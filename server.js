'use strict';
/* AB Z Fruit challenge server.
   Rooms with a 4-digit code, 2..10 players, entry fee in virtual coins (held by the server per device),
   everyone plays the same level + seed, ranking decides the payout. No real money, no cash-out. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const env = (k, d) => (process.env[k] !== undefined && process.env[k] !== '' ? process.env[k] : d);
const CFG = {
  port: +env('PORT', 8080),
  dataDir: env('DATA_DIR', path.join(__dirname, 'data')),
  startCoins: +env('START_COINS', 500),
  entryFee: +env('ENTRY_FEE', 100),
  cutPct: +env('CUT_PCT', 0),                       // house cut taken from the pot (0 = none)
  maxPlayers: +env('MAX_PLAYERS', 10),
  minPlayers: +env('MIN_PLAYERS', 2),
  countdownMs: +env('COUNTDOWN_MS', 3000),
  minFinishMs: +env('MIN_FINISH_MS', 15000),         // a clear faster than this is rejected as impossible
  lobbyIdleMs: +env('LOBBY_IDLE_MS', 10 * 60 * 1000),
  doneKeepMs: +env('DONE_KEEP_MS', 2 * 60 * 1000),
  graceMs: +env('GRACE_MS', 20000),                  // after time is up, wait this long for late reports
  levels: { easy: +env('LEVEL_EASY', 10), medium: +env('LEVEL_MEDIUM', 60), hard: +env('LEVEL_HARD', 150) },
  durations: { easy: +env('DUR_EASY', 240) * 1000, medium: +env('DUR_MEDIUM', 360) * 1000, hard: +env('DUR_HARD', 480) * 1000 }
};

/* ---------- wallets (persistent JSON file; set DATA_DIR to a volume) ---------- */
const walletFile = path.join(CFG.dataDir, 'wallets.json');
let wallets = {};
try { fs.mkdirSync(CFG.dataDir, { recursive: true }); wallets = JSON.parse(fs.readFileSync(walletFile, 'utf8')); } catch (e) { wallets = {}; }
let saveTimer = null;
function saveWallets(now) {
  if (now) { clearTimeout(saveTimer); saveTimer = null; return writeWallets(); }
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; writeWallets(); }, 500);
}
function writeWallets() {
  try { const tmp = walletFile + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(wallets)); fs.renameSync(tmp, walletFile); } catch (e) { console.error('wallet save failed', e.message); }
}
function wallet(id) {
  if (!wallets[id]) wallets[id] = { coins: CFG.startCoins, created: Date.now() };
  return wallets[id];
}
function addCoins(id, n) { const w = wallet(id); w.coins = Math.max(0, w.coins + n); saveWallets(); return w.coins; }

/* ---------- rooms ---------- */
const rooms = new Map();            // code -> room
const byDevice = new Map();         // deviceId -> code
const DIFFS = ['easy', 'medium', 'hard'];

function newCode() {
  for (let i = 0; i < 200; i++) { const c = String(crypto.randomInt(0, 10000)).padStart(4, '0'); if (!rooms.has(c)) return c; }
  return null;
}
const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
function publicPlayers(room) {
  return [...room.players.values()].map(p => ({
    id: p.pub, name: p.name, host: p.id === room.host, remaining: p.remaining, total: p.total, state: p.state, timeMs: p.timeMs, online: !!(p.ws && p.ws.readyState === 1)
  }));
}
function broadcast(room, o) { for (const p of room.players.values()) send(p.ws, o); }
function roomView(room) {
  return { code: room.code, difficulty: room.difficulty, level: CFG.levels[room.difficulty], durationMs: CFG.durations[room.difficulty], fee: CFG.entryFee, state: room.state, players: publicPlayers(room), max: CFG.maxPlayers };
}
function pushRoom(room) { broadcast(room, { t: 'room', room: roomView(room) }); }

function closeRoom(room, reason, refund) {
  if (!rooms.has(room.code)) return;
  if (refund) for (const p of room.players.values()) if (p.paid) { addCoins(p.id, CFG.entryFee); p.paid = false; }
  broadcast(room, { t: 'closed', reason });
  for (const p of room.players.values()) { if (byDevice.get(p.id) === room.code) byDevice.delete(p.id); send(p.ws, { t: 'wallet', coins: wallet(p.id).coins }); }
  clearTimeout(room.timer); clearTimeout(room.idle);
  rooms.delete(room.code);
  saveWallets();
}
function touchLobby(room) {
  clearTimeout(room.idle);
  if (room.state === 'lobby') room.idle = setTimeout(() => closeRoom(room, 'idle', true), CFG.lobbyIdleMs);
}

