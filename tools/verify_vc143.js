const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
const assert=(v,m)=>{if(!v)throw Error(m)};
for(let n=1;n<=300;n++){const cfg=C.ZF_LEVELS.gen(n);assert(cfg.action143.sequence.length<=2,'profile '+n);assert(cfg.action143.monkeyThrows>=2,'throw config');}
for(const n of [1,17,20,100,200,300]){
 C.ZF.start(n);let g=C.ZF.G;g.actionAt133=1e6;let count=g.remaining, before=new Map(g.hang.map(e=>[e.id,[e.x,e.y,e.kind,e.pairId]]));C.ZF.action134('monkey');let m=g.monkey134;assert(m,'monkey '+n);let flights=0,was=false;
 for(let i=0;i<750&&g.monkey134;i++){C.ZF.advance(1/60);if(m.phase==='throw'&&!was){flights++;assert(m.flight.dest.monkeyDest143,'dest lock');assert(!C.ZF.release(m.flight.dest),'dest cannot drop');assert(!C.ZF.release(m.held),'held cannot drop');}was=m.phase==='throw';assert(Number.isFinite(m.x)&&Number.isFinite(m.y),'finite');assert(Math.abs(Math.hypot(m.gripX-m.ax,m.gripY-m.ay)-m.len)<.001,'rope');C.ZF.render();}
 assert(!g.monkey134,'exit '+n);assert(flights>=2,'multiple throws '+n+' '+flights);assert(g.hang.some(e=>before.has(e.id)&&Math.hypot(e.x-before.get(e.id)[0],e.y-before.get(e.id)[1])>g.r*2),'relocate '+n);assert(g.remaining===count&&!g.hang.some(e=>e.monkeyHeld||e.monkeyDest143||e.taken),'no lost locks '+n);assert(g.hang.every(e=>!before.has(e.id)||e.kind===before.get(e.id)[2]&&e.pairId===before.get(e.id)[3]),'identities');console.log('monkey PASS',n,flights);
 C.ZF.start(n);g=C.ZF.G;g.actionAt133=1e6;C.ZF.action134('monkey');m=g.monkey134;C.ZF.advance(2.2);assert(m.phase==='throw','throw phase');let target=m.held,dest=m.flight.dest;for(let j=0;j<3;j++){C.ZF.monkeyTap142(m.x,m.y);C.ZF.advance(.03);}C.ZF.advance(2);assert(!g.monkey134&&!target.monkeyHeld&&!dest.monkeyDest143&&!dest.taken,'rescue');console.log('rescue PASS',n);
 C.ZF.start(n);g=C.ZF.G;g.actionAt133=1e6;C.ZF.action134('falcon');let e=g.bird.target,x=e.x,y=e.y;C.ZF.advance(5);assert(Math.hypot(x-e.x,y-e.y)>g.r*2&&!e.birdHeld&&!e.taken,'falcon '+n);console.log('falcon PASS',n);
}
C.ZF.start(1);C.ZF.advance(30);let g=C.ZF.G;assert(!g.bird&&!g.monkey134&&!g.bees.length&&!g.wind134,'no early automatic');console.log('profile PASS 300');
`);
