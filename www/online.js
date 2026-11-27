/* VC172: online challenge (rooms, 100-coin entry, ranking). Talks to the challenge server over WebSocket.
   The game itself is only touched through the small window.ZF API and the ZF_ONLINE172 hooks called by game.js. */
(function () {
  'use strict';
  var $ = function (i) { return document.getElementById(i); };
  var LS = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };
  var URL = window.ZF_ONLINE_URL || LS.get('zf_online_url') || 'wss://challenge-server-production-31308fc7.up.railway.app';

  var STR = {
    ar: {
      title: 'تحدي أونلاين', name: 'اسمك', diff: 'الصعوبة', easy: 'سهل', medium: 'متوسط', hard: 'صعب', create: 'إنشاء غرفة', joinLbl: 'أو ادخل غرفة بالكود', join: 'ادخل',
      note: 'الدخول {fee} عملة. الفايز ياخد الجايزة، وكل اللاعبين بيلعبوا نفس المستوى.', connecting: 'جاري الاتصال بالسيرفر...', offline: 'مفيش اتصال، بنحاول تاني...',
      code: 'كود الغرفة', info: '{style} · المستوى {lvl} · {min} دقيقة · الدخول {fee} عملة · الجايزة {pot}', start: 'ابدأ', waitHost: 'في انتظار صاحب الغرفة يبدأ...', leave: 'خروج', host: 'صاحب الغرفة', offlineP: 'غير متصل',
      style: 'الأسلوب', race: 'سباق', speed: 'سرعة 60 ثانية', action: 'أكشن', d_race: 'أول واحد يخلّص كل الفاكهة يكسب.', d_speed: 'دقيقة واحدة، واللي يجمّع فاكهة أكتر يكسب.', d_action: 'سباق بأحداث الأكشن (القرد والصقر وغيرهم) بنفس التوقيت للكل.', score: 'نقاط {n}',
      need2: 'محتاج لاعبين اتنين على الأقل', go: 'انطلق!', waitOthers: 'خلّصت! بنستنى باقي اللاعبين...', lostWait: 'خسرت الجولة، بنستنى النتيجة...', leaveAsk: 'لو خرجت هتخسر الـ{fee} عملة بتاعة الدخول. تخرج؟', yes: 'اخرج', no: 'كمّل',
      result: 'الترتيب النهائي', prize: '+{n}', ok: 'تمام', fin: '{s}ث', left: 'باقي {n}', coins: 'رصيدك: {n}',
      e_no_room: 'الغرفة دي مش موجودة', e_started: 'الجولة بدأت خلاص', e_full: 'الغرفة مليانة', e_no_coins: 'رصيدك أقل من {fee} عملة', e_not_host: 'صاحب الغرفة بس اللي يقدر', e_need_players: 'محتاج لاعبين اتنين على الأقل', e_already_in_room: 'أنت في غرفة بالفعل', e_busy: 'السيرفر مشغول، جرّب كمان شوية', e_rate: 'بطّئ شوية', e_other: 'حصلت مشكلة، جرّب تاني',
      c_host_left: 'صاحب الغرفة خرج، والعملات رجعت', c_idle: 'الغرفة اتقفلت لعدم النشاط، والعملات رجعت', c_empty: 'الغرفة اتقفلت', badName: 'اكتب اسمك الأول', badCode: 'اكتب كود من 4 أرقام'
    },
    en: {
      title: 'Online challenge', name: 'Your name', diff: 'Difficulty', easy: 'Easy', medium: 'Medium', hard: 'Hard', create: 'Create room', joinLbl: 'Or join with a code', join: 'Join',
      note: 'Entry {fee} coins. The winner takes the prize; everyone plays the same level.', connecting: 'Connecting...', offline: 'No connection, retrying...',
      code: 'Room code', info: '{style} · Level {lvl} · {min} min · Entry {fee} · Prize {pot}', start: 'Start', waitHost: 'Waiting for the host to start...', leave: 'Leave', host: 'Host', offlineP: 'offline',
      style: 'Style', race: 'Race', speed: 'Speed 60s', action: 'Action', d_race: 'First to clear all the fruit wins.', d_speed: 'One minute, the most matched fruit wins.', d_action: 'A race with action events (monkey, falcon...) at the same moments for everyone.', score: 'Score {n}',
      need2: 'Need at least 2 players', go: 'Go!', waitOthers: 'Done! Waiting for the others...', lostWait: 'You lost the round, waiting for results...', leaveAsk: 'If you leave you lose the {fee} entry coins. Leave?', yes: 'Leave', no: 'Stay',
      result: 'Final ranking', prize: '+{n}', ok: 'OK', fin: '{s}s', left: '{n} left', coins: 'Balance: {n}',
      e_no_room: 'Room not found', e_started: 'The round already started', e_full: 'Room is full', e_no_coins: 'You need {fee} coins', e_not_host: 'Only the host can do that', e_need_players: 'Need at least 2 players', e_already_in_room: 'You are already in a room', e_busy: 'Server busy, try again', e_rate: 'Slow down', e_other: 'Something went wrong, try again',
      c_host_left: 'The host left, coins refunded', c_idle: 'Room closed (idle), coins refunded', c_empty: 'Room closed', badName: 'Enter your name first', badCode: 'Enter a 4-digit code'
    }
  };
  function lang() { return window.ZF && window.ZF.lang ? window.ZF.lang() : 'ar'; }
  function T(k, a) { var s = (STR[lang()] && STR[lang()][k]) || STR.ar[k] || k; if (a) for (var x in a) s = s.replace('{' + x + '}', a[x]); return s; }
  function toast(m) { var el = $('toast'); if (!el) return; el.textContent = m; el.classList.remove('hidden'); clearTimeout(toast.h); toast.h = setTimeout(function () { el.classList.add('hidden'); }, 2600); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- state ---------- */
  var ws = null, wantConn = false, retry = 0, retryT = null, connected = false;
  var coins = 0, fee = 100, mePub = '', room = null, view = 'home', diff = 'medium', inGame = false, gameOver = false, cfgInfo = null;
  var lastProg = 0, countT = null, startedLocal = false, curStyle = 'race';

  function deviceId() {
    var d = LS.get('zf_online_dev');
    if (!d || !/^[A-Za-z0-9_-]{16,64}$/.test(d)) {
      var a = new Uint8Array(16); try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256); }
      d = 'd' + Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
      LS.set('zf_online_dev', d);
    }
    return d;
  }
  function myName() { return ($('onName172').value || '').trim().slice(0, 14); }

  /* ---------- connection ---------- */
  function setStatus() {
    var el = $('onConn172'); if (!el) return;
    el.textContent = connected ? '' : (retry > 0 ? T('offline') : T('connecting'));
    el.classList.toggle('hidden', connected);
  }
  function connect() {
    wantConn = true;
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
    try { ws = new WebSocket(URL); } catch (e) { scheduleRetry(); return; }
    var mine = ws;
    ws.onopen = function () { if (mine !== ws) return; retry = 0; connected = true; setStatus(); sendHello(); };
    ws.onmessage = function (ev) { if (mine !== ws) return; var m; try { m = JSON.parse(ev.data); } catch (e) { return; } onMsg(m); };
    ws.onclose = function () { if (mine !== ws) return; connected = false; ws = null; setStatus(); scheduleRetry(); };
    ws.onerror = function () { };
    setStatus();
  }
  function scheduleRetry() {
    clearTimeout(retryT);
    if (!(wantConn || inGame || room)) return;
    retry++; retryT = setTimeout(connect, Math.min(8000, 1000 + retry * 1000)); setStatus();
  }
  function send(o) { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); return true; } return false; }
  function sendHello() { send({ t: 'hello', deviceId: deviceId(), name: myName() || LS.get('zf_online_name') || 'لاعب' }); }

  /* ---------- views ---------- */
  function setView(v) {
    view = v;
    $('onHome172').classList.toggle('hidden', v !== 'home');
    $('onLobby172').classList.toggle('hidden', v !== 'lobby');
  }
  function renderCoins() { $('onCoins172').textContent = coins; }
  function applyTexts() {
    $('onTitle172').textContent = T('title'); $('onNameLbl172').textContent = T('name'); $('onDiffLbl172').textContent = T('diff');
    $('onCreate172').textContent = T('create'); $('onJoinLbl172').textContent = T('joinLbl'); $('onJoin172').textContent = T('join');
    $('onNote172').textContent = T('note', { fee: fee }); $('onStart172').textContent = T('start'); $('onLeave172').textContent = T('leave');
    ['easy', 'medium', 'hard'].forEach(function (d) { document.querySelectorAll('.on172seg [data-d="' + d + '"]').forEach(function (b) { b.textContent = T(d); }); });
    document.querySelectorAll('#onStyleHost172 [data-s]').forEach(function (b) { b.textContent = T(b.getAttribute('data-s')); }); $('onLeaveYes172').textContent = T('yes'); $('onLeaveNo172').textContent = T('no'); $('onResultTitle172').textContent = T('result'); $('onResultOk172').textContent = T('ok');
  }
  function markDiff(d) { document.querySelectorAll('.on172seg [data-d]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-d') === d); }); }

  function renderLobby() {
    if (!room) return;
    $('onCodeBig172').textContent = room.code;
    var n = room.players.length, mins = Math.round(room.durationMs / 60000 * 10) / 10;
    $('onRoomInfo172').textContent = T('info', { style: T(room.style || 'race'), lvl: room.level, min: mins, fee: room.fee, pot: n * room.fee });
    var amHost = room.players.some(function (p) { return p.id === mePub && p.host; });
    $('onDiffHost172').classList.toggle('hidden', !amHost); markDiff(room.difficulty);
    $('onStyleHost172').classList.toggle('hidden', !amHost); document.querySelectorAll('#onStyleHost172 [data-s]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-s') === room.style); });
    $('onStyleLbl172').textContent = amHost ? T('style') : T('style') + ': ' + T(room.style || 'race'); $('onStyleDesc172').textContent = T('d_' + (room.style || 'race'));
    $('onPlayers172').innerHTML = room.players.map(function (p) {
      return '<div class="on172p' + (p.id === mePub ? ' me' : '') + '"><span>' + esc(p.name) + (p.host ? ' <i>👑 ' + T('host') + '</i>' : '') + '</span>' + (p.online ? '' : '<em>' + T('offlineP') + '</em>') + '</div>';
    }).join('');
    var online = room.players.filter(function (p) { return p.online; }).length;
    var st = $('onStart172'); st.classList.toggle('hidden', !amHost); st.classList.toggle('dis', online < 2);
    $('onWaitHost172').classList.toggle('hidden', amHost); $('onWaitHost172').textContent = T('waitHost');
  }

  /* ---------- standings during play ---------- */
  function renderStand() {
    if (!room || !inGame) { $('on172stand').classList.add('hidden'); return; }
    var speed = room.style === 'speed';
    var list = room.players.slice().sort(function (a, b) {
      if (speed) return (b.score || 0) - (a.score || 0);
      var fa = a.state === 'finished', fb = b.state === 'finished';
      if (fa !== fb) return fa ? -1 : 1; if (fa && fb) return a.timeMs - b.timeMs;
      var ra = a.remaining == null ? 1e9 : a.remaining, rb = b.remaining == null ? 1e9 : b.remaining; return ra - rb;
    });
    var shown = list.slice(0, 4); var me = list.findIndex(function (p) { return p.id === mePub; }); if (me >= 4) shown.push(list[me]);
    $('on172rows').innerHTML = shown.map(function (p) {
      var pos = list.indexOf(p) + 1, v = speed ? String(p.score || 0) : p.state === 'finished' ? '✓ ' + T('fin', { s: Math.round(p.timeMs / 1000) }) : p.state === 'lost' || p.state === 'timeout' ? '✗ ' + (p.remaining == null ? '' : p.remaining) : (p.remaining == null ? '…' : p.remaining);
      return '<div class="r' + (p.id === mePub ? ' me' : '') + '"><b>' + pos + '</b><span>' + esc(p.name) + '</span><i>' + v + '</i></div>';
    }).join('');
    $('on172stand').classList.remove('hidden');
  }

  /* ---------- messages ---------- */
  function errMsg(m) {
    var k = 'e_' + m.code; var s = STR.ar[k] ? T(k, { fee: m.fee || fee }) : T('e_other'); return s;
  }
  function onMsg(m) {
    switch (m.t) {
      case 'hi': fee = m.fee || fee; cfgInfo = m; break;
      case 'welcome': coins = m.coins; fee = m.fee || fee; mePub = m.pub || mePub; renderCoins(); applyTexts(); break;
      case 'wallet': coins = m.coins; renderCoins(); break;
      case 'created': case 'joined': room = m.room; coins = m.coins; renderCoins(); setView('lobby'); renderLobby(); break;
      case 'room': room = m.room; if (view === 'lobby') renderLobby(); renderStand(); break;
      case 'start': onStart(m); break;
      case 'timeup': if (inGame && !gameOver && window.ZF && window.ZF.G && window.ZF.G.state === 'play') window.ZF.endLevel(false); break;
      case 'result': onResult(m); break;
      case 'closed': toast(T('c_' + m.reason) === 'c_' + m.reason ? T('c_empty') : T('c_' + m.reason)); room = null; if (inGame) { stopGameUi(); goHome(); } else { setView('home'); } break;
      case 'left': room = null; coins = m.coins != null ? m.coins : coins; renderCoins(); if (!inGame) setView('home'); break;
      case 'error': if (m.code !== 'too_fast') toast(errMsg(m)); break;
    }
  }

  /* ---------- game flow ---------- */
  function onStart(m) {
    if (inGame && m.resumed) return;                 // game still running locally after a short disconnect
    if (inGame) return;
    var elapsed = m.resumed ? (m.serverNow - m.startAt) : -m.countdownMs;
    var dur = m.durationMs - Math.max(0, elapsed);
    if (dur < 5000) { return; }
    inGame = true; gameOver = false; lastProg = 0; startedLocal = false;
    curStyle = m.style || 'race'; window.ZF.onlinePrepare(m.level, m.seed, dur, curStyle);
    renderStand();
    var wait = Math.max(0, -elapsed), t0 = Date.now();
    clearInterval(countT);
    var box = $('on172count');
    function step() {
      var left = wait - (Date.now() - t0);
      if (left > 0) { box.textContent = Math.ceil(left / 1000); box.classList.remove('hidden'); return; }
      clearInterval(countT); box.textContent = T('go'); window.ZF.onlineGo(); startedLocal = true;
      setTimeout(function () { box.classList.add('hidden'); }, 700);
    }
    countT = setInterval(step, 100); step();
  }
  function tick(G) {
    var now = Date.now(); if (now - lastProg < 600) return; lastProg = now;
    send({ t: 'progress', remaining: Math.max(0, G.remaining | 0), total: G.total | 0, score: G.matchScore155 | 0 });
  }
  function gameEnded(r) {
    if (gameOver) return; gameOver = true;
    var cleared = r.win && r.reason !== 'time';
    if (cleared) send({ t: 'finish', score: r.score }); else send({ t: 'lost', remaining: r.remaining, score: r.score });
    var w = $('on172wait'); w.textContent = cleared ? T('waitOthers') : T('lostWait'); w.classList.remove('hidden');
  }
  function stopGameUi() {
    inGame = false; gameOver = false; clearInterval(countT);
    ['on172count', 'on172stand', 'on172wait', 'pOnLeave172'].forEach(function (i) { $(i).classList.add('hidden'); });
  }
  function onResult(m) {
    var me = m.ranking.find(function (r) { return r.id === mePub; });
    stopGameUi(); room = null; coins = m.coins; renderCoins();
    $('onResultList172').innerHTML = m.ranking.map(function (r) {
      var v = m.style === 'speed' ? T('score', { n: r.score || 0 }) : r.state === 'finished' ? T('fin', { s: Math.round(r.timeMs / 1000) }) : (r.remaining == null ? '—' : T('left', { n: r.remaining }));
      return '<div class="on172r' + (r.id === mePub ? ' me' : '') + '"><b>' + r.place + '</b><span>' + esc(r.name) + '</span><small>' + v + '</small><i dir="ltr">' + (r.prize ? T('prize', { n: r.prize }) : '') + '</i></div>';
    }).join('');
    $('onResultCoins172').textContent = T('coins', { n: coins });
    $('pOnline172').classList.remove('hidden');
    if (me && me.prize) { /* winner sound handled by game end already */ }
  }
  function goHome() { // back to the online home screen with a clean menu state behind it
    window.ZF.menu(); window.ZF.show('sOnline172'); open();
  }
  function askLeave() {
    $('onLeaveTxt172').textContent = T('leaveAsk', { fee: fee }); $('pOnLeave172').classList.remove('hidden');
  }
  function doLeave() {
    $('pOnLeave172').classList.add('hidden'); send({ t: 'leave' }); stopGameUi(); room = null; goHome();
  }

  /* ---------- public API ---------- */
  function open() {
    applyTexts(); $('onName172').value = LS.get('zf_online_name') || ''; renderCoins(); markDiff(diff);
    if (!room) setView('home'); else { setView('lobby'); renderLobby(); }
    connect(); setStatus();
  }
  function back() {
    if (view === 'lobby' && room) { send({ t: 'leave' }); return 'ok'; }
    wantConn = false; window.ZF.menu(); return 'ok';
  }
  function gameClosed() { // game.js showMenu(): leaving a running match counts as a forfeit
    if (inGame) { send({ t: 'leave' }); room = null; }
    stopGameUi();
  }
  window.ZF_ONLINE172 = { open: open, back: back, tick: tick, gameEnded: gameEnded, gameClosed: gameClosed, askLeave: askLeave, _state: function () { return { view: view, inGame: inGame, room: room, coins: coins, mePub: mePub }; } };

  document.addEventListener('DOMContentLoaded', function () { wire(); });
  if (document.readyState !== 'loading') wire();
  var wired = false;
  function wire() {
    if (wired || !$('onBack172')) return; wired = true;
    $('onBack172').addEventListener('click', function () { back(); });
    document.querySelectorAll('.on172seg [data-d]').forEach(function (b) {
      b.addEventListener('click', function () {
        diff = b.getAttribute('data-d'); markDiff(diff);
        if (view === 'lobby' && room) send({ t: 'difficulty', difficulty: diff });
      });
    });
    document.querySelectorAll('#onStyleHost172 [data-s]').forEach(function (b) {
      b.addEventListener('click', function () { if (view === 'lobby' && room) send({ t: 'style', style: b.getAttribute('data-s') }); });
    });
    $('onCreate172').addEventListener('click', function () {
      var nm = myName(); if (!nm) return toast(T('badName'));
      LS.set('zf_online_name', nm); if (!connected) return toast(T('connecting'));
      sendHello(); send({ t: 'create', difficulty: diff, style: 'race' });
    });
    $('onJoin172').addEventListener('click', function () {
      var nm = myName(); if (!nm) return toast(T('badName'));
      var c = ($('onCode172').value || '').trim(); if (!/^\d{4}$/.test(c)) return toast(T('badCode'));
      LS.set('zf_online_name', nm); if (!connected) return toast(T('connecting'));
      sendHello(); send({ t: 'join', code: c });
    });
    $('onCode172').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 4); });
    $('onStart172').addEventListener('click', function () { if (room && room.players.filter(function (p) { return p.online; }).length < 2) return toast(T('need2')); send({ t: 'start' }); });
    $('onLeave172').addEventListener('click', function () { send({ t: 'leave' }); });
    $('on172exit').addEventListener('click', askLeave);
    $('onLeaveYes172').addEventListener('click', doLeave);
    $('onLeaveNo172').addEventListener('click', function () { $('pOnLeave172').classList.add('hidden'); });
    $('onResultOk172').addEventListener('click', function () { $('pOnline172').classList.add('hidden'); goHome(); });
  }
})();
