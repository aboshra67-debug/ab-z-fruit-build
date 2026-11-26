const fs=require('fs'),path=require('path'),vm=require('vm');
const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
eval(h+`
function check(ok,msg){if(!ok)throw Error(msg);}
const profiles=new Set();
for(let n=1;n<=300;n++){
 C.ZF.start(n);const g=C.ZF.G;const l=g.mouthY-g.slopeTopY,r=g.mouthY-g.slopeRightY;
 check(l>0&&r>0&&g.cfg.cap===4,'invalid terrain '+n); profiles.add((l/r).toFixed(3)+':'+g.cfg.layout);
 const terrain=C.Matter.Composite.allBodies(g.engine.world).filter(b=>b.label==='ground');
 check(terrain.some(b=>Math.abs(b.angle-Math.atan2(l,g.chL))<1e-9),'left physics slope '+n);
 check(terrain.some(b=>Math.abs(b.angle-Math.atan2(-r,720-g.chR))<1e-9),'right physics slope '+n);
 for(const o of g.obst){const gy=o.x<g.chL?g.slopeTopY+l*o.x/g.chL:o.x>g.chR?g.slopeRightY+r*(720-o.x)/(720-g.chR):g.mouthY;check(gy-o.y>=g.r*4.89,'obstacle ground clearance '+n);}
 if(n<=15&&n>=11) console.log('level',n,'layout',g.cfg.layout,'leftRise',l.toFixed(1),'rightRise',r.toFixed(1),'obstacles',g.obst.map(o=>[o.type,Math.round(o.x),Math.round(o.y)]));
}
check(profiles.size===5,'layout coverage '+profiles.size);console.log('300 levels: all five layouts; descending slopes, real collider angles, obstacle-to-ground clearance and 4-slot capacity PASS');
C.ZF.start(12);const g=C.ZF.G;check(g.beeT>=7&&g.beeT<=10,'initial bee delay');g.beeT=0;C.ZF.advance(.05);let b=g.bees[0];check(b,'bee missing');check(g.beeT>=10,'bee cooldown');b.x=b.target.x;b.y=b.target.y-4;C.ZF.advance(.05);let e=b.target;check(e.stung&&e.taken,'bee lock');check(!C.ZF.release(e),'bee ignored');C.ZF.advance(1.65);check(!e.stung&&!e.taken&&e.state==='hang','bee timeout');console.log('Bee: delayed first arrival, longer cooldown and 1.5-second lock without forced drop PASS');
`);
