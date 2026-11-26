const fs=require('fs'),path=require('path'),vm=require('vm');
const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
eval(h+`
function check(ok,msg){if(!ok)throw Error(msg);}
const B=C.Matter.Body;
for(const n of [6,10,25,80,117,300]){
 C.ZF.start(n);const g=C.ZF.G;for(const o of g.obst.filter(o=>o.type==='wood')){
 const min=g.r*2.2; const maxExtent=o.size*Math.SQRT1_2;
 check(o.x-maxExtent>=min && 720-o.x-maxExtent>=min,'wall clearance at spawn '+n);
 }
 for(let i=0;i<90;i++){C.ZF.advance(1/60);for(const o of g.obst.filter(o=>o.type==='wood')){check(o.x-o.size*Math.SQRT1_2>=g.r*2.2 && 720-o.x-o.size*Math.SQRT1_2>=g.r*2.2,'wall clearance during movement '+n);}}
}
console.log('Moving crates preserve a full fruit diameter at either wall PASS');
C.ZF.start(10);let g=C.ZF.G,o=g.obst.find(o=>o.type==='wood'),x=o.x,ang=o.ang;
let e=g.order.find(e=>C.ZF.isVisible(e)&&!e.caged&&!e.ice);check(C.ZF.release(e),'tap');B.setPosition(e.body,{x:o.x,y:o.y-o.size*Math.SQRT1_2-g.r*1.2});B.setVelocity(e.body,{x:0,y:0});C.ZF.advance(1/60);check(o.x===x&&o.ang===ang,'crate moved in occupied sweep');console.log('Crate freezes before contact PASS');
C.ZF.start(1);g=C.ZF.G;let v=g.order.find(e=>C.ZF.isVisible(e));check(C.ZF.release(v),'tap');const p=v.body.position;check(p.x===v.x&&p.y===v.y,'tap displaced fruit');const before=g.engine.timing.timestamp;C.ZF.advance(.1);const elapsed=g.engine.timing.timestamp-before;check(Math.abs(elapsed-125)<.001,'fixed-step rate '+elapsed);console.log('125% simulation rate; 240 Hz integration step; unchanged initial coordinates PASS');
`);
