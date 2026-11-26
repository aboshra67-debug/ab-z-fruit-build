const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
const assert=(v,m)=>{if(!v)throw Error(m)};
for(const n of [1,17,20,100,200,300]){
 C.ZF.start(n);let g=C.ZF.G;g.actionAt133=1e6;let count=g.remaining;C.ZF.action134('monkey');let m=g.monkey134;assert(m,'no monkey '+n);let target=m.target,held=false,frames=new Set(),pivot=m.ax,phases=new Set();
 for(let i=0;i<360;i++){C.ZF.advance(1/60);if(g.monkey134){phases.add(m.phase);frames.add(m.frame);assert(Number.isFinite(m.x)&&Number.isFinite(m.y),'finite');assert(m.ax===pivot,'fixed anchor');assert(Math.abs(Math.hypot(m.gripX-m.ax,m.gripY-m.ay)-m.len)<.0001,'rope length');if(m.held){held=true;assert(target.monkeyHeld&&target.taken,'held flags');assert(!C.ZF.release(target),'cannot release held fruit');}C.ZF.render();}}
 assert(!g.monkey134&&held&&!target.monkeyHeld&&!target.taken,'clean exit '+n);assert(g.remaining===count,'remaining count '+n);assert(frames.size>=10,'frames '+n);console.log('normal PASS',n,frames.size,[...phases].join(','));
 C.ZF.start(n);g=C.ZF.G;g.actionAt133=1e6;count=g.remaining;C.ZF.action134('monkey');m=g.monkey134;C.ZF.advance(1.6);assert(m.held,'not held '+n);target=m.held;let x=target.x,y=target.y;assert(!C.ZF.monkeyTap142(-1000,-1000),'outside hit');for(let i=0;i<3;i++){assert(C.ZF.monkeyTap142(m.x,m.y),'tap '+i);C.ZF.advance(.1);}assert(m.scared&&m.phase==='return','three taps');C.ZF.advance(2);assert(!g.monkey134&&!target.monkeyHeld&&!target.taken&&g.hang.includes(target)&&g.remaining===count,'rescued fruit');console.log('rescue PASS',n);
}
C.ZF.start(17);let g=C.ZF.G;g.actionAt133=1e6;C.ZF.action134('monkey');let m=g.monkey134;C.ZF.release(m.target);C.ZF.advance(2.5);assert(!g.monkey134,'stale target cleanup');console.log('removed target PASS');
C.ZF.start(17);g=C.ZF.G;g.actionAt133=1e6;C.ZF.action134('monkey');m=g.monkey134;C.ZF.advance(.5);for(let i=0;i<3;i++){C.ZF.monkeyTap142(m.x,m.y);C.ZF.advance(.1);}C.ZF.advance(2);assert(!g.monkey134&&!g.hang.some(f=>f.monkeyHeld),'early scare cleanup');console.log('early scare PASS');
`);
