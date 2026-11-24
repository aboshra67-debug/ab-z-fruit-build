// Procedural level generator for AB Z Fruit (deterministic per level number)
(function () {
  'use strict';
  var MAX_LEVEL = 300;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function evenInt(x) { x = Math.round(x); return x % 2 ? x + 1 : x; }

  function genLevel(n) {
    n = Math.max(1, Math.min(MAX_LEVEL, n | 0));
    var count = evenInt(8 + 1.45 * (n - 1));          // fruits to clear (about 100 at lvl 65, 200 at lvl 135, 300 at lvl 200+)
    count = Math.min(count, 300);
    var pairs = count / 2;
    var types = Math.min(3 + Math.floor((n - 1) / 6), 18);
    types = Math.min(types, pairs);
    var cap = n < 12 ? 5 : (n < 40 ? 4 : 3);           // how many fruits fit in the channel
    var boss = (n >= 20 && n % 10 === 0);
    var cfg = {
      n: n, count: count, types: types, cap: cap, boss: boss,
      world: Math.floor((n - 1) / 20) % 5,
      rMax: n < 4 ? 40 : 38,
      wood: n >= 8 ? Math.min(4, 1 + Math.floor((n - 8) / 25)) : 0,
      rock: n >= 14 ? Math.min(4, 1 + Math.floor((n - 14) / 30)) : 0,
      mystery: n >= 15 ? Math.min(Math.floor(pairs * 0.15), 1 + Math.floor((n - 15) / 10)) : 0,
      cage: n >= 10 ? Math.min(10, 1 + Math.floor((n - 10) / 12)) : 0,
      bee: n >= 28 ? (n >= 150 ? 2 : 1) : 0,
      bird: n >= 35 ? 1 + Math.floor(n / 90) : 0,
      bomb: n >= 45 ? Math.min(6, 1 + Math.floor((n - 45) / 30)) : 0,
      seed: n * 7919 + 13
    };
    if (boss) { cfg.wood = Math.min(5, cfg.wood + 1); cfg.bomb += 1; cfg.cage += 1; }
    cfg.rng = mulberry32(cfg.seed);
    return cfg;
  }

  window.ZF_LEVELS = { MAX_LEVEL: MAX_LEVEL, gen: genLevel, mulberry32: mulberry32 };
})();