/* ---------- ranking + payout ---------- */
function rankPlayers(room) {
  const list = [...room.players.values()];
  const cleared = list.filter(p => p.state === 'finished').sort((a, b) => a.timeMs - b.timeMs);
  const rest = list.filter(p => p.state !== 'finished').sort((a, b) => (a.remaining - b.remaining) || ((a.lastAt || 0) - (b.lastAt || 0)));
  return cleared.concat(rest);
}
function payoutShares(n) { // fractions of the pot by place
  if (n <= 1) return [1];
  if (n === 2) return [1];
  return [0.6, 0.3, 0.1];
}
function finishRoom(room) {
  if (room.state === 'done') return;
  room.state = 'done';
  clearTimeout(room.timer);
  const ranked = rankPlayers(room);
  const paying = ranked.filter(p => p.paid);
  const pot = Math.floor(paying.length * CFG.entryFee * (100 - CFG.cutPct) / 100);
  const shares = payoutShares(ranked.length);
  const prizes = ranked.map(() => 0);
  let given = 0;
  shares.forEach((s, i) => { if (ranked[i] && ranked[i].paid) { prizes[i] = Math.floor(pot * s); given += prizes[i]; } });
  if (prizes.length && pot - given > 0) prizes[0] += pot - given; // rounding remainder to first place
  const out = ranked.map((p, i) => ({ place: i + 1, id: p.pub, name: p.name, state: p.state, remaining: p.remaining, timeMs: p.timeMs, prize: prizes[i] }));
  ranked.forEach((p, i) => { if (prizes[i]) addCoins(p.id, prizes[i]); p.paid = false; });
  saveWallets(true);
  for (const p of room.players.values()) {
    if (byDevice.get(p.id) === room.code) byDevice.delete(p.id);
    send(p.ws, { t: 'result', ranking: out, pot, coins: wallet(p.id).coins });
  }
  room.timer = setTimeout(() => rooms.delete(room.code), CFG.doneKeepMs);
}
function checkDone(room) {
  if (room.state !== 'playing') return;
  const open = [...room.players.values()].some(p => p.state === 'playing');
  if (!open) finishRoom(room);
}

function startRoom(room) {
  room.state = 'countdown';
  room.seed = crypto.randomInt(1, 2 ** 31 - 1);
  room.startAt = Date.now() + CFG.countdownMs;
  const dur = CFG.durations[room.difficulty];
  broadcast(room, { t: 'start', seed: room.seed, level: CFG.levels[room.difficulty], difficulty: room.difficulty, durationMs: dur, countdownMs: CFG.countdownMs, serverNow: Date.now(), startAt: room.startAt });
  for (const p of room.players.values()) { p.state = 'playing'; p.remaining = null; p.timeMs = null; }
  clearTimeout(room.idle);
  room.timer = setTimeout(() => {
    room.state = 'playing';
    room.timer = setTimeout(() => { // time is up: unfinished players stop at their last report
      for (const p of room.players.values()) if (p.state === 'playing') p.state = 'timeout';
      broadcast(room, { t: 'timeup' });
      setTimeout(() => finishRoom(room), CFG.graceMs > 0 ? Math.min(CFG.graceMs, 2000) : 0);
    }, dur);
  }, CFG.countdownMs);
  pushRoom(room);
}

/* ---------- connection handling ---------- */
const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, name: 'abzfruit-challenge', rooms: rooms.size, players: byDevice.size }));
  }
  res.writeHead(404); res.end();
});
const wss = new WebSocketServer({ server, maxPayload: 4096 });

function cleanName(s) { s = String(s || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 14); return s || 'لاعب'; }
const pubId = id => crypto.createHash('sha1').update('zf' + id).digest('hex').slice(0, 8);

