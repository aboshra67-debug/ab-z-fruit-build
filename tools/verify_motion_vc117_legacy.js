const fs=require('fs'),path=require('path'),vm=require('vm');
const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
eval(h+`
const B=C.Matter.Body;
function check(ok,msg){if(!ok)throw Error(msg);}
// Controlled vertical contact: selected fruit is supported by a suspended fruit.
C.ZF.start(10);let g=C.ZF.G;let e=g.hang.find(f=>C.ZF.isVisible(f)&&!f.bomb&&!f.caged&&!f.stung&&!f.ice);let support=g.hang.find(f=>f!==e&&C.ZF.isVisible(f)&&!f.bomb&&Math.abs(f.x-360)<110&&f.y>g.topY+g.r*3);
check(support,'support missing');check(C.ZF.release(e),'release');B.setPosition(e.body,{x:support.x,y:support.y-g.r*2.1});B.setVelocity(e.body,{x:0,y:0});let recovered=false,frames=0,rem=g.remaining;
for(;frames<360;frames++){C.ZF.advance(1/60);if(e.foreground)recovered=true;if(e.body.position.y>=g.mouthY&&e.body.position.x>=g.chL&&e.body.position.x<=g.chR)break;}
check(frames<360,'stuck after six seconds '+JSON.stringify(e.body.position));check(g.remaining===rem,'unexpected match');check(e.body.collisionFilter.mask===0xffffffff,'collision mask not restored');console.log('Blocked fall reaches channel in '+(frames/60).toFixed(2)+'s; foreground escape='+recovered+'; accounting and collision restored PASS');
// Fast second selection, initially obstructed by the first. No upward teleport or duplicate drop.
C.ZF.start(10);g=C.ZF.G;let a=g.order[0],b=g.order.find(f=>f!==a&&C.ZF.isVisible(f)&&!f.caged&&!f.ice);check(C.ZF.release(a),'first release');let bx=b.x,by=b.y;B.setPosition(a.body,{x:bx,y:by});B.setVelocity(a.body,{x:0,y:0});check(C.ZF.release(b)&&b.pendingDrop&&b.state==='hang','queued second tap');check(b.x===bx&&b.y===by,'queued fruit moved on tap');check(C.ZF.release(b),'duplicate input accepted idempotently');B.setPosition(a.body,{x:360,y:g.floorY-g.r*1.1});B.setVelocity(a.body,{x:0,y:0});C.ZF.advance(.1);check(b.state==='fall'&&!b.pendingDrop&&g.dyn.filter(x=>x===b).length===1,'queue not drained exactly once');console.log('Rapid tap queued without changing spawn coordinates or duplicate fruit PASS');
`);
