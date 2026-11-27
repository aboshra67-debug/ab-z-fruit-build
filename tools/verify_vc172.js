// VC172: online-mode hooks in the game: same seed = same board, different seed = different board, room timer, wait state, tick, classic untouched.
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const h=fs.readFileSync(root+'/tools/verify_engine_node.js','utf8').split('let solver=')[0].replace("const project=path.resolve(__dirname,'..')","const project='"+root+"'");
eval(h+`
const z=C.ZF;let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('FAIL',m);}};
const sig=()=>JSON.stringify(z.G.hang.map(e=>[e.id,e.kind,Math.round(e.x),Math.round(e.y)]));
let ticks=0;C.window.ZF_ONLINE172={tick:()=>{ticks++;},gameEnded:r=>{C.__ended=r;},gameClosed:()=>{}};
for(const lvl of [10,60,150]){
  z.onlinePrepare(lvl,123456,5000);const a=sig(),gA=z.G;
  ok(gA.variant155==='online'&&gA.state==='wait','online variant, waiting at '+lvl);
  ok(gA.limit155===5,'room timer 5s at '+lvl);
  const t0=gA.time;z.advance(1);ok(gA.time===t0,'no time passes while waiting');
  z.onlinePrepare(lvl,123456,5000);ok(sig()===a,'same seed -> same board at level '+lvl);
  z.onlinePrepare(lvl,654321,5000);ok(sig()!==a,'different seed -> different board at level '+lvl);
  z.menu();z.start(lvl,'classic');const base=sig();z.menu();z.start(lvl,'classic');ok(sig()===base,'classic levels unchanged and deterministic at '+lvl);
}
z.onlinePrepare(10,777,6000);z.onlineGo();ok(z.G.state==='play','go starts play');
ticks=0;z.advance(2);ok(ticks>=100,'progress hook called every frame in play ('+ticks+')');
z.advance(5);ok(C.__ended&&C.__ended.win===false&&C.__ended.reason==='time','time up ends the round as lost (reason time)');
ok(z.G.state==='lost','state lost after time up');
z.onlinePrepare(10,778,60000);z.onlineGo();C.__ended=null;z.G.remaining=0;z.endLevel(true);ok(C.__ended&&C.__ended.win===true&&C.__ended.remaining===0,'win reports remaining 0');
z.menu();ok(z.G.demo===true,'menu returns to demo board and clears online state');
z.start(5,'classic');const c0=z.save.coins;ok(z.G.variant155==='classic'&&z.G.limit155===0,'classic after online has no limit');

// styles: speed/action map onto the existing variants, same seed = same board for each style
for(const st of ['race','speed','action']){
  z.onlinePrepare(60,4242,7000,st);const a=sig(),g=z.G;
  ok(g.online172===st&&g.variant155===(st==='race'?'online':st),'style '+st+' -> variant '+g.variant155);
  ok(g.limit155===7,'room timer overrides the variant limit for '+st+' ('+g.limit155+')');
  ok(g.state==='wait','waiting state for '+st);
  z.onlinePrepare(60,4242,7000,st);ok(sig()===a,'same seed -> same board in style '+st);
  if(st==='action')ok(z.G.cfg.action143.sequence.length>=6,'action events enabled in action style');
}
z.onlinePrepare(60,9,2000,'speed');z.onlineGo();C.__ended=null;z.G.matchScore155=14;z.advance(3);
ok(C.__ended&&C.__ended.score===14&&C.__ended.reason==='time','speed time-up reports the score (reason time)');
z.menu();z.start(5,'speed');ok(!z.G.online172&&z.G.limit155===60,'plain speed challenge unchanged outside online');

console.log(fail?'FAILED '+fail:'PASS VC172 online hooks');process.exit(fail?1:0);
`);