wss.on('connection', ws => {
  ws.alive = true; ws.msgs = 0; ws.winStart = Date.now();
  ws.on('pong', () => { ws.alive = true; });
  ws.on('message', buf => {
    const now = Date.now();
    if (now - ws.winStart > 5000) { ws.winStart = now; ws.msgs = 0; }
    if (++ws.msgs > 60) return send(ws, { t: 'error', code: 'rate' });
    let m; try { m = JSON.parse(buf.toString()); } catch (e) { return send(ws, { t: 'error', code: 'bad_json' }); }
    if (!m || typeof m.t !== 'string') return send(ws, { t: 'error', code: 'bad_msg' });
    try { handle(ws, m); } catch (e) { console.error('handler', e); send(ws, { t: 'error', code: 'server' }); }
  });
  ws.on('close', () => leaveSocket(ws));
  send(ws, { t: 'hi', fee: CFG.entryFee, max: CFG.maxPlayers, levels: CFG.levels, durations: CFG.durations });
});
setInterval(() => { wss.clients.forEach(ws => { if (!ws.alive) return ws.terminate(); ws.alive = false; try { ws.ping(); } catch (e) { } }); }, 25000).unref();

function myRoom(ws) { return ws.id ? rooms.get(byDevice.get(ws.id)) : null; }

function leaveSocket(ws) {
  const room = myRoom(ws); if (!room) return;
  const p = room.players.get(ws.id); if (!p || p.ws !== ws) return;
  p.ws = null;
  if (room.state === 'lobby') { removePlayer(room, p, 'left'); }
  else { pushRoom(room); }
}
function removePlayer(room, p, why) { // lobby only: refund and drop
  if (p.paid) { addCoins(p.id, CFG.entryFee); p.paid = false; }
  room.players.delete(p.id); byDevice.delete(p.id);
  send(p.ws, { t: 'left', reason: why, coins: wallet(p.id).coins });
  if (room.host === p.id) return closeRoom(room, 'host_left', true);
  if (!room.players.size) return closeRoom(room, 'empty', false);
  pushRoom(room);
}

