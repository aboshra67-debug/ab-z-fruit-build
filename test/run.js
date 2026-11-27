// Integration tests: real WebSocket clients against the real server (fast timings).
const os = require('os'), path = require('path'), fs = require('fs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zfs-'));
Object.assign(process.env, { DATA_DIR: tmp, COUNTDOWN_MS: '150', MIN_FINISH_MS: '300', DUR_EASY: '2', DUR_MEDIUM: '3', LOBBY_IDLE_MS: '1500', DONE_KEEP_MS: '500' });
const WebSocket = require('ws');
const S = require('../server.js');
let port, fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('FAIL:', m); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
let n = 0; const devId = () => ('dev' + (++n) + 'x'.repeat(20)).slice(0, 24);

class C {
  constructor(name, id) { this.name = name; this.id = id || devId(); this.msgs = []; this.waiters = []; }
  async open() {
    this.ws = new WebSocket('ws://127.0.0.1:' + port);
    this.ws.on('message', b => { const m = JSON.parse(b); this.msgs.push(m); this.waiters = this.waiters.filter(w => !(w.t === m.t && (w.f ? w.f(m) : true) && (w.res(m), true))); });
    await new Promise(r => this.ws.on('open', r));
    this.send({ t: 'hello', deviceId: this.id, name: this.name });
    return this.wait('welcome');
  }
  send(o) { this.ws.send(JSON.stringify(o)); }
  wait(t, f, ms = 4000) { const hit = this.msgs.find(m => m.t === t && (!f || f(m))); if (hit && !hit._seen) { hit._seen = 1; return Promise.resolve(hit); } return new Promise((res, rej) => { const w = { t, f, res: m => { m._seen = 1; res(m); } }; this.waiters.push(w); setTimeout(() => rej(new Error('timeout waiting ' + t + ' for ' + this.name)), ms); }); }
  last(t) { return [...this.msgs].reverse().find(m => m.t === t); }
  close() { this.ws.close(); }
}
const coins = c => S.wallet(c.id).coins;

