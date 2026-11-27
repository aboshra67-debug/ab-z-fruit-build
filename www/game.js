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
    ar: { remaining: 'المتبقي', level: 'المستوى', play: 'العب', levels: 'المراحل', online: 'تحدي أونلاين', soon: 'قريبًا', loading: 'جاري التحميل...',
      paused: 'إيقاف مؤقت', resume: 'كمّل', replay: 'إعادة', home: 'الرئيسية', win: 'أحسنت!', next: 'التالي',
      full: 'المجرى امتلأ!', fullHint: 'نزّل الفاكهة اللي زي اللي فوق المجرى عشان تختفي.', retry: 'حاول تاني', continueAd: 'كمّل بإعلان', continueCoins: 'إنقاذ بـ 35 عملة',
      settings: 'الإعدادات', sound: 'الصوت', vibration: 'الاهتزاز', language: 'اللغة', close: 'إغلاق',
      adTitle: 'إعلان تجريبي', adHint: 'هنا هيظهر إعلان حقيقي في النسخة المنشورة.',
      hint1: 'اضغط على الفاكهة عشان تنزل. فاكهتين زي بعض بيختفوا بس لما يتقابلوا جوه المجرى!',
      hint2: 'اسحب إصبعك على لحد 3 فواكه عشان ينزلوا مع بعض.',
      hintBird: 'الطائر جاي! اضغط عليه قبل ما يخطف فاكهة.', hintBee: 'النحلة تغيّر نوع ثمرتين بالتتابع.', hintBomb: 'القنبلة! اضغط عليها قبل ما تنفجر.',
      hintIce:'الثلج: اضغط مرة لكسره ومرة لإنزال الفاكهة.', star3:'لعب ممتاز بدون مساعدات أو امتلاء المجرى.', star2:'وصلت للسعة القصوى للمجرى.', star1:'استخدمت وسيلة مساعدة في المرحلة.', hintLock: 'الرقم بينقص مع كل زوج فواكه بيختفي. لما يوصل 0 الفاكهة تتحرر.', noCoins: 'مفيش عملات كفاية', online2: 'التحدي الأونلاين قريبًا', shareTxt: 'العب AB Z Fruit - زحلقها! لعبة الفواكه الممتعة' },
    en: { remaining: 'Left', level: 'Level', play: 'Play', levels: 'Levels', online: 'Online Duel', soon: 'Soon', loading: 'Loading...',
      paused: 'Paused', resume: 'Resume', replay: 'Replay', home: 'Home', win: 'Great job!', next: 'Next',
      full: 'The channel is full!', fullHint: 'Drop the same fruit as the one on top to clear it.', retry: 'Try again', continueAd: 'Continue with ad', continueCoins: 'Rescue for 35 coins',
      settings: 'Settings', sound: 'Sound', vibration: 'Vibration', language: 'Language', close: 'Close',
      adTitle: 'Test ad', adHint: 'A real ad will appear here in the published version.',
      hint1: 'Tap a fruit to drop it. Two matching fruits vanish only when they meet inside the channel!',
      hint2: 'Swipe across up to 3 fruits to drop them together.',
      hintBird: 'A bird is coming! Tap it before it grabs a fruit.', hintBee: 'The bee changes two matching fruits in turn.', hintBomb: 'A bomb! Tap it before it explodes.',
      hintIce:'Ice: tap once to break it, then tap to drop the fruit.', star3:'No power-ups or full channel.', star2:'The channel reached full capacity.', star1:'A power-up was used.', hintLock: 'The number drops every time a pair vanishes. At 0 the fruit is freed.', noCoins: 'Not enough coins', online2: 'Online duel is coming soon', shareTxt: 'Play AB Z Fruit! A fun fruit puzzle game' }
  };

  /* ---------------- save ---------------- */
  var SKEY = 'zfruit_v1';
  var save = { unlocked: 1, stars: {}, coins: 100, sound: 1, vib: 1, lang: 'ar', hint1: 0, hint2: 0 };
  try { var s0 = JSON.parse(localStorage.getItem(SKEY) || '{}'); for (var k in s0) save[k] = s0[k]; } catch (e) {}
  var DEF149={cut:{ar:'المقص',en:'Scissors',cost:20},shield:{ar:'الدرع',en:'Shield',cost:25},spray:{ar:'المبيد',en:'Repellent',cost:25},fan:{ar:'المروحة',en:'Fan',cost:30},anchor:{ar:'المرساة',en:'Anchor',cost:35}};
  if(!save.def149||typeof save.def149!=='object')save.def149={};
  Object.keys(DEF149).forEach(k=>{var v=save.def149[k];save.def149[k]=Number.isFinite(v)?Math.max(0,Math.floor(v)):3;});
  if(!save.assist155||typeof save.assist155!=='object'||Array.isArray(save.assist155))save.assist155={};
  if(!save.records155||typeof save.records155!=='object'||Array.isArray(save.records155))save.records155={};
  Object.assign(TR.ar,{modes155:'تحديات اللعب',classic155:'اللعب الكلاسيكي',timed155:'تحدي الوقت',speed155:'تحدي السرعة · 60 ثانية',action155:'تحدي الأكشن'});
  Object.assign(TR.en,{modes155:'Game challenges',classic155:'Classic',timed155:'Time challenge',speed155:'Speed · 60 seconds',action155:'Action challenge'});
  var mode155='classic';
  function assistState155(n){var k=String(n),s=save.assist155[k];if(!s||typeof s!=='object')s=save.assist155[k]={fails:0,granted:false};s.fails=Math.max(0,Math.min(99,Number(s.fails)||0));return s;}
  function persist() { try { localStorage.setItem(SKEY, JSON.stringify(save)); } catch (e) {} }
  function t(k) { return (TR[save.lang] && TR[save.lang][k]) || TR.ar[k] || k; }
  function applyLang() {
    document.documentElement.lang = save.lang;
    document.documentElement.dir = save.lang === 'ar' ? 'rtl' : 'ltr';
    var els = document.querySelectorAll('[data-t]');
    for (var i = 0; i < els.length; i++) els[i].textContent = t(els[i].getAttribute('data-t'));
    refreshDefense149(true);
    $('langAr').classList.toggle('on', save.lang === 'ar'); $('langEn').classList.toggle('on', save.lang === 'en');
  }

  /* ---------------- assets ---------------- */
  var IMG = { fruit: {}, el: {}, ui: {}, world: {} };
  var sceneryCache = null;
  function loadAll(done) {
    var list = [], n = 0;
    FR.forEach(function (f) { list.push(['fruit', f.n, 'assets/fruits/' + f.n + '.png']); });
    ['wood', 'rock', 'cage', 'bird1', 'bird2', 'bird3', 'monkey', 'bee', 'bomb', 'mystery', 'heart', 'star', 'coin', 'sparkle', 'ring', 'pop', 'splash', 'smoke', 'shards']
      .forEach(function (k) { list.push(['el', k, 'assets/el/' + k + '.png']); });
    for(var i=0;i<16;i++){var k=monkeyFrame142(i);list.push(['el',k,'assets/el/'+k+'.webp']);}
    for (var w = 0; w < 5; w++) { list.push(['world', 'sky' + w, 'assets/world/sky' + w + '.jpg']); list.push(['world', 'soil' + w, 'assets/world/soil' + w + '.jpg']); }
    Object.keys(DEF149).forEach(k=>list.push(['ui','def150_'+k,'assets/ui/def150_'+k+'.png']));
    list.push(['ui','basket156','assets/ui/basket156.png'],['ui','basket158','assets/ui/basket158.png'],['ui','basket160','assets/ui/basket160.png']);
    list.push(['el', 'premiumSplash', 'assets/world/premium_splash.png']);
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
    drop: function () { tone(380, 260, .10, 'sine', .10); tone(720,420,.045,'triangle',.035); },
    pop: function (c) { var b = 560 + (c || 0) * 90; tone(b, b * 1.8, .16, 'triangle', .16); tone(b * 1.5, b * 2.4, .12, 'sine', .08, .05); noise(.075,.025); },
    win: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, f, .28, 'triangle', .10, i * .10); tone(f*2, f*2, .18, 'sine', .025, i*.10); }); },
    lose: function () { tone(330, 120, .5, 'sawtooth', .12); },
    bird: function () { tone(1400, 2000, .08, 'sine', .1); tone(1800, 1300, .1, 'sine', .1, .1); tone(1500, 2100, .08, 'sine', .1, .22); },
    bomb: function () { noise(.42, .18); tone(95, 38, .45, 'sine', .19); tone(240, 75, .16, 'triangle', .08); },
    power: function () { tone(400, 900, .25, 'square', .08); },
    bee: function () { tone(210, 190, .25, 'sawtooth', .05); },
    wood: function (broken) { noise(broken?.16:.055,broken?.14:.06);tone(broken?165:240,90,.08,'triangle',.08); },
    rock: function () { tone(170,100,.055,'triangle',.08); },
    combo: function (n) { tone(660,880,.09,'triangle',.07);tone(880,1100+Math.min(n,8)*40,.12,'sine',.065,.07); }
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
    e.gravity.y = 1; e.gravity.scale = 0.001626; // VC167: fruit friction .004 (was .14) so a fruit slides down the slope like the original (measured 13 px/frame at the mouth) instead of rolling slowly.
    // VC166: tuned with frictionAir .002 so the channel-region fall matches the original's measured 0.528 px/frame^2 (VC165 used 0.001458 with frictionAir .008, which measured ~0.36-0.38 in real play)
    return e;
  }

  function groundY(g, x) {
    if (x <= g.chL) return g.slopeTopY + (g.mouthY - g.slopeTopY) * (x / g.chL);
    if (x >= g.chR) return g.slopeRightY + (g.mouthY - g.slopeRightY) * ((W - x) / (W - g.chR));
    return g.mouthY;
  }

  function addSeg(g, x1, y1, x2, y2, th) {
    var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy), ang = Math.atan2(dy, dx);
    var nx = -dy / len, ny = dx / len; if (ny < 0) { nx = -nx; ny = -ny; }   // normal pointing downward (into the soil)
    var cx = (x1 + x2) / 2 + nx * th / 2, cy = (y1 + y2) / 2 + ny * th / 2;
    var b = Bodies.rectangle(cx, cy, len + 4, th, { isStatic: true, angle: ang, friction: .026, frictionStatic: 0, restitution: 0, label: 'ground' });
    Composite.add(g.engine.world, b); return b;
  }

  function buildLevel(n, demo) {
    var cfg = LV.gen(n), rng = cfg.rng;
    var variant=demo?'classic':mode155, help=variant==='classic'&&!demo?assistState155(n).fails:0;
    if(variant==='action'){
      cfg.action143.sequence=['monkey','falcon','bee','wind','spider','vortex'];cfg.action143.first=5;cfg.action143.interval=12;cfg.action143.maxAttacks=12;cfg.defense152=['cut','shield','spray','fan','anchor'];cfg.bee=1;cfg.bird=1;
    }
    if(help>=3){var ap=cfg.action143;ap.interval=Math.ceil(ap.interval*1.4);ap.first+=5;ap.maxAttacks=Math.ceil(ap.maxAttacks*.65);ap.monkeyThrows=Math.max(1,ap.monkeyThrows-1);ap.windStrength*=.75;ap.falconSpeed*=.85;cfg.hazard144.spider.count=Math.max(2,cfg.hazard144.spider.count-1);cfg.hazard144.vortex.count=Math.max(2,cfg.hazard144.vortex.count-1);}

    var g = { cfg: cfg, n: n, demo: !!demo, engine: newEngine(), hang: [], dyn: [], obst: [], fx: [], parts: [], bees: [], bird: null,
      time: 0, state: 'play', shake: 0, extra: 0, birdDone: 0, popped: 0, powerUsed: 0, maxStack: 0, gesture: 0, bombList: [], clouds: [],
      stuckT: 0, fullT: 0, theme: THEMES[cfg.world],variant155:variant,assist155:help,limit155:variant==='speed'?60:variant==='timed'?Math.max(60,Math.ceil(cfg.count*2.5)):0,lastProgress155:0,hintAt155:18 }; 
    for (var i = 0; i < 6; i++) g.clouds.push({ x: rnd() * W, y: 120 + rnd() * 380, s: .6 + rnd() * .9, v: 4 + rnd() * 9 });

    var topBar = (variant==='classic'?76:120), bottomBar = Math.ceil(((demo?12:dockHeight161(cfg))+Math.max(0,(window.innerHeight-H*scale)/2))/scale); // VC161 reserve real footer below basket
    // Keep the HUD clear and return more vertical space to the fruit field.
    // channel geometry depends on fruit radius -> search the largest radius that fits all fruits
    var scrolling = !demo;
    var visibleGoal = scrolling ? Math.min(42, Math.ceil(cfg.count * .88)) : cfg.count;
    var need = visibleGoal + cfg.bomb, bestR = 11, cells = null, geom = null;
    var targetR = cfg.rMax;
    if(scrolling && cfg.wood+cfg.rock>0)targetR=Math.min(targetR,Math.floor(35+(H-1280)*.028));
    // VC116: larger early fruit, preserve compact high-level density.
    targetR=Math.max(25,Math.floor(targetR*(n<=3?1.02:n<=30?.97:n<=60?.91:.82)));
    for (var r = targetR; r >= 11; r -= 1) {
      var gm = geomFor(r, cfg, topBar, bottomBar);
      var cs = genCells(gm, r, rng0(cfg.seed + r));
      var obstSpace = (cfg.wood + cfg.rock) * (scrolling ? 1.1 : 18);
      if (cs.length >= (scrolling ? Math.min(need, 17) : need) * 1.03 + obstSpace + 2) { bestR = r; cells = cs; geom = gm; break; }
    }
    if (!geom) { bestR = 11; geom = geomFor(11, cfg, topBar, bottomBar); cells = genCells(geom, 11, rng0(cfg.seed)); }
    // VC123: smaller whole fruits; use the same radius for drawing, collision,
    // placement and four-slot channel geometry. Keep feed and motion rules intact.
    if (scrolling) {
      bestR = H < 1250 ? 24 : H < 1320 ? 27 : H < 1450 ? 30 : 34; if(n>=151)bestR=Math.min(bestR,30); if(n>=251)bestR=Math.min(bestR,28); // VC153 responsive fruit geometry
      geom = geomFor(bestR, cfg, topBar, bottomBar);
      cells = genCells(geom, bestR, rng0(cfg.seed + bestR));
    }
    // spread the fruits over the whole sky: widen the cell spacing until the cells just fit this level's fruits
    var spread = 1.13, wantCells = need * 1.03 + (cfg.wood + cfg.rock) * (scrolling ? 3 : 18) + 6;
    for (var ff = 1.19; ff <= 1.43; ff += 0.06) {
      var cs2 = genCells(geom, bestR, rng0(cfg.seed + bestR), ff);
      if (cs2.length < wantCells) break; spread = ff; cells = cs2;
    }
    g.r = bestR; for (var kk in geom) g[kk] = geom[kk];

    // static terrain
    addSeg(g, 0, g.slopeTopY, g.chL, g.mouthY, 80);
    addSeg(g, g.chR, g.mouthY, W, g.slopeRightY, 80);
    g.wallL = Bodies.rectangle(g.chL - 30, (g.mouthY + g.floorY + 600) / 2, 60, g.floorY + 600 - g.mouthY, { isStatic: true, friction: 0, frictionStatic: 0, label: 'ground' });
    g.wallR = Bodies.rectangle(g.chR + 30, (g.mouthY + g.floorY + 600) / 2, 60, g.floorY + 600 - g.mouthY, { isStatic: true, friction: 0, frictionStatic: 0, label: 'ground' });
    g.floorB = Bodies.rectangle(W / 2, g.floorY + 30, 400, 60, { isStatic: true, friction: .1, label: 'ground' });
    Composite.add(g.engine.world, [g.wallL, g.wallR, g.floorB]);
    Composite.add(g.engine.world, [Bodies.rectangle(-30, H / 2, 60, H * 3, { isStatic: true, label: 'ground' }), Bodies.rectangle(W + 30, H / 2, 60, H * 3, { isStatic: true, label: 'ground' })]);

    if(g.divider){var dv=g.divider; Composite.add(g.engine.world,Bodies.rectangle(dv.x,(dv.bottom- H*2)/2,dv.w,dv.bottom+H*2,{isStatic:true,label:"ground",friction:0}));}
    // obstacles (placed in the falling corridor, above the slopes)
    var usedCells = {};
    function takeCell(filter) {
      for (var i = 0; i < cells.length; i++) { if (!usedCells[i] && (!filter || filter(cells[i]))) { usedCells[i] = 1; return cells[i]; } }
      return null;
    }
    var shuffled = shuffle(cells.map(function (c, i) { return i; }), rng);
    if (scrolling) shuffled.sort(function(a,b){return cells[b].y-cells[a].y;});
    function pickCell(filter) {
      for (var i = 0; i < shuffled.length; i++) { var idx = shuffled[i]; if (!usedCells[idx] && (!filter || filter(cells[idx]))) { usedCells[idx] = 1; return cells[idx]; } }
      return null;
    }
    function blockAround(c, rad) { for (var i = 0; i < cells.length; i++) { if (!usedCells[i]) { var dx = cells[i].x - c.x, dy = cells[i].y - c.y; if (dx * dx + dy * dy < rad * rad) usedCells[i] = 1; } } }
    var corridor = function (c) { return c.x > W * 0.2 && c.x < W * 0.8 && Math.abs(c.x - W / 2) > g.r * 4.5 && c.y > g.topY + (g.mouthY - g.topY) * 0.22 && c.y < groundY(g, c.x) - g.r * 6.2; };
    // Scroll boards reserve a compact obstacle strip above the slopes, keeping
    // the visible fruit field clear rather than scattering blockers into its reserve.
    var obstacleSlots = [];
    if (scrolling) {
      // VC152: compact staggered rows, preserving a clear middle route and side lanes.
      var requested=cfg.wood+cfg.rock;
      var xs=[112,270,450,608];
      for (var row=0;row<2 && obstacleSlots.length<requested;row++) {
        var mixed=xs.slice();
        if(cfg.layout===2||cfg.layout===4)mixed.reverse();
        if(cfg.layout===0||cfg.layout===3)mixed=[mixed[0],mixed[3],mixed[1],mixed[2]];
        mixed.forEach(function(x){
          // Narrower solid obstacles permit a full fruit diameter between adjacent bodies.
          var xx=x, yy=groundY(g,xx)-g.r*(5.05+row*5.65);
          if(yy-g.r*3.65>=g.topY+g.r*4.7 && obstacleSlots.length<requested)obstacleSlots.push({x:xx,y:yy});
        });
      }
      var usable=Math.min(requested,obstacleSlots.length);
      if(usable<requested){var wood=Math.min(cfg.wood,Math.ceil(usable*cfg.wood/Math.max(1,requested)));cfg.rock=Math.min(cfg.rock,usable-wood);cfg.wood=wood;}

    }
    var i2;
    for (i2 = 0; i2 < cfg.wood; i2++) {
      var c = scrolling ? obstacleSlots.shift() : (pickCell(corridor) || pickCell()); if (!c) break;
      // Preserve a full fruit-width escape lane between the rotating crate and side wall.
      if(scrolling)c.x=clamp(c.x,112,W-112);
      var sz = g.r * (scrolling?1.48:2.6);
      var body = Bodies.rectangle(c.x, c.y, sz, sz, { isStatic: true, angle: (rng() - .5) * 0.9, friction: .02, frictionStatic: 0, restitution: 0, label: 'obst' });
      Composite.add(g.engine.world, body); g.obst.push({ type: 'wood', x: c.x, y: c.y, size: sz, ang: body.angle, baseAng:body.angle, baseX:c.x, hp:n>=6?3:4, hitIds:{}, phase:rng()*6.28, body: body });
      blockAround(c, g.r * 5.4);
    }
    for (i2 = 0; i2 < cfg.rock; i2++) {
      var c2 = scrolling ? obstacleSlots.shift() : (pickCell(corridor) || pickCell()); if (!c2) break;
      var rr = g.r * (scrolling?1.05:1.45);
      var body2 = Bodies.circle(c2.x, c2.y, rr * .92, { isStatic: true, friction: .02, frictionStatic: 0, restitution: 0, label: 'obst' });
      Composite.add(g.engine.world, body2); g.obst.push({ type: 'rock', x: c2.x, y: c2.y, size: rr * 2.2, ang: (rng() - .5) * .6, body: body2 });
      blockAround(c2, g.r * 5.6);
    }

    // Real impacts drive breakable crates; defer world mutation until the physics step ends.
    if (!demo) M.Events.on(g.engine,'collisionStart',function(ev){
      ev.pairs.forEach(function(pair){
        var a=pair.bodyA,b=pair.bodyB;if(a.label==='fruit'){var swap=a;a=b;b=swap;}
        if(a.label!=='obst'||b.label!=='fruit'||!b.ent)return;
        var o=g.obst.find(function(x){return x.body===a;});
        if(!o)return;
        if(o.type==='rock'){if(!o.hitIds)o.hitIds={};if(!o.hitIds[b.ent.id]){o.hitIds[b.ent.id]=true;o.impact=true;o.impactT=.28;}return;}
        if(o.type!=='wood'||o.hp<=0||o.hitIds[b.ent.id])return;
        o.hitIds[b.ent.id]=true;o.hp--;o.impact=true;o.impactT=.28;
      });
    });
    // fruits: pairs of the same kind
    var pairs = cfg.count / 2, kinds = [];
    var chosen = [], usedFam = {};      // pick `types` different fruit families (whole or sliced version)
    shuffle(FR.map(function (f, i) { return i; }), rng).forEach(function (fi) {
      var fm = FR[fi].f || FR[fi].n; if (/_cut$/.test(FR[fi].n) || usedFam[fm] || chosen.length >= cfg.types) return; usedFam[fm] = 1; chosen.push(fi);
    });
    for (var p = 0; p < pairs; p++) { var tk = p < chosen.length ? p : Math.floor(rng() * chosen.length); kinds.push(chosen[tk]); }
    shuffle(kinds, rng);
    // fruits hang in solid cells. Every level is built so that it can be solved: the fruits are listed bottom-up
    // (a fruit is only reachable after the fruits under it are gone) and the kinds are dealt along that list as nested
    // pairs, so the 4-slot channel never has to hold more than 3 unmatched fruits when the list is played in order.
    var sel = [], bombCells = [];
    if (scrolling) {
      var layout = scrollCells(g, cfg.count + cfg.bomb, visibleGoal, rng);
      for (var bi0 = 0; bi0 < cfg.bomb; bi0++) {
        var ix0 = Math.min(layout.length - 1, Math.floor((bi0 + 1) * layout.length / (cfg.bomb + 1)));
        bombCells.push(layout.splice(ix0, 1)[0]);
      }
      sel = layout;
    } else {
      for (var q = 0; q < cfg.count; q++) { var sc = pickCell(); if (!sc) break; sel.push(sc); }
    }
    if (sel.length % 2) sel.pop();
    sel.forEach(function (c0) { c0.k = rng(); });
    sel.sort(function (a, b) { return b.y - a.y; });    // lowest fruit first: a fruit is only reachable once the fruits under it are gone
    var seqK = [], seqP = [], ki = 0, nT = sel.length;
    // Bounded-depth nested groups: large spans without exceeding 3 unmatched fruits.
    // Select distinct kinds for all open ancestors, even when a type repeats later.
    var bag = [], difficulty = cfg.difficulty, blockMax = [2,3,4,5,7,9][difficulty];
    if(n>=11 && n<=15)blockMax=3; else if(n<=20 && n>=16)blockMax=4;
    if(help>=2)blockMax=2;
    function nextKind(active) {
      if (!bag.length) bag = shuffle(chosen.slice(), rng);
      var ix = bag.findIndex(function(k){return active.indexOf(k)<0;});
      if(ix<0) { var allowed=chosen.filter(function(k){return active.indexOf(k)<0;}); return allowed[Math.floor(rng()*allowed.length)]; }
      return bag.splice(ix,1)[0];
    }
    function emitGroup(count, depth, active) {
      var kind=nextKind(active), pid=ki++;
      seqK.push(kind);seqP.push(pid);
      var left=count-1, maxChild=depth===1?Math.max(2,Math.ceil(blockMax*.52)):1;
      while(left>0){var child=Math.min(left,depth>=2?1:Math.max(1,Math.floor(2+rng()*Math.max(1,maxChild-1))));emitGroup(child,depth+1,active.concat(kind));left-=child;}
      seqK.push(kind);seqP.push(pid);
    }
    var remainingPairs=nT/2;
    while(remainingPairs>0){var block=Math.min(remainingPairs, help>=2?1:cfg.n<=3?1+Math.floor(rng()*2):cfg.n<=10?2+Math.floor(rng()*2):Math.max(1,Math.floor(blockMax*(.65+rng()*.35))));emitGroup(block,1,[]);remainingPairs-=block;}
    // Keep strict y ordering so each prescribed release remains physically reachable.
    var mystSet = {}, mystLeft = Math.min(cfg.mystery, Math.floor(nT / 2));
    while (mystLeft > 0) { var mp = Math.floor(rng() * ki); if (!mystSet[mp]) { mystSet[mp] = 1; mystLeft--; } }
    var id = 1; g.order = [];
    sel.forEach(function (c, ix) {
      var e = { kind: seqK[ix], mystery: !!mystSet[seqP[ix]], id: id++, x: c.x, y: c.y, state: 'hang', lane: c.lane, ph: rng() * 6.28, caged: false, stung: false, bomb: false, ord: ix, pairId: seqP[ix] };
      e.visualAngle=(LV.mulberry32(cfg.seed+e.id*137)()-.5)*.18;
      g.hang.push(e); g.order.push(e);
    });
    var pairs2 = nT / 2; pairs = pairs2;
    // cages (each cage locks one fruit; opens after 2 pops)
    var cagedN = 0, hpMax = Math.max(2, Math.floor(pairs * 0.6));
    shuffle(g.hang.filter(function (e) { return e.ord >= Math.floor(nT * 0.7); }), rng).forEach(function (e) {
      if (cagedN < cfg.cage) { e.caged = true; e.lock = (cagedN % 2 === 0) ? 'nest' : 'bubble'; e.cageHp = Math.min(hpMax, clamp(2 + Math.floor((cfg.n - 10) / 20) + Math.floor(rng() * 3), 2, 9)); cagedN++; }
    });
    // Ice is a two-tap obstacle, not a permanent lock. Exclude existing cages/mystery.
    // Group six consecutive, complete pairs into a deep bowl (three pairs).
    if(cfg.counter && !demo){
      for(var pi=6;pi+5<Math.min(nT,120);pi++){
        var group=g.order.slice(pi,pi+6);
        if(group.some(function(e){return e.caged||e.mystery||e.plateHidden||e.plate;}))continue;
        if(group.some(function(e){return group.filter(function(f){return f.pairId===e.pairId;}).length!==2;}))continue;
        var host=group[0];host.plate=group.slice(1).map(function(e){return {kind:e.kind,pairId:e.pairId};});
        group.slice(1).forEach(function(e){e.plateHidden=true;e.state='stored';g.hang.splice(g.hang.indexOf(e),1);});
        pi+=11;if(g.hang.filter(function(e){return e.plate;}).length>=2)break;
      }
    }
    var iceN=0;
    if(!demo) shuffle(g.hang.filter(function(e){return !e.caged&&!e.mystery&&!e.plate&&e.ord>=4;}),rng).forEach(function(e){if(iceN<cfg.ice){e.ice=true;e.iceUntil=5;iceN++;}});
    // bombs
    for (var b2 = 0; b2 < cfg.bomb; b2++) {
      var cb = scrolling ? bombCells[b2] : pickCell(); if (!cb) break;
      var be = { id: id++, kind: -1, x: cb.x, y: cb.y, state: 'hang', lane: cb.lane, bomb: true, fuse: 14 + rng() * 8 - Math.min(4, cfg.n / 50), ph: rng() * 6.28 };
      g.hang.push(be);
    }
    g.hang.forEach(function (he) { syncHangBody(g, he); });
    g.total = nT; g.remaining = nT;
    g.birdAt = 0.08 + rng() * 0.10; g.birdN = cfg.bird; g.beeT = 7 + rng() * 3.0;
    return g;
  }
  // Seeded radial dart scatter. The moving generation window has no grid anchors.
  function scrollCells(g, count, goal, rng) {
    var r=g.r, margin=r*1.60, top=g.topY+r*1.65;
    var bottom=g.mouthY-r*2.35;
    // Shape the field along the funnel and obstacle clearance envelope.
    function limit(x){
      var y=Math.min(bottom,groundY(g,x)-r*3.05);
      g.obst.forEach(function(o){var extent=(o.type==='wood'?o.size*Math.SQRT1_2:o.size*.5)+r*1.90,dx=Math.abs(x-(o.baseX==null?o.x:o.baseX));if(dx<extent)y=Math.min(y,o.y-Math.sqrt(extent*extent-dx*dx));});
      return y;
    }
    // VC159: alternating staggered rows, wide natural variation with collision clearance.
    var all=[], gap=r*2.24, step=r*2.58, cols=Math.max(2,Math.floor((W-2*margin)/step)+1);
    var pitch=(W-2*margin)/(cols-1), rowGap=r*2.70, base=bottom;
    for(var row=0;all.length<count;row++){
      var stagger=row%2, num=cols-stagger, slots=[], y0=base-row*rowGap;
      for(var j=0;j<num;j++){
        var x=margin+pitch*(j+stagger*.5)+(rng()-.5)*r*.26;
        x=clamp(x,margin,W-margin);
        var y=y0+(rng()-.5)*r*.38;
        if(y>limit(x)||g.divider&&Math.abs(x-g.divider.x)<=g.divider.w/2+r*1.45)continue;
        if(slots.some(function(c){return Math.hypot(c.x-x,c.y-y)<gap;})||all.some(function(c){return Math.abs(c.y-y)<gap&&Math.hypot(c.x-x,c.y-y)<gap;}))continue;
        slots.push({x:x,y:y,lane:0});
      }
      var take=Math.min(count-all.length,slots.length);
      for(var k=0;k<take;k++){
        var idx=take===1?Math.floor(slots.length/2):Math.round(k*(slots.length-1)/(take-1));
        all.push(slots[idx]);
      }
    }
    // VC160: break the visible diagonal/column lattice without changing fruit count or clearance.
    for(var pass=0;pass<4;pass++){
      var order=shuffle(all.slice(),rng);
      order.forEach(function(c){
        for(var tryN=0;tryN<4;tryN++){
          var x=clamp(c.x+(rng()-.5)*r*1.65,margin,W-margin),y=c.y+(rng()-.5)*r*1.45;
          if(y>limit(x)||g.divider&&Math.abs(x-g.divider.x)<=g.divider.w/2+r*1.45)continue;
          if(all.some(function(o){return o!==c&&Math.abs(o.y-y)<gap&&Math.hypot(o.x-x,o.y-y)<gap;}))continue;
          c.x=x;c.y=y;break;
        }
      });
    }
    all.sort(function(a,b){return b.y-a.y;});
    g.scroll={lanes:[{bottom:bottom}],limit:limit,step:r*2.26,top:top};
    return all;
  }
  // VC122: reserve sprites are revealed whole, never through the HUD clip.
  // Use the same aspect fit and rotation as drawSpr. Coordinates/feed stay untouched.
  function spriteHalfHeight(im, size, angle) {
    var iw=im && im.naturalWidth, ih=im && (im.naturalHeight || im.height);
    if(!iw || !ih) return size * Math.SQRT1_2;
    var fit=size/Math.max(iw,ih);
    return fit*(Math.abs(Math.sin(angle||0))*iw+Math.abs(Math.cos(angle||0))*ih)/2;
  }
  function fruitTopExtent(g,e) {
    var r=g.r;
    if(e.plate) return r*1.38+2;
    if(e.bomb) return r*1.45+2.5; // includes fuse ring and maximum pulse
    var im=e.mystery?IMG.el.mystery:kindImg(e);
    var extent=spriteHalfHeight(im,r*DRAW_K,e.visualAngle||0);
    if(e.caged && e.lock!=='nest') extent=Math.max(extent,r*1.32+Math.max(2,r*.1)/2);
    if(e.ice) extent=Math.max(extent,r*1.06+2.5);
    // Reserve space for transient status outlines, even before an insect arrives.
    return Math.max(extent,r*1.16+2);
  }
  function visibleFruit(g, e) {
    var threshold=g.scroll && e.lane!=null ? g.scroll.top-.01 : g.topY;
    return e.y>=Math.max(threshold,g.topY+fruitTopExtent(g,e)+1);
  }
  function syncHangBody(g, e) {
    if (g.scroll && e.lane != null && e.y < g.topY - g.r * 1.4) {
      if (e.hb) { Composite.remove(g.engine.world, e.hb); e.hb = null; }
      return;
    }
    hbOn(g,e);
    if (e.hb && (e.hb.position.x !== e.x || e.hb.position.y !== e.y)) Body.setPosition(e.hb,{x:e.x,y:e.y});
  }
  // VC118: individual downward feed with swept-circle clearance.
  function advanceField(g, dt) {
    if (!g.scroll) return;
    var r=g.r, diameter=r*BODY_K*2+.35, cell=diameter, buckets=new Map();
    function key(x,y){return Math.floor(x/cell)+','+Math.floor(y/cell);}
    function put(e){var k=key(e.x,e.y), a=buckets.get(k);if(!a){a=new Set();buckets.set(k,a);}a.add(e);e._feedKey=k;}
    function remove(e){var a=buckets.get(e._feedKey);if(a)a.delete(e);}
    var field=g.hang.filter(function(e){return e.lane!=null;}).sort(function(a,b){return b.y-a.y;});
    
    g.hang.forEach(put);
    var cap=r*4.8*dt;
    function stopAt(x,y,ox,oy,room){
      var dx=Math.abs(x-ox);if(dx>=diameter)return room;
      var dy=oy-y, extent=Math.sqrt(diameter*diameter-dx*dx);
      if(dy<=0)return room;
      return Math.min(room,Math.max(0,dy-extent));
    }
    field.forEach(function(e){
      if(e.ice||e.birdHeld||e.monkeyHeld||e.monkeyDest143||e.birdDest143||e.hazard144||e.plateOutgoing){e.feedSpeed=0;return;}
      var room=Math.max(0,Math.min(cap,g.scroll.limit(e.x)-e.y));
      // A descending reserve fruit must never get ahead of a falling fruit in its path.
      if(g.dyn.some(function(o){var q=o.body.position;return q.y<g.mouthY && q.y<=e.y+diameter && Math.abs(q.x-e.x)<diameter*1.5;})){e.feedSpeed=0;return;}
      if(room<=.0001){e.feedSpeed=0;return;}
      var x0=Math.floor(e.x/cell),y0=Math.floor(e.y/cell);
      for(var ix=x0-1;ix<=x0+1;ix++)for(var iy=y0;iy<=y0+2;iy++){
        var group=buckets.get(ix+','+iy);if(group)group.forEach(function(o){if(o!==e)room=stopAt(e.x,e.y,o.x,o.y,room);});
      }
      g.dyn.forEach(function(o){var q=o.body.position;room=stopAt(e.x,e.y,q.x,q.y,room);});
      e.feedSpeed=Math.min(r*4.8,(e.feedSpeed||0)+r*12*dt);
      var move=Math.min(room,e.feedSpeed*dt);
      if(move<=.0001){e.feedSpeed=0;return;}
      remove(e);e.y+=move;put(e);syncHangBody(g,e);
      if(move<e.feedSpeed*dt-.001)e.feedSpeed=0;
    });
  }
  function inMatchChannel(g,e) {
    var p=e.body.position;
    return p.x >= g.chL && p.x <= g.chR && p.y >= g.mouthY && p.y <= g.floorY;
  }
  /* hanging fruits are solid: a fruit that falls onto them stops until the fruit below is released */
  // VC166: collision body shaped like the visible fruit (convex, centrally symmetric hull of the sprite), so a fruit stops exactly where its picture touches another.
  function fruitBody166(e, x, y, opts, r) {
    r = r || G.r;
    var fk = typeof e.kind === 'number' && e.kind >= 0 && !e.bomb ? FR[e.kind % FR.length] : null, h = fk && window.ZF_HULLS && window.ZF_HULLS[fk.n]; if (h && h.length < 6) h = null; // plain rectangles (cut halves) keep the round collider
    if (!h) return Bodies.circle(x, y, r * BODY_K, opts);
    var size = r * DRAW_K, a = e.visualAngle || 0, c = Math.cos(a), sn = Math.sin(a);
    var v = h.map(function (q) { var px = q[0] * size, py = q[1] * size; return { x: px * c - py * sn, y: px * sn + py * c }; });
    var b = Bodies.fromVertices(x, y, [v], opts);
    return b || Bodies.circle(x, y, r * BODY_K, opts);
  }
  function hbOn(g, e) {
    if (e.hb || e.plateOutgoing) return;
    e.hb = fruitBody166(e, e.x, e.y, { isStatic: true, friction: .025, frictionStatic: 0, restitution: 0, collisionFilter:{category:HANG_CATEGORY,mask:0xffffffff}, label: 'hang' }, g.r);
    Composite.add(g.engine.world, e.hb);
  }
  function hbOff(e) { if (e.hb) { Composite.remove(G.engine.world, e.hb); e.hb = null; } }
  function nearHang(p) {
    var lim = G.r * 2.2;
    for (var i = 0; i < G.hang.length; i++) { var h = G.hang[i]; if (h.hb) { var dx = h.x - p.x, dy = h.y - p.y; if (dy > G.r * .5 && Math.abs(dx) < G.r * 1.7 && dx * dx + dy * dy < lim * lim) return true; } }
    return false;
  }
  function rng0(seed) { return LV.mulberry32(seed); }

  var HANG_CATEGORY=0x0002, NORMAL_CATEGORY=0x0001;
  var BODY_K = 1.02, DRAW_K = 2.2;       // VC166: physics circle matches the visible fruit (sprites are ~0.92 of their box) so stopped fruits touch with no visible gap
  var SLOPE_DEG166 = 30;
  function geomFor(r, cfg, topBar, bottomBar) {
    var br = r * BODY_K;                                   // physics radius of a fruit
    var cw = Math.round(r * DRAW_K * 1.2);                 // like the original: channel is ~1.2x the fruit diameter
    var cap = cfg.cap;
    // VC153: reserve basket plus all three existing channel extensions above the controls.
    var bkW=Math.min(W*.43,cw*1.9), bkH=bkW*.618, dockY=H-bottomBar, basketRoom=bkH*(1.065-.19)+r*.12+2, extensionRoom=r*2*.98*3;   // VC170: room below the channel floor for the whole basket (it sits under the floor now)
    var floorBase = dockY - basketRoom - extensionRoom;
    var depth = cap * br * 2 * 0.99 - r * 0.30; // VC159: compact, still fits cap complete fruit centers
    var mouthY = floorBase - depth;
    var slopeRun = W / 2 - cw / 2, slopeRise = slopeRun * Math.tan(SLOPE_DEG166 * Math.PI / 180);   // VC166: real slope angle (was ~12 degrees)
    // Five monotonic terrain profiles. Both slopes always lead downhill to the same mouth.
    // Keep the four-slot channel geometry and the integration/feed algorithms unchanged.
    var profile = [[1,1],[1.15,.94],[.94,1.15],[1.12,1.12],[.91,.91]][cfg.layout || 0];
    var g = { divider: cfg.divider ? {x:W/2,w:Math.max(14,r*.45),bottom:topBar+24+(mouthY-topBar-24)*.48} : null, cw: cw, chL: W / 2 - cw / 2, chR: W / 2 + cw / 2, floorY: floorBase, floorBase: floorBase, dockY:dockY, mouthY: mouthY, slopeTopY: mouthY - slopeRise*profile[0], slopeRightY: mouthY - slopeRise*profile[1], topY: topBar + 24 };
    return g;
  }
  function genCells(g, r, rng, f) {          // blue-noise (Poisson-disc) scatter over the sky, like the original
    var dmin = r * 2 * (f || 1.13), cs = dmin / Math.SQRT2;
    var x0 = r * 1.38, x1 = W - r * 1.38, y0 = g.topY + r * 1.2, y1 = g.mouthY - r * 2.2;
    var gw = Math.ceil((x1 - x0) / cs) + 1, gh = Math.ceil((y1 - y0) / cs) + 1, grid = new Array(gw * gh), out = [], act = [];
    function ok(x, y) {
      if (x < x0 || x > x1 || y < y0 || y > y1) return false;
      if (!(y < groundY(g, x) - r * 3.6 && y > g.topY)) return false;
      var cx = Math.floor((x - x0) / cs), cy = Math.floor((y - y0) / cs);
      for (var a = Math.max(0, cx - 2); a <= Math.min(gw - 1, cx + 2); a++) for (var b = Math.max(0, cy - 2); b <= Math.min(gh - 1, cy + 2); b++) {
        var q = grid[b * gw + a]; if (q) { var dx = q.x - x, dy = q.y - y; if (dx * dx + dy * dy < dmin * dmin) return false; }
      }
      return true;
    }
    function add(x, y) { var c = { x: x, y: y }; out.push(c); act.push(c); grid[Math.floor((y - y0) / cs) * gw + Math.floor((x - x0) / cs)] = c; }
    for (var t = 0; t < 400 && !out.length; t++) { var sx = x0 + rng() * (x1 - x0), sy = y0 + rng() * (y1 - y0); if (ok(sx, sy)) add(sx, sy); }
    while (act.length) {
      var ai = Math.floor(rng() * act.length), c0 = act[ai], found = false;
      for (var k = 0; k < 24; k++) {
        var ang = rng() * 6.2832, rad = dmin * (1 + rng()), px = c0.x + Math.cos(ang) * rad, py = c0.y + Math.sin(ang) * rad;
        if (ok(px, py)) { add(px, py); found = true; break; }
      }
      if (!found) act.splice(ai, 1);
    }
    return out;
  }

  /* ---------------- gameplay actions ---------------- */
  function kindImg(e) { return IMG.fruit[FR[e.kind % FR.length].n]; }

  function releaseFruit(e) {
    if (!G || e.state !== 'hang' || e.caged || e.stung || e.birdHeld || e.monkeyHeld || e.monkeyDest143 || e.birdDest143 || e.hazard144 || e.beeReserved || !visibleFruit(G,e)) return false;
    if (e.bomb) { defuse(e); return true; }
    if(e.plateOutgoing)return false;
    if(e.plate && e.plate.length){
      if(G.dyn.some(function(o){var q=o.body.position;return Math.hypot(q.x-e.x,q.y-e.y)<G.r*BODY_K*2+.35;}))return false;
      var next=e.plate.shift(), fruit={kind:e.kind,pairId:e.pairId,id:100000+ ++idCounter,x:e.x,y:e.y,state:'hang',visualAngle:0};
      hbOff(e);e.plateOutgoing=fruit;G.hang.push(fruit);
      if(!releaseFruit(fruit)){G.hang.pop();e.plate.unshift(next);e.plateOutgoing=null;hbOn(G,e);return false;}
      e.kind=next.kind;e.pairId=next.pairId;addFx('sparkle',e.x,e.y,G.r*2,.25);return true;
    }
    if (e.ice) return false;
    // Keep the selected fruit in its original slot until its spawn is clear.
    var clash = G.dyn.some(function(o){var q=o.body.position;return Math.hypot(q.x-e.x,q.y-e.y)<G.r*BODY_K*1.90;});
    if(clash){if(e.pendingDrop)return true;if(G.hang.filter(function(f){return f.pendingDrop;}).length>=3)return false;e.pendingDrop=true;e.wob=.25;return true;}
    e.pendingDrop=false;hbOff(e);
    e.state = 'fall'; e.mystery = false;
    var b = fruitBody166(e, e.x, e.y, { restitution: .05, friction: .004, frictionStatic: 0, frictionAir: .002, density: .0016, collisionFilter:{category:NORMAL_CATEGORY,mask:0xffffffff}, label: 'fruit' });
    // Start from rest at the exact selected position; gravity alone releases it.
    b.ent = e; e.body = b; e.idle = 0; Composite.add(G.engine.world, b);
    G.hang.splice(G.hang.indexOf(e), 1); G.dyn.push(e);
    SFX.drop(); vib(8);
    return true;
  }
  function releaseAt(x, y) { // hit-test hanging fruits (topmost nearest)
    if(y<G.topY)return false;
    var best = null, bd = 1e9, rr = G.r * 1.3;
    for (var i = 0; i < G.hang.length; i++) {
      var e = G.hang[i]; if (!visibleFruit(G,e)) continue; var dx = e.x - x, dy = e.y - y, d = dx * dx + dy * dy;
      if (d < rr * rr && d < bd) { bd = d; best = e; }
    }
    if (!best) return false;
    if (best.caged) { addFx('ring',best.x,best.y,G.r*2.8,.25);vib(10);return false; }
    if (best.stung) { addFx('ring',best.x,best.y,G.r*2.8,.25);vib(10);return false; }
    return releaseFruit(best);
  }
  function defuse(e) {
    hbOff(e); G.hang.splice(G.hang.indexOf(e), 1); e.state='removed';
    addFx('sparkle', e.x, e.y, G.r * 4, .5); addFx('smoke', e.x, e.y, G.r * 3.4, .6);
    SFX.power(); if(G.variant155==='classic'){save.coins += 2; persist(); updateCoins();}
  }
  function explodeBomb(e) {
    hbOff(e); G.hang.splice(G.hang.indexOf(e), 1); e.state='removed';
    addFx('pop', e.x, e.y, G.r * 7, .6); addFx('smoke', e.x, e.y, G.r * 5, .8);
    SFX.bomb(); vib(60); G.shake = 0; addFx('ring',e.x,e.y,G.r*9,.45);burst(e.x,e.y,'#e7a449',36,G.r*1.3);
    // Blast damages obstacles and unlocks nearby ice; never auto-selects or moves fruit.
    var reach=G.r*8;
    G.obst.forEach(function(o){if(dist2(o,e)<=reach*reach){o.impact=true;o.impactT=.4;if(o.type==='wood')o.hp=0;}});
    G.hang.forEach(function(f){if(!visibleFruit(G,f)||dist2(f,e)>reach*reach)return;if(f.ice && !f.iceUntil){f.ice=false;addFx('shards',f.x,f.y,G.r*2.5,.35);}if(f.caged){f.cageHp=Math.max(0,f.cageHp-2);if(!f.cageHp){f.caged=false;addFx('shards',f.x,f.y,G.r*2.5,.35);}}});
  }
  function dist2(a, b) { var dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy; }

  function popPair(a, b) {
    if(G.variant155==='classic'&&(a.gold133>G.time||b.gold133>G.time)){save.coins+=5;persist();updateCoins();}
    var items=[a,b].map(function(e){var p=e.body.position;return {kind:e.kind,x:p.x,y:p.y,angle:e.body.angle};});
    [a,b].forEach(function(e){Composite.remove(G.engine.world,e.body);G.dyn.splice(G.dyn.indexOf(e),1);e.state='collected';});
    (G.collecting||(G.collecting=[])).push({items:items,t:0,dur:.55});
  }
  function finishPair(items) {
    var a=items[0],b=items[1];
    [a, b].forEach(function (e) {
      var bgm=basketGeometry158(G), x = W/2, y = bgm.y + bgm.h*.30;
      addFx('premiumSplash', x, y, G.r * 3.4, .36); addFx('ring',x,y,G.r*2.8,.25); if((G.combo||0)>=2)addFx('ring', x, y, G.r * 3.6, .35); else addFx('sparkle', x, y, G.r * 2.1, .35);
      for (var i = 0; i < (G.combo>=2?24:16) && G.parts.length < 160; i++) G.parts.push({ x: x, y: y, vx: (rnd() - .5) * 420, vy: -rnd() * 380 - 40, t: 0, life: .55 + rnd() * .3, c: FR[e.kind % FR.length].c, s: G.r * (.12 + rnd() * .14) });
    });
    G.remaining -= 2; G.popped += 2; G.matchScore155=(G.matchScore155||0)+2;G.lastProgress155=G.time;G.hintAt155=G.time+18;G.hintIds155=[]; G.basketGlow = .36; G.basketBounce=.28;
    G.combo = G.lastMatch != null && G.time-G.lastMatch <= 3.2 ? (G.combo||0)+1 : 1;
    G.lastMatch=G.time;
    if(G.combo>=2){addFx('ring',W/2,G.floorY-G.r,G.r*(3.5+Math.min(G.combo,8)*.25),.32);burst(W/2,G.floorY-G.r,'#e6ba68',Math.min(18,G.combo*3),G.r);}
    if(G.combo>=3){G.comboShow=1.15;if(G.combo%3===0&&G.variant155==='classic'){save.coins+=2;persist();updateCoins();G.comboReward=2;}else G.comboReward=0;}
    SFX.pop(Math.min(6, G.combo-1)); if(G.combo>=3&&G.combo%3===0)SFX.combo(G.combo); vib(G.combo>=3?20:14);
    cageHit();
    bumpCounter();
  }
  function cageHit() {
    G.hang.forEach(function (e) { if (e.caged) { e.cageHp--; if (e.cageHp <= 0) { e.caged = false; addFx('shards', e.x, e.y, G.r * 3.2, .5); addFx('sparkle', e.x, e.y, G.r * 3, .45); SFX.power(); } } });
  }
  function removeFruit(e) {
    var x, y;
    if (e.state === 'fall') { x = e.body.position.x; y = e.body.position.y; Composite.remove(G.engine.world, e.body); G.dyn.splice(G.dyn.indexOf(e), 1); }
    else { x = e.x; y = e.y; hbOff(e); G.hang.splice(G.hang.indexOf(e), 1); }
    e.state = 'removed'; if (visibleFruit(G,e)) { addFx('splash', x, y, G.r * 3, .5); addFx('sparkle', x, y, G.r * 2.4, .4); }
  }

  /* ---------------- power-ups ---------------- */
  var COST = { trash: 25, plus: 30, shuffle: 20, hand:15, swap:20, freeze:25, blast:35 };
  function eligible133(e){return !e.bomb&&!e.plate&&!e.caged&&!e.ice&&!e.stung&&!e.taken&&!e.beeReserved&&!e.pendingDrop&&visibleFruit(G,e);}
  function spend133(k){G.powerUsed++;SFX.power();return true;}
  function paidSpend133(k){if(save.free133>0){save.free133--;G.powerUsed++;persist();SFX.power();return true;}if(save.coins<COST[k]){toast(t('noCoins'));return false;}save.coins-=COST[k];G.powerUsed++;persist();updateCoins();SFX.power();return true;}
  function safeSlot133(x,y,ignore){var r=G.r,gap=r*BODY_K*2+.6;return x>r*1.2&&x<W-r*1.2&&y>G.topY+r*1.5&&y<Math.min(G.slopeTopY,G.slopeRightY)-r*1.5&&!G.hang.some(e=>e!==ignore&&Math.hypot(e.x-x,e.y-y)<gap)&&!G.dyn.some(e=>e!==ignore&&Math.hypot(e.body.position.x-x,e.body.position.y-y)<gap)&&!G.obst.some(o=>Math.hypot(o.x-x,o.y-y)<o.size*.8+r);}
  function arm133(k){if(!G||G.state!=='play')return;if(k==='freeze'){if(!(G.freezeUntil>G.time)&&spend133(k))G.freezeUntil=G.time+5;return;}if(k==='blast'){var a=channelFruits();if(!a.length||!spend133(k))return;SFX.bomb();vib(65);a.forEach(e=>{if(!G.dyn.includes(e))return;var p=e.body.position;burst(p.x,p.y,'#ffb32c',18,G.r);addFx('ring',p.x,p.y,G.r*4,.5);addFx('smoke',p.x,p.y,G.r*3,.45);if(!G.dyn.includes(e))return;var twin=G.hang.find(f=>!f.bomb&&!f.plate&&!f.taken&&!f.beeReserved&&f.kind===e.kind)||G.dyn.find(f=>f!==e&&f.kind===e.kind);removeFruit(e);G.remaining--;G.popped++;if(twin){removeFruit(twin);G.remaining--;G.popped++;}});G.fullT=0;G.rescue134=false;bumpCounter();return;}G.help133=G.help133===k?null:k;G.selected133=null;toast(k==='hand'?'اسحب ثمرة من المجرى لأعلى':'اختر ثمرة من المجرى ثم ثمرة من الأعلى');}
  function hit133(x,y){return channelFruits().find(e=>{var p=basketFruit160(G,e)||e.body.position;return Math.hypot(p.x-x,p.y-y)<G.r*1.25;});}
  function hand133(e,x,y){if(!e||!G.dyn.includes(e))return false;if(!safeSlot133(x,y,e)){var best=null,bd=Infinity;for(var yy=G.topY+G.r*1.6;yy<Math.min(G.slopeTopY,G.slopeRightY)-G.r*1.5;yy+=G.r*.6)for(var xx=G.r*1.3;xx<W-G.r*1.3;xx+=G.r*.6){if(safeSlot133(xx,yy,e)){var d=Math.hypot(xx-x,yy-y);if(d<bd){bd=d;best=[xx,yy];}}}if(!best){toast('لا يوجد مكان فارغ');return false;}x=best[0];y=best[1];}if(!spend133('hand'))return false;Composite.remove(G.engine.world,e.body);G.dyn.splice(G.dyn.indexOf(e),1);e.body=null;e.state='hang';e.x=x;e.y=y;e.lane=null;e.pendingDrop=false;G.hang.push(e);syncHangBody(G,e);G.fullT=0;G.rescue134=false;G.help133=null;return true;}
  function swap133(a,b){if(!a||!G.dyn.includes(a)||!b||!eligible133(b)||!spend133('swap'))return false;var k=a.kind,p=a.pairId;a.kind=b.kind;a.pairId=b.pairId;b.kind=k;b.pairId=p;G.help133=null;G.selected133=null;return true;}
  // VC143: per-level action settings. Manual test buttons remain independent.
  function actionProfile143(g){return g.cfg.action143;}
  function actionBusy143(g){return !!(g.hazard144||g.bird||g.monkey134||g.bees.some(b=>b.state!=='leave')||g.wind134>g.time||g.warn133);}
  function farSlot143(e,used,filter){
    var a=G.hang.filter(f=>f!==e&&eligible133(f)&&f.kind!==e.kind&&!(used&&used.has(f.id))&&(!filter||filter(f)));
    if(!a.length)return null;
    a.sort((f,h)=>Math.hypot(h.x-e.x,h.y-e.y)-Math.hypot(f.x-e.x,f.y-e.y));
    return a[Math.floor(rnd()*Math.min(3,a.length))];
  }
  function swapSlots139(a,b){var x=a.x,y=a.y,l=a.lane;a.x=b.x;a.y=b.y;a.lane=b.lane;b.x=x;b.y=y;b.lane=l;syncHangBody(G,a);syncHangBody(G,b);}
  // VC140: continuous gust displacement, with swept clearance in small substeps.
  function windVector145(g){var u=clamp((g.wind134-g.time)/actionProfile143(g).windDuration,0,1);return (g.windDirection137||1)*Math.tanh((u-.42)*9)*Math.sin(Math.PI*u);}
  function gust139(dt){
    var g=G,r=g.r,gap=r*BODY_K*2+.6,d=g.windDirection137||1;
    var a=g.hang.filter(eligible133).sort((a,b)=>d*(b.x-a.x));
    var moved=0, profile=actionProfile143(g), progress=clamp((g.wind134-g.time)/profile.windDuration,0,1), power=Math.sin(Math.PI*progress);
    var force=windVector145(g);d=force<0?-1:1;power=Math.abs(force);a.sort((a,b)=>d*(b.x-a.x));
    for(var e of a){var ox=e.x,oy=e.y;var step=r*profile.windStrength*dt*power;
      for(var dy of [Math.sin(g.time*5+e.id)*step*.55,0,-step*.6,step*.6]){
        var x=ox+d*step,y=oy+dy;
        if(!safeSlot133(x,y,e))continue;
        if(g.divider&&Math.abs(x-g.divider.x)<g.divider.w/2+r&&y<g.divider.bottom+r)continue;
        e.x=x;e.y=y;e.visualAngle=(e.visualAngle||0)+d*step/r*.28;syncHangBody(g,e);moved++;break;
      }
    }
    g.windMoved139=(g.windMoved139||0)+moved;
    g.dyn.forEach(e=>{if(e.body&&!e.ice)Body.applyForce(e.body,e.body.position,{x:d*e.body.mass*.00045*power*profile.windStrength/2.8,y:0});});
  }
  // VC142: rope-driven monkey. The overhead hand is the end of a taut rope.
  var monkeyAnchors142={"monkey142_00":[[0.39412,-0.06078],[0.1549,0.21176]],"monkey142_01":[[0.39412,-0.06078],[0.16241,0.21087]],"monkey142_02":[[0.39412,-0.06078],[0.16877,0.20832]],"monkey142_03":[[0.39412,-0.06078],[0.17302,0.2045]],"monkey142_04":[[0.39412,-0.06078],[0.17451,0.2]],"monkey142_05":[[0.39412,-0.06078],[0.17302,0.1955]],"monkey142_06":[[0.39412,-0.06078],[0.16877,0.19168]],"monkey142_07":[[0.39412,-0.06078],[0.16241,0.18913]],"monkey142_08":[[0.39412,-0.06078],[0.1549,0.18824]],"monkey142_09":[[0.39412,-0.06078],[0.1474,0.18913]],"monkey142_10":[[0.39412,-0.06078],[0.14104,0.19168]],"monkey142_11":[[0.39412,-0.06078],[0.13679,0.1955]],"monkey142_12":[[0.39412,-0.06078],[0.13529,0.2]],"monkey142_13":[[0.39412,-0.06078],[0.13679,0.2045]],"monkey142_14":[[0.39412,-0.06078],[0.14104,0.20832]],"monkey142_15":[[0.39412,-0.06078],[0.1474,0.21087]]};
  function monkeyFrame142(i){return 'monkey142_'+('0'+((i%16+16)%16)).slice(-2);}
  function monkeyOffset142(m,pt,angle){var x=pt[0]*m.size*m.dir,y=pt[1]*m.size,c=Math.cos(angle),s=Math.sin(angle);return {x:x*c-y*s,y:x*s+y*c};}
  function monkeyPose142(m,theta,len,frame,tilt){
    m.theta=theta;m.len=len;m.frame=monkeyFrame142(frame);m.angle=-m.dir*1.08+tilt;
    m.gripX=m.ax+Math.sin(theta)*len;m.gripY=m.ay+Math.cos(theta)*len;
    var a=monkeyAnchors142[m.frame],h=monkeyOffset142(m,a[0],m.angle),f=monkeyOffset142(m,a[1],m.angle);
    m.x=m.gripX-h.x;m.y=m.gripY-h.y;m.freeX=m.x+f.x;m.freeY=m.y+f.y;
  }
  function monkeyAim142(m,e){var a=monkeyAnchors142[monkeyFrame142(0)],ang=-m.dir*1.08,h=monkeyOffset142(m,a[0],ang),f=monkeyOffset142(m,a[1],ang),dx=e.x+h.x-f.x-m.ax,dy=Math.max(10,e.y+h.y-f.y-m.ay);return {theta:Math.atan2(dx,dy),len:Math.hypot(dx,dy)};}
  function monkeyTarget142(e){return G.hang.indexOf(e)>=0&&eligible133(e)&&e.y>G.topY+G.r*2.1&&e.y<G.mouthY-G.r;}
  function monkeyStart142(e){
    var a=G.hang.filter(monkeyTarget142);if(!a.length)return null;if(!monkeyTarget142(e))e=a[Math.floor(rnd()*a.length)];
    var m={t:0,pt:0,phase:'approach',target:e,held:null,dir:e.x<W/2?-1:1,size:Math.max(180,Math.min(250,G.r*5.9)),ax:0,ay:G.topY-285,taps:[],scared:false,throws:0,used:new Set(),maxThrows:actionProfile143(G).monkeyThrows};
    // Choose the side that leaves the body inside the playfield; the rope pivot never moves.
    var h=monkeyOffset142(m,monkeyAnchors142[monkeyFrame142(0)][0],-m.dir*1.08),f=monkeyOffset142(m,monkeyAnchors142[monkeyFrame142(0)][1],-m.dir*1.08);
    m.ax=clamp(e.x+h.x-f.x+m.dir*W*.08,32,W-32);
    m.fromTheta=-m.dir*.68;m.fromLen=45;monkeyPose142(m,m.fromTheta,m.fromLen,0,0);return m;
  }
  function monkeyMove142(m,phase){m.phase=phase;m.pt=0;m.fromTheta=m.theta;m.fromLen=m.len;}
  function monkeyTravel142(m,aim,u){var q=clamp(u,0,1),ease=q*q*(3-2*q),wave=Math.sin(Math.PI*q),theta=m.fromTheta+(aim.theta-m.fromTheta)*ease;var len=m.fromLen+(aim.len-m.fromLen)*ease;monkeyPose142(m,theta,len,Math.round(wave*8),-.16*Math.sin(q*2*Math.PI)*m.dir);}
  function monkeyHeldValid142(m){return m.held&&G.hang.indexOf(m.held)>=0&&m.held.state==='hang'&&m.held.monkeyHeld;}
  function monkeyRestore142(m,swap){var e=m.held;if(monkeyHeldValid142(m)){if(swap&&monkeyTarget142(swap)&&swap!==e)swapSlots139(e,swap);e.monkeyHeld=false;e.taken=false;addFx('ring',e.x,e.y,G.r*1.5,.3);}m.held=null;}
  function monkeyExit142(m){monkeyClearDest143(m);monkeyRestore142(m,null);m.flight=null;monkeyMove142(m,'exit');}
  function monkeyThrow143(m){
    var e=m.held,d=farSlot143(e,m.used,monkeyTarget142);
    if(!d){monkeyExit142(m);return;}
    // Keep both logical slots reserved for the duration of the projectile arc.
    d.taken=true;d.monkeyDest143=true;
    m.flight={x:m.freeX,y:m.freeY,dx:d.x,dy:d.y,dest:d,duration:clamp(.48+Math.hypot(d.x-m.freeX,d.y-m.freeY)/W*.36,.48,.84)};
    monkeyMove142(m,'throw');vib(25);SFX.drop();
  }
  function monkeyClearDest143(m){var d=m.flight&&m.flight.dest;if(d&&d.monkeyDest143){d.monkeyDest143=false;d.taken=false;}}
  function monkeyFinish143(m){
    var e=m.held,d=m.flight.dest;monkeyClearDest143(m);
    if(monkeyHeldValid142(m)&&monkeyTarget142(d)){
      monkeyRestore142(m,d);m.used.add(e.id);m.used.add(d.id);
      addFx('ring',e.x,e.y,G.r*2.1,.35);burst(e.x,e.y,'#eac276',8,G.r);
    }else monkeyRestore142(m,null);
    m.throws++;m.flight=null;
    var a=G.hang.filter(f=>monkeyTarget142(f)&&!m.used.has(f.id));
    if(!m.scared&&m.throws<m.maxThrows&&a.length>=2){m.target=a[Math.floor(rnd()*a.length)];monkeyMove142(m,'approach');}
    else monkeyExit142(m);
  }
  function monkeyTap142(x,y){var m=G&&G.monkey134;if(!m||m.phase==='exit'||m.scared||G.freezeUntil>G.time)return false;var dx=x-m.x,dy=y-m.y;if(Math.hypot(dx,dy)>m.size*.40)return false;
    m.taps=m.taps.filter(t=>G.time-t<=1.5);m.taps.push(G.time);vib(15);addFx('ring',m.x,m.y,G.r*1.2,.2);
    if(m.taps.length>=3){m.scared=true;toast(save.lang==='ar'?'هرب القرد!':'Monkey scared away!');if(monkeyHeldValid142(m)){monkeyClearDest143(m);m.flight=null;monkeyMove142(m,'return');}else monkeyExit142(m);}return true;}
  function updateMonkey142(dt){var m=G.monkey134;m.t+=dt;m.pt+=dt;
    if(m.held&&!monkeyHeldValid142(m)){monkeyExit142(m);}
    if(m.phase==='approach'){
      if(!monkeyTarget142(m.target)){monkeyExit142(m);return;}
      monkeyTravel142(m,monkeyAim142(m,m.target),m.pt/(m.throws?.65:1.05));
      if(m.pt>=(m.throws?.65:1.05)){var e=m.target;if(Math.hypot(m.freeX-e.x,m.freeY-e.y)>G.r*.28){monkeyExit142(m);return;}e.monkeyHeld=true;e.taken=true;m.held=e;m.grabTheta=m.theta;m.grabLen=m.len;monkeyMove142(m,'swing');vib(22);}
    }else if(m.phase==='swing'){
      // Bounded pendulum, acceleration and reversal follow gravity; limbs lag the swing.
      var u=clamp(m.pt/1.05,0,1),phase=u*2*Math.PI,amp=Math.min(.62,Math.max(.16,(W*.28)/Math.max(1,m.grabLen))),th=m.grabTheta+m.dir*amp*Math.sin(phase)*Math.sin(Math.PI*u);
      var lo=Math.atan2(30-m.ax,Math.max(1,m.grabLen)),hi=Math.atan2(W-30-m.ax,Math.max(1,m.grabLen));th=clamp(th,lo,hi);
      monkeyPose142(m,th,m.grabLen,Math.round(u*16),-.21*m.dir*Math.sin(phase)*Math.sin(Math.PI*u));
      if(m.pt>=1.05)monkeyThrow143(m);
    }else if(m.phase==='throw'){
      var u=clamp(m.pt/m.flight.duration,0,1);monkeyPose142(m,m.fromTheta+m.dir*.16*Math.sin(Math.PI*u),m.fromLen,Math.round(u*12),m.dir*.2*Math.sin(Math.PI*u));
      if(u>=1)monkeyFinish143(m);
    }else if(m.phase==='deposit'||m.phase==='return'){
      var dest=m.phase==='deposit'&&m.dest&&monkeyTarget142(m.dest)?m.dest:m.held;
      if(!dest){monkeyExit142(m);return;}
      monkeyTravel142(m,monkeyAim142(m,dest),m.pt/.72);
      if(m.pt>=.72){var e=m.held,swap=dest!==e?dest:null,wasReturn=m.phase==='return';monkeyRestore142(m,swap);if(!swap&&!wasReturn&&e)releaseFruit(e);monkeyExit142(m);}
    }else if(m.phase==='exit'){
      if(m.ropeCut149){m.x+=m.dir*260*dt;m.y+=Math.min(1100,160+m.pt*1500)*dt;m.angle+=m.dir*dt*.8;if(m.pt>=.85||m.y>H+100)G.monkey134=null;return;}
      monkeyTravel142(m,{theta:m.dir*.35,len:18},m.pt/.9);if(m.pt>=.9)G.monkey134=null;
    }
  }
  function drawMonkey142(m){
    ctx.save();ctx.beginPath();ctx.rect(0,G.topY,W,H-G.topY);ctx.clip();
    // Textured rope with a shaded round profile and braided highlights.
    var dx=m.gripX-m.ax,dy=m.gripY-m.ay,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,rw=Math.max(5,G.r*.18);
    if(!m.ropeCut149){ctx.lineCap='round';ctx.strokeStyle='#4d321c';ctx.lineWidth=rw+2;ctx.beginPath();ctx.moveTo(m.ax,m.ay);ctx.lineTo(m.gripX,m.gripY);ctx.stroke();
    ctx.strokeStyle='#ac8151';ctx.lineWidth=rw;ctx.beginPath();ctx.moveTo(m.ax,m.ay);ctx.lineTo(m.gripX,m.gripY);ctx.stroke();
    ctx.strokeStyle='#dfbb87';ctx.lineWidth=1.5;ctx.beginPath();for(var d=3;d<len;d+=8){var x=m.ax+dx*d/len,y=m.ay+dy*d/len;ctx.moveTo(x+nx*rw*.4,y+ny*rw*.4);ctx.lineTo(x-nx*rw*.4+dx*3/len,y-ny*rw*.4+dy*3/len);}ctx.stroke();}
    ctx.save();ctx.translate(m.x,m.y);ctx.rotate(m.angle);ctx.scale(m.dir,1);var im=IMG.el[m.frame];if(im&&im.naturalWidth)drawSpr(im,0,0,m.size,0,1);else drawSpr(IMG.el.monkey,0,0,m.size,0,1);ctx.restore();
    if(monkeyHeldValid142(m)){if(m.phase==='throw'&&m.flight){var f=m.flight,u=clamp(m.pt/f.duration,0,1);drawSpr(kindImg(m.held),f.x+(f.dx-f.x)*u,f.y+(f.dy-f.y)*u-4*u*(1-u)*Math.min(G.r*4,Math.hypot(f.dx-f.x,f.dy-f.y)*.35),G.r*DRAW_K,u*m.dir*6.28,1);}else drawSpr(kindImg(m.held),m.freeX,m.freeY,G.r*DRAW_K,m.theta*.6,1);}
    ctx.restore();
  }
  // VC144: three independently configured obstacles. Reservations retain physical slots.
  function startHazard144(k){
    if(k!=='spider'&&k!=='vortex')return;
    var a=G.hang.filter(eligible133), p=G.cfg.hazard144[k];if(!p||a.length<2)return;
    if(k==='spider'&&G.web147)return;
    var r=G.r, pool=k==='spider'?a.filter(e=>e.y<G.topY+(Math.min(G.slopeTopY,G.slopeRightY)-G.topY)*.76):a;
    if(!pool.length)pool=a;
    var center=pool[Math.floor(rnd()*pool.length)];
    if(k==='spider') a.sort((f,h)=>Math.hypot(f.x-center.x,f.y-center.y)-Math.hypot(h.x-center.x,h.y-center.y));
    else {a.sort((f,h)=>Math.hypot(f.x-center.x,f.y-center.y)-Math.hypot(h.x-center.x,h.y-center.y));}
    var items=a.slice(0,Math.min(k==='spider'?Math.max(4,p.count):p.count,a.length));
    if(k==='vortex'){
      // Sort around the center so each fruit moves to the next existing slot.
      items.sort((f,h)=>Math.atan2(f.y-center.y,f.x-center.x)-Math.atan2(h.y-center.y,h.x-center.x));
      if(items.every(e=>e.kind===items[0].kind)){var other=a.find(e=>e.kind!==items[0].kind);if(other)items[items.length-1]=other;}
    }
    var h={kind:k,t:0,dur:p.duration,items:items,slots:items.map(e=>({x:e.x,y:e.y,lane:e.lane})),x:center.x,y:center.y,taps:0,lastTap:-99};
    h.targetX=center.x;h.targetY=center.y;
    if(k==='spider'){h.webProgress=items.map(()=>0);h.anchorX=center.x;h.dur=Math.max(6,h.dur);h.targetX=center.x;h.targetY=center.y;}
    if(k==='spider'){h.y=G.topY-r*2;}
    items.forEach(e=>{e.hazard144=k;e.taken=true;});G.hazard144=h;showCut147();
    toast(save.lang==='ar'?({spider:'شبكة العنكبوت!',vortex:'دوامة الفواكه!'}[k]):({spider:'Spider web!',vortex:'Fruit vortex!'}[k]));vib(20);
  }
  function hazardPoint144(h,i,u){
    var a=h.slots[i],b=h.slots[(i+1)%h.slots.length],r=G.r;
    var ax=a.x-h.targetX,ay=a.y-h.targetY,bx=b.x-h.targetX,by=b.y-h.targetY;
    var aa=Math.atan2(ay,ax),ba=Math.atan2(by,bx),delta=(ba-aa+Math.PI*3)%(2*Math.PI)-Math.PI;
    var q=u*u*(3-2*u),pull=Math.sin(Math.PI*q),radius=(Math.hypot(ax,ay)*(1-q)+Math.hypot(bx,by)*q)*(1-.48*pull);
    var angle=aa+(delta+Math.PI*2)*q;
    var x=h.targetX+Math.cos(angle)*radius,y=h.targetY+Math.sin(angle)*radius;
    if(u<=0)return {x:a.x,y:a.y};if(u>=1)return {x:b.x,y:b.y};
    return {x:clamp(x,r*1.2,W-r*1.2),y:clamp(y,G.topY+r*1.4,Math.min(G.slopeTopY,G.slopeRightY)-r*1.35)};
  }
  function finishHazard144(h,commit){
    if(commit&&h.kind==='vortex'&&h.items.every(e=>G.hang.includes(e)&&e.hazard144===h.kind)){
      h.items.forEach((e,i)=>{var q=h.slots[(i+1)%h.slots.length];e.x=q.x;e.y=q.y;e.lane=q.lane;});
      h.items.forEach(e=>syncHangBody(G,e));
    }
    if(commit&&h.kind==='spider'){G.web147={items:h.items.slice(),anchorX:h.anchorX,x:h.targetX,y:h.targetY,taps:0,lastTap:-99};G.hazard144=null;showCut147();return;}
    h.items.forEach(e=>{if(e.hazard144===h.kind){e.hazard144=null;e.taken=false;}});G.hazard144=null;showCut147();
  }
  function updateHazard144(dt){var h=G.hazard144;h.t+=dt;var u=clamp(h.t/h.dur,0,1);
    if(h.items.some(e=>!G.hang.includes(e))){finishHazard144(h,false);return;}
    if(h.kind==='spider'){
      var v=clamp(u/.24,0,1),w=clamp((u-.82)/.18,0,1),ease=t=>t*t*(3-2*t);h.y=G.topY-G.r*2+(h.targetY-G.topY+G.r*2)*ease(v)*(1-ease(w));h.x=h.anchorX+Math.sin(h.t*3)*G.r*.30*Math.sin(Math.PI*u);h.webProgress=h.items.map((e,i)=>clamp((u-.24-i*.055)/.25,0,1));
    }
    if(u>=1)finishHazard144(h,true);
  }
  // VC147: persistent silk, free scissors, five deliberate taps as a fallback.
  function showCut147(){refreshDefense149(true);}
  function cutWeb147(){if(!G||G.state!=='play')return false;var h=G.hazard144,w=G.web147;if(!w&&!(h&&h.kind==='spider'))return false;
    if(h&&h.kind==='spider')finishHazard144(h,false);
    if(w){w.items.forEach(e=>{if(e.hazard144==='spider'){e.hazard144=null;e.taken=false;burst(e.x,e.y,'#ffffff',5,G.r*.6);}});G.web147=null;}
    showCut147();SFX.power();return true;}
  // VC149: manual defense tools. No debit unless a live, matching attack is stopped.
  function activeDefense149(k){if(!G||G.demo||G.state!=='play')return false;var h=G.hazard144;
    if(k==='cut')return !!(G.web147||h&&h.kind==='spider'||G.monkey134&&G.monkey134.phase!=='exit'&&!G.monkey134.scared);
    if(k==='shield')return !!(G.bird&&G.bird.state!=='leave');
    if(k==='spray')return G.bees.some(b=>b.state!=='leave');
    if(k==='fan')return G.wind134>G.time;
    if(k==='anchor')return !!(h&&h.kind==='vortex');return false;
  }
  var defenseSignature149='';
  // VC154: stage-specific rail; manual action tests can temporarily reveal their own tool.
  function relevantDefense154(k){return !!(G&&!G.demo&&((G.cfg.defense152||[]).includes(k)||activeDefense149(k)));}
  // VC161: footer geometry, independent of gameplay and art.
  function dockCell161(){return Math.max(34,Math.min(50,Math.floor((window.innerWidth-36)/7)));}
  function dockHeight161(cfg){return 14+dockCell161()+(cfg.defense152&&cfg.defense152.length?dockCell161()+8:0);}
  function positionRails154(){if(!G||G.demo)return;var size=dockCell161(),base=8;[['hudBottom',base],['def149_bar',base+size+8]].forEach(function(row){var el=$(row[0]);if(el.style.setProperty)el.style.setProperty('--rail-cell',size+'px');else el.style.railCell=size+'px';el.style.bottom=row[1]+'px';});hintAnchor164();}
  function hintAnchor164(){var hb=$('hint'),db=$('def149_bar');if(!hb||!hb.style||!db)return;var size=dockCell161(),two=!db.classList.contains('hidden');hb.style.top='auto';hb.style.bottom=(8+size*(two?2:1)+(two?8:0)+4)+'px';}

  function refreshDefense149(force){var keys=Object.keys(DEF149),sig=save.lang+'|'+save.coins+'|'+keys.map(k=>save.def149[k]+':'+Number(activeDefense149(k))+':'+Number(relevantDefense154(k))).join('|');if(!force&&sig===defenseSignature149)return;defenseSignature149=sig;
    keys.forEach(k=>{var b=$('def149_'+k),a=activeDefense149(k),n=save.def149[k],d=DEF149[k];b.classList.toggle('hidden',!relevantDefense154(k));$('buy149_'+k).classList.toggle('hidden',!relevantDefense154(k));b.classList.toggle('ready149',a);b.classList.toggle('empty149',n===0);b.setAttribute('aria-label',d[save.lang]+': '+n);b.setAttribute('aria-disabled',String(!a||!n));$('def149_n_'+k).textContent=n;$('def149_l_'+k).textContent=d[save.lang];$('buy149_'+k).textContent=d[save.lang]+' +1 · '+d.cost;});
    var any=keys.some(relevantDefense154);$('def149_bar').classList.toggle('hidden',!any);$('hudBottom').classList.toggle('split155',!any);if(!any)$('def149_panel').classList.add('hidden');$('def149_shop').textContent=save.lang==='ar'?'متجر':'Shop';$('def149_wallet').textContent=(save.lang==='ar'?'رصيدك: ':'Balance: ')+save.coins;$('def149_close').textContent=save.lang==='ar'?'إغلاق':'Close';
  }
  function buyDefense149(k){var d=DEF149[k];if(!d||!G||G.state!=='play'||G.demo)return false;if(save.coins<d.cost){toast(t('noCoins'));return false;}save.coins-=d.cost;save.def149[k]++;persist();updateCoins();refreshDefense149(true);SFX.power();return true;}
  function useDefense149(k){if(!DEF149[k]||!activeDefense149(k)){toast(save.lang==='ar'?'لا يوجد هجوم مناسب الآن':'No matching attack');return false;}if(!save.def149[k]){toast(save.lang==='ar'?'الأداة نفدت، افتح المتجر':'Out of stock — open shop');return false;}
    var scene150=defenseScene150(k);
    if(k==='cut'){if(G.web147||G.hazard144&&G.hazard144.kind==='spider'){if(!cutWeb147())return false;}else{var m=G.monkey134;m.scared=true;monkeyExit142(m);m.ropeCut149=true;}}
    else if(k==='shield'){var b=G.bird;if(b.state==='carry')dropCarry(b);else{if(b.target)b.target.taken=false;b.state='leave';G.birdDone++;}addFx('ring',b.x,b.y,G.r*3,.45);}
    else if(k==='spray'){G.bees.forEach(b=>{if(b.state==='leave')return;
      // If one fruit was already converted, complete its paired conversion before releasing reservations.
      // Never undo a first conversion that the player may already have matched.
      if(b.phase&&b.second&&G.hang.includes(b.second)&&b.second.beeReserved)b.second.kind=b.newKind;
      [b.target,b.second].forEach(e=>{if(e&&e.beeReserved){e.beeReserved=false;e.taken=false;e.stung=false;}});b.state='leave';});G.forceBee143=false;}
    else if(k==='fan'){G.wind134=G.time;G.windMoved139=0;}
    else if(k==='anchor'){finishHazard144(G.hazard144,false);}
    G.defFx150=scene150;
    save.def149[k]--;G.powerUsed++;persist();refreshDefense149(true);SFX.power();vib(15);return true;
  }
  // VC151: staged, screen-space defense cinematics. Gameplay is resolved immediately;
  // snapshots animate only visuals, so no locks, extra charges or delayed callbacks survive a restart.
  function defenseScene150(k){var h=G.hazard144,w=G.web147||h,m=G.monkey134,b=G.bird,r=G.r;
    var f={kind:k,start:G.time,dur:k==='fan'?2.25:1.85,x:W/2,y:G.topY+(G.mouthY-G.topY)*.45,lines:[],targets:[],actors:[]};
    if(k==='cut'&&w&&(G.web147||h&&h.kind==='spider')){f.x=G.web147?w.x:w.targetX;f.y=G.web147?w.y:w.targetY;f.lines.push([w.anchorX,G.topY,f.x,f.y]);w.items.forEach(e=>{f.lines.push([f.x,f.y,e.x,e.y]);f.targets.push([e.x,e.y]);});}
    else if(k==='cut'&&m){f.x=(m.ax+m.gripX)/2;f.y=(m.ay+m.gripY)/2;f.lines.push([m.ax,m.ay,m.gripX,m.gripY]);f.monkey={ref:m,x:m.x,y:m.y,frame:m.frame,size:m.size,dir:m.dir};}
    else if(k==='shield'&&b){f.x=b.target?b.target.x:clamp(b.x,r*3,W-r*3);f.y=b.target?b.target.y:b.y;f.actors.push({ref:b,x:b.x,y:b.y,dir:b.x<f.x?1:-1});}
    else if(k==='spray'){G.bees.filter(b=>b.state!=='leave').forEach(b=>f.actors.push({ref:b,x:b.x,y:b.y}));if(f.actors.length){f.x=f.actors[0].x;f.y=f.actors[0].y;}}
    else if(k==='fan'){f.dir=windVector145(G)<0?1:-1;f.x=f.dir>0?r*2.4:W-r*2.4;}
    else if(k==='anchor'&&h){f.x=h.targetX||h.x||W/2;f.y=h.targetY||h.y||f.y;h.items.forEach(e=>f.targets.push([e.x,e.y]));}
    f.x=clamp(f.x,r*1.8,W-r*1.8);f.y=clamp(f.y,G.topY+r*1.7,G.mouthY-r*1.5);return f;
  }
  function ease151(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function mix151(a,b,t){return a+(b-a)*t;}
  function prop151(x,y,scale,angle,alpha,paint){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);ctx.globalAlpha=alpha;ctx.shadowColor='rgba(35,24,13,.46)';ctx.shadowBlur=3;ctx.shadowOffsetY=3;paint();ctx.restore();}
  function blade151(a){ctx.save();ctx.rotate(a);var g=ctx.createLinearGradient(-9,0,9,0);g.addColorStop(0,'#41596a');g.addColorStop(.35,'#d5e4ed');g.addColorStop(.62,'#fff');g.addColorStop(1,'#8096a1');ctx.fillStyle=g;ctx.strokeStyle='#435764';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-5,7);ctx.lineTo(-8,-25);ctx.quadraticCurveTo(-8,-38,3,-42);ctx.lineTo(8,4);ctx.closePath();ctx.fill();ctx.stroke();ctx.strokeStyle='#faffff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(3,-34);ctx.lineTo(6,-2);ctx.stroke();ctx.strokeStyle='#8d2418';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(0,19,11,13,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#f06b44';ctx.lineWidth=5;ctx.stroke();ctx.restore();}
  function rope151(x,y,xx,yy,sag,alpha){ctx.save();ctx.globalAlpha=alpha;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo((x+xx)/2,(y+yy)/2+sag,xx,yy);ctx.strokeStyle='#5c4a34';ctx.lineWidth=3.5;ctx.stroke();ctx.strokeStyle='#f5ead4';ctx.lineWidth=1.6;ctx.stroke();ctx.restore();}
  function drawDefense150(){var f=G.defFx150;if(!f)return;var u=clamp((G.time-f.start)/f.dur,0,1),r=G.r;if(u>=1){G.defFx150=null;return;}
    var k=f.kind,x=f.x,y=f.y,arrive=ease151(u/.30),after=clamp((u-.43)/.57,0,1),fade=1-ease151((u-.82)/.18),sy=G.mouthY-r*.3,px=mix151(W/2,x,arrive),py=mix151(sy,y,arrive);ctx.save();ctx.beginPath();ctx.rect(0,G.topY,W,G.mouthY-G.topY);ctx.clip();
    if(k==='cut'){
      // The intact web stays visible until the blades meet; then both silk ends recoil and fall.
      f.lines.forEach((l,i)=>{var v=clamp((u-.43-i*.015)/.48,0,1),mx=(l[0]+l[2])/2,my=(l[1]+l[3])/2;if(!v){rope151(l[0],l[1],l[2],l[3],0,fade);return;}var dx=(l[2]-l[0])*.24*v,dy=(l[3]-l[1])*.24*v;rope151(l[0],l[1],mx-dx,my-dy+r*v*v,r*v,1-v);rope151(l[2],l[3]+r*4*v*v,mx+dx,my+dy+r*5*v*v,r*v,1-v);});
      f.targets.forEach(a=>{for(var i=0;i<8;i++){var t=i*Math.PI/4;rope151(a[0],a[1]+r*4*after*after,a[0]+Math.cos(t)*r*1.15,a[1]+Math.sin(t)*r*1.15+r*4*after*after,r*.3*after,fade*(1-after));}});
      if(f.monkey){var m=f.monkey;drawSpr(IMG.el[m.frame]||IMG.el.monkey,m.x+(m.dir||1)*r*2*after,m.y+r*6*after*after,m.size,.5*after,1-after);}
      var open=mix151(.48,.06,ease151((u-.30)/.13));prop151(px,py+r*.6,r/18,-.55,fade,()=>{blade151(open);blade151(-open);oval134(0,0,3.8,3.8,'#d7ae64');oval134(-1,-1,1.4,1.4,'#fff4cd');});
    }else if(k==='shield'){
      var a=f.actors[0],dir=a?a.dir:1,impact=ease151((u-.3)/.16),recoil=Math.sin(Math.PI*clamp((u-.43)/.26,0,1))*r*.40,shieldX=px+dir*recoil;
      if(a){var bx=mix151(a.x,x-dir*r*2.1,ease151(u/.43))-dir*(r*5+W*.35)*after,by=mix151(a.y,y,ease151(u/.43))-r*3*after;ctx.save();ctx.translate(bx,by);ctx.scale(dir,1);var fr=['bird1','bird2','bird3','bird2'][Math.floor(u*36)%4];drawSpr(IMG.el[fr],0,0,r*5.4,-.45*after,fade);ctx.restore();}
      prop151(shieldX,py,1,.10*Math.sin(after*22)*(1-after),fade,()=>drawSpr(IMG.ui.def150_shield,0,0,r*4.8,0,1));
      if(u>.38&&u<.69){var v=(u-.38)/.31;ctx.globalAlpha=1-v;ctx.strokeStyle='#fff4b8';ctx.lineWidth=3;for(var i=0;i<12;i++){var t=i*Math.PI/6;ctx.beginPath();ctx.moveTo(x-dir*r*.8+Math.cos(t)*r*v,y+Math.sin(t)*r*v);ctx.lineTo(x-dir*r*.8+Math.cos(t)*r*(v+1),y+Math.sin(t)*r*(v+1));ctx.stroke();}ctx.globalAlpha=1;}
    }else if(k==='spray'){
      var sx=clamp(x+r*2.4,r*2,W-r*2),side=sx>x?1:-1;px=mix151(W/2,sx,arrive);var nozzleX=px-side*r*.95,nozzleY=py-r*.85;
      prop151(px,py,1,side*.15,fade,()=>{ctx.scale(side,1);drawSpr(IMG.ui.def150_spray,0,0,r*4.2,0,1);});
      if(u>.27){for(var i=0;i<34;i++){var v=((u-.27)*2.8+i/34)%1,spread=(i%9-4)*.15;ctx.globalAlpha=fade*(1-v)*.66;oval134(nozzleX-side*v*r*5,nozzleY+spread*v*r*4,r*(.07+v*.23),r*(.06+v*.13),'#e5f8c2');}ctx.globalAlpha=1;}
      f.actors.forEach((a,i)=>{var t=ease151((u-.38)/.62),bx=a.x-side*(W*.72+r)*t,by=a.y-r*4*t+Math.sin(t*15+i)*r*.65;ctx.save();ctx.translate(bx,by);ctx.scale(side,.82+.18*Math.sin(u*65));drawSpr(IMG.el.bee,0,0,r*3.2+16,-.3*t,fade);ctx.restore();});
    }else if(k==='fan'){
      var dir=f.dir||1,rot=(u*u*8+u*5)*Math.PI,rad=r*1.65;prop151(px,py,1,0,fade,()=>{drawSpr(IMG.ui.def150_fan,0,0,r*4.5,0,1);ctx.translate(0,-r*.28);ctx.fillStyle='#263d4a';ctx.beginPath();ctx.arc(0,0,rad*.82,0,Math.PI*2);ctx.fill();ctx.save();ctx.rotate(rot);for(var i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ctx.fillStyle='#92cee3';ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-rad*.9,-rad*.12,-rad*.65,-rad*.85,-rad*.24,-rad*.68);ctx.quadraticCurveTo(rad*.23,-rad*.5,0,0);ctx.fill();}ctx.restore();ctx.strokeStyle='#c7e0e8';ctx.lineWidth=1.5;for(var i=0;i<8;i++){var a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*rad*.85,Math.sin(a)*rad*.85);ctx.stroke();}oval134(0,0,r*.26,r*.26,'#d6ad54');});
      if(u>.24)for(var i=0;i<14;i++){var v=(u*2.5+i*.14)%1,xx=x+dir*(r*1.7+W*v*.90),yy=y+(i%7-3)*r*.72;ctx.globalAlpha=fade*(1-v)*.7;ctx.strokeStyle='#e4faff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(xx-dir*r*3,yy);ctx.bezierCurveTo(xx-dir*r*2,yy-r*.7,xx-dir*r,yy+r*.3,xx,yy);ctx.stroke();}ctx.globalAlpha=1;
    }else if(k==='anchor'){
      var anchorY=clamp(y+r*2.5,G.topY+r*2,G.mouthY-r*2);py=mix151(sy,anchorY,arrive);var t=ease151((u-.23)/.2);f.targets.forEach(a=>{var xx=mix151(px,a[0],t),yy=mix151(py,a[1],t);rope151(px,py,xx,yy,r*.5*(1-t),fade);if(t>.8){ctx.globalAlpha=fade;ctx.strokeStyle='#d1ad78';ctx.lineWidth=3;ctx.beginPath();ctx.arc(a[0],a[1],r*1.15,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}});
      prop151(px,py,1,.13*Math.sin(u*17)*(1-t),fade,()=>drawSpr(IMG.ui.def150_anchor,0,0,r*4.7,0,1));
      for(var i=0;i<5;i++){var v=1-ease151((u-.3)/.5),rad=r*(1+i*.58)*v;ctx.globalAlpha=fade*v*.45;ctx.strokeStyle='#d9f4ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,rad,u*8+i,Math.PI*1.5+u*8+i);ctx.stroke();}ctx.globalAlpha=1;
    }ctx.restore();
  }
  function actorInDefense151(a){var f=G.defFx150;return !!(f&&(G.time-f.start)<f.dur&&(f.actors.some(b=>b.ref===a)||f.monkey&&f.monkey.ref===a));}
  function hazardTap144(x,y){var h=G&&G.hazard144,w=G&&G.web147,r=G.r;
    if(w&&(w.items.some(e=>Math.hypot(x-e.x,y-e.y)<r*1.35)||Math.abs(x-w.anchorX)<r*.4&&y>=G.topY&&y<=w.y)){
      w.taps=G.time-w.lastTap<1.5?w.taps+1:1;w.lastTap=G.time;vib(10);if(w.taps>=5)cutWeb147();else toast((save.lang==='ar'?'قطع الشبكة ':'Cut web ')+w.taps+'/5');return true;}
    if(!h||h.kind==='vortex')return false;
    if(h.kind==='spider'&&Math.hypot(x-h.x,y-h.y)>r*2.3&&!h.items.some(e=>Math.hypot(x-e.x,y-e.y)<r*1.4))return false;
    h.taps=G.time-h.lastTap<1.5?h.taps+1:1;h.lastTap=G.time;vib(10);
    if(h.taps>=(h.kind==='spider'?5:3)){finishHazard144(h,false);SFX.power();}return true;
  }
  function silk147(w,progress){var r=G.r,x=w.x,y=w.y;ctx.save();ctx.lineCap='round';
    function line(x1,y1,x2,y2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle='rgba(35,49,61,.65)';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#fffdf0';ctx.lineWidth=2.5;ctx.stroke();}
    line(w.anchorX,G.topY,x,y);
    w.items.forEach((e,i)=>{var p=progress?progress[i]:1;if(!p||e.hazard144!=='spider')return;var rr=r*1.35;line(x,y,x+(e.x-x)*p,y+(e.y-y)*p);for(var j=0;j<8;j++){var a=j*Math.PI/4;line(e.x,e.y,e.x+Math.cos(a)*rr*p,e.y+Math.sin(a)*rr*p);}for(var j=1;j<=3;j++){for(var k=0;k<8;k++){var a=k*Math.PI/4,b=(k+1)*Math.PI/4,rad=rr*j/3*p;line(e.x+Math.cos(a)*rad,e.y+Math.sin(a)*rad,e.x+Math.cos(b)*rad,e.y+Math.sin(b)*rad);}}});ctx.restore();}
  function drawWeb147(w){ctx.save();ctx.beginPath();ctx.rect(0,G.topY,W,H-G.topY);ctx.clip();silk147(w);ctx.restore();}
  function drawHazard144(h){var r=G.r,u=clamp(h.t/h.dur,0,1);ctx.save();ctx.beginPath();ctx.rect(0,G.topY,W,H-G.topY);ctx.clip();
    if(h.kind==='spider'){
      silk147({x:h.targetX,y:h.targetY,anchorX:h.anchorX,items:h.items},h.webProgress);
      ctx.beginPath();ctx.moveTo(h.anchorX,G.topY);ctx.lineTo(h.x,h.y);ctx.strokeStyle='#46535d';ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle='#fffdf0';ctx.lineWidth=3;ctx.stroke();
      ctx.translate(h.x,h.y);ctx.scale(1.65,1.65);ctx.lineCap='round';
      for(var side of [-1,1])for(var j=0;j<4;j++){var angle=(j-1.5)*.53,b=Math.sin(h.t*13+(j%2)*Math.PI+(side===1?Math.PI:0))*r*.22;var x1=side*r*.29,y1=(j-1.5)*r*.22,x2=side*r*.82,y2=Math.sin(angle)*r*.92+b,x3=side*r*1.12,y3=Math.sin(angle)*r*1.22+r*.32-b,x4=side*r*1.36,y4=Math.sin(angle)*r*1.42+r*.48-b*.6;
        for(var pass=0;pass<2;pass++){ctx.strokeStyle=pass?'#947653':'#29231e';ctx.lineWidth=r*(pass?.085:.19);ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.lineTo(x3,y3);ctx.lineTo(x4,y4);ctx.stroke();}oval134(x2,y2,r*.11,r*.11,'#53412e');}
      gloss135(0,-r*.25,r*.51,r*.66,'#997953','#30251d');gloss135(0,r*.38,r*.35,r*.33,'#715337','#211a16');for(var i=0;i<8;i++){var ang=i*2.4;oval134(Math.cos(ang)*r*.18,r*.40+Math.sin(ang)*r*.13,r*.055,r*.05,'#151719');oval134(Math.cos(ang)*r*.18-r*.015,r*.39+Math.sin(ang)*r*.13,r*.018,r*.018,'#fff1d8');}
    }else{
      var x=h.targetX,y=h.targetY;for(var j=0;j<5;j++){ctx.strokeStyle='rgba(229,249,255,'+(.48-j*.055)+')';ctx.lineWidth=3;ctx.beginPath();for(var i=0;i<=60;i++){var a=i/60*Math.PI*4+h.t*9+j*Math.PI*.4,rr=r*(.3+i/60*3.5);ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.76);}ctx.stroke();}
      h.items.forEach((e,i)=>{var q=hazardPoint144(h,i,u);drawSpr(kindImg(e),q.x,q.y,r*DRAW_K,Math.sin(u*Math.PI)*.35,1);});
    }ctx.restore();
  }
  function action134(k){if(!G||G.state!=='play')return;if(G.hazard144)return;if(['spider','vortex'].includes(k)){if(!actionBusy143(G))startHazard144(k);return;}if(k==='bee'){if(G.bees.length)return;G.forceBee143=true;G.beeT=0;updateBees(0);if(!G.bees.length)toast('لا يوجد زوج ظاهر مناسب للنحلة');return;}var a=G.hang.filter(eligible133);if(!a.length)return;var e=a[Math.floor(rnd()*a.length)];if(k==='ice'){tone(1250,650,.25,'triangle',.12);vib(20);e.ice=true;e.iceUntil=G.time+5;}else if(k==='gold'){e.gold133=G.time+12;}else if(k==='monkey'&&!G.monkey134){G.monkey134=monkeyStart142(e);if(G.monkey134)vib(25);}else if(k==='wind'){G.wind134=G.time+actionProfile143(G).windDuration;G.windNext139=G.time;G.windMoved139=0;G.windDirection137=rnd()<.5?-1:1;noise(.65,.09);tone(180,90,.7,'sine',.08);vib(25);}else if(k==='fall'){G.warn133=G.time+2;toast('انتبه! سقوط مفاجئ');}else if(k==='falcon'&&!G.bird){SFX.bird();vib(20);var near=a.filter(f=>a.some(h=>h!==f&&h.kind===f.kind&&Math.hypot(h.x-f.x,h.y-f.y)<G.r*5));if(near.length)e=near[Math.floor(rnd()*near.length)];e.taken=true;G.bird={state:'fly',t:0,x:-90,y:e.y-90,target:e,fromLeft:true,frame:0};}}
  function updateAction133(dt){G.hang.forEach(e=>{if(e.ice&&G.time>=(e.iceUntil||5)){e.ice=false;addFx('shards',e.x,e.y,G.r*2.8,.35);burst(e.x,e.y,'#b8edff',10,G.r);addFx('sparkle',e.x,e.y,G.r*2.4,.4);}});if(G.freezeUntil>G.time)return;
    if(G.hazard144)updateHazard144(dt);
    if(G.monkey134)updateMonkey142(dt);
    if(G.wind134>G.time)gust139(dt);
    if(G.warn133&&G.time>=G.warn133){G.warn133=0;G.hang.filter(eligible133).slice(0,4).forEach(e=>releaseFruit(e));}
    var p=actionProfile143(G);if(!p.sequence.length||G.remaining<=4)return;
    if((G.actionIndex134||0)>=p.maxAttacks)return;
    if(!G.actionAt133)G.actionAt133=G.time+p.first;
    if(G.time>=G.actionAt133){
      if(actionBusy143(G)||G.web147||G.defFx150){G.actionAt133=G.time+2;return;}
      var k=p.sequence[(G.actionIndex134||0)%p.sequence.length];
      G.actionAt133=G.time+p.interval;
      action134(k);G.actionIndex134=(G.actionIndex134||0)+1;
      if(!G.actionHelp152){G.actionHelp152={};}
      if(!G.actionHelp152[k]){G.actionHelp152[k]=true;var names={monkey:['المقص: اقطع حبل القرد','Scissors: cut the monkey rope'],falcon:['الدرع: صد الصقر','Shield: block the falcon'],bee:['المبيد: اطرد النحلة','Repellent: repel the bee'],wind:['المروحة: أوقف الرياح','Fan: counter the wind'],spider:['المقص أو خمس ضغطات لفك الشبكة','Scissors or five taps: clear the web'],vortex:['المرساة: ثبّت الفاكهة','Anchor: hold the fruit']};if(names[k])toast(names[k][save.lang==='ar'?0:1]);}
    }}

  function payFor(kind, run) {
    if (!G || G.state !== 'play') return;
    if (true) { G.powerUsed++; run(); return; }
    if (save.coins >= COST[kind]) { save.coins -= COST[kind]; persist(); updateCoins(); G.powerUsed++; run(); }
    else { showAd(function () { G.powerUsed++; run(); }); }
  }
  function channelFruits() {
    return G.dyn.filter(function (e) { var p = e.body.position; return p.x > G.chL - 4 && p.x < G.chR + 4 && p.y > G.mouthY - G.r; }).sort(function (a, b) { return a.body.position.y - b.body.position.y; });
  }
  function doTrash() {
    var ch = channelFruits(); var top = ch[0] || G.dyn.slice().sort(function (a, b) { return b.body.position.y - a.body.position.y; })[0];
    if (!top) { toast(save.lang === 'ar' ? 'مفيش فاكهة في المجرى' : 'Nothing in the channel'); refundNone('trash'); return; }
    var twin = G.dyn.filter(function (e) { return e !== top && e.kind === top.kind; })[0] || G.hang.filter(function (e) { return !e.bomb && !e.plate && !e.beeReserved && e.kind === top.kind; })[0];
    removeFruit(top); G.remaining -= 1; if (twin) { removeFruit(twin); G.remaining -= 1; }
    SFX.power(); bumpCounter();
  }
  function doTrashSilent() {
    var ch = channelFruits(); var top = ch[0]; if (!top) return;
    var twin = G.dyn.filter(function (e) { return e !== top && e.kind === top.kind; })[0] || G.hang.filter(function (e) { return !e.bomb && !e.plate && !e.beeReserved && e.kind === top.kind; })[0];
    removeFruit(top); G.remaining -= 1; if (twin) { removeFruit(twin); G.remaining -= 1; }
  }
  function refundNone(kind) { save.coins += 0; persist(); updateCoins(); G.powerUsed--; }
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
    var arr = G.hang.filter(function (e) { return !e.bomb && !e.plate && !e.beeReserved && !e.monkeyHeld && !e.hazard144; });
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
  function addFx(img, x, y, size, dur) { if (G.fx.length >= 80) G.fx.shift(); G.fx.push({ img: img, x: x, y: y, size: size, t: 0, dur: dur }); }

  // Visual debris only; no physics impulse; bounded particle budget.
  function burst(x,y,color,count,size){for(var i=0;i<count&&G.parts.length<160;i++){var a=rnd()*Math.PI*2,v=120+rnd()*240;G.parts.push({x:x,y:y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-90,t:0,life:.28+rnd()*.35,c:color,s:size*(.08+rnd()*.12)});}}
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
    if(G.limit155 && G.time>=G.limit155){G.time=G.limit155;refreshMode155();return finishChallenge155(G.variant155==='speed','time');}
    refreshMode155();adaptive155();
    updateAction133(dt);
    refreshDefense149(false);
    if(G.freezeUntil>G.time)return;
    G.lid166 = (G.collecting && G.collecting.some(function(cp){return cp.t>=cp.dur*.24&&cp.t<=cp.dur*.86;})) ? Math.min(1, (G.lid166||0) + dt * 9) : Math.max(0, (G.lid166||0) - dt * 8);
    if(G.collecting) for(var ci=G.collecting.length-1;ci>=0;ci--){var cp=G.collecting[ci];cp.t+=dt;if(cp.t>=cp.dur){G.collecting.splice(ci,1);finishPair(cp.items);}}
    G.comboShow=Math.max(0,(G.comboShow||0)-dt); G.basketBounce=Math.max(0,(G.basketBounce||0)-dt); G.basketGlow = Math.max(0,(G.basketGlow||0)-dt);
    // physics
    var budget=(G.physicsCarry||0)+dt*270; // VC120: 10% more than VC119; unchanged 240 Hz integration
    var steps=Math.min(17,Math.floor(budget+1e-8));G.physicsCarry=Math.max(0,budget-steps);
    // Small bounded rotations keep the obstacle footprint clear of the fruit reserve.
    G.obst.forEach(function(o){
      o.impactT=Math.max(0,(o.impactT||0)-dt);
      if(o.type!=='wood'||G.n<21)return;
      var phase=G.time*(2.1+G.cfg.difficulty*.24)+o.phase;
      var target=o.baseAng+Math.sin(phase)*.38;
      var goalX=clamp(o.baseX+Math.sin(phase*.72)*G.r*.12,108,W-108);
      var nx=o.x+clamp(goalX-o.x,-dt*G.r*.9,dt*G.r*.9);
      var clearance=o.size*Math.SQRT1_2+G.r*BODY_K+G.r*.5+Math.abs(nx-o.x);
      // Freeze before contact, never shove a supported fruit.
      var close=G.dyn.some(function(e){var p=e.body.position;return Math.hypot(p.x-o.x,p.y-o.y)<clearance;})||G.hang.some(function(e){return e.hb&&Math.hypot(e.x-o.x,e.y-o.y)<clearance;});
      if(!close){o.x=nx;o.ang+=clamp(target-o.ang,-dt*1.3,dt*1.3);Body.setPosition(o.body,{x:o.x,y:o.y});Body.setAngle(o.body,o.ang);}
    });
    for (var s = 0; s < steps; s++) Engine.update(G.engine, 1000 / 240);
    for(var oi=G.obst.length-1;oi>=0;oi--){var o=G.obst[oi];if(o.impact){o.impact=false;addFx('shards',o.x,o.y,G.r*2,.24);burst(o.x,o.y,o.type==='wood'?'#d7a05e':'#b5c0c7',12,G.r*.8);if(o.type==='rock')SFX.rock();else SFX.wood(o.hp<=0);vib(12);if(o.type==='wood'&&o.hp<=0){Composite.remove(G.engine.world,o.body);G.obst.splice(oi,1);addFx('smoke',o.x,o.y,G.r*3.6,.5);addFx('ring',o.x,o.y,G.r*4,.35);burst(o.x,o.y,'#c38a49',34,G.r*1.25);vib(32);}}}
    G.shake = Math.max(0, G.shake - dt * 30);
    G.hang.forEach(function(e){if(e.plateOutgoing){var f=e.plateOutgoing;if(f.state!=='fall'||Math.hypot(f.body.position.x-e.x,f.body.position.y-e.y)>=G.r*BODY_K*2+.35){e.plateOutgoing=null;syncHangBody(G,e);}}});
    advanceField(G,dt);
    // Bounded queued taps, always rechecking lock and visibility.
    G.hang.filter(function(e){return e.pendingDrop;}).forEach(function(e){if(e.caged||e.stung||e.ice||!visibleFruit(G,e)){e.pendingDrop=false;return;}releaseFruit(e);});

    // merge same-kind fruits that touch
    var d = G.dyn, merged = true, guard = 0; G.chain = 0;
    while (merged && guard++ < 20) {
      merged = false;
      for (var i = 0; i < d.length && !merged; i++) {
        for (var j = i + 1; j < d.length; j++) {
          var a = d[i], b = d[j];
          if (a.kind !== b.kind || !inMatchChannel(G,a) || !inMatchChannel(G,b)) continue;
          var dx = a.body.position.x - b.body.position.x, dy = a.body.position.y - b.body.position.y, rr = G.r * BODY_K * 2 * 1.06;
          if (dx * dx + dy * dy < rr * rr) { popPair(a, b); G.chain++; merged = true; break; }
        }
      }
    }
    // No manual separation, upward nudges, collision bypass or repositioning.
    for (var k=0;k<G.dyn.length;k++) {
      var e=G.dyn[k], p=e.body.position;
      if(p.y>H+200||p.x<-200||p.x>W+200){
        (G.lostLog=G.lostLog||[]).push([e.kind,Math.round(p.x),Math.round(p.y)]);
        return endLevel(false); // never teleport an escaped fruit back
      }
    }
    // Overflow: a fifth fruit may bounce forever and never meet the old speed test.
    // Require a genuinely full channel plus an extra fruit at the mouth. Reset when a match frees space.
    var stack=0, inside=[], above=[], r0=G.r;
    for(var m=0;m<G.dyn.length;m++){
      var ee=G.dyn[m], pp=ee.body.position;
      if(pp.x>=G.chL-r0*.12 && pp.x<=G.chR+r0*.12 && pp.y>=G.mouthY-r0*.10 && pp.y<=G.floorY+r0*.1)inside.push(ee);
      if(pp.x>G.chL-6 && pp.x<G.chR+6 && pp.y>G.mouthY-r0*1.5)stack++;
      if(pp.y>=G.mouthY-r0*3.0 && pp.y<=G.mouthY+r0*.15 && Math.abs(pp.x-W/2)<=G.cw*.5+r0*1.7 && !nearHang(pp))above.push(ee);
    }
    G.maxStack=Math.max(G.maxStack,stack);G.stackNow=inside.length;
    var full=inside.length>=G.cfg.cap;
    // VC165: like the original, a full channel that settles without a match loses the level at once.
    var calm=inside.every(function(e){return e.body.speed<.6;});
    // VC169: when the channel is full and settled the player gets GRACE_S166 seconds to swap/use tools before the level is lost.
    if(!full || G.chain>0 || G.collecting&&G.collecting.length){G.fullT=0;G.overflowSeen=false;G.grace166=null;}
    else if(G.grace166==null){
      if(!calm){G.fullT=0;G.overflowSeen=false;}
      else{G.overflowSeen=true;G.fullT+=dt;if(G.fullT>=.5){G.fullT=0;G.grace166=GRACE_S166;toast('المجرى امتلأ! بدّل فاكهة قبل ما الوقت يخلص');}}
    }else{G.overflowSeen=true;G.fullT=Math.max(G.fullT,.06);G.grace166-=dt;if(G.grace166<=0){G.grace166=null;G.fullT=0;G.overflowSeen=false;return endLevel(false);}}

    // deadlock: nothing left to drop and the channel cannot clear itself
    var freeLeft = G.hang.some(function (e) { return !e.bomb && !e.caged && !e.stung; });
    var settled = G.dyn.length > 0 && G.dyn.every(function (e) { return e.body.speed < 0.3; });
    if (!freeLeft && !G.hang.some(e=>e.ice) && settled && !G.bird && !G.bees.length && !G.hang.some(function (e) { return e.caged || e.bomb; })) { G.deadT = (G.deadT || 0) + dt; if (G.deadT > 2.5) { G.deadT = 0; G.deadlock = true; return endLevel(false); } } else G.deadT = 0;
    // cages never deadlock: if only locked fruits remain, open them
    if (G.hang.length && G.hang.every(function (e) { return e.caged || e.bomb; }) && G.hang.some(function (e) { return e.caged; })) { G.hang.forEach(function (e) { if (e.caged) { e.cageHp = 0; e.caged = false; addFx('shards', e.x, e.y, G.r * 3.2, .5); } }); }
    // bombs
    var activeBombs=G.hang.filter(function(e){return e.bomb&&visibleFruit(G,e);});
    activeBombs.forEach(function(be){if(be.state!=='hang'||G.hang.indexOf(be)<0)return;be.fuse-=dt;if(be.fuse<=0)explodeBomb(be);});
    // bees
    updateBees(dt); updateBird(dt);
    // win
    if (G.remaining <= 0 && G.dyn.length === 0 && G.state === 'play') endLevel(true);
    
    updateCounter();
  }

  function updateFx(dt) {
    for (var i = G.fx.length - 1; i >= 0; i--) { G.fx[i].t += dt; if (G.fx[i].t >= G.fx[i].dur) G.fx.splice(i, 1); }
    for (var j = G.parts.length - 1; j >= 0; j--) { var p = G.parts[j]; p.t += dt; p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.t >= p.life) G.parts.splice(j, 1); }
  }

  function pickTarget() {
    var c = G.hang.filter(function (e) { return !e.bomb && !e.caged && !e.stung && !e.ice && !e.taken && !e.plate && !e.beeReserved && visibleFruit(G,e); });
    return c.length ? c[Math.floor(rnd() * c.length)] : null;
  }
  function updateBees(dt) {
    if(!G.bees.length&&!G.forceBee143)return;
    if(G.remaining<=2)G.forceBee143=false;
    if(!G.bees.length)G.beeT-=dt;
    if(G.forceBee143&&G.beeT<=0 && !G.bees.length && G.remaining>2){
      G.forceBee143=false;
      G.beeT=2;
      var eligible=G.hang.filter(function(e){return !e.bomb&&!e.plate&&!e.caged&&!e.ice&&!e.mystery&&!e.taken&&!e.pendingDrop&&visibleFruit(G,e);});
      var a=eligible.find(function(e){return eligible.some(function(f){return f!==e&&f.pairId===e.pairId&&f.kind===e.kind;});});
      if(!a)a=eligible.find(e=>eligible.some(f=>f!==e&&f.kind===e.kind));
      if(a){G.beeT=10+rnd()*5;var b=eligible.find(f=>f!==a&&f.kind===a.kind&&f.pairId===a.pairId)||eligible.find(f=>f!==a&&f.kind===a.kind);var counts={};G.hang.forEach(function(e){if(!e.bomb){counts[e.kind]=(counts[e.kind]||0)+1;(e.plate||[]).forEach(function(f){counts[f.kind]=(counts[f.kind]||0)+1;});}});
        var choices=Object.keys(counts).map(Number).filter(function(k){return k!==a.kind&&k!==G.lastBeeKind;});
        if(!choices.length)choices=FR.map(function(f,i){return i;}).filter(function(k){return k!==a.kind&&k!==G.lastBeeKind&&!/_cut$/.test(FR[k].n);});
        choices.sort(function(x,y){return (counts[x]||0)-(counts[y]||0);});var k=choices[Math.floor(rnd()*Math.min(3,choices.length))];G.lastBeeKind=k;
        a.beeReserved=b.beeReserved=true;a.taken=b.taken=true;
        G.bees.push({x:-60,y:a.y,target:a,second:b,newKind:k,state:'fly',t:0,phase:0});SFX.bee();showActionHint('hintBee');}
    }
    for(var i=G.bees.length-1;i>=0;i--){var bee=G.bees[i],e=bee.target;
      if(bee.state==='fly'){var dx=e.x-bee.x,dy=e.y-G.r*.55-bee.y,d=Math.hypot(dx,dy);if(d<18){bee.state='perch';bee.t=0;e.stung=true;}else{var move=Math.min(d,Math.min(420,Math.max(90,d*5))*dt),sway=Math.sin(G.time*16)*Math.min(35,d*.20)*dt;bee.x+=dx/d*move-dy/d*sway;bee.y+=dy/d*move+dx/d*sway;}}
      else if(bee.state==='perch'){bee.x=e.x;bee.y=e.y-G.r*.55;bee.t+=dt;if(bee.t>=1.1){e.kind=bee.newKind;e.stung=false;e.beeReserved=false;e.taken=false;addFx('sparkle',e.x,e.y,G.r*3,.55);addFx('ring',e.x,e.y,G.r*2.7,.4);burst(e.x,e.y,'#ffd85b',12,G.r);SFX.power();if(!bee.phase){bee.phase=1;bee.state='exitFirst';bee.t=0;}else bee.state='leave';}}
      else if(bee.state==='exitFirst'){bee.x+=520*dt;bee.y-=100*dt;if(bee.x>W+100){bee.state='wait';bee.t=0;}}
      else if(bee.state==='wait'){bee.t+=dt;if(bee.t>=2){bee.target=bee.second;bee.x=-100;bee.y=bee.second.y;bee.state='fly';SFX.bee();}}
      else {bee.x+=350*dt;bee.y-=120*dt;if(bee.x>W+100||bee.y< -100){G.bees.splice(i,1);}}
    }
  }
  function updateBird(dt) {
    var prog = 1 - G.remaining / G.total;
    if (!G.bird && false && G.birdDone < G.birdN && prog >= G.birdAt + G.birdDone * Math.min(.22,.68/Math.max(1,G.birdN)) && G.hang.length > 3) {
      var tg = pickTarget();
      if (tg) { tg.taken = true; var left = rnd() < .5; G.bird = { state: 'warn', t: 0, x: left ? -90 : W + 90, y: 210 + rnd() * 120, target: tg, fromLeft: left, frame: 0 }; SFX.bird(); showActionHint('hintBird'); }
    }
    var b = G.bird; if (!b) return;
    b.frame += dt * 10; b.t += dt;
    if (b.state === 'warn') { if (b.t > 1.4) { b.state = 'fly'; b.t = 0; } }
    else if (b.state === 'fly') {
      if (b.target.state !== 'hang'||!G.hang.includes(b.target)||b.target.pendingDrop||b.target.ice||!visibleFruit(G,b.target)) { b.target.taken=false; b.state = 'leave'; G.birdDone++; return; }
      var dx = b.target.x - b.x, dy = b.target.y-G.r*1.45-b.y, d = Math.hypot(dx,dy)||1;
      var speed=Math.min(d,Math.min(actionProfile143(G).falconSpeed,Math.max(G.r*2.8,d*5))*dt);b.x+=dx/d*speed;b.y+=dy/d*speed;
      if (d < G.r*.25) { b.x=b.target.x;b.y=b.target.y-G.r*1.45;b.state = 'carry'; b.t = 0; b.carry=b.target; b.carry.birdHeld=true; b.dest139=farSlot143(b.carry);if(b.dest139){b.dest139.birdDest143=true;b.dest139.taken=true;} SFX.bird(); }
    } else if (b.state === 'carry') {
      var e=b.carry;if(!e||!G.hang.includes(e)||e.state!=='hang'){dropCarry(b);return;}var dest=b.dest139, valid=dest&&G.hang.includes(dest)&&dest.birdDest143&&!dest.ice&&!dest.caged&&visibleFruit(G,dest), k=Math.min(1,b.t/1.05), smooth=k*k*(3-2*k);
      var tx=valid?e.x+(dest.x-e.x)*smooth:e.x,ty=(valid?e.y+(dest.y-e.y)*smooth:e.y)-G.r*1.45-Math.sin(smooth*Math.PI)*G.r*2;
      b.x=tx;b.y=ty;
      if(b.t>=1.05){if(valid)swapSlots139(e,dest);dropCarry(b);}

    } else {
      b.x += (b.fromLeft ? 1 : -1) * 360 * dt; b.y -= 120 * dt;
      if (b.x < -140 || b.x > W + 140 || b.y < -140) { G.bird = null; }
    }
  }
  function dropCarry(b) {
    if(b.dest139&&b.dest139.birdDest143){b.dest139.birdDest143=false;b.dest139.taken=false;}
    var e=b.carry;if(e){e.birdHeld=false;e.taken=false;addFx('sparkle',e.x,e.y,G.r*2.1,.3);}
    b.carry = null; b.state = 'leave'; G.birdDone++;
  }
  function scareBird() {
    var b = G.bird; if (!b || b.state==='leave') return false;
    if (b.state === 'carry' && b.carry) {
      // A successful tap rescues the fruit back to its own reserved location.
      // The reserve is frozen while the bird carries it, so the original slot is safe.
      dropCarry(b);
    }
    else { if (b.target) b.target.taken = false; b.state = 'leave'; G.birdDone++; }
    SFX.bird(); if(G.variant155==='classic'){save.coins += 5; persist(); updateCoins();} addFx('sparkle', b.x, b.y, 150, .5); return true;
  }

  /* ---------------- level end ---------------- */
  function refreshMode155(){if(!G||G.demo)return;var v=G.variant155,active=v!=='classic';$('challenge155').classList.toggle('hidden',!active);if(!active)return;var name=t(v+'155'),secs=Math.max(0,Math.ceil(G.limit155-G.time)),timer=G.limit155?Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0'):'';var score=v==='speed'?(save.lang==='ar'?'النقاط: ':'Score: ')+(G.matchScore155||0):'';if($('mode155').textContent!==name)$('mode155').textContent=name;if($('timer155').textContent!==timer)$('timer155').textContent=timer;if($('score155').textContent!==score)$('score155').textContent=score;}
  function adaptive155(){
    if(G.variant155!=='classic'||G.time<G.hintAt155||G.freezeUntil>G.time)return;
    G.hintAt155=G.time+8;var r=G.r,elapsed=G.time-G.lastProgress155;
    function ordinary(e){return eligible133(e)&&!e.hazard144&&!e.birdHeld&&!e.monkeyHeld&&!e.monkeyDest143&&!e.birdDest143&&!e.mystery;}
    function blocker(e){return G.hang.filter(f=>f!==e&&f.hb&&f.y>e.y+r*.12&&Math.abs(f.x-e.x)<r*2.05).sort((a,b)=>a.y-b.y)[0];}
    var a=G.hang.filter(ordinary).sort((a,b)=>b.y-a.y),free=a.filter(e=>!blocker(e)),ch=channelFruits(),target=ch[0],pair=[];
    if(target){var f=free.find(e=>e.kind===target.kind);if(f)pair=[f];}
    else{for(var e of free){var twin=free.find(f=>f!==e&&f.kind===e.kind);if(twin){pair=[e,twin];break;}}}
    // Never change a locked/held fruit, and never alter total counts, wallet or player progress.
    if(!pair.length&&target&&elapsed>=45&&!G.assistSwap160&&!(G.collecting&&G.collecting.length)&&G.dyn.every(e=>e.body.speed<.5)){
      var donor=G.hang.find(e=>e.kind===target.kind&&!e.bomb&&!e.plate&&!e.caged&&!e.ice&&!e.taken&&!e.stung&&!e.beeReserved&&!e.pendingDrop&&!e.hazard144&&!e.birdHeld&&!e.monkeyHeld&&!e.monkeyDest143&&!e.birdDest143&&!e.mystery);
      var recipient=free.find(e=>e.kind!==target.kind);
      if(donor&&recipient){var kind=recipient.kind,pid=recipient.pairId;recipient.kind=donor.kind;recipient.pairId=donor.pairId;donor.kind=kind;donor.pairId=pid;G.assistSwap160=true;recipient.wob=.35;pair=[recipient];toast(save.lang==='ar'?'فرصة مساعدة: قربنا لك ثمرة مطابقة':'Assist: matching fruit brought closer');}
    }
    if(!pair.length&&target){var match=a.find(e=>e.kind===target.kind);if(match){var b=blocker(match);while(b&&ordinary(b)&&blocker(b))b=blocker(b);if(b&&ordinary(b))pair=[b];}}
    if(!pair.length&&!target&&free.length)pair=[free[0]];
    if(!pair.length&&elapsed>=60&&target&&G.cfg.cap-ch.length<=1&&G.extra<3&&!G.assistRescue160){extendChannel(1);G.assistRescue160=true;G.powerUsed++;toast(save.lang==='ar'?'فرصة إنقاذ: مساحة إضافية للمجرى':'Rescue: extra channel space');}
    G.hintIds155=pair.map(e=>e.id);G.hintUntil155=G.time+5;
    if(pair.length&&!G.assistSwap160)toast(save.lang==='ar'?'جرّب الفاكهة المضيئة':'Try the highlighted fruit');
  }

  function finishChallenge155(win,reason){if(!G||G.state!=='play')return;var v=G.variant155;G.state=win?'won':'lost';var s=G.matchScore155||0,k=v+'_'+G.n,r=save.records155[k]||{};if(v==='speed'){r.best=Math.max(r.best||0,s);}else if(win){r.wins=(r.wins||0)+1;r.bestTime=Math.min(r.bestTime||Infinity,Math.ceil(G.time));}save.records155[k]=r;persist();(win?SFX.win:SFX.lose)();$('challengeTitle155').textContent=v==='speed'?(save.lang==='ar'?'نتيجة السرعة':'Speed result'):win?t('win'):(reason==='time'?(save.lang==='ar'?'انتهى الوقت':'Time is up'):t('full'));$('challengeResult155').textContent=(save.lang==='ar'?'الفواكه المطابقة: ':'Matched fruit: ')+s+' / '+G.total;$('challengeBest155').textContent=v==='speed'?(save.lang==='ar'?'أفضل نتيجة: ':'Best score: ')+r.best:(r.bestTime?(save.lang==='ar'?'أفضل وقت: ':'Best time: ')+r.bestTime+'s':'');$('pChallenge155').classList.remove('hidden');}
  function endLevel(win) {
    if(G.variant155!=='classic')return finishChallenge155(win,'board');
    if (G.state !== 'play') return;
    G.state = win ? 'won' : 'lost';
    var finished = G;
    if (win) {
      if(save.assist155[String(G.n)])save.assist155[String(G.n)].fails=0;
      SFX.win(); vib(40);
      for(var v=0;v<56;v++)G.parts.push({x:W*.5+(rnd()-.5)*W*.5,y:G.mouthY-G.r*4,vx:(rnd()-.5)*620,vy:-180-rnd()*530,t:0,life:.8+rnd()*.7,c:['#ffe05d','#ff8c40','#80de5b','#f66b87','#fff5b9'][v%5],s:3+rnd()*5});
      var stars = (G.powerUsed === 0 ? (G.maxStack < G.cfg.cap ? 3 : 2) : 1);
      var coins = 10 + stars * 5;
      var prev = save.stars[G.n] || 0; if (stars > prev) save.stars[G.n] = stars;
      if (G.n === save.unlocked && G.n < LV.MAX_LEVEL) save.unlocked = G.n + 1;
      if(G.n%5===0&&!prev){save.free133=(save.free133||0)+1;var upcoming=LV.gen(Math.min(300,G.n+1)).defense152;var dk=upcoming.length?upcoming[(G.n/5-1)%upcoming.length]:Object.keys(DEF149)[(G.n/5-1)%5];save.def149[dk]++;}save.coins += coins; persist(); updateCoins();
      setTimeout(function () {
        if (G !== finished || G.state !== 'won') return;
        $('winLvl').textContent = G.n; $('winCoins').textContent = coins; $('winReason').textContent=t(stars===3?'star3':stars===2?'star2':'star1');
        for (var i = 1; i <= 3; i++) { var el = $('st' + i); el.className = ''; void el.offsetWidth; el.className = i <= stars ? 'on' : 'off'; el.style.animationDelay = (i * .25) + 's'; }
        $('wNext').style.display = G.n >= LV.MAX_LEVEL ? 'none' : '';
        $('pWin').classList.remove('hidden');
      }, 700);
    } else {
      var a155=assistState155(G.n);if(!G.lossCounted155){a155.fails++;G.lossCounted155=true;}if(a155.fails>=5&&!a155.granted){var ks=G.cfg.defense152;var gift=ks.length?ks[0]:null;if(gift)save.def149[gift]++;a155.granted=true;}persist();
      SFX.lose(); vib(120);
      setTimeout(function () { if (G !== finished || G.state !== 'lost') return; $('loseLvl').textContent = G.n; $('loseRemaining').textContent = G.remaining; $('pLose').classList.remove('hidden'); }, 500);
    }
  }

  /* ---------------- rendering ---------------- */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    var vw = window.innerWidth, vh = window.innerHeight;
    scale = vw / W; var newH = Math.round(clamp(vh / scale, 1200, 1700));
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    if (newH !== H) { H = newH; if (G && mode === 'menu') startDemo(); }
    if(G&&!G.demo)positionRails154();
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    var s = scale * dpr, vh = window.innerHeight;
    var offY = (vh * dpr - H * s) / 2;
    ctx.setTransform(s, 0, 0, s, 0, offY);
    if (!G) { ctx.fillStyle = '#7fd0ff'; ctx.fillRect(0, 0, W, H); return; }
    // VC162: reclaim the unused future-extension reserve in the camera only.
    // The collector and all physics coordinates stay unchanged; input uses the inverse mapping.
    var zoom=boardStretch162(G), anchor=G.topY;
    ctx.setTransform(s,0,0,s*zoom,0,offY+s*anchor*(1-zoom));
    var th = G.theme;
    if (G.shake > 0) ctx.translate((rnd() - .5) * G.shake, (rnd() - .5) * G.shake);
    if (!drawScenery(th)) {
    // sky
    var sg = ctx.createLinearGradient(0, 0, 0, H * .7); sg.addColorStop(0, th.sky[0]); sg.addColorStop(1, th.sky[1]);
    ctx.fillStyle = sg; ctx.fillRect(-20, -20, W + 40, H + 40);
    if (th.night) { for (var i = 0; i < 40; i++) { var sx = (i * 197) % W, sy = (i * 83) % (H * .45); ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(cloudOff * 1.5 + i)); ctx.fillStyle = '#fff'; ctx.fillRect(sx, sy, 3, 3); } ctx.globalAlpha = 1; }
    // sun / moon
    ctx.fillStyle = th.sun; ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(W * .16, H * .45, 54, 0, 7); ctx.fill();
    ctx.globalAlpha = .25; ctx.beginPath(); ctx.arc(W * .16, H * .45, 84, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    // clouds
    ctx.fillStyle = th.night ? 'rgba(180,190,255,.18)' : 'rgba(255,255,255,.85)';
    G.clouds.forEach(function (c) { ctx.beginPath(); ctx.ellipse(c.x, c.y, 70 * c.s, 26 * c.s, 0, 0, 7); ctx.ellipse(c.x + 42 * c.s, c.y + 6 * c.s, 50 * c.s, 22 * c.s, 0, 0, 7); ctx.ellipse(c.x - 42 * c.s, c.y + 8 * c.s, 46 * c.s, 20 * c.s, 0, 0, 7); ctx.fill(); });
    // far hills
    hills(H * .46, 60, 0.012, th.hill[0], 0.9); hills(H * .53, 46, 0.019, th.hill[1], 1.7);
    drawGround(th);
    }
    // Decorative back-plane supports; only the fruit-facing obstacle collides.
    G.obst.forEach(function(o){
      if(o.type!=='wood')return;
      var half=o.size*.30;
      ctx.save();ctx.lineCap='round';ctx.globalAlpha=.85;
      for(var side=-1;side<=1;side+=2){var sx=o.x+side*half;
        ctx.strokeStyle='#815027';ctx.lineWidth=Math.max(4,G.r*.16);ctx.beginPath();ctx.moveTo(sx,o.y+o.size*.23);ctx.lineTo(sx+side*G.r*.24,groundY(G,sx+side*G.r*.24)+6);ctx.stroke();
        ctx.strokeStyle='#d8a25f';ctx.lineWidth=Math.max(2,G.r*.055);ctx.stroke();}
      ctx.restore();
    });
    // obstacles
    G.obst.forEach(function (o) { var im = IMG.el[o.type]; if (!im || !im.complete || !im.naturalWidth) return; ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.type === 'wood' ? o.ang : 0); var h = o.size * im.height / im.width; ctx.drawImage(im, -o.size / 2, -h / 2, o.size, h); if(o.type==='wood'&&G.n>=6){ctx.fillStyle='#51412e';ctx.fillRect(-o.size*.32,h*.32,o.size*.64,7);ctx.fillStyle='#e6bd75';ctx.fillRect(-o.size*.32,h*.32,o.size*.64*o.hp/3,7);if(o.hp<3){ctx.strokeStyle='rgba(83,44,18,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-o.size*.38,-h*.33);ctx.lineTo(-o.size*.10,-h*.06);ctx.lineTo(-o.size*.19,h*.05);ctx.lineTo(o.size*.16,h*.29);ctx.stroke();}} if(o.impactT>0){ctx.globalAlpha=Math.min(.45,o.impactT);ctx.strokeStyle='#ffe0a0';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,o.size*.52,0,7);ctx.stroke();} ctx.restore(); });
    if(G.divider){var dv=G.divider;var dg=ctx.createLinearGradient(dv.x-dv.w/2,0,dv.x+dv.w/2,0);dg.addColorStop(0,'#70401f');dg.addColorStop(.35,'#f5c37d');dg.addColorStop(.7,'#b87839');dg.addColorStop(1,'#68401e');ctx.fillStyle=dg;ctx.fillRect(dv.x-dv.w/2,G.topY,dv.w,dv.bottom-G.topY);ctx.strokeStyle='#e8b875';ctx.lineWidth=2;ctx.strokeRect(dv.x-dv.w/2,G.topY,dv.w,dv.bottom-G.topY);}
    // hanging fruits
    var r = G.r;
    ctx.save(); ctx.beginPath(); ctx.rect(0,G.topY,W,H-G.topY); ctx.clip();
    G.hang.forEach(function (e) {
      var x = e.x, y = e.y;
      if (!visibleFruit(G,e)||e.birdHeld) return;
      if(e.hazard144==='vortex')return;
      if(e.monkeyHeld){ctx.save();ctx.globalAlpha=.26;ctx.strokeStyle='#714e32';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(x,y,r*.9,0,Math.PI*2);ctx.stroke();ctx.restore();return;}
      var entry=1; // only reveal a complete sprite, at its unchanged physical position
      if (e.bomb) { drawBomb(e, x, y); return; }
      if(y>=G.topY+r*.8){ctx.fillStyle = 'rgba(19,66,90,.13)'; ctx.beginPath(); ctx.ellipse(x, y + r * .69, r * .68, r * .14, 0, 0, 7); ctx.fill();}
      var sc = 1; // no size pulsing that could look like jumping
      var im = e.mystery ? IMG.el.mystery : kindImg(e);
      if (e.caged && e.lock === 'nest') drawNestBack(x, y);
      if(e.plate){
        drawReserveBasket162(e,im,x,y,r);
      }else drawSpr(im, x, y, r * DRAW_K * sc, e.visualAngle||0, (e.stung ? .55 : 1)*entry);
      if(G.hintUntil155>G.time&&(G.hintIds155||[]).includes(e.id)){ctx.save();ctx.strokeStyle='#fff6a1';ctx.shadowColor='#ffde40';ctx.shadowBlur=14;ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,r*1.18,0,7);ctx.stroke();ctx.restore();}
      if(e.gold133>G.time){ctx.strokeStyle="#ffce32";ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,r*1.1,0,7);ctx.stroke();}
      if (e.caged) drawLockFront(e, x, y);
      if(e.counter>0){ctx.fillStyle="#65401d";ctx.beginPath();ctx.arc(x,y,r*.43,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold "+Math.round(r*.65)+"px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(e.counter,x,y); }
      if(e.stung||e.birdHeld){ctx.save();ctx.strokeStyle=e.stung?'#d8a244':'#9cbad4';ctx.lineWidth=4;ctx.setLineDash([8,6]);ctx.beginPath();ctx.arc(x,y,r*1.16,0,7);ctx.stroke();ctx.restore();}
      if(e.ice){ctx.save();ctx.strokeStyle='rgba(139,203,222,.90)';ctx.fillStyle='rgba(161,214,228,.24)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,r*1.06,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='rgba(234,246,247,.9)';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-r*.6,y-r*.6);ctx.lineTo(x-r*.15,y-r*.12);ctx.lineTo(x+r*.28,y-r*.5);ctx.moveTo(x-r*.15,y-r*.12);ctx.lineTo(x+r*.15,y+r*.6);ctx.stroke();ctx.fillStyle="#fff";ctx.font="bold "+Math.round(r*.65)+"px sans-serif";ctx.textAlign="center";ctx.fillText(Math.max(1,Math.ceil((e.iceUntil||5)-G.time)),x,y);ctx.restore();}
    });
    ctx.restore();
    // dynamic fruits
    drawSand164(G);drawBasket(G);
    ctx.save();ctx.beginPath();ctx.rect(0,G.topY,W,H-G.topY);ctx.clip();G.dyn.forEach(function (e) { var p = e.body.position, im=kindImg(e), angle=e.body.angle+(e.visualAngle||0); if(p.y-spriteHalfHeight(im,r*DRAW_K,angle)<G.topY+1||basketFruit160(G,e))return; drawSpr(im, p.x, p.y, r * DRAW_K * chuteScale163(G,p), angle, 1); });ctx.restore();
    // carried fruit
    // Held fruit is already drawn at its solid original slot.
    // bees
    G.bees.forEach(function (b) { if(b.state==='wait'||actorInDefense151(b))return; ctx.save();ctx.translate(b.x,b.y);ctx.scale(1, .94+.06*Math.sin(G.time*75));drawSpr(IMG.el.bee, 0, 0, r * 3.2 + 16, Math.sin(G.time * 20) * .1, 1);ctx.restore(); });
    // bird
    if (G.bird&&!actorInDefense151(G.bird)) {
      var bd = G.bird;
      if (bd.state === 'warn') { var wx = bd.fromLeft ? 40 : W - 40; ctx.globalAlpha = .6 + .4 * Math.sin(bd.t * 14); ctx.fillStyle = '#ff3b3b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(wx, bd.y - 34); ctx.lineTo(wx + 32, bd.y + 24); ctx.lineTo(wx - 32, bd.y + 24); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', wx, bd.y + 18); ctx.globalAlpha = 1; }
      else { var fr = ['bird1','bird2','bird3','bird2'][Math.floor(bd.frame*(bd.state==='carry'?.92:.72))%4]; var dir = (bd.state === 'leave' ? bd.fromLeft : (bd.target && bd.target.x < bd.x ? false : true)); ctx.save(); ctx.translate(bd.x, bd.y+Math.sin(bd.frame*Math.PI/2)*r*.12); ctx.rotate(bd.state==='fly'?.17*Math.sin(bd.frame*.45):-.12*Math.sin(Math.PI*clamp(bd.t/1.05,0,1)));  if (bd.state === 'leave' ? !bd.fromLeft : (bd.carry ? W / 2 < bd.x : bd.target && bd.target.x < bd.x)) ctx.scale(-1, 1); ctx.save();ctx.scale(Math.max(1,r/25),Math.max(1,r/25));if(IMG.el[fr]&&IMG.el[fr].naturalWidth){drawSpr(IMG.el[fr],0,0,Math.max(120,r*5.5),0,1);}else drawFalcon134(bd.frame);ctx.restore();ctx.restore();if(bd.carry)drawSpr(kindImg(bd.carry),bd.x,bd.y+r*1.45,r*DRAW_K,0,1); }
    }
    if(G.monkey134&&!actorInDefense151(G.monkey134))drawMonkey142(G.monkey134);
    if(G.web147)drawWeb147(G.web147);
    if(G.hazard144)drawHazard144(G.hazard144);
    if(G.wind134>G.time){ctx.save();for(var i=0;i<16;i++){var x=(G.time*310+i*137)%(W+200)-70,y=G.topY+45+i*48;var windForce=windVector145(G),windDir=windForce<0?-1:1;ctx.globalAlpha=Math.abs(windForce);if(windDir<0)x=W-x;ctx.strokeStyle='rgba(232,251,255,.72)';ctx.lineWidth=3+i%3;ctx.lineCap='round';ctx.beginPath();var d=windDir;ctx.moveTo(x-100*d,y);ctx.bezierCurveTo(x-60*d,y-35,x+50*d,y-35,x+20*d,y+8);ctx.bezierCurveTo(x+5*d,y+30,x-22*d,y+12,x-5*d,y-2);ctx.stroke();ctx.save();ctx.translate(x+35,y-12);ctx.rotate(G.time*5+i);oval134(0,0,11,4,'#a9ce75');ctx.strokeStyle='#648744';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.stroke();ctx.restore();}ctx.restore();}
    if(G.selected133&&G.selected133.body){var q=G.drag134||basketFruit160(G,G.selected133)||G.selected133.body.position;ctx.save();ctx.strokeStyle='#fff3a0';ctx.lineWidth=5;ctx.beginPath();ctx.arc(q.x,q.y,G.r*1.15,0,7);ctx.stroke();if(G.drag134)drawSpr(kindImg(G.selected133),q.x,q.y,G.r*DRAW_K,0,.85);ctx.restore();}
    if(G.freezeUntil>G.time){ctx.fillStyle='#c8f5ff';ctx.font='bold 32px sans-serif';ctx.textAlign='center';ctx.fillText('❄ '+Math.ceil(G.freezeUntil-G.time),W/2,G.topY+35);}
    drawDefense150();
    // particles + fx
    G.parts.forEach(function (p) { ctx.globalAlpha = 1 - p.t / p.life; ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(p.x,p.y,p.s*.75,p.s*1.35,Math.atan2(p.vy,p.vx)-Math.PI/2,0,7); ctx.fill(); }); ctx.globalAlpha = 1;
    G.fx.forEach(function (f) { var k = f.t / f.dur, im = IMG.el[f.img]; ctx.globalAlpha = 1 - k * k; var sz = f.size * (0.5 + k * .8); if (!im || !im.complete || !im.naturalWidth) return; var h = sz * im.height / im.width; ctx.drawImage(im, f.x - sz / 2, f.y - h / 2, sz, h); }); ctx.globalAlpha = 1;
    // Decorative basket below the physical channel; never changes collision capacity.
    drawBasketFront170(G);
    // overflow warning, including the last free slot
    if (G.comboShow>0 && G.state==='play') {
      ctx.save();ctx.globalAlpha=Math.min(1,G.comboShow*3);ctx.font='900 34px sans-serif';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#94551b';ctx.fillStyle='#fff3a0';
      var txt=(save.lang==='ar'?'كومبو ×':'COMBO ×')+G.combo+(G.comboReward?'  +2':'');
      var yy=G.mouthY-G.r*3.5-(1.15-G.comboShow)*22;ctx.strokeText(txt,W/2,yy);ctx.fillText(txt,W/2,yy);ctx.restore();
    }
    if (G.grace166 != null && G.state === 'play') {
      var gs=Math.ceil(G.grace166), gx=G.chR+G.r*2.1, gy=G.mouthY+G.r*1.6, pr=G.r*.95, fr=clamp(G.grace166/GRACE_S166,0,1), warn=G.grace166<5;
      ctx.save();ctx.fillStyle=warn?'rgba(176,30,20,.92)':'rgba(120,64,18,.92)';ctx.beginPath();ctx.arc(gx,gy,pr,0,7);ctx.fill();
      ctx.strokeStyle='#ffe3a1';ctx.lineWidth=Math.max(3,pr*.16);ctx.beginPath();ctx.arc(gx,gy,pr*.82,-Math.PI/2,-Math.PI/2+Math.PI*2*fr);ctx.stroke();
      ctx.fillStyle='#fff5d5';ctx.font='bold '+Math.round(pr*1.0)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='ltr';ctx.fillText(String(gs),gx,gy+pr*.04);ctx.restore();
    }
    if ((G.fullT > 0.05 || G.stackNow >= G.cfg.cap-1) && G.state === 'play') {
      // Keep the capacity warning, but never draw a crossbar across the fruit path.
      ctx.save();ctx.strokeStyle='rgba(255,166,50,'+(.65+.20*Math.sin(G.time*7))+')';ctx.lineWidth=5;ctx.lineCap='round';
      [G.chL-3,G.chR+3].forEach(function(x){ctx.beginPath();ctx.moveTo(x,G.mouthY+5);ctx.lineTo(x,G.mouthY+G.r*1.15);ctx.stroke();});ctx.restore();
    }
  }


  function oval134(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();}
  function gloss135(x,y,rx,ry,light,dark){var g=ctx.createRadialGradient(x-rx*.3,y-ry*.4,1,x,y,Math.max(rx,ry));g.addColorStop(0,light);g.addColorStop(1,dark);oval134(x,y,rx,ry,g);}
  function drawFalcon134(t){ctx.save();ctx.scale(1.35,1.35);var flap=Math.sin(t*1.6)*.42;for(var d of [-1,1]){ctx.save();ctx.scale(d,1);ctx.rotate(flap);for(var i=0;i<7;i++){ctx.save();ctx.translate(18+i*9,-12-i*2);ctx.rotate(-.5+i*.10);gloss135(0,0,9,31-i*1.4,'#c38c52','#4d2d20');ctx.restore();}gloss135(27,-5,29,17,'#e2b16d','#704024');ctx.restore();}gloss135(0,28,13,22,'#a67b4c','#513122');gloss135(0,4,24,31,'#d6a36a','#684022');gloss135(5,10,15,24,'#fff0ce','#bd905a');gloss135(13,-20,23,21,'#f5dfb5','#9b6b3e');oval134(23,-22,9,8,'#70452a');oval134(25,-23,5,6,'#201b18');oval134(27,-25,2,2,'#fff');ctx.fillStyle='#edac38';ctx.beginPath();ctx.moveTo(30,-19);ctx.quadraticCurveTo(49,-19,43,-5);ctx.lineTo(35,-11);ctx.closePath();ctx.fill();ctx.strokeStyle='#b87725';ctx.lineWidth=3;ctx.lineCap='round';for(var x of [-8,10]){ctx.beginPath();ctx.moveTo(x,27);ctx.lineTo(x,39);ctx.quadraticCurveTo(x+9,38,x+7,46);ctx.stroke();}ctx.restore();}
  function drawMonkey134(t){ctx.save();ctx.scale(1.35,1.35);var swing=Math.sin(t*12);ctx.strokeStyle='#754226';ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-15,23);ctx.bezierCurveTo(-55,45,-60,-12,-40,-17);ctx.stroke();for(var d of [-1,1]){ctx.save();ctx.translate(d*13,29);ctx.rotate(d*swing*.5);gloss135(0,9,9,17,'#b67b49','#63351f');gloss135(4,22,12,7,'#e7b27d','#996039');ctx.restore();}gloss135(0,17,25,29,'#b77c4d','#63351f');gloss135(3,19,15,19,'#f5cf9c','#b87c49');for(var d of [-1,1]){gloss135(d*27,-15,14,16,'#b97c4d','#704026');gloss135(d*28,-15,8,10,'#f2b98b','#a96843');}gloss135(0,-16,30,29,'#c58b54','#6b3c24');gloss135(0,-9,23,21,'#ffe0b0','#c48a58');for(var d of [-1,1]){oval134(d*10,-18,7,9,'#fff8e8');oval134(d*10+2,-17,4,6,'#32231b');oval134(d*10+3,-20,1.5,2,'#fff');}oval134(2,-5,5,3,'#8e563b');ctx.strokeStyle='#854c32';ctx.lineWidth=2;ctx.beginPath();ctx.arc(2,0,10,.15,Math.PI-.15);ctx.stroke();ctx.save();ctx.translate(17,8);ctx.rotate(t<1.5?-.35+swing*.45:-.6);gloss135(15,5,20,8,'#c58b54','#704026');gloss135(32,5,9,8,'#f4c48d','#b47a4d');ctx.restore();ctx.restore();}
  // VC156: approved basket artwork. Real collector floor remains aligned to its mouth.
  function basketGeometry158(g){
    // VC165: small basket just under the channel end (about 1.9x the channel width) like the original.
    var r=g.r,w=Math.min(W*.43,g.cw*1.9),h=w*.618;
    return {w:w,h:h,y:g.floorY-h*.19+r*.12};   // VC170: the lid is at floor level; fruit rests on top of the basket instead of inside it
  }
  function boardStretch162(g){
    if(!g||g.demo)return 1;
    var b=basketGeometry158(g), bottom=b.y+b.h*1.065, target=g.dockY-16;
    return clamp((target-g.topY)/Math.max(1,bottom-g.topY),.96,1.27);
  }
  function drawReserveBasket162(e,im,x,y,r){
    var art=IMG.ui.basket160,z=boardStretch162(G),w=r*2.45,h=w*.618,by=-r*.22;
    ctx.save();ctx.translate(x,y);ctx.scale(1,1/z);
    if(art&&art.complete&&art.naturalWidth){
      ctx.drawImage(art,-w/2,by,w,h);
      // Actual fruit stays in the small wicker basket, behind its front rim.
      ctx.save();ctx.scale(1,z);drawSpr(im,0,(by+h*.06)/z,r*1.52,0,1);ctx.restore();
      ctx.save();ctx.beginPath();ctx.moveTo(-w*.49,by+h*.27);ctx.bezierCurveTo(-w*.32,by+h*.48,w*.32,by+h*.48,w*.49,by+h*.27);ctx.lineTo(w*.51,by+h);ctx.lineTo(-w*.51,by+h);ctx.closePath();ctx.clip();ctx.drawImage(art,-w/2,by,w,h);ctx.restore();
    }else{
      ctx.fillStyle='#8a5125';ctx.beginPath();ctx.ellipse(0,by+h*.20,w*.48,h*.20,0,0,7);ctx.fill();
      ctx.save();ctx.scale(1,z);drawSpr(im,0,by/z,r*1.52,0,1);ctx.restore();
      ctx.fillStyle='#c58a43';ctx.beginPath();ctx.moveTo(-w*.47,by+h*.22);ctx.quadraticCurveTo(-w*.34,by+h,0,by+h);ctx.quadraticCurveTo(w*.34,by+h,w*.47,by+h*.22);ctx.quadraticCurveTo(0,by+h*.55,-w*.47,by+h*.22);ctx.fill();
    }
    var bw=w*.41,bh=h*.22,yy=by+h*.635;
    ctx.fillStyle='#744318';ctx.strokeStyle='#ffcf75';ctx.lineWidth=Math.max(1.6,r*.06);ctx.beginPath();ctx.roundRect(-bw/2,yy,bw,bh,bh*.45);ctx.fill();ctx.stroke();ctx.fillStyle='#fff6dc';ctx.font='bold '+Math.round(r*.49)+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(e.plate.length+1,0,yy+bh*.5);ctx.restore();
  }
  function chuteScale163(g,p){
    if(Math.abs(p.x-W/2)>g.cw*.5)return 1;
    var t=clamp((p.y-g.mouthY+g.r*.25)/(g.r*1.5),0,1);
    // Compensate the expanded vertical camera spacing without widening past the chute.
    return 1+Math.min(.13,Math.max(0,boardStretch162(g)-1)) * t;
  }
  function basketFruit160(g,e){
    // VC165: fruit keeps its real physics position; it is only drawn between the basket's back and front rim.
    var p=e.body.position,r=g.r,b=basketGeometry158(g);
    return null;   // VC170: fruit stays above the lid and is drawn by the normal fruit pass
  }
  // VC164: quiet sand decoration beside the channel and basket. Purely visual: no bodies, no input, no collision.
  function drawSand164(g){
    if(!g||g.demo)return;
    var r=g.r,b=basketGeometry158(g),cx=W/2,half=b.w*.5,top=g.mouthY+r*1.7,bot=b.y+b.h*1.0;
    function pebble(x,y,rx,ry,c1,c2){ctx.fillStyle='rgba(98,58,20,.16)';ctx.beginPath();ctx.ellipse(x+rx*.15,y+ry*.55,rx*1.05,ry*.55,0,0,7);ctx.fill();var gr=ctx.createRadialGradient(x-rx*.3,y-ry*.4,1,x,y,Math.max(rx,ry));gr.addColorStop(0,c1);gr.addColorStop(1,c2);ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();}
    function tuft(x,y,s){ctx.strokeStyle='rgba(96,142,48,.75)';ctx.lineWidth=Math.max(1.6,r*.07);ctx.lineCap='round';for(var k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(x+k*s*.28,y);ctx.quadraticCurveTo(x+k*s*.5,y-s*.55,x+k*s*.85,y-s*(.95-.12*Math.abs(k)));ctx.stroke();}}
    ctx.save();ctx.beginPath();ctx.rect(0,top,W,Math.max(0,bot-top+r));ctx.clip();
    [-1,1].forEach(function(d){
      var edge=g.cw*.5+r*1.1,wide=half+r*.5;
      tuft(cx+d*(edge+r*1.2),top+r*.9,r*.5);
      tuft(cx+d*(edge+r*3.1),top+r*2.7,r*.42);
      pebble(cx+d*(edge+r*.9),top+r*2.5,r*.34,r*.2,'#e7cd98','#bd9a5e');
      pebble(cx+d*(edge+r*2.3),top+r*1.6,r*.24,r*.15,'#ead6a6','#c4a366');
      pebble(cx+d*(wide+r*.7),b.y+b.h*.72,r*.42,r*.24,'#e3c68e','#b8934f');
      pebble(cx+d*(wide+r*1.9),b.y+b.h*.9,r*.3,r*.18,'#ead3a0','#c09d5f');
      tuft(cx+d*(wide+r*2.6),b.y+b.h*.62,r*.46);
      pebble(cx+d*(wide+r*3.3),b.y+b.h*.8,r*.22,r*.14,'#e5cb96','#bb9758');
    });
    ctx.restore();
  }
  var GRACE_S166 = 15;
  function drawBasket(g) {
    var im=IMG.ui.basket160,r=g.r,b=basketGeometry158(g),w=b.w,h=b.h,y=b.y;
    ctx.save();ctx.translate(W/2,y);
    ctx.fillStyle='rgba(103,58,15,.19)';ctx.beginPath();ctx.ellipse(0,h*.98,w*.46,h*.08,0,0,Math.PI*2);ctx.fill();
    var loaded=im&&im.complete&&im.naturalWidth;
    if(loaded)ctx.drawImage(im,-w/2,0,w,h);
    else {ctx.fillStyle='#bb8342';ctx.beginPath();ctx.moveTo(-w*.49,h*.18);ctx.lineTo(w*.49,h*.18);ctx.lineTo(w*.35,h*.89);ctx.quadraticCurveTo(0,h*1.10,-w*.35,h*.89);ctx.closePath();ctx.fill();ctx.fillStyle='#70401a';ctx.beginPath();ctx.ellipse(0,h*.18,w*.47,h*.16,0,0,Math.PI*2);ctx.fill();}
    // VC169: closed wicker lid over the opening, hinged at the back; it opens while a pair is dropped in.
    (function(){var o=clamp(g.lid166||0,0,1),eo=o*o*(3-2*o),rx=w*.47,ry0=h*.15,back=h*.19-ry0,ry=ry0*(1-.86*eo),cy=back+ry;
      ctx.save();var lg=ctx.createLinearGradient(0,cy-ry,0,cy+ry);lg.addColorStop(0,'#d9a35c');lg.addColorStop(1,'#a8692b');
      ctx.fillStyle=lg;ctx.strokeStyle='#6b3d16';ctx.lineWidth=Math.max(2,w*.012);ctx.beginPath();ctx.ellipse(0,cy,rx,Math.max(1.5,ry),0,0,Math.PI*2);ctx.fill();ctx.stroke();
      if(ry>ry0*.4){ctx.strokeStyle='rgba(107,61,22,.45)';ctx.lineWidth=Math.max(1.2,w*.007);for(var k=-3;k<=3;k++){ctx.beginPath();ctx.ellipse(0,cy,Math.abs(k)*rx/3.4+1,Math.max(1,ry*Math.abs(k)/3.4),0,0,Math.PI*2);if(k>0)ctx.stroke();}
        for(var m=-4;m<=4;m++){ctx.beginPath();ctx.moveTo(m*rx/4.6,cy-ry*Math.sqrt(Math.max(0,1-Math.pow(m/4.6,2))));ctx.lineTo(m*rx/4.6,cy+ry*Math.sqrt(Math.max(0,1-Math.pow(m/4.6,2))));ctx.stroke();}}
      ctx.restore();})();
    ctx.restore();
  }
  // VC170: pair that matched rises a little, the lid opens, then it drops into the basket behind the front rim.
  function drawBasketFront170(g) {
    var im=IMG.ui.basket160,r=g.r,b=basketGeometry158(g),w=b.w,h=b.h,y=b.y;
    var loaded=im&&im.complete&&im.naturalWidth;
    ctx.save();ctx.translate(W/2,y);
    if(g.collecting)g.collecting.forEach(function(cp){var t=clamp(cp.t/cp.dur,0,1);cp.items.forEach(function(e,i){
      var side=i?1:-1,sx0=e.x-W/2,sy0=e.y-y,rise=clamp(t/.34,0,1),rz=rise*rise*(3-2*rise),dk=clamp((t-.34)/.5,0,1),dz=dk*dk*(3-2*dk);
      var topX=sx0+(side*r*.55-sx0)*rz, topY=sy0-r*.8*rz, inX=side*r*.5, inY=h*.34;
      var xx=dk>0?topX+(inX-topX)*dz:topX, yy=dk>0?topY+(inY-topY)*dz:topY;
      var sc=(1+.08*Math.sin(Math.min(1,t/.34)*Math.PI))*(1-.12*dz), al=1-clamp((t-.86)/.14,0,1);
      drawSpr(kindImg(e),xx,yy,r*DRAW_K*sc,e.angle*(1-dz)+dz*side*.25,al);});});
    // Foreground is the actual curved front rim: lower portions of fruit are naturally occluded.
    if(loaded){ctx.save();ctx.beginPath();ctx.moveTo(-w*.47,h*.30);ctx.bezierCurveTo(-w*.36,h*.46,w*.36,h*.46,w*.47,h*.30);ctx.lineTo(w*.53,h*1.03);ctx.lineTo(-w*.53,h*1.03);ctx.closePath();ctx.clip();ctx.drawImage(im,-w/2,0,w,h);ctx.restore();}
    // Replace the artwork's original static label completely with the live progress counter.
    var bw=w*.66,bh=h*.34,by=h*.58;
    var bg=ctx.createLinearGradient(0,by,0,by+bh);bg.addColorStop(0,'#855326');bg.addColorStop(1,'#5e3517');ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(-bw/2,by,bw,bh,bh*.46);ctx.fill();ctx.strokeStyle='#ffce76';ctx.lineWidth=Math.max(2,w*.008);ctx.stroke();
    var ctr=Math.max(0,g.total-g.remaining)+' / '+g.total;ctx.font='bold '+Math.max(12,Math.min(Math.floor(bh*.62),Math.floor(bw*.9/(ctr.length*.6))))+'px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='ltr';ctx.fillStyle='#fff5d5';ctx.fillText(ctr,0,by+bh*.52);ctx.restore();
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
    var rr = 30, bottom = g.slopeTopY - 30;
    for (var y = 150; y < bottom; y += 90) {
      for (var side = 0; side < 2; side++) {
        var x = side ? W : 0;
        var gr = ctx.createRadialGradient(x, y, 4, x, y, rr); gr.addColorStop(0, '#f1c27e'); gr.addColorStop(1, '#c98a4a');
        ctx.fillStyle = gr; ctx.strokeStyle = '#7a4a1e'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = 'rgba(120,70,25,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, rr * .66, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, rr * .32, 0, 7); ctx.stroke();
      }
    }
  }
  function drawSpr(im, x, y, size, rot, alpha) {
    if (!im || !im.complete || !im.naturalWidth) return; var h = size * im.height / im.width, w = size;
    var m = Math.max(w,h); if (m > size) { w = w * size / m; h = h * size / m; }
    ctx.save(); ctx.translate(x, y); ctx.scale(1,1/boardStretch162(G)); if (rot) ctx.rotate(rot); if (alpha < 1) ctx.globalAlpha = alpha; ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
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
  function drawScenery(th) {
    var g=G, idx=g.cfg.world, sky=IMG.world['sky'+idx], soil=IMG.world['soil'+idx];
    if(!sky || !sky.complete || !sky.naturalWidth || !soil || !soil.complete || !soil.naturalWidth) return false;
    var key=[H,idx,g.chL,g.mouthY,g.floorY,g.slopeTopY,g.slopeRightY].join(':');
    if(!sceneryCache || sceneryCache.key!==key){
      var c=document.createElement('canvas'); c.width=W;c.height=H;
      var q=c.getContext('2d'),yl=g.slopeTopY,yr=g.slopeRightY,y=Math.min(yl,yr),m=g.mouthY,l=g.chL,r=g.chR,f=g.floorY,sh=m+12;
      var sw=sky.naturalWidth,hh=sh,sy0=0;
      if(sy0>0)q.drawImage(sky,0,0,sw,1,0,0,W,sy0+1);
      q.drawImage(sky,0,sy0,W,hh);q.fillStyle='rgba(255,250,225,.025)';q.fillRect(0,0,W,sh);q.fillStyle=th.hill[1];q.fillRect(0,Math.max(sh,sy0+hh),W,H-Math.max(sh,sy0+hh));
      q.save();q.beginPath();q.moveTo(0,yl);q.lineTo(l,m);q.lineTo(l,f);q.lineTo(r,f);q.lineTo(r,m);q.lineTo(W,yr);q.lineTo(W,H);q.lineTo(0,H);q.closePath();q.clip();
      q.fillStyle='#f6d18f';q.fillRect(0,y,W,H-y);q.save();q.globalAlpha=.20;q.drawImage(soil,0,y,W,H-y);q.restore();
      var shade=q.createLinearGradient(0,y,0,H);shade.addColorStop(0,'rgba(255,236,180,.62)');shade.addColorStop(.55,'rgba(242,191,116,.20)');shade.addColorStop(1,'rgba(196,129,58,.22)');q.fillStyle=shade;q.fillRect(0,y,W,H-y);
      function line(col,width,dy){q.strokeStyle=col;q.lineWidth=width;q.lineJoin='round';q.lineCap='round';q.beginPath();q.moveTo(0,yl+dy);q.lineTo(l,m+dy);q.moveTo(r,m+dy);q.lineTo(W,yr+dy);q.stroke();}
      line('rgba(73,40,13,.48)',30,15);line('#276d17',24,9);line(th.grass,17,5);line(th.grassHi,6,2);
      for(var side=0;side<2;side++)for(var i=0;i<28;i++){var t=(i+.3)/28,x=side?r+(W-r)*t:l*t,yy=groundY(g,x);q.strokeStyle=i%3===0?th.grassHi:th.grass;q.lineWidth=2.5;q.beginPath();q.moveTo(x,yy+12);q.lineTo(x+(i%2?4:-4),yy+2);q.stroke();}
      q.strokeStyle='rgba(75,45,13,.35)';q.lineWidth=8;q.beginPath();q.moveTo(l,m);q.lineTo(l,f);q.lineTo(r,f);q.lineTo(r,m);q.stroke();q.restore();
      q.save();q.beginPath();q.rect(l,m,g.cw,Math.max(0,f-m));q.clip();var ch=q.createLinearGradient(l,0,r,0);q.fillStyle='#e6a338';q.fillRect(l,m,g.cw,f-m);q.globalAlpha=.20;q.drawImage(soil,l,m,g.cw,f-m);q.globalAlpha=1;ch.addColorStop(0,'#a95c18');ch.addColorStop(.13,'#e5a044');ch.addColorStop(.45,'#ffdf83');ch.addColorStop(.85,'#e8a947');ch.addColorStop(1,'#a9621c');q.fillStyle=ch;q.fillRect(l,m,g.cw,f-m);
      q.strokeStyle='rgba(255,245,155,.45)';q.lineWidth=Math.max(3,g.cw*.075);q.lineJoin='round';q.lineCap='round';for(var ay=m+g.cw*.65;ay<f-g.cw*.35;ay+=g.cw*.95){q.beginPath();q.moveTo(l+g.cw*.24,ay-g.cw*.12);q.lineTo((l+r)/2,ay+g.cw*.12);q.lineTo(r-g.cw*.24,ay-g.cw*.12);q.stroke();}/* VC163: continuous chute, no painted slot dividers. */q.restore();
      sceneryCache={key:key,canvas:c};
    }
    ctx.drawImage(sceneryCache.canvas,0,0);
    ctx.save();ctx.globalAlpha=.09;ctx.fillStyle='#ffffff';g.clouds.forEach(function(c){var yy=100+c.y*.7;ctx.beginPath();ctx.ellipse(c.x,yy,65*c.s,12*c.s,0,0,7);ctx.fill();});ctx.restore();return true;
  }

  function drawGround(th) {
    var g = G, floor = g.floorY;
    // soil polygon (the channel is a notch cut from it)
    var sg = ctx.createLinearGradient(0, Math.min(g.slopeTopY,g.slopeRightY), 0, H); sg.addColorStop(0, th.soil[0]); sg.addColorStop(1, th.soil[1]);
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(-10, g.slopeTopY - 10); ctx.lineTo(0, g.slopeTopY); ctx.lineTo(g.chL, g.mouthY); ctx.lineTo(g.chL, floor); ctx.lineTo(g.chR, floor); ctx.lineTo(g.chR, g.mouthY); ctx.lineTo(W, g.slopeRightY); ctx.lineTo(W + 10, g.slopeRightY - 10); ctx.lineTo(W + 10, H + 10); ctx.lineTo(-10, H + 10); ctx.closePath(); ctx.fill();
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
    function edge(col, w, dy) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(-10, g.slopeTopY - 10 + dy); ctx.lineTo(0, g.slopeTopY + dy); ctx.lineTo(g.chL, g.mouthY + dy); ctx.lineTo(g.chL, g.mouthY + 70 + dy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(g.chR, g.mouthY + 70 + dy); ctx.lineTo(g.chR, g.mouthY + dy); ctx.lineTo(W, g.slopeRightY + dy); ctx.lineTo(W + 10, g.slopeRightY - 10 + dy); ctx.stroke(); }
    edge(th.grass, 22, 6); edge(th.grassHi, 7, -1);
    // channel floor rim
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(g.chL, floor - 4, g.cw, 10);
    // slot marks to show capacity
    /* VC163: no painted dividers in fallback renderer. */
  }

  /* ---------------- UI wiring ---------------- */
  function show(id) { ['sSplash', 'sMenu', 'sLevels','sModes155'].forEach(function (s) { $(s).classList.toggle('hidden', s !== id); }); screen = id; $('hud').classList.add('hidden'); }
  function updateCoins() { $('coinsTxt').textContent = save.coins; $('menuCoins').textContent = save.coins; }
  function totalStars() { var s = 0; for (var k in save.stars) s += save.stars[k]; return s; }
  function updateCounter() { var c = G ? Math.max(0, G.remaining) : 0; if ($('cntTxt').textContent != c) $('cntTxt').textContent = c; }
  function bumpCounter() { var el = $('counter'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); updateCounter(); }
  function updateSoundIcons() { var src = 'assets/ui/' + (save.sound ? 'sound_on' : 'sound_off') + '.png'; $('soundImgM').src = src; $('soundImgP').src = src; $('setSound').checked = !!save.sound; $('setVib').checked = !!save.vib; }

  function showMenu() {
    mode = 'menu'; mode155='classic'; hideAllPopups(); show('sMenu');
    $('menuLvl').textContent = save.unlocked; $('menuStars').textContent = totalStars(); updateCoins();
    startDemo();
  }
  function startDemo() { var n = Math.max(1, Math.min(save.unlocked, 12)); G = buildLevel(Math.max(2, n), true); }
  function startLevel(n,variant) {
    if(typeof variant==='string')mode155=variant;
    hideAllPopups(); mode = 'play'; n = Math.max(1, Math.min(LV.MAX_LEVEL, n | 0));
    G = buildLevel(n, false); G.state = 'play';if(G.variant155==='classic'&&G.assist155>=5&&!G.cfg.defense152.length){extendChannel(1);G.powerUsed++;}positionRails154();$('def149_panel').classList.add('hidden');showCut147();
    show(null); ['sSplash', 'sMenu', 'sLevels'].forEach(function (s) { $(s).classList.add('hidden'); });
    $('hud').classList.remove('hidden'); $('lvlTxt').textContent = n; updateCoins(); updateCounter();refreshMode155();
    $('cntIcon').src = 'assets/fruits/' + FR[(n * 3) % Math.min(FR.length, 8)].n + '.png';
    var h = $('hint'); h.classList.add('hidden');
    if (n === 1) showHint('hint1', 6000); else if (n === 2) showHint('hint2', 6000);
    else if (n === 8) showHint('hintLock', 5500); else if(n===16)showHint('hintIce',5500); else if (G.cfg.bomb && n === 45) showHint('hintBomb', 5000);
  }
  var hintT = null, actionHintsSeen = {};
  function showActionHint(key) {
    // Explain an action once per session, without interrupting tutorial text.
    if(actionHintsSeen[key])return;
    var h=$('hint');if(!h.classList.contains('hidden'))return;
    actionHintsSeen[key]=true;showHint(key,1200);
  }
  function showHint(key, ms) { var h = $('hint'); hintAnchor164(); h.textContent = t(key); h.classList.remove('hidden'); clearTimeout(hintT); hintT = setTimeout(function () { h.classList.add('hidden'); }, ms || 3500); }
  function hideAllPopups() { ['pPause', 'pWin', 'pLose', 'pSettings', 'pAd','pChallenge155'].forEach(function (p) { $(p).classList.add('hidden'); }); }

  var TEST_ALL_LEVELS = true; // VC125 internal testing only; never modifies saved unlocks
  function buildLevelGrid() {
    var grid = $('levelGrid'); grid.innerHTML = '';
    for (var i = 1; i <= LV.MAX_LEVEL; i++) {
      var b = document.createElement('button'); b.className = 'lv' + (i === save.unlocked ? ' cur' : '') + (!TEST_ALL_LEVELS && i > save.unlocked ? ' lock' : '');
      if (!TEST_ALL_LEVELS && i > save.unlocked) b.innerHTML = '<img src="assets/ui/lock.png" alt="">';
      else { var st = save.stars[i] || 0; b.innerHTML = i + '<div class="s">' + [1, 2, 3].map(function (k) { return '<img class="' + (k <= st ? '' : 'off') + '" src="assets/el/star.png" alt="">'; }).join('') + '</div>'; }
      (function (n) { b.addEventListener('click', function () { if (TEST_ALL_LEVELS || n <= save.unlocked) { SFX.click(); startLevel(n,'classic'); } else toast(save.lang === 'ar' ? 'خلّص المراحل اللي قبلها الأول' : 'Finish earlier levels first'); }); })(i);
      grid.appendChild(b);
    }
    var cur = grid.children[Math.max(0, save.unlocked - 1)]; if (cur) setTimeout(function () { cur.scrollIntoView({ block: 'center' }); }, 30);
  }

  function bind(id, fn) { var el = $(id); el.addEventListener('click', function (ev) { audio(); fn(ev); }); }
  function initUI() {
    bind('btnPlay', function () { SFX.click(); startLevel(save.unlocked,'classic'); });
    bind('btnLevels', function () { SFX.click(); show('sLevels'); buildLevelGrid(); });
    bind('btnLevelsBack', function () { SFX.click(); showMenu(); });
    bind('btnModes',function(){show('sModes155');$('records155').textContent=(save.lang==='ar'?'أفضل سرعة: ':'Best speed: ')+Math.max(0,...Object.keys(save.records155).filter(k=>k.startsWith('speed_')).map(k=>save.records155[k].best||0));});
    bind('modesBack155',showMenu);bind('classic155',()=>startLevel(save.unlocked,'classic'));bind('timed155',()=>startLevel(save.unlocked,'timed'));bind('speed155',()=>startLevel(Math.max(51,save.unlocked),'speed'));bind('action155',()=>startLevel(Math.max(21,save.unlocked),'action'));bind('challengeRetry155',()=>startLevel(G.n,G.variant155));bind('challengeHome155',showMenu);
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
    function rescue() {
      if(!G || G.state!=='lost')return;
      $('pLose').classList.add('hidden');G.state='play';G.fullT=0;G.grace166=null;G.overflowSeen=false;G.deadT=0;G.deadlock=false;G.powerUsed++;G.combo=0;G.lastMatch=null;
      for(var i=0;i<3;i++)doTrashSilent();bumpCounter();SFX.power();
    }
    bind('lCoins',function(){if(!G||G.state!=='lost')return;if(!channelFruits().length){toast(save.lang==='ar'?'مفيش فاكهة في المجرى للإنقاذ':'No fruit in the channel to rescue');return;}persist();updateCoins();rescue();});
    bind('lAd', function () { var current=G;showAd(function(){if(G===current)rescue();}); });
    Object.keys(DEF149).forEach(k=>{bind('def149_'+k,()=>useDefense149(k));bind('buy149_'+k,()=>buyDefense149(k));});
    bind('def149_shop',()=>{$('def149_panel').classList.toggle('hidden');refreshDefense149(true);});bind('def149_close',()=>$('def149_panel').classList.add('hidden'));
    // Public manual action trigger removed; internal QA API retained.
    ['hand','swap','freeze','blast'].forEach(k=>bind('pu_'+k,()=>arm133(k)));
    cv.addEventListener('pointermove',function(ev){if(G&&G.help133==='hand'&&G.selected133)G.drag134=toLogical(ev);});cv.addEventListener('pointercancel',function(){if(G){G.selected133=null;G.drag134=null;}});cv.addEventListener('pointerup',function(ev){if(G&&G.help133==='hand'&&G.selected133){var p=toLogical(ev);if(p.y<G.mouthY)hand133(G.selected133,p.x,p.y);G.selected133=null;G.drag134=null;}});
    bind('puTrash', function () { payFor('trash', doTrash); }); bind('puPlus', function () { payFor('plus', doPlus); }); bind('puShuffle', function () { payFor('shuffle', doShuffle); });

    // VC125: one primary pointer-down selects at most one fruit.
    function toLogical(ev) { var vh = window.innerHeight; var y=(ev.clientY-(vh-H*scale)/2)/scale,anchor=G?G.topY:0;return {x:ev.clientX/scale,y:anchor+(y-anchor)/boardStretch162(G)}; }
    function act(ev, first) {
      if (!G || mode !== 'play' || G.state !== 'play') return;
      var p = toLogical(ev);
      if(first&&hazardTap144(p.x,p.y))return;
      if(first&&monkeyTap142(p.x,p.y))return;
      if(G.help133==='hand'){G.selected133=hit133(p.x,p.y);if(G.selected133&&cv.setPointerCapture)cv.setPointerCapture(ev.pointerId);return;}
      if(G.help133==='swap'){if(!G.selected133)G.selected133=hit133(p.x,p.y);else swap133(G.selected133,G.hang.find(e=>eligible133(e)&&Math.hypot(e.x-p.x,e.y-p.y)<G.r));return;}
      if (first) {
        if (G.bird && (G.bird.state === 'fly' || G.bird.state === 'carry' || G.bird.state === 'warn') && G.bird.state !== 'warn') { var dx = p.x - G.bird.x, dy = p.y - G.bird.y; if (dx * dx + dy * dy < 90 * 90) { scareBird(); return; } }
        for (var i = 0; i < G.bees.length; i++) { var b = G.bees[i], bx = p.x - b.x, by = p.y - b.y; if (b.state!=='leave' && bx * bx + by * by < 70 * 70) { if(b.phase)return; if(b.target){b.target.beeReserved=false;b.target.taken=false;b.target.stung=false;}if(b.second){b.second.beeReserved=false;b.second.taken=false;b.second.stung=false;} b.state = 'leave'; SFX.power(); if(G.variant155==='classic'){save.coins += 2; persist(); updateCoins();} return; } }
        G.gesture = 0;
      }
      if (G.gesture >= 1) return;
      if(G.freezeUntil>G.time)return;
      if (releaseAt(p.x, p.y)) G.gesture++;
    }
    cv.addEventListener('pointerdown', function (ev) { if (ev.isPrimary === false || (ev.button != null && ev.button !== 0)) return; audio(); act(ev, true); });
  }

  /* ---------------- main loop ---------------- */
  function frame(ts) {
    var dt = Math.min(0.05, (ts - lastT) / 1000 || 0.016); lastT = ts;
    update(dt); render(); requestAnimationFrame(frame);
  }

  window.ZF = {
    back: function () { // Android back button
      if (!$('pAd').classList.contains('hidden')) return 'ok';
      var ps = ['pSettings', 'pPause', 'pWin', 'pLose','pChallenge155']; for (var i = 0; i < ps.length; i++) if (!$(ps[i]).classList.contains('hidden')) { if (ps[i] === 'pSettings') $('pSettings').classList.add('hidden'); else if (ps[i] === 'pPause') { $('pPause').classList.add('hidden'); if (G) G.state = 'play'; } else showMenu(); return 'ok'; }
      if (screen === 'sLevels'||screen==='sModes155') { showMenu(); return 'ok'; }
      if (mode === 'play') { if (G && G.state === 'play') { G.state = 'paused'; $('pPause').classList.remove('hidden'); } return 'ok'; }
      return 'exit';
    },
    // test helpers
    get G() { return G; }, isVisible: function(e){return !!G && visibleFruit(G,e);}, scare: scareBird, start: startLevel, release: releaseFruit, save: save, menu: showMenu,
    advance: function (sec) { var n = Math.round(sec * 60); for (var i = 0; i < n; i++) update(1 / 60); },
    render: render, useDefense149:useDefense149, buyDefense149:buyDefense149, activeDefense149:activeDefense149, cutWeb147:cutWeb147, hazardTap144:hazardTap144, monkeyTap142:monkeyTap142, action134:action134, arm133:arm133, hand133:hand133, swap133:swap133
  };

  function boot() {
    resize(); window.addEventListener('resize', resize); applyLang(); updateSoundIcons(); updateCoins();
    initUI();
    G = buildLevel(2, true); requestAnimationFrame(frame);
    loadAll(function () { setTimeout(function () { showMenu(); }, 450); });
  }
  boot();
})();
