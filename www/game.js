// AB Z Fruit - game engine (HTML5 canvas + Matter.js), runs inside an Android WebView
(function () {
  'use strict';
  var M = Matter, Engine = M.Engine, Bodies = M.Bodies, Body = M.Body, Composite = M.Composite;
  var W = 720, H = 1560;
  var $ = function (id) { return document.getElementById(id); };
  var cv = $('cv'), ctx = cv.getContext('2d');
  var scale = 1, dpr = 1;
  var FR = window.ZF_FRUITS;                   // [{n,c}]
  var LV = window.ZF_LEVELS;

  /* ---------------- i18n ---------------- */
  var TR = {
    ar: { level: 'المستوى', play: 'العب', levels: 'المراحل', online: 'تحدي أونلاين', soon: 'قريبًا', loading: 'جاري التحميل...',
      paused: 'إيقاف مؤقت', resume: 'كمّل', replay: 'إعادة', home: 'الرئيسية', win: 'أحسنت!', next: 'التالي',
      full: 'المجرى امتلأ!', fullHint: 'نزّل الفاكهة اللي زي اللي فوق المجرى عشان تختفي.', retry: 'حاول تاني', continueAd: 'كمّل بإعلان',
      settings: 'الإعدادات', sound: 'الصوت', vibration: 'الاهتزاز', language: 'اللغة', close: 'إغلاق',
      adTitle: 'إعلان تجريبي', adHint: 'هنا هيظهر إعلان حقيقي في النسخة المنشورة.',
      hint1: 'اضغط على الفاكهة عشان تنزل. فاكهتين زي بعض بيختفوا لما يتقابلوا!',
      hint2: 'اسحب إصبعك على لحد 3 فواكه عشان ينزلوا مع بعض.',
      hintBird: 'الطائر جاي! اضغط عليه قبل ما يخطف فاكهة.', hintBee: 'نحلة! اضغط عليها عشان تطيّرها.', hintBomb: 'القنبلة! اضغط عليها قبل ما تنفجر.',
      hintLock: 'الرقم بينقص مع كل زوج فواكه بيختفي. لما يوصل 0 الفاكهة تتحرر.', noCoins: 'مفيش عملات كفاية', online2: 'التحدي الأونلاين قريبًا', shareTxt: 'العب AB Z Fruit - زحلقها! لعبة الفواكه الممتعة' },
    en: { level: 'Level', play: 'Play', levels: 'Levels', online: 'Online Duel', soon: 'Soon', loading: 'Loading...',
      paused: 'Paused', resume: 'Resume', replay: 'Replay', home: 'Home', win: 'Great job!', next: 'Next',
      full: 'The channel is full!', fullHint: 'Drop the same fruit as the one on top to clear it.', retry: 'Try again', continueAd: 'Continue with ad',
      settings: 'Settings', sound: 'Sound', vibration: 'Vibration', language: 'Language', close: 'Close',
      adTitle: 'Test ad', adHint: 'A real ad will appear here in the published version.',
      hint1: 'Tap a fruit to drop it. Two matching fruits vanish when they meet!',
      hint2: 'Swipe across up to 3 fruits to drop them together.',
      hintBird: 'A bird is coming! Tap it before it grabs a fruit.', hintBee: 'A bee! Tap it to shoo it away.', hintBomb: 'A bomb! Tap it before it explodes.',
      hintLock: 'The number drops every time a pair vanishes. At 0 the fruit is freed.', noCoins: 'Not enough coins', online2: 'Online duel is coming soon', shareTxt: 'Play AB Z Fruit! A fun fruit puzzle game' }
  };

  /* ---------------- save ---------------- */
  var SKEY = 'zfruit_v1';
  var save = { unlocked: 1, stars: {}, coins: 100, sound: 1, vib: 1, lang: 'ar', hint1: 0, hint2: 0 };
  try { var s0 = JSON.parse(localStorage.getItem(SKEY) || '{}'); for (var k in s0) save[k] = s0[k]; } catch (e) {}
  function persist() { try { localStorage.setItem(SKEY, JSON.stringify(save)); } catch (e) {} }
  function t(k) { return (TR[save.lang] && TR[save.lang][k]) || TR.ar[k] || k; }
  function applyLang() {
    document.documentElement.lang = save.lang;
    document.documentElement.dir = save.lang === 'ar' ? 'rtl' : 'ltr';
    var els = document.querySelectorAll('[data-t]');
    for (var i = 0; i < els.length; i++) els[i].textContent = t(els[i].getAttribute('data-t'));
    $('langAr').classList.toggle('on', save.lang === 'ar'); $('langEn').classList.toggle('on', save.lang === 'en');
  }

  /* ---------------- assets ---------------- */
  var IMG = { fruit: {}, el: {}, ui: {} };
  function loadAll(done) {
    var list = [], n = 0;
    FR.forEach(function (f) { list.push(['fruit', f.n, 'assets/fruits/' + f.n + '.png']); });
    ['wood', 'rock', 'cage', 'bird1', 'bird2', 'bird3', 'bee', 'bomb', 'mystery', 'heart', 'star', 'coin', 'sparkle', 'ring', 'pop', 'splash', 'smoke', 'shards']
      .forEach(function (k) { list.push(['el', k, 'assets/el/' + k + '.png']); });
    var total = list.length;
    list.forEach(function (it) {
      var im = new Image();
      im.onload = im.onerror = function () { n++; var f = $('loadFill'); if (f) f.style.width = (n / total * 100) + '%'; if (n === total) done(); };
      im.src = it[2]; IMG[it[0]][it[1]] = im;
    });
  }

  /* ---------------- audio (synth, no files) ---------------- */
  var AC = null;
  function audio() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f0, f1, dur, type, vol, delay) {
    if (!save.sound) return; var a = audio(); if (!a) return;
    var t0 = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t0); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(vol || .15, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + dur + .02);
  }
  function noise(dur, vol) {
    if (!save.sound) return; var a = audio(); if (!a) return;
    var buf = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    var s = a.createBufferSource(), g = a.createGain(); s.buffer = buf; g.gain.value = vol || .2; s.connect(g); g.connect(a.destination); s.start();
  }
  var SFX = {
    click: function () { tone(520, 700, .08, 'triangle', .12); },
    drop: function () { tone(380, 260, .10, 'sine', .10); },
    pop: function (c) { var b = 560 + (c || 0) * 90; tone(b, b * 1.8, .16, 'triangle', .16); tone(b * 1.5, b * 2.4, .12, 'sine', .08, .05); },
    win: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, f, .22, 'triangle', .16, i * .12); }); },
    lose: function () { tone(330, 120, .5, 'sawtooth', .12); },
    bird: function () { tone(1400, 2000, .08, 'sine', .1); tone(1800, 1300, .1, 'sine', .1, .1); tone(1500, 2100, .08, 'sine', .1, .22); },
    bomb: function () { noise(.5, .3); tone(120, 40, .5, 'sawtooth', .2); },
    power: function () { tone(400, 900, .25, 'square', .08); },
    bee: function () { tone(210, 190, .25, 'sawtooth', .05); }
  };
  function vib(ms) { if (save.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) {} } }

  /* ---------------- helpers ---------------- */
  var rnd = Math.random;
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function shuffle(arr, rng) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)), x = arr[i]; arr[i] = arr[j]; arr[j] = x; } return arr; }
  function toast(msg) { var el = $('toast'); el.textContent = msg; el.classList.remove('hidden'); clearTimeout(toast.h); toast.h = setTimeout(function () { el.classList.add('hidden'); }, 1800); }

  /* ---------------- world themes ---------------- */
  var THEMES = [
    { sky: ['#5fc2ff', '#d6f3ff'], hill: ['#9ad65a', '#7bc243'], grass: '#3fc01e', grassHi: '#8cf05a', soil: ['#8a5a34', '#6b4224'], dot: '#5c3a20', sun: '#fff3a0', night: false },
    { sky: ['#7fd4ff', '#fff0d6'], hill: ['#86c95a', '#5fae3c'], grass: '#37b23a', grassHi: '#85e070', soil: ['#8f5f3a', '#70472a'], dot: '#5e3d24', sun: '#ffe08a', night: false },
    { sky: ['#4fc6f0', '#c8f4ff'], hill: ['#e9d79a', '#d4c07a'], grass: '#4cc470', grassHi: '#9bf0b0', soil: ['#c9a566', '#a98748'], dot: '#8a6a34', sun: '#fff6b0', night: false },
    { sky: ['#ff9a6a', '#ffe0a8'], hill: ['#a9b84a', '#7f9a35'], grass: '#6fb52a', grassHi: '#c0ee6a', soil: ['#8a4e34', '#683824'], dot: '#4e2a1a', sun: '#ffd0a0', night: false },
    { sky: ['#101a46', '#3a3f8a'], hill: ['#285a4a', '#1e4a3c'], grass: '#2f9a58', grassHi: '#6fe0a0', soil: ['#4a3a50', '#362a3c'], dot: '#241a2a', sun: '#f4f4ff', night: true }
  ];

  /* ---------------- game state ---------------- */
  var G = null;            // active level or demo scene
  var screen = 'splash';
  var mode = 'menu';       // 'menu' | 'play'
  var lastT = 0;
  var cloudOff = 0;

  function newEngine() {
    var e = Engine.create({ positionIterations: 14, velocityIterations: 10 });
    e.gravity.y = 1; e.gravity.scale = 0.0022;
    return e;
  }

  function groundY(g, x) {
    if (x <= g.chL) return g.slopeTopY + (g.mouthY - g.slopeTopY) * (x / g.chL);
    if (x >= g.chR) return g.slopeTopY + (g.mouthY - g.slopeTopY) * ((W - x) / (W - g.chR));
    return g.mouthY;
  }

  function addSeg(g, x1, y1, x2, y2, th) {
    var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy), ang = Math.atan2(dy, dx);
    var nx = -dy / len, ny = dx / len; if (ny < 0) { nx = -nx; ny = -ny; }   // normal pointing downward (into the soil)
    var cx = (x1 + x2) / 2 + nx * th / 2, cy = (y1 + y2) / 2 + ny * th / 2;
    var b = Bodies.rectangle(cx, cy, len + 4, th, { isStatic: true, angle: ang, friction: .02, frictionStatic: 0, restitution: .1, label: 'ground' });
    Composite.add(g.engine.world, b); return b;
  }

  function buildLevel(n, demo) {
    var cfg = LV.gen(n), rng = cfg.rng;
    var g = { cfg: cfg, n: n, demo: !!demo, engine: newEngine(), hang: [], dyn: [], obst: [], fx: [], parts: [], bees: [], bird: null,
      time: 0, state: 'play', shake: 0, extra: 0, birdDone: 0, popped: 0, powerUsed: 0, maxStack: 0, gesture: 0, bombList: [], clouds: [],
      stuckT: 0, fullT: 0, theme: THEMES[cfg.world] };
    for (var i = 0; i < 6; i++) g.clouds.push({ x: rnd() * W, y: 120 + rnd() * 380, s: .6 + rnd() * .9, v: 4 + rnd() * 9 });

    var topBar = 120, bottomBar = 215;
    // channel geometry depends on fruit radius -> search the largest radius that fits all fruits
    var need = cfg.count + cfg.bomb, bestR = 11, cells = null, geom = null;
    for (var r = cfg.rMax; r >= 11; r -= 1) {
      var gm = geomFor(r, cfg, topBar, bottomBar);
      var cs = genCells(gm, r, rng0(cfg.seed + r));
      var obstSpace = (cfg.wood + cfg.rock) * 18;
      if (cs.length >= need * 1.2 + obstSpace + 4) { bestR = r; cells = cs; geom = gm; break; }
    }
    if (!geom) { bestR = 11; geom = geomFor(11, cfg, topBar, bottomBar); cells = genCells(geom, 11, rng0(cfg.seed)); }
    // spread the fruits over the whole sky: widen the cell spacing until the cells just fit this level's fruits
    var spread = 1.07, wantCells = need * 1.12 + (cfg.wood + cfg.rock) * 18 + 6;
    for (var ff = 1.12; ff <= 2.0; ff += 0.06) {
      var cs2 = genCells(geom, bestR, rng0(cfg.seed + bestR), ff);
      if (cs2.length < wantCells) break; spread = ff; cells = cs2;
    }
    g.r = bestR; for (var kk in geom) g[kk] = geom[kk];

    // static terrain
    addSeg(g, 0, g.slopeTopY, g.chL, g.mouthY, 80);
    addSeg(g, g.chR, g.mouthY, W, g.slopeTopY, 80);
    g.wallL = Bodies.rectangle(g.chL - 30, (g.mouthY + g.floorY + 600) / 2, 60, g.floorY + 600 - g.mouthY, { isStatic: true, friction: 0, frictionStatic: 0, label: 'ground' });
    g.wallR = Bodies.rectangle(g.chR + 30, (g.mouthY + g.floorY + 600) / 2, 60, g.floorY + 600 - g.mouthY, { isStatic: true, friction: 0, frictionStatic: 0, label: 'ground' });
    g.floorB = Bodies.rectangle(W / 2, g.floorY + 30, 400, 60, { isStatic: true, friction: .1, label: 'ground' });
    Composite.add(g.engine.world, [g.wallL, g.wallR, g.floorB]);
    Composite.add(g.engine.world, [Bodies.rectangle(-30, H / 2, 60, H * 3, { isStatic: true, label: 'ground' }), Bodies.rectangle(W + 30, H / 2, 60, H * 3, { isStatic: true, label: 'ground' })]);

    // obstacles (placed in the falling corridor, above the slopes)
    var usedCells = {};
    function takeCell(filter) {
      for (var i = 0; i < cells.length; i++) { if (!usedCells[i] && (!filter || filter(cells[i]))) { usedCells[i] = 1; return cells[i]; } }
      return null;
    }
    var shuffled = shuffle(cells.map(function (c, i) { return i; }), rng);
    function pickCell(filter) {
      for (var i = 0; i < shuffled.length; i++) { var idx = shuffled[i]; if (!usedCells[idx] && (!filter || filter(cells[idx]))) { usedCells[idx] = 1; return cells[idx]; } }
      return null;
    }
    function blockAround(c, rad) { for (var i = 0; i < cells.length; i++) { if (!usedCells[i]) { var dx = cells[i].x - c.x, dy = cells[i].y - c.y; if (dx * dx + dy * dy < rad * rad) usedCells[i] = 1; } } }
    var corridor = function (c) { return c.x > W * 0.2 && c.x < W * 0.8 && Math.abs(c.x - W / 2) > g.r * 4.5 && c.y > g.topY + (g.mouthY - g.topY) * 0.22 && c.y < groundY(g, c.x) - g.r * 6.2; };
    var i2;
    for (i2 = 0; i2 < cfg.wood; i2++) {
      var c = pickCell(corridor) || pickCell(); if (!c) break;
      var sz = g.r * 2.6;
      var body = Bodies.rectangle(c.x, c.y, sz, sz, { isStatic: true, angle: (rng() - .5) * 0.9, friction: .02, frictionStatic: 0, restitution: .25, label: 'obst' });
      Composite.add(g.engine.world, body); g.obst.push({ type: 'wood', x: c.x, y: c.y, size: sz, ang: body.angle, body: body });
      blockAround(c, g.r * 5.4);
    }
    for (i2 = 0; i2 < cfg.rock; i2++) {
      var c2 = pickCell(corridor) || pickCell(); if (!c2) break;
      var rr = g.r * 1.45;
      var body2 = Bodies.circle(c2.x, c2.y, rr * .92, { isStatic: true, friction: .02, frictionStatic: 0, restitution: .25, label: 'obst' });
      Composite.add(g.engine.world, body2); g.obst.push({ type: 'rock', x: c2.x, y: c2.y, size: rr * 2.2, ang: (rng() - .5) * .6, body: body2 });
      blockAround(c2, g.r * 5.6);
    }

    // fruits: pairs of the same kind
    var pairs = cfg.count / 2, kinds = [];
    var chosen = [], usedFam = {};      // pick `types` different fruit families (whole or sliced version)
    shuffle(FR.map(function (f, i) { return i; }), rng).forEach(function (fi) {
      var fm = FR[fi].f || FR[fi].n; if (usedFam[fm] || chosen.length >= cfg.types) return; usedFam[fm] = 1; chosen.push(fi);
    });
    for (var p = 0; p < pairs; p++) { var tk = p < chosen.length ? p : Math.floor(rng() * chosen.length); kinds.push(chosen[tk]); }
    var mysteryLeft = cfg.mystery;
    var ents = [];
    shuffle(kinds, rng).forEach(function (k, idx) {
      var isMyst = mysteryLeft > 0 && rng() < 0.35; if (isMyst) mysteryLeft--;
      for (var j = 0; j < 2; j++) ents.push({ kind: k, mystery: isMyst });
    });
    while (mysteryLeft > 0) { // make sure all mystery pairs are used
      var a = ents[Math.floor(rng() * ents.length)]; if (!a.mystery) { a.mystery = true; var tw = ents.filter(function (e) { return e.kind === a.kind && !e.mystery && e !== a; })[0]; if (tw) tw.mystery = true; mysteryLeft--; }
    }
    shuffle(ents, rng);
    var id = 1;
    ents.forEach(function (e) {
      var c = pickCell();
      if (!c) return;
      e.id = id++; e.x = c.x; e.y = c.y; e.state = 'hang'; e.ph = rng() * 6.28; e.caged = false; e.stung = false; e.bomb = false;
      g.hang.push(e);
    });
    // cages (each cage locks one fruit; opens after 2 pops)
    var cagedN = 0, hpMax = Math.max(2, Math.floor(pairs * 0.6));
    shuffle(g.hang.slice(), rng).forEach(function (e) {
      if (cagedN < cfg.cage) { e.caged = true; e.lock = (cagedN % 2 === 0) ? 'nest' : 'bubble'; e.cageHp = Math.min(hpMax, clamp(2 + Math.floor((cfg.n - 10) / 20) + Math.floor(rng() * 3), 2, 9)); cagedN++; }
    });
    // bombs
    for (var b2 = 0; b2 < cfg.bomb; b2++) {
      var cb = pickCell(); if (!cb) break;
      var be = { id: id++, kind: -1, x: cb.x, y: cb.y, state: 'hang', bomb: true, fuse: 16 + rng() * 10 - Math.min(6, cfg.n / 40), ph: rng() * 6.28 };
      g.hang.push(be);
    }
    g.total = cfg.count; g.remaining = cfg.count;
    g.birdAt = 0.28 + rng() * 0.2; g.birdN = cfg.bird; g.beeT = 5 + rng() * 6;
    return g;
  }
  function rng0(seed) { return LV.mulberry32(seed); }

  var BODY_K = 1.1, DRAW_K = 2.2;        // physics radius ~= drawn radius, so fruits never look like they overlap
  function geomFor(r, cfg, topBar, bottomBar) {
    var br = r * BODY_K;                                   // physics radius of a fruit
    var cw = Math.round(r * DRAW_K * 1.2);                 // like the original: channel is ~1.2x the fruit diameter
    var cap = cfg.cap;
    var floorBase = H - bottomBar - r * 2 * 1.2;
    var depth = cap * br * 2 * 0.99 + r * 0.5;
    var mouthY = floorBase - depth;
    var slopeRise = clamp((mouthY - topBar) * 0.42, 130, 300);
    var g = { cw: cw, chL: W / 2 - cw / 2, chR: W / 2 + cw / 2, floorY: floorBase, floorBase: floorBase, mouthY: mouthY, slopeTopY: mouthY - slopeRise, topY: topBar + 24 };
    return g;
  }
  function genCells(g, r, rng, f) {
    var s = r * 2 * (f || 1.07), dy = s * 0.88, out = [], row = 0;
    for (var y = g.topY + r * 1.2; y < g.mouthY - r * 2.2; y += dy, row++) {
      var off = (row % 2) ? s / 2 : 0;
      for (var x = r * 1.3 + off; x < W - r * 1.3; x += s) {
        var jx = (rng() - .5) * s * (f > 1.2 ? 0.3 : 0.08), jy = (rng() - .5) * s * (f > 1.2 ? 0.3 : 0.08);
        var px = x + jx, py = y + jy, gy = groundY(g, px);
        if (py < gy - r * 1.7 && py > g.topY) out.push({ x: px, y: py });
      }
    }
    return out;
  }

  /* ---------------- gameplay actions ---------------- */
  function kindImg(e) { return IMG.fruit[FR[e.kind % FR.length].n]; }

  function releaseFruit(e) {
    if (!G || e.state !== 'hang' || e.caged || e.stung) return false;
    if (e.bomb) { defuse(e); return true; }
    e.state = 'fall'; e.mystery = false;
    for (var tr = 0; tr < 8; tr++) {   // never spawn inside another falling fruit
      var clash = G.dyn.some(function (o) { var q = o.body.position, dx = q.x - e.x, dy = q.y - e.y; return dx * dx + dy * dy < Math.pow(G.r * BODY_K * 2.05, 2); });
      if (!clash) break; e.y -= G.r * BODY_K * 0.7;
    }
    var b = Bodies.circle(e.x, e.y, G.r * BODY_K, { restitution: .12, friction: .02, frictionStatic: 0, frictionAir: .004, density: .0016, label: 'fruit' });
    Body.setVelocity(b, { x: (rnd() - .5) * 1.4, y: 0 }); Body.setAngularVelocity(b, (rnd() - .5) * .12);
    b.ent = e; e.body = b; e.idle = 0; Composite.add(G.engine.world, b);
    G.hang.splice(G.hang.indexOf(e), 1); G.dyn.push(e);
    SFX.drop(); vib(8);
    return true;
  }
  function releaseAt(x, y) { // hit-test hanging fruits (topmost nearest)
    var best = null, bd = 1e9, rr = G.r * 1.3;
    for (var i = 0; i < G.hang.length; i++) {
      var e = G.hang[i], dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
      if (d < rr * rr && d < bd) { bd = d; best = e; }
    }
    if (!best) return false;
    if (best.caged) { G.shake = Math.max(G.shake, 3); return false; }
    if (best.stung) { G.shake = Math.max(G.shake, 3); return false; }
    return releaseFruit(best);
  }
  function defuse(e) {
    G.hang.splice(G.hang.indexOf(e), 1);
    addFx('sparkle', e.x, e.y, G.r * 4, .5); addFx('smoke', e.x, e.y, G.r * 3.4, .6);
    SFX.power(); save.coins += 2; persist(); updateCoins();
  }
  function explodeBomb(e) {
    G.hang.splice(G.hang.indexOf(e), 1);
    addFx('pop', e.x, e.y, G.r * 7, .6); addFx('smoke', e.x, e.y, G.r * 5, .8);
    SFX.bomb(); vib(60); G.shake = 14;
    var near = G.hang.filter(function (f) { return !f.bomb && !f.caged && !f.stung; })
      .sort(function (a, b) { return dist2(a, e) - dist2(b, e); }).slice(0, 3);
    near.forEach(function (f) { releaseFruit(f); });
  }
  function dist2(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }

  function popPair(a, b) {
    [a, b].forEach(function (e) {
      var x = e.body.position.x, y = e.body.position.y;
      Composite.remove(G.engine.world, e.body); G.dyn.splice(G.dyn.indexOf(e), 1);
      addFx('splash', x, y, G.r * 3.2, .55); addFx('sparkle', x, y, G.r * 2.6, .45);
      for (var i = 0; i < 7; i++) G.parts.push({ x: x, y: y, vx: (rnd() - .5) * 420, vy: -rnd() * 380 - 40, t: 0, life: .55 + rnd() * .3, c: FR[e.kind % FR.length].c, s: G.r * (.12 + rnd() * .14) });
    });
    G.remaining -= 2; G.popped += 2;
    SFX.pop(Math.min(6, G.chain || 0)); vib(14);
    cageHit();
    bumpCounter();
  }
  function cageHit() {
    G.hang.forEach(function (e) { if (e.caged) { e.cageHp--; if (e.cageHp <= 0) { e.caged = false; addFx('shards', e.x, e.y, G.r * 3.2, .5); addFx('sparkle', e.x, e.y, G.r * 3, .45); SFX.power(); } } });
  }
  function removeFruit(e) {
    var x, y;
    if (e.state === 'fall') { x = e.body.position.x; y = e.body.position.y; Composite.remove(G.engine.world, e.body); G.dyn.splice(G.dyn.indexOf(e), 1); }
    else { x = e.x; y = e.y; G.hang.splice(G.hang.indexOf(e), 1); }
    addFx('splash', x, y, G.r * 3, .5); addFx('sparkle', x, y, G.r * 2.4, .4);
  }

  /* ---------------- power-ups ---------------- */
  var COST = { trash: 25, plus: 30, shuffle: 20 };
  function payFor(kind, run) {
    if (!G || G.state !== 'play') return;
    if (save.coins >= COST[kind]) { save.coins -= COST[kind]; persist(); updateCoins(); G.powerUsed++; run(); }
    else { showAd(function () { G.powerUsed++; run(); }); }
  }
  function channelFruits() {
    return G.dyn.filter(function (e) { var p = e.body.position; return p.x > G.chL - 4 && p.x < G.chR + 4 && p.y > G.mouthY - G.r; }).sort(function (a, b) { return a.body.position.y - b.body.position.y; });
  }
  function doTrash() {
    var ch = channelFruits(); var top = ch[0] || G.dyn.slice().sort(function (a, b) { return b.body.position.y - a.body.position.y; })[0];
    if (!top) { toast(save.lang === 'ar' ? 'مفيش فاكهة في المجرى' : 'Nothing in the channel'); refundNone('trash'); return; }
    var twin = G.dyn.filter(function (e) { return e !== top && e.kind === top.kind; })[0] || G.hang.filter(function (e) { return !e.bomb && e.kind === top.kind; })[0];
    removeFruit(top); G.remaining -= 1; if (twin) { removeFruit(twin); G.remaining -= 1; }
    SFX.power(); bumpCounter();
  }
  function doTrashSilent() {
    var ch = channelFruits(); var top = ch[0]; if (!top) return;
    var twin = G.dyn.filter(function (e) { return e !== top && e.kind === top.kind; })[0] || G.hang.filter(function (e) { return !e.bomb && e.kind === top.kind; })[0];
    removeFruit(top); G.remaining -= 1; if (twin) { removeFruit(twin); G.remaining -= 1; }
  }
  function refundNone(kind) { save.coins += COST[kind]; persist(); updateCoins(); G.powerUsed--; }
  function doPlus() {
    if (G.extra >= 3) { toast(save.lang === 'ar' ? 'وصلت للحد الأقصى' : 'Maximum reached'); refundNone('plus'); return; }
    extendChannel(1); SFX.power();
  }
  function extendChannel(slots) {
    G.extra += slots; var add = G.r * 2 * 0.98 * slots; G.floorY += add; G.cfg.cap += slots;
    Body.setPosition(G.floorB, { x: W / 2, y: G.floorY + 30 });
    addFx('ring', W / 2, G.floorY - G.r, G.r * 5, .6);
  }
  function doShuffle() {
    var arr = G.hang.filter(function (e) { return !e.bomb; });
    var kinds = shuffle(arr.map(function (e) { return e.kind; }), Math.random);
    arr.forEach(function (e, i) { e.kind = kinds[i]; e.wob = .6; addFx('sparkle', e.x, e.y, G.r * 2.2, .4); });
    SFX.power();
  }

  /* ---------------- ads (stub; native bridge when available) ---------------- */
  var adCb = null;
  function showAd(cb) {
    if (window.AndroidBridge && window.AndroidBridge.showRewarded) { adCb = cb; try { window.AndroidBridge.showRewarded(); return; } catch (e) {} }
    adCb = cb; $('pAd').classList.remove('hidden'); $('adFill').style.width = '0';
    var s = Date.now(); (function loop() { var p = Math.min(1, (Date.now() - s) / 1500); $('adFill').style.width = (p * 100) + '%'; if (p < 1) setTimeout(loop, 50); else { $('pAd').classList.add('hidden'); var f = adCb; adCb = null; if (f) f(); } })();
  }
  window.onRewarded = function () { var f = adCb; adCb = null; if (f) f(); };

  /* ---------------- effects ---------------- */
  function addFx(img, x, y, size, dur) { G.fx.push({ img: img, x: x, y: y, size: size, t: 0, dur: dur }); }

  /* ---------------- update ---------------- */
  var idCounter = 0;
  function update(dt) {
    if (!G) return;
    cloudOff += dt;
    G.clouds.forEach(function (c) { c.x += c.v * dt; if (c.x > W + 140) c.x = -140; });
    G.hang.forEach(function (e) { e.ph += dt * 2.2; if (e.wob) e.wob = Math.max(0, e.wob - dt); });
    updateFx(dt);
    if (G.demo) return;
    if (G.state !== 'play') return;
    G.time += dt;
    // physics
    var steps = Math.max(2, Math.min(12, Math.round(dt * 240)));
    for (var s = 0; s < steps; s++) Engine.update(G.engine, 1000 / 240);
    G.shake = Math.max(0, G.shake - dt * 30);

    // merge same-kind fruits that touch
    var d = G.dyn, merged = true, guard = 0; G.chain = 0;
    while (merged && guard++ < 20) {
      merged = false;
      for (var i = 0; i < d.length && !merged; i++) {
        for (var j = i + 1; j < d.length; j++) {
          var a = d[i], b = d[j];
          if (a.kind !== b.kind) continue;
          var dx = a.body.position.x - b.body.position.x, dy = a.body.position.y - b.body.position.y, rr = G.r * BODY_K * 2 * 1.06;
          if (dx * dx + dy * dy < rr * rr) { popPair(a, b); G.chain++; merged = true; break; }
        }
      }
    }
    // safety net: never let two fruits visibly overlap
    for (var pi = 0; pi < G.dyn.length; pi++) {
      for (var pj = pi + 1; pj < G.dyn.length; pj++) {
        var qa = G.dyn[pi].body, qb = G.dyn[pj].body, sdx = qb.position.x - qa.position.x, sdy = qb.position.y - qa.position.y, sd = Math.sqrt(sdx * sdx + sdy * sdy), mn = G.r * BODY_K * 2 * 0.94;
        if (sd < mn && sd > 0.01) { var push = (mn - sd) / 2, ux = sdx / sd, uy = sdy / sd; Body.setPosition(qa, { x: qa.position.x - ux * push, y: qa.position.y - uy * push }); Body.setPosition(qb, { x: qb.position.x + ux * push, y: qb.position.y + uy * push }); }
      }
    }
    // stuck fruits (not in channel and not moving) get a nudge toward the channel
    for (var k = 0; k < G.dyn.length; k++) {
      var e = G.dyn[k], p = e.body.position, v = e.body.speed;
      var inCh = p.x > G.chL - 6 && p.x < G.chR + 6 && p.y > G.mouthY - G.r * 0.5;
      if (!inCh && v < 0.3) { e.idle = (e.idle || 0) + dt; if (e.idle > 1.2) { e.idle = 0; Body.setVelocity(e.body, { x: (W / 2 - p.x) * 0.02 + (rnd() - .5) * 2, y: -3 }); } }
      else e.idle = 0;
      if (p.y > H + 200 || p.x < -200 || p.x > W + 200) { (G.lostLog = G.lostLog || []).push([e.kind, Math.round(p.x), Math.round(p.y)]); Composite.remove(G.engine.world, e.body); e.state = 'hang'; e.x = clamp(W * .3 + rnd() * W * .4, 60, W - 60); e.y = G.topY + G.r * 2; e.ph = 0; delete e.body; G.dyn.splice(k, 1); k--; G.hang.push(e); }
    }
    // overflow check
    var blocked = false, stack = 0;
    for (var m = 0; m < G.dyn.length; m++) {
      var ee = G.dyn[m], pp = ee.body.position;
      if (pp.x > G.chL - 6 && pp.x < G.chR + 6 && pp.y > G.mouthY - G.r * 1.5) stack++;
      if (ee.body.speed < 0.45 && pp.x > G.chL - 6 && pp.x < G.chR + 6 && pp.y < G.mouthY - G.r * 0.15 && pp.y > G.mouthY - G.r * 3) blocked = true;
    }
    G.maxStack = Math.max(G.maxStack, stack);
    if (blocked) { G.fullT += dt; if (G.fullT > 1.3) { G.fullT = 0; return endLevel(false); } } else G.fullT = Math.max(0, G.fullT - dt * 2);

    // deadlock: nothing left to drop and the channel cannot clear itself
    var freeLeft = G.hang.some(function (e) { return !e.bomb && !e.caged && !e.stung; });
    var settled = G.dyn.length > 0 && G.dyn.every(function (e) { return e.body.speed < 0.3; });
    if (!freeLeft && settled && !G.bird && !G.bees.length && !G.hang.some(function (e) { return e.caged; })) { G.deadT = (G.deadT || 0) + dt; if (G.deadT > 2.5) { G.deadT = 0; G.deadlock = true; return endLevel(false); } } else G.deadT = 0;
    // cages never deadlock: if only locked fruits remain, open them
    if (G.hang.length && G.hang.every(function (e) { return e.caged || e.bomb; }) && G.hang.some(function (e) { return e.caged; })) { G.hang.forEach(function (e) { if (e.caged) { e.cageHp = 0; e.caged = false; addFx('shards', e.x, e.y, G.r * 3.2, .5); } }); }
    // bombs
    for (var bi = G.hang.length - 1; bi >= 0; bi--) { var be = G.hang[bi]; if (be.bomb) { be.fuse -= dt; if (be.fuse <= 0) explodeBomb(be); } }
    // bees
    updateBees(dt); updateBird(dt);
    // win
    if (G.remaining <= 0 && G.dyn.length === 0 && G.state === 'play') endLevel(true);
    else if (G.hang.filter(function (e) { return !e.bomb; }).length === 0 && G.dyn.length === 0 && G.state === 'play') endLevel(true);
    updateCounter();
  }

  function updateFx(dt) {
    for (var i = G.fx.length - 1; i >= 0; i--) { G.fx[i].t += dt; if (G.fx[i].t >= G.fx[i].dur) G.fx.splice(i, 1); }
    for (var j = G.parts.length - 1; j >= 0; j--) { var p = G.parts[j]; p.t += dt; p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t >= p.life) G.parts.splice(j, 1); }
  }

  function pickTarget() {
    var c = G.hang.filter(function (e) { return !e.bomb && !e.caged && !e.stung && !e.taken; });
    return c.length ? c[Math.floor(rnd() * c.length)] : null;
  }
  function updateBees(dt) {
    if (!G.cfg.bee) return;
    var prog = 1 - G.remaining / G.total;
    G.beeT -= dt;
    if (G.beeT <= 0 && G.bees.length < G.cfg.bee && prog < 0.9 && G.hang.length > 4) {
      var tg = pickTarget(); G.beeT = 12 + rnd() * 8;
      if (tg) { tg.taken = true; G.bees.push({ x: rnd() < .5 ? -60 : W + 60, y: 160 + rnd() * 200, target: tg, state: 'fly', t: 0 }); SFX.bee(); showHint('hintBee'); }
    }
    for (var i = G.bees.length - 1; i >= 0; i--) {
      var b = G.bees[i];
      if (b.state === 'fly') {
        if (b.target.state !== 'hang') { b.state = 'leave'; continue; }
        var dx = b.target.x - b.x, dy = b.target.y - 4 - b.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
        b.x += dx / d * 260 * dt; b.y += dy / d * 260 * dt + Math.sin(G.time * 12) * 1.2;
        if (d < 18) { b.state = 'perch'; b.t = 0; b.target.stung = true; }
      } else if (b.state === 'perch') {
        b.t += dt; if (b.target.state !== 'hang') { b.state = 'leave'; continue; }
        b.x = b.target.x; b.y = b.target.y - G.r * .55;
        if (b.t > 6) { b.target.stung = false; b.target.taken = false; b.state = 'leave'; }
      } else { b.x += (b.x < W / 2 ? -1 : 1) * 320 * dt; b.y -= 180 * dt; if (b.x < -100 || b.x > W + 100 || b.y < -100) { if (b.target) { b.target.stung = false; b.target.taken = false; } G.bees.splice(i, 1); } }
    }
  }
  function updateBird(dt) {
    var prog = 1 - G.remaining / G.total;
    if (!G.bird && G.birdDone < G.birdN && prog >= G.birdAt + G.birdDone * 0.22 && G.hang.length > 3) {
      var tg = pickTarget();
      if (tg) { tg.taken = true; var left = rnd() < .5; G.bird = { state: 'warn', t: 0, x: left ? -90 : W + 90, y: 210 + rnd() * 120, target: tg, fromLeft: left, frame: 0 }; SFX.bird(); showHint('hintBird'); }
    }
    var b = G.bird; if (!b) return;
    b.frame += dt * 10; b.t += dt;
    if (b.state === 'warn') { if (b.t > 1.4) { b.state = 'fly'; b.t = 0; } }
    else if (b.state === 'fly') {
      if (b.target.state !== 'hang') { b.state = 'leave'; return; }
      var dx = b.target.x - b.x, dy = b.target.y - b.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      b.x += dx / d * 330 * dt; b.y += dy / d * 330 * dt;
      if (d < G.r * 1.2) { b.state = 'carry'; b.t = 0; G.hang.splice(G.hang.indexOf(b.target), 1); b.carry = b.target; b.carry.state = 'carried'; SFX.bird(); }
    } else if (b.state === 'carry') {
      var tx = W / 2, ty = G.mouthY - G.r * 6; var ddx = tx - b.x, ddy = ty - b.y, dd = Math.sqrt(ddx * ddx + ddy * ddy) || 1;
      b.x += ddx / dd * 300 * dt; b.y += ddy / dd * 300 * dt;
      if (dd < 14) dropCarry(b);
    } else {
      b.x += (b.fromLeft ? 1 : -1) * 360 * dt; b.y -= 120 * dt;
      if (b.x < -140 || b.x > W + 140 || b.y < -140) { G.bird = null; }
    }
  }
  function dropCarry(b) {
    var e = b.carry; if (e) { e.state = 'hang'; e.x = b.x; e.y = b.y + G.r; e.taken = false; G.hang.push(e); e.state = 'hang'; releaseFruit(e); }
    b.carry = null; b.state = 'leave'; G.birdDone++;
  }
  function scareBird() {
    var b = G.bird; if (!b) return false;
    if (b.state === 'carry') { dropCarry(b); }
    else { if (b.target) b.target.taken = false; b.state = 'leave'; G.birdDone++; }
    SFX.bird(); save.coins += 5; persist(); updateCoins(); addFx('sparkle', b.x, b.y, 150, .5); return true;
  }

  /* ---------------- level end ---------------- */
  function endLevel(win) {
    if (G.state !== 'play') return;
    G.state = win ? 'won' : 'lost';
    if (win) {
      SFX.win(); vib(40);
      var stars = (G.powerUsed === 0 ? (G.maxStack < G.cfg.cap ? 3 : 2) : 1);
      var coins = 10 + stars * 5;
      var prev = save.stars[G.n] || 0; if (stars > prev) save.stars[G.n] = stars;
      if (G.n >= save.unlocked && G.n < LV.MAX_LEVEL) save.unlocked = G.n + 1;
      save.coins += coins; persist(); updateCoins();
      setTimeout(function () {
        $('winLvl').textContent = G.n; $('winCoins').textContent = coins;
        for (var i = 1; i <= 3; i++) { var el = $('st' + i); el.className = ''; void el.offsetWidth; el.className = i <= stars ? 'on' : 'off'; el.style.animationDelay = (i * .25) + 's'; }
        $('wNext').style.display = G.n >= LV.MAX_LEVEL ? 'none' : '';
        $('pWin').classList.remove('hidden');
      }, 700);
    } else {
      SFX.lose(); vib(120);
      setTimeout(function () { $('pLose').classList.remove('hidden'); }, 500);
    }
  }

  /* ---------------- rendering ---------------- */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var vw = window.innerWidth, vh = window.innerHeight;
    scale = vw / W; var newH = Math.round(clamp(vh / scale, 1200, 1700));
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    if (newH !== H) { H = newH; if (G && mode === 'menu') startDemo(); }
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    var s = scale * dpr, vh = window.innerHeight;
    var offY = (vh * dpr - H * s) / 2;
    ctx.setTransform(s, 0, 0, s, 0, offY);
    if (!G) { ctx.fillStyle = '#7fd0ff'; ctx.fillRect(0, 0, W, H); return; }
    var th = G.theme;
    if (G.shake > 0) ctx.translate((rnd() - .5) * G.shake, (rnd() - .5) * G.shake);
    // sky
    var sg = ctx.createLinearGradient(0, 0, 0, H * .7); sg.addColorStop(0, th.sky[0]); sg.addColorStop(1, th.sky[1]);
    ctx.fillStyle = sg; ctx.fillRect(-20, -20, W + 40, H + 40);
    if (th.night) { for (var i = 0; i < 40; i++) { var sx = (i * 197) % W, sy = (i * 83) % (H * .45); ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(cloudOff * 1.5 + i)); ctx.fillStyle = '#fff'; ctx.fillRect(sx, sy, 3, 3); } ctx.globalAlpha = 1; }
    // sun / moon
    ctx.fillStyle = th.sun; ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(W * .82, 290, 52, 0, 7); ctx.fill();
    ctx.globalAlpha = .25; ctx.beginPath(); ctx.arc(W * .82, 290, 80, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    // clouds
    ctx.fillStyle = th.night ? 'rgba(180,190,255,.18)' : 'rgba(255,255,255,.85)';
    G.clouds.forEach(function (c) { ctx.beginPath(); ctx.ellipse(c.x, c.y, 70 * c.s, 26 * c.s, 0, 0, 7); ctx.ellipse(c.x + 42 * c.s, c.y + 6 * c.s, 50 * c.s, 22 * c.s, 0, 0, 7); ctx.ellipse(c.x - 42 * c.s, c.y + 8 * c.s, 46 * c.s, 20 * c.s, 0, 0, 7); ctx.fill(); });
    // far hills
    hills(H * .46, 60, 0.012, th.hill[0], 0.9); hills(H * .53, 46, 0.019, th.hill[1], 1.7);
    drawGround(th);
    drawLogs(G);
    // obstacles
    G.obst.forEach(function (o) { var im = IMG.el[o.type]; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.type === 'wood' ? o.ang : 0); var h = o.size * im.height / im.width; ctx.drawImage(im, -o.size / 2, -h / 2, o.size, h); ctx.restore(); });
    // hanging fruits
    var r = G.r;
    G.hang.forEach(function (e) {
      var bob = Math.sin(e.ph) * 3, x = e.x, y = e.y + bob;
      if (e.bomb) { drawBomb(e, x, y); return; }
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(x, y + r * .95, r * .8, r * .22, 0, 0, 7); ctx.fill();
      var sc = 1 + (e.wob ? Math.sin(e.wob * 30) * .08 : 0);
      var im = e.mystery ? IMG.el.mystery : kindImg(e);
      if (e.caged && e.lock === 'nest') drawNestBack(x, y);
      drawSpr(im, x, y, r * DRAW_K * sc, 0, e.stung ? .55 : 1);
      if (e.caged) drawLockFront(e, x, y);
    });
    // dynamic fruits
    G.dyn.forEach(function (e) { var p = e.body.position; drawSpr(kindImg(e), p.x, p.y, r * DRAW_K, e.body.angle, 1); });
    // carried fruit
    if (G.bird && G.bird.carry) drawSpr(kindImg(G.bird.carry), G.bird.x, G.bird.y + r * 1.4, r * DRAW_K, 0, 1);
    // bees
    G.bees.forEach(function (b) { drawSpr(IMG.el.bee, b.x, b.y, r * 2.2 + 10, Math.sin(G.time * 20) * .1, 1); });
    // bird
    if (G.bird) {
      var bd = G.bird;
      if (bd.state === 'warn') { var wx = bd.fromLeft ? 40 : W - 40; ctx.globalAlpha = .6 + .4 * Math.sin(bd.t * 14); ctx.fillStyle = '#ff3b3b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(wx, bd.y - 34); ctx.lineTo(wx + 32, bd.y + 24); ctx.lineTo(wx - 32, bd.y + 24); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', wx, bd.y + 18); ctx.globalAlpha = 1; }
      else { var fr = ['bird1', 'bird2', 'bird3', 'bird2'][Math.floor(bd.frame) % 4]; var dir = (bd.state === 'leave' ? bd.fromLeft : (bd.target && bd.target.x < bd.x ? false : true)); ctx.save(); ctx.translate(bd.x, bd.y); if (bd.state === 'leave' ? !bd.fromLeft : (bd.carry ? W / 2 < bd.x : bd.target && bd.target.x < bd.x)) ctx.scale(-1, 1); var im2 = IMG.el[fr]; var bw = 130, bh = bw * im2.height / im2.width; ctx.drawImage(im2, -bw / 2, -bh / 2, bw, bh); ctx.restore(); }
    }
    // particles + fx
    G.parts.forEach(function (p) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
    G.fx.forEach(function (f) { var k = f.t / f.dur, im = IMG.el[f.img]; ctx.globalAlpha = 1 - k * k; var sz = f.size * (0.5 + k * .8); var h = sz * im.height / im.width; ctx.drawImage(im, f.x - sz / 2, f.y - h / 2, sz, h); }); ctx.globalAlpha = 1;
    // overflow warning
    if (G.fullT > 0.05 && G.state === 'play') { ctx.fillStyle = 'rgba(255,40,40,' + (.12 + .18 * Math.sin(G.time * 16)) + ')'; ctx.fillRect(0, 0, W, H); }
  }


  function drawBadge(x, y, rad, num, col) {
    var g = ctx.createRadialGradient(x - rad * .3, y - rad * .3, rad * .1, x, y, rad);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, col);
    ctx.fillStyle = g; ctx.strokeStyle = 'rgba(60,40,20,.85)'; ctx.lineWidth = Math.max(2, rad * .16);
    ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4a2a10'; ctx.font = 'bold ' + Math.round(rad * 1.35) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(num), x, y + rad * .06);
  }
  function drawNestBack(x, y) {
    var r = G.r; ctx.save();
    ctx.fillStyle = '#6a3a14'; ctx.beginPath(); ctx.ellipse(x, y + r * .35, r * 1.32, r * .5, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  function drawLockFront(e, x, y) {
    var r = G.r;
    if (e.lock === 'nest') {
      var g = ctx.createLinearGradient(0, y + r * .1, 0, y + r * 1.35); g.addColorStop(0, '#d79a52'); g.addColorStop(1, '#7a4519');
      ctx.fillStyle = g; ctx.strokeStyle = '#4a2a10'; ctx.lineWidth = Math.max(2, r * .1);
      ctx.beginPath(); ctx.moveTo(x - r * 1.32, y + r * .35); ctx.quadraticCurveTo(x - r * 1.1, y + r * 1.45, x, y + r * 1.45); ctx.quadraticCurveTo(x + r * 1.1, y + r * 1.45, x + r * 1.32, y + r * .35);
      ctx.ellipse(x, y + r * .35, r * 1.32, r * .5, 0, 0, Math.PI, true); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(70,35,10,.45)'; ctx.lineWidth = 2;
      for (var i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * r * .45, y + r * .6); ctx.lineTo(x + i * r * .34, y + r * 1.3); ctx.stroke(); }
      drawBadge(x, y + r * 1.05, r * .5, e.cageHp, '#ffe9b0');
    } else {
      var bg = ctx.createRadialGradient(x - r * .4, y - r * .45, r * .1, x, y, r * 1.35);
      bg.addColorStop(0, 'rgba(255,255,255,.55)'); bg.addColorStop(.7, 'rgba(150,225,255,.28)'); bg.addColorStop(1, 'rgba(90,190,255,.6)');
      ctx.fillStyle = bg; ctx.strokeStyle = 'rgba(210,245,255,.95)'; ctx.lineWidth = Math.max(2, r * .1);
      ctx.beginPath(); ctx.arc(x, y, r * 1.32, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = r * .1; ctx.beginPath(); ctx.arc(x, y, r * 1.05, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke();
      drawBadge(x - r * .72, y - r * .72, r * .5, e.cageHp, '#bdf0ff');
    }
  }
  function drawLogs(g) {
    var rr = 40, bottom = g.slopeTopY - 30;
    for (var y = 150; y < bottom; y += 100) {
      for (var side = 0; side < 2; side++) {
        var x = side ? W : 0;
        var gr = ctx.createRadialGradient(x, y, 4, x, y, rr); gr.addColorStop(0, '#f1c27e'); gr.addColorStop(1, '#c98a4a');
        ctx.fillStyle = gr; ctx.strokeStyle = '#7a4a1e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(120,70,25,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, rr * .66, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, rr * .32, 0, 7); ctx.stroke();
      }
    }
  }
  function drawSpr(im, x, y, size, rot, alpha) {
    if (!im || !im.width) return; var h = size * im.height / im.width, w = size;
    var m = Math.max(w, h); if (m > size) { w = w * size / m; h = h * size / m; }
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (alpha < 1) ctx.globalAlpha = alpha; ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
  }
  function drawBomb(e, x, y) {
    var r = G.r; var pulse = e.fuse < 6 ? 1 + .1 * Math.sin(G.time * 18) : 1;
    drawSpr(IMG.el.bomb, x, y, r * 2.5 * pulse, 0, 1);
    var k = clamp(e.fuse / 22, 0, 1); ctx.strokeStyle = e.fuse < 6 ? '#ff4040' : '#ffd23a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, r * 1.45, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
  }
  function hills(y0, amp, freq, col, ph) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-10, H);
    for (var x = -10; x <= W + 10; x += 20) ctx.lineTo(x, y0 + Math.sin(x * freq + ph) * amp * .6 + Math.sin(x * freq * 2.3 + ph * 2) * amp * .3);
    ctx.lineTo(W + 10, H); ctx.closePath(); ctx.fill();
  }
  function drawGround(th) {
    var g = G, floor = g.floorY;
    // soil polygon (the channel is a notch cut from it)
    var sg = ctx.createLinearGradient(0, g.slopeTopY, 0, H); sg.addColorStop(0, th.soil[0]); sg.addColorStop(1, th.soil[1]);
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(-10, g.slopeTopY - 10); ctx.lineTo(0, g.slopeTopY); ctx.lineTo(g.chL, g.mouthY); ctx.lineTo(g.chL, floor); ctx.lineTo(g.chR, floor); ctx.lineTo(g.chR, g.mouthY); ctx.lineTo(W, g.slopeTopY); ctx.lineTo(W + 10, g.slopeTopY - 10); ctx.lineTo(W + 10, H + 10); ctx.lineTo(-10, H + 10); ctx.closePath(); ctx.fill();
    // soil texture
    ctx.fillStyle = th.dot; ctx.globalAlpha = .35;
    for (var i = 0; i < 70; i++) { var px = (i * 131) % W, py = g.mouthY + 20 + ((i * 97) % (H - g.mouthY)); if (px > g.chL - 8 && px < g.chR + 8 && py < floor + 6) continue; if (py < groundY(g, px) + 24) continue; ctx.beginPath(); ctx.ellipse(px, py, 9 + (i % 5) * 3, 5 + (i % 3) * 2, (i % 7) * .4, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
    // channel interior glow
    var cg = ctx.createLinearGradient(0, g.mouthY - 30, 0, floor); cg.addColorStop(0, 'rgba(236,255,170,.0)'); cg.addColorStop(.15, '#e9fb9a'); cg.addColorStop(1, '#bfe35a');
    ctx.fillStyle = cg; ctx.fillRect(g.chL, g.mouthY - 30, g.cw, floor - g.mouthY + 30);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(g.chL, g.mouthY, 5, floor - g.mouthY); ctx.fillRect(g.chR - 5, g.mouthY, 5, floor - g.mouthY);
    // grass edge
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function edge(col, w, dy) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-10, g.slopeTopY - 10 + dy); ctx.lineTo(0, g.slopeTopY + dy); ctx.lineTo(g.chL, g.mouthY + dy); ctx.lineTo(g.chL, g.mouthY + 70 + dy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(g.chR, g.mouthY + 70 + dy); ctx.lineTo(g.chR, g.mouthY + dy); ctx.lineTo(W, g.slopeTopY + dy); ctx.lineTo(W + 10, g.slopeTopY - 10 + dy); ctx.stroke(); }
    edge(th.grass, 22, 6); edge(th.grassHi, 7, -1);
    // channel floor rim
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(g.chL, floor - 4, g.cw, 10);
    // slot marks to show capacity
    ctx.strokeStyle = 'rgba(80,100,20,.25)'; ctx.lineWidth = 2; var slot = g.r * 2 * .98;
    for (var y = floor - slot; y > g.mouthY - 2; y -= slot) { ctx.beginPath(); ctx.moveTo(g.chL + 4, y); ctx.lineTo(g.chR - 4, y); ctx.stroke(); }
  }

  /* ---------------- UI wiring ---------------- */
  function show(id) { ['sSplash', 'sMenu', 'sLevels'].forEach(function (s) { $(s).classList.toggle('hidden', s !== id); }); screen = id; $('hud').classList.add('hidden'); }
  function updateCoins() { $('coinsTxt').textContent = save.coins; $('menuCoins').textContent = save.coins; }
  function totalStars() { var s = 0; for (var k in save.stars) s += save.stars[k]; return s; }
  function updateCounter() { var c = G ? Math.max(0, G.remaining) : 0; if ($('cntTxt').textContent != c) $('cntTxt').textContent = c; }
  function bumpCounter() { var el = $('counter'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); updateCounter(); }
  function updateSoundIcons() { var src = 'assets/ui/' + (save.sound ? 'sound_on' : 'sound_off') + '.png'; $('soundImgM').src = src; $('soundImgP').src = src; $('setSound').checked = !!save.sound; $('setVib').checked = !!save.vib; }

  function showMenu() {
    mode = 'menu'; hideAllPopups(); show('sMenu');
    $('menuLvl').textContent = save.unlocked; $('menuStars').textContent = totalStars(); updateCoins();
    startDemo();
  }
  function startDemo() { var n = Math.max(1, Math.min(save.unlocked, 12)); G = buildLevel(Math.max(2, n), true); }
  function startLevel(n) {
    hideAllPopups(); mode = 'play'; n = Math.max(1, Math.min(LV.MAX_LEVEL, n | 0));
    G = buildLevel(n, false); G.state = 'play';
    show(null); ['sSplash', 'sMenu', 'sLevels'].forEach(function (s) { $(s).classList.add('hidden'); });
    $('hud').classList.remove('hidden'); $('lvlTxt').textContent = n; updateCoins(); updateCounter();
    $('cntIcon').src = 'assets/fruits/' + FR[(n * 3) % Math.min(FR.length, 8)].n + '.png';
    var h = $('hint'); h.classList.add('hidden');
    if (n === 1) showHint('hint1', 6000); else if (n === 2) showHint('hint2', 6000);
    else if (n === 10) showHint('hintLock', 6500); else if (G.cfg.bomb && n === 45) showHint('hintBomb', 5000);
  }
  var hintT = null;
  function showHint(key, ms) { var h = $('hint'); h.textContent = t(key); h.classList.remove('hidden'); clearTimeout(hintT); hintT = setTimeout(function () { h.classList.add('hidden'); }, ms || 3500); }
  function hideAllPopups() { ['pPause', 'pWin', 'pLose', 'pSettings', 'pAd'].forEach(function (p) { $(p).classList.add('hidden'); }); }

  function buildLevelGrid() {
    var grid = $('levelGrid'); grid.innerHTML = '';
    for (var i = 1; i <= LV.MAX_LEVEL; i++) {
      var b = document.createElement('button'); b.className = 'lv' + (i === save.unlocked ? ' cur' : '') + (i > save.unlocked ? ' lock' : '');
      if (i > save.unlocked) b.innerHTML = '<img src="assets/ui/lock.png" alt="">';
      else { var st = save.stars[i] || 0; b.innerHTML = i + '<div class="s">' + [1, 2, 3].map(function (k) { return '<img class="' + (k <= st ? '' : 'off') + '" src="assets/el/star.png" alt="">'; }).join('') + '</div>'; }
      (function (n) { b.addEventListener('click', function () { if (n <= save.unlocked) { SFX.click(); startLevel(n); } else toast(save.lang === 'ar' ? 'خلّص المراحل اللي قبلها الأول' : 'Finish earlier levels first'); }); })(i);
      grid.appendChild(b);
    }
    var cur = grid.children[Math.max(0, save.unlocked - 1)]; if (cur) setTimeout(function () { cur.scrollIntoView({ block: 'center' }); }, 30);
  }

  function bind(id, fn) { var el = $(id); el.addEventListener('click', function (ev) { audio(); fn(ev); }); }
  function initUI() {
    bind('btnPlay', function () { SFX.click(); startLevel(save.unlocked); });
    bind('btnLevels', function () { SFX.click(); show('sLevels'); buildLevelGrid(); });
    bind('btnLevelsBack', function () { SFX.click(); showMenu(); });
    bind('btnOnline', function () { SFX.click(); toast(t('online2')); });
    bind('btnSettings', function () { SFX.click(); $('pSettings').classList.remove('hidden'); });
    bind('setClose', function () { SFX.click(); $('pSettings').classList.add('hidden'); });
    function toggleSound() { save.sound = save.sound ? 0 : 1; persist(); updateSoundIcons(); SFX.click(); }
    bind('btnSoundM', toggleSound); bind('btnSoundP', toggleSound);
    $('setSound').addEventListener('change', function () { save.sound = this.checked ? 1 : 0; persist(); updateSoundIcons(); });
    $('setVib').addEventListener('change', function () { save.vib = this.checked ? 1 : 0; persist(); });
    bind('langAr', function () { save.lang = 'ar'; persist(); applyLang(); }); bind('langEn', function () { save.lang = 'en'; persist(); applyLang(); });
    bind('btnShare', function () { SFX.click(); var txt = t('shareTxt'); if (window.AndroidBridge && window.AndroidBridge.share) window.AndroidBridge.share(txt); else if (navigator.share) navigator.share({ text: txt }).catch(function () {}); else toast(txt); });
    bind('btnPause', function () { if (G && G.state === 'play') { G.state = 'paused'; $('pPause').classList.remove('hidden'); SFX.click(); } });
    bind('pResume', function () { $('pPause').classList.add('hidden'); if (G) G.state = 'play'; });
    bind('pRestart', function () { startLevel(G.n); });
    bind('pHome', function () { showMenu(); });
    bind('wNext', function () { startLevel(G.n + 1); }); bind('wReplay', function () { startLevel(G.n); }); bind('wHome', function () { showMenu(); });
    bind('lRetry', function () { startLevel(G.n); }); bind('lHome', function () { showMenu(); });
    bind('lAd', function () { showAd(function () { $('pLose').classList.add('hidden'); G.state = 'play'; G.fullT = 0; G.deadlock = false; for (var i = 0; i < 3; i++) doTrashSilent(); extendChannel(1); }); });
    bind('puTrash', function () { payFor('trash', doTrash); }); bind('puPlus', function () { payFor('plus', doPlus); }); bind('puShuffle', function () { payFor('shuffle', doShuffle); });

    // pointer input on the canvas (drag across fruits releases up to 3 together)
    var down = false, lastRel = 0;
    function toLogical(ev) { var vh = window.innerHeight; return { x: ev.clientX / scale, y: (ev.clientY - (vh - H * scale) / 2) / scale }; }
    function act(ev, first) {
      if (!G || mode !== 'play' || G.state !== 'play') return;
      var p = toLogical(ev);
      if (first) {
        if (G.bird && (G.bird.state === 'fly' || G.bird.state === 'carry' || G.bird.state === 'warn') && G.bird.state !== 'warn') { var dx = p.x - G.bird.x, dy = p.y - G.bird.y; if (dx * dx + dy * dy < 90 * 90) { scareBird(); return; } }
        for (var i = 0; i < G.bees.length; i++) { var b = G.bees[i], bx = p.x - b.x, by = p.y - b.y; if (bx * bx + by * by < 70 * 70) { if (b.target) { b.target.stung = false; b.target.taken = false; } b.state = 'leave'; SFX.power(); save.coins += 2; persist(); updateCoins(); return; } }
        G.gesture = 0;
      }
      if (G.gesture >= 3) return;
      if (releaseAt(p.x, p.y)) G.gesture++;
    }
    cv.addEventListener('pointerdown', function (ev) { audio(); down = true; act(ev, true); });
    cv.addEventListener('pointermove', function (ev) { if (down) act(ev, false); });
    window.addEventListener('pointerup', function () { down = false; });
    window.addEventListener('pointercancel', function () { down = false; });
  }

  /* ---------------- main loop ---------------- */
  function frame(ts) {
    var dt = Math.min(0.05, (ts - lastT) / 1000 || 0.016); lastT = ts;
    update(dt); render(); requestAnimationFrame(frame);
  }

  window.ZF = {
    back: function () { // Android back button
      if (!$('pAd').classList.contains('hidden')) return 'ok';
      var ps = ['pSettings', 'pPause', 'pWin', 'pLose']; for (var i = 0; i < ps.length; i++) if (!$(ps[i]).classList.contains('hidden')) { if (ps[i] === 'pSettings') $('pSettings').classList.add('hidden'); else if (ps[i] === 'pPause') { $('pPause').classList.add('hidden'); if (G) G.state = 'play'; } else showMenu(); return 'ok'; }
      if (screen === 'sLevels') { showMenu(); return 'ok'; }
      if (mode === 'play') { if (G && G.state === 'play') { G.state = 'paused'; $('pPause').classList.remove('hidden'); } return 'ok'; }
      return 'exit';
    },
    // test helpers
    get G() { return G; }, scare: scareBird, start: startLevel, release: releaseFruit, save: save, menu: showMenu,
    advance: function (sec) { var n = Math.round(sec * 60); for (var i = 0; i < n; i++) update(1 / 60); },
    render: render
  };

  function boot() {
    resize(); window.addEventListener('resize', resize); applyLang(); updateSoundIcons(); updateCoins();
    initUI();
    G = buildLevel(2, true); requestAnimationFrame(frame);
    loadAll(function () { setTimeout(function () { showMenu(); }, 450); });
  }
  boot();
})();