function handle(ws, m) {
  if (m.t === 'ping') return send(ws, { t: 'pong', serverNow: Date.now() });
  if (m.t === 'hello') {
    const id = String(m.deviceId || '');
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(id)) return send(ws, { t: 'error', code: 'bad_device' });
    ws.id = id; ws.name = cleanName(m.name);
    const w = wallet(id); saveWallets();
    send(ws, { t: 'welcome', coins: w.coins, fee: CFG.entryFee });
    // reattach to a running game after a dropped connection
    const room = rooms.get(byDevice.get(id));
    if (room) {
      const p = room.players.get(id);
      if (p) { p.ws = ws; p.name = ws.name || p.name; send(ws, { t: 'room', room: roomView(room) }); if (room.state !== 'lobby' && room.state !== 'done') send(ws, { t: 'start', seed: room.seed, level: CFG.levels[room.difficulty], difficulty: room.difficulty, durationMs: CFG.durations[room.difficulty], countdownMs: Math.max(0, room.startAt - Date.now()), serverNow: Date.now(), startAt: room.startAt, resumed: true }); pushRoom(room); }
    }
    return;
  }
  if (!ws.id) return send(ws, { t: 'error', code: 'no_hello' });
  const w = wallet(ws.id);

  if (m.t === 'wallet') return send(ws, { t: 'wallet', coins: w.coins });

  if (m.t === 'create') {
    if (byDevice.has(ws.id)) return send(ws, { t: 'error', code: 'already_in_room' });
    const diff = DIFFS.includes(m.difficulty) ? m.difficulty : 'medium';
    if (w.coins < CFG.entryFee) return send(ws, { t: 'error', code: 'no_coins', coins: w.coins, fee: CFG.entryFee });
    const code = newCode(); if (!code) return send(ws, { t: 'error', code: 'busy' });
    const room = { code, difficulty: diff, host: ws.id, state: 'lobby', players: new Map(), created: Date.now() };
    rooms.set(code, room);
    addPlayer(room, ws);
    touchLobby(room);
    return send(ws, { t: 'created', code, room: roomView(room), coins: wallet(ws.id).coins });
  }
  if (m.t === 'join') {
    if (byDevice.has(ws.id)) return send(ws, { t: 'error', code: 'already_in_room' });
    const room = rooms.get(String(m.code || ''));
    if (!room) return send(ws, { t: 'error', code: 'no_room' });
    if (room.state !== 'lobby') return send(ws, { t: 'error', code: 'started' });
    if (room.players.size >= CFG.maxPlayers) return send(ws, { t: 'error', code: 'full' });
    if (w.coins < CFG.entryFee) return send(ws, { t: 'error', code: 'no_coins', coins: w.coins, fee: CFG.entryFee });
    addPlayer(room, ws); touchLobby(room);
    send(ws, { t: 'joined', code: room.code, room: roomView(room), coins: wallet(ws.id).coins });
    return pushRoom(room);
  }
  const room = myRoom(ws);
  if (m.t === 'leave') {
    if (!room) return send(ws, { t: 'left', coins: w.coins });
    const p = room.players.get(ws.id);
    if (room.state === 'lobby') return removePlayer(room, p, 'left');
    // leaving a running game forfeits the entry: the player counts as lost at the last report
    if (p.state === 'playing') { p.state = 'lost'; p.lastAt = Date.now(); }
    byDevice.delete(ws.id); send(ws, { t: 'left', coins: w.coins });
    pushRoom(room); return checkDone(room);
  }
  if (!room) return send(ws, { t: 'error', code: 'no_room' });
  const p = room.players.get(ws.id);

  if (m.t === 'difficulty') {
    if (room.host !== ws.id || room.state !== 'lobby') return send(ws, { t: 'error', code: 'not_host' });
    if (!DIFFS.includes(m.difficulty)) return send(ws, { t: 'error', code: 'bad_difficulty' });
    room.difficulty = m.difficulty; touchLobby(room); return pushRoom(room);
  }
  if (m.t === 'start') {
    if (room.host !== ws.id) return send(ws, { t: 'error', code: 'not_host' });
    if (room.state !== 'lobby') return send(ws, { t: 'error', code: 'started' });
    const online = [...room.players.values()].filter(x => x.ws && x.ws.readyState === 1);
    if (online.length < CFG.minPlayers) return send(ws, { t: 'error', code: 'need_players' });
    for (const x of [...room.players.values()]) if (!(x.ws && x.ws.readyState === 1)) removePlayer(room, x, 'offline');
    return startRoom(room);
  }
  if (m.t === 'progress') {
    if (room.state !== 'playing' || p.state !== 'playing') return;
    const rem = Math.floor(+m.remaining), tot = Math.floor(+m.total);
    if (!(rem >= 0 && tot > 0 && rem <= tot)) return;
    if (!p.total) p.total = tot;
    if (tot !== p.total) return;
    if (p.remaining === null || rem <= p.remaining) { p.remaining = rem; p.lastAt = Date.now(); }
    if (!room.lastPush || Date.now() - room.lastPush > 700) { room.lastPush = Date.now(); pushRoom(room); }
    return;
  }
  if (m.t === 'finish') { // all fruit cleared
    if (room.state !== 'playing' || p.state !== 'playing') return;
    const el = Date.now() - room.startAt;
    if (el < CFG.minFinishMs) { return send(ws, { t: 'error', code: 'too_fast' }); }
    if (el > CFG.durations[room.difficulty] + 1500) return;
    p.state = 'finished'; p.remaining = 0; p.timeMs = el; p.lastAt = Date.now();
    pushRoom(room); return checkDone(room);
  }
  if (m.t === 'lost') { // channel overflowed, out of the round
    if (room.state !== 'playing' || p.state !== 'playing') return;
    const rem = Math.floor(+m.remaining);
    if (rem >= 0 && (!p.total || rem <= p.total) && (p.remaining === null || rem <= p.remaining)) p.remaining = rem;
    p.state = 'lost'; p.lastAt = Date.now();
    pushRoom(room); return checkDone(room);
  }
  send(ws, { t: 'error', code: 'unknown' });
}

function addPlayer(room, ws) {
  const id = ws.id;
  addCoins(id, -CFG.entryFee);
  room.players.set(id, { id, pub: pubId(id), name: ws.name, ws, paid: true, state: 'lobby', remaining: null, total: null, timeMs: null, lastAt: 0 });
  byDevice.set(id, room.code);
  send(ws, { t: 'wallet', coins: wallet(id).coins });
}

if (require.main === module) {
  server.listen(CFG.port, () => console.log('abzfruit challenge server on', CFG.port, JSON.stringify({ fee: CFG.entryFee, start: CFG.startCoins, data: CFG.dataDir })));
  const bye = () => { saveWallets(true); process.exit(0); };
  process.on('SIGTERM', bye); process.on('SIGINT', bye);
}
module.exports = { server, wss, CFG, rooms, wallets, wallet, saveWallets };
