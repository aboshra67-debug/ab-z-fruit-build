const fs=require('fs'),path=require('path'),vm=require('vm');
const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
eval(h+`
const B=C.Matter.Body,Comp=C.Matter.Composite;
function check(ok,msg){if(!ok)throw Error(msg);}
function fixture(n,k){C.ZF.start(n);const g=C.ZF.G;let a=g.hang.filter(e=>!e.bomb&&!e.caged&&!e.ice&&C.ZF.isVisible(e)).slice(0,k);check(a.length===k,'fixture fruits');for(const e of g.hang.slice())if(!a.includes(e)&&e.hb)Comp.remove(g.engine.world,e.hb);g.hang=a;g.order=a;return {g,a};}
function place(e,x,y){e.x=x;e.y=y;B.setPosition(e.hb,{x,y});}
// Isolated, physically contacting pair; no movement commands after setup.
let {g,a}=fixture(1,2),r=g.r,top=a[0],bottom=a[1];g.scroll=null;top.kind=0;bottom.kind=1;
let x=360,y=g.mouthY-r*3.6;place(bottom,x,y);place(top,x,y-r*2.2-1);
check(C.ZF.release(top),'upper release');let min=top.body.position.y;for(let i=0;i<15;i++){C.ZF.advance(1/60);let p=top.body.position;check(p.y>=min-2,'upper jumps on support');check(Math.hypot(p.x-bottom.x,p.y-bottom.y)>=r*2.12,'upper penetrates support');min=Math.max(min,p.y);}
check(Math.abs(top.body.position.y-(y-r*2.2))<r*.12,'upper did not wait on support '+JSON.stringify(top.body.position));let oldTop=top.body.position.y;check(C.ZF.release(bottom),'lower release');check(bottom.body.position.y===y,'lower displaced at release');
for(let i=0;i<180;i++){C.ZF.advance(1/60);let p=top.body.position,q=bottom.body.position;check(p.y>=oldTop-2,'upper jumped after lower release');check(p.y<=q.y+1,'upper passed lower');check(Math.hypot(p.x-q.x,p.y-q.y)>=r*2.08,'fruit intersection');oldTop=Math.max(oldTop,p.y);}
check(bottom.body.position.y>g.mouthY&&top.body.position.y>g.mouthY,'both must reach channel');console.log('Supported upper fruit waits; lower descends first; no jump, pass-through or overlap beyond polygon tolerance PASS');
// Local reserve clearance. Block one column, let a separate column descend.
({g,a}=fixture(1,3));r=g.r;let d=2.2*r+.35,lo=a[0],hi=a[1],side=a[2],base=g.topY+5*r;
place(lo,200,base);place(hi,200,base-d);place(side,520,base-d);g.scroll.limit=x=>x<300?base:base+r*2;
let hy=hi.y,sy=side.y;for(let i=0;i<60;i++){let before=side.y;C.ZF.advance(1/60);check(Math.abs(hi.y-hy)<.01,'blocked reserve moved');check(side.y>=before&&side.y-before<=r*4.8/60+.001,'reserve step discontinuity');check(Math.hypot(lo.x-hi.x,lo.y-hi.y)>=d-.001,'reserve overlap');}
check(side.y>sy+r,'independent lane failed');Comp.remove(g.engine.world,lo.hb);g.hang.splice(g.hang.indexOf(lo),1);for(let i=0;i<60;i++){let before=hi.y;C.ZF.advance(1/60);check(hi.y>=before&&hi.y-before<=r*4.8/60+.001,'reserve jump');}check(hi.y>hy+r,'freed reserve failed to descend');console.log('Blocked reserve waits, independent lane moves, cleared lane resumes continuously PASS');
// Deep obstruction at tap: queue without moving the suspended fruit or releasing twice.
({g,a}=fixture(1,2));g.scroll=null;r=g.r;let first=a[0],second=a[1];place(first,360,g.topY+r*3);place(second,360,g.topY+r*6);check(C.ZF.release(first),'first tap');B.setPosition(first.body,{x:second.x,y:second.y});B.setVelocity(first.body,{x:0,y:0});let sx=second.x,sy2=second.y;check(C.ZF.release(second)&&second.pendingDrop&&second.state==='hang','obstructed tap must wait');check(second.x===sx&&second.y===sy2,'queued fruit moved');check(C.ZF.release(second),'repeat tap');B.setPosition(first.body,{x:360,y:g.floorY-r*1.1});B.setVelocity(first.body,{x:0,y:0});C.ZF.advance(.1);check(second.state==='fall'&&!second.pendingDrop&&g.dyn.filter(e=>e===second).length===1,'queue release must occur once');console.log('Obstructed tap queues at the same coordinates and releases exactly once PASS');

`);