(async () => {
  await new Promise(r => S.server.listen(0, r)); port = S.server.address().port;

  // 1 wallet + create/join/escrow
  const a = new C('A'), b = new C('B'); const w = await a.open(); await b.open();
  ok(w.coins === 500, 'new device gets 500 coins'); ok(w.fee === 100, 'fee 100');
  a.send({ t: 'create', difficulty: 'easy' }); const cr = await a.wait('created');
  ok(/^\d{4}$/.test(cr.code), '4-digit code'); ok(cr.coins === 400, 'host paid 100');
  b.send({ t: 'join', code: cr.code }); const jn = await b.wait('joined');
  ok(jn.coins === 400 && jn.room.players.length === 2, 'joiner paid, 2 players');
  // errors
  const x = new C('X'); await x.open(); x.send({ t: 'join', code: '0000x' }); ok((await x.wait('error')).code === 'no_room', 'unknown code');
  a.send({ t: 'create', difficulty: 'easy' }); ok((await a.wait('error')).code === 'already_in_room', 'cannot create twice');
  b.send({ t: 'start' }); ok((await b.wait('error')).code === 'not_host', 'only host starts');
  // 2 players game: A clears, B lost -> A wins 200
  a.send({ t: 'start' }); const st = await a.wait('start'); await b.wait('start');
  ok(st.seed > 0 && st.level === S.CFG.levels.easy && st.durationMs === 2000, 'start payload');
  await sleep(200); a.send({ t: 'finish' }); ok((await a.wait('error')).code === 'too_fast', 'impossible fast finish rejected');
  b.send({ t: 'progress', remaining: 9, total: 20 }); a.send({ t: 'progress', remaining: 3, total: 20 });
  await sleep(300); a.send({ t: 'finish' }); b.send({ t: 'lost', remaining: 7 });
  const ra = await a.wait('result'), rb = await b.wait('result');
  ok(ra.ranking[0].name === 'A' && ra.ranking[0].prize === 200 && ra.ranking[1].prize === 0, '2 players: winner takes all 200');
  ok(ra.coins === 600 && rb.coins === 400, 'wallets after 2-player: 600 / 400 (got ' + ra.coins + '/' + rb.coins + ')');
  ok(ra.ranking[1].remaining === 7, 'loser remaining recorded');

  // 3 players 60/30/10 ; ranking: finished by time, then by fewer remaining
  const p = [new C('P1'), new C('P2'), new C('P3')]; for (const c of p) await c.open();
  p[0].send({ t: 'create', difficulty: 'easy' }); const c3 = await p[0].wait('created');
  p[1].send({ t: 'join', code: c3.code }); p[2].send({ t: 'join', code: c3.code }); await p[1].wait('joined'); await p[2].wait('joined');
  p[0].send({ t: 'start' }); for (const c of p) await c.wait('start'); await sleep(450);
  p[2].send({ t: 'progress', remaining: 2, total: 30 }); p[0].send({ t: 'progress', remaining: 10, total: 30 });
  p[1].send({ t: 'finish' }); await sleep(30); p[2].send({ t: 'lost', remaining: 2 }); p[0].send({ t: 'lost', remaining: 10 });
  const r3 = await p[0].wait('result');
  ok(r3.ranking.map(r => r.name).join() === 'P2,P3,P1', '3 players ranking P2,P3,P1 (got ' + r3.ranking.map(r => r.name) + ')');
  ok(r3.ranking.map(r => r.prize).join() === '180,90,30', '60/30/10 of 300 (got ' + r3.ranking.map(r => r.prize) + ')');
  ok(r3.pot === 300, 'pot 300');
  ok(coins(p[1]) === 500 - 100 + 180 && coins(p[2]) === 500 - 100 + 90 && coins(p[0]) === 500 - 100 + 30, 'wallets after 3 players');

  // lobby leave refunds; host leave closes room with refunds
  const h = new C('H'), g = new C('G'); await h.open(); await g.open();
  h.send({ t: 'create', difficulty: 'medium' }); const hc = await h.wait('created'); g.send({ t: 'join', code: hc.code }); await g.wait('joined');
  g.send({ t: 'leave' }); const gl = await g.wait('left'); ok(gl.coins === 500, 'guest refunded on lobby leave');
  g.send({ t: 'join', code: hc.code }); await g.wait('joined');
  h.send({ t: 'leave' }); const cl = await g.wait('closed'); ok(cl.reason === 'host_left', 'host leaves -> room closed');
  await sleep(50); ok(coins(h) === 500 && coins(g) === 500, 'everyone refunded when host leaves'); ok(!S.rooms.has(hc.code), 'room removed');

  // start needs 2 players
  const s1 = new C('S1'); await s1.open(); s1.send({ t: 'create', difficulty: 'easy' }); await s1.wait('created'); s1.send({ t: 'start' }); ok((await s1.wait('error')).code === 'need_players', 'start alone rejected'); s1.send({ t: 'leave' }); await s1.wait('left');

  // not enough coins
  const poor = new C('Poor'); await poor.open(); S.wallet(poor.id).coins = 50; poor.send({ t: 'create', difficulty: 'easy' }); const ne = await poor.wait('error'); ok(ne.code === 'no_coins' && ne.coins === 50, 'no coins blocks creating');

  // full room (10) and 11th rejected
  const hc10 = new C('T0'); await hc10.open(); hc10.send({ t: 'create', difficulty: 'easy' }); const c10 = await hc10.wait('created'); const crowd = [hc10];
  for (let i = 1; i < 10; i++) { const c = new C('T' + i); await c.open(); c.send({ t: 'join', code: c10.code }); await c.wait('joined'); crowd.push(c); }
  const over = new C('T10'); await over.open(); over.send({ t: 'join', code: c10.code }); ok((await over.wait('error')).code === 'full', '11th player rejected');
  hc10.send({ t: 'start' }); for (const c of crowd) await c.wait('start'); await sleep(400);
  crowd.forEach((c, i) => { if (i < 5) c.send({ t: 'finish' }); else c.send({ t: 'lost', remaining: i }); });
  const r10 = await crowd[0].wait('result');
  ok(r10.ranking.length === 10 && r10.pot === 1000, '10 players pot 1000'); ok(r10.ranking.slice(0, 3).map(r => r.prize).join() === '600,300,100', '10 players 600/300/100'); ok(r10.ranking.slice(3).every(r => r.prize === 0), 'no prize beyond 3rd');
  const total = [...crowd].reduce((s, c) => s + coins(c), 0); ok(total === 10 * 500, 'coins conserved with 10 players (total ' + total + ')');

  // time up: nobody finishes -> rank by remaining
  const t1 = new C('Tm1'), t2 = new C('Tm2'); await t1.open(); await t2.open();
  t1.send({ t: 'create', difficulty: 'easy' }); const tc = await t1.wait('created'); t2.send({ t: 'join', code: tc.code }); await t2.wait('joined'); t1.send({ t: 'start' }); await t1.wait('start'); await sleep(200);
  t1.send({ t: 'progress', remaining: 8, total: 20 }); t2.send({ t: 'progress', remaining: 5, total: 20 });
  const rt = await t1.wait('result', null, 6000); ok(rt.ranking[0].name === 'Tm2' && rt.ranking[0].prize === 200, 'time up: fewer remaining wins');

  // reconnect mid-game keeps the seat; leaving mid-game forfeits
  const d1 = new C('D1'), d2 = new C('D2'); await d1.open(); await d2.open();
  d1.send({ t: 'create', difficulty: 'easy' }); const dc = await d1.wait('created'); d2.send({ t: 'join', code: dc.code }); await d2.wait('joined'); d1.send({ t: 'start' }); await d1.wait('start'); await d2.wait('start'); await sleep(400);
  d2.close(); await sleep(100); const d2b = new C('D2', d2.id); await d2b.open(); const rs = await d2b.wait('start'); ok(rs.resumed === true, 'reconnect resumes the game');
  d1.send({ t: 'finish' }); d2b.send({ t: 'leave' }); const rd = await d1.wait('result'); ok(rd.ranking[0].name === 'D1' && coins(d1) === 600 && coins(d2b) === 400, 'leaver forfeits entry');

  // bad input
  const bad = new C('Bad'); await bad.open(); bad.ws.send('not json'); ok((await bad.wait('error')).code === 'bad_json', 'bad json'); 
  const nh = new C('NH'); nh.ws = new WebSocket('ws://127.0.0.1:' + port); nh.ws.on('message', b => nh.msgs.push(JSON.parse(b))); await new Promise(r => nh.ws.on('open', r)); nh.send({ t: 'create' }); await sleep(100); ok(nh.msgs.some(m => m.t === 'error' && m.code === 'no_hello'), 'must say hello first');
  const bd = new C('BD', 'short'); bd.ws = new WebSocket('ws://127.0.0.1:' + port); bd.ws.on('message', b => bd.msgs.push(JSON.parse(b))); await new Promise(r => bd.ws.on('open', r)); bd.send({ t: 'hello', deviceId: 'short' }); await sleep(100); ok(bd.msgs.some(m => m.code === 'bad_device'), 'bad device id rejected');

  // lobby idle closes and refunds
  const idl = new C('Idle'); await idl.open(); idl.send({ t: 'create', difficulty: 'easy' }); await idl.wait('created'); const cl2 = await idl.wait('closed', null, 3000); ok(cl2.reason === 'idle' && coins(idl) === 500, 'idle lobby closes + refund');

  // persistence
  S.saveWallets(true); const disk = JSON.parse(fs.readFileSync(path.join(tmp, 'wallets.json'), 'utf8')); ok(disk[d1.id] && disk[d1.id].coins === 600, 'wallets persisted to disk');

  // health
  const http = require('http'); const hb = await new Promise(r => http.get('http://127.0.0.1:' + port + '/health', res => { let s = ''; res.on('data', d => s += d); res.on('end', () => r(JSON.parse(s))); })); ok(hb.ok === true, '/health');

  console.log(fails ? 'FAILED ' + fails + ' of ' + checks : 'PASS: ' + checks + ' checks'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('ERROR', e.message); process.exit(2); });
