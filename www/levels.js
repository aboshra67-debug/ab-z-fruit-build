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
    // VC152: seven deterministic progression bands, counts include the offscreen reserve.
    var bands=[[1,20,24,60,0,2,0,0,0,0,0],[21,50,60,100,1,3,1,1,16,24,2],[51,100,100,140,2,4,1,2,14,21,3],[101,150,140,180,3,5,2,3,12,19,4],[151,200,180,220,4,6,2,3,11,17,5],[201,250,220,260,5,7,3,4,10,15,6],[251,300,260,300,6,8,3,4,9,13,7]];
    var band=bands.find(function(b){return n>=b[0]&&n<=b[1];}), u=(n-band[0])/(band[1]-band[0]);
    var count=Math.min(300,evenInt(band[2]+(band[3]-band[2])*u));
    var barrierCount=Math.round(band[4]+(band[5]-band[4])*u);
    var actionCount=Math.round(band[6]+(band[7]-band[6])*u);
    var pairs = count / 2;
    var types = Math.min(6 + Math.floor((n - 1) * 0.58) + (n>=12?2:0), 28);
    types = Math.min(types, pairs, n<=20?6:n<=50?8:n<=100?10:n<=200?14:18);
    if(n>=11&&n<=20)types=Math.min(types,10+Math.floor((n-11)/3));
    var cap = 4;                                       // the channel always holds exactly 4 fruits
    var boss = (n >= 20 && n % 10 === 0);
    var cfg = {
      divider: n>=21 && (n<=30 || (n>=71 && n%4===1)), counter: n>=41 && (n<=50 || (n>=71 && n%4===2)),
      n: n, count: count, types: types, cap: cap, boss: boss,
      difficulty: n <= 10 ? 0 : n <= 30 ? 1 : n <= 60 ? 2 : n <= 100 ? 3 : n <= 200 ? 4 : 5,
      world: Math.floor((n - 1) / 20) % 5,
      layout: n <= 10 ? 0 : n === 11 ? 1 : (n-6)%5,
      rMax: count <= 30 ? 49 : 46,
      wood: n >= 6 ? Math.min(5, 1 + Math.floor((n - 6) / 20)) : 0,
      rock: n >= 11 ? Math.min(5, 1 + Math.floor((n - 11) / 24)) : 0,
      mystery: n >= 15 ? Math.min(Math.floor(pairs * 0.15), 1 + Math.floor((n - 15) / 10)) : 0,
      cage: n >= 8 ? Math.min(12, 1 + Math.floor((n - 8) / 10)) : 0,
      bee: n >= 9 ? (n >= 65 ? 2 : 1) : 0,
      bird: n >= 12 ? Math.min(4,1 + Math.floor(n / 48)) : 0,
      bomb: n >= 25 ? Math.min(7, 1 + Math.floor((n - 25) / 23)) : 0,
      ice: n >= 16 ? Math.min(14, 1 + Math.floor(n / 19)) : 0,
      seed: n * 7919 + 13
    };
    if(n>=31&&n<=40)cfg.rock=Math.min(3,cfg.rock+1);
    if (boss) { cfg.wood = Math.min(5, cfg.wood + 1); cfg.bomb += 1; cfg.cage += 1; }
    if(n<=50){cfg.wood=Math.min(cfg.wood,1);cfg.rock=Math.min(cfg.rock,1);cfg.cage=Math.min(cfg.cage,1);cfg.ice=Math.min(cfg.ice,1);cfg.mystery=0;cfg.bomb=Math.min(cfg.bomb,1);}
    // Count real physical barriers, including the optional divider. Alternate wood and rock.
    cfg.divider=barrierCount>=3 && n>=21 && n%5===0;
    cfg.counter=n>=41 && n%4===2;
    cfg.barrier152=barrierCount;
    var solid=barrierCount-Number(cfg.divider);
    cfg.wood=Math.ceil(solid/2);cfg.rock=solid-cfg.wood;
    // No scheduled attacks in tutorial levels. Every later stage uses a distinct subset.
    // Rotation gives every defense a purpose; ten-level challenges rotate more strongly.
    var pool=['monkey','falcon','bee','wind','spider','vortex'];
    var seq=[],start=(n-21+Math.floor(n/10))%pool.length;
    for(var i=0;i<actionCount;i++)seq.push(pool[(start+i)%pool.length]);
    if(n===21)seq=['monkey'];if(n===22)seq=['falcon'];if(n===23)seq=['bee'];if(n===24)seq=['wind'];if(n===25)seq=['spider'];if(n===26)seq=['vortex'];
    cfg.bee=seq.includes('bee')?1:0;cfg.bird=seq.includes('falcon')?1:0;
    cfg.action143={sequence:seq,first:band[8],interval:band[9],maxAttacks:band[10],monkeyThrows:n<=100?2:3,falconSpeed:n<=50?580:720,windDuration:n<=50?3.5:4.5,windStrength:n<=50?4.2:5.4};
    cfg.hazard144={spider:{duration:n<=100?4.5:6,count:n<=100?3:5},vortex:{duration:1.8,count:n<=100?4:6}};
    cfg.defense152=seq.map(function(k){return {monkey:'cut',spider:'cut',falcon:'shield',bee:'spray',wind:'fan',vortex:'anchor'}[k];}).filter(function(k,i,a){return a.indexOf(k)===i;});
    cfg.rng = mulberry32(cfg.seed);
    return cfg;
  }

  window.ZF_LEVELS = { MAX_LEVEL: MAX_LEVEL, gen: genLevel, mulberry32: mulberry32 };
})();
