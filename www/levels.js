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
    var count = evenInt(20 + 4.4 * (n - 1));          // ~20 at lvl 1, ~42 at lvl 6, ~100 at lvl 19, ~200 at lvl 42, 300 from lvl 64
    count = Math.min(count, 300);
    var pairs = count / 2;
    var types = Math.min(5 + Math.floor((n - 1) / 3), 22);
    types = Math.min(types, pairs);
    var cap = 4;                                       // the channel always holds exactly 4 fruits
    var boss = (n >= 20 && n % 10 === 0);
    var cfg = {
      n: n, count: count, types: types, cap: cap, boss: boss,
      world: Math.floor((n - 1) / 20) % 5,
      rMax: 31,
      wood: n >= 6 ? Math.min(5, 1 + Math.floor((n - 6) / 20)) : 0,
      rock: n >= 11 ? Math.min(5, 1 + Math.floor((n - 11) / 24)) : 0,
      mystery: n >= 15 ? Math.min(Math.floor(pairs * 0.15), 1 + Math.floor((n - 15) / 10)) : 0,
      cage: n >= 8 ? Math.min(12, 1 + Math.floor((n - 8) / 10)) : 0,
      bee: n >= 22 ? (n >= 150 ? 2 : 1) : 0,
      bird: n >= 28 ? 1 + Math.floor(n / 90) : 0,
      bomb: n >= 35 ? Math.min(6, 1 + Math.floor((n - 35) / 25)) : 0,
      seed: n * 7919 + 13
    };
    if (boss) { cfg.wood = Math.min(5, cfg.wood + 1); cfg.bomb += 1; cfg.cage += 1; }
    cfg.rng = mulberry32(cfg.seed);
    return cfg;
  }

  window.ZF_LEVELS = { MAX_LEVEL: MAX_LEVEL, gen: genLevel, mulberry32: mulberry32 };
})();
