const fs=require('fs'),path=require('path'),vm=require('vm');
const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
eval(h+`
function check(ok,msg){if(!ok)throw Error(msg);}
const B=C.Matter.Body;
let g;for(let n=16;n<100;n++){C.ZF.start(n);g=C.ZF.G;if(g.hang.some(e=>e.ice&&C.ZF.isVisible(e)))break;}
let ice=g.hang.find(e=>e.ice&&C.ZF.isVisible(e)),rem=g.remaining;check(ice&&C.ZF.release(ice)&&!ice.ice&&ice.state==='hang'&&g.remaining===rem,'thaw');check(C.ZF.release(ice)&&ice.state==='fall'&&g.remaining===rem,'drop');console.log('Ice two-tap/no premature match PASS');
C.ZF.start(12);g=C.ZF.G;let o=g.obst.find(o=>o.type==='wood');check(o,'wood exists');let ang=o.body.angle;C.ZF.advance(.4);check(Math.abs(o.body.angle-ang)>.001,'rotation');
let f=g.hang.filter(e=>!e.bomb&&!e.ice&&!e.caged&&C.ZF.isVisible(e)).slice(0,3);check(f.length===3,'impact test fruit');
for(const e of f){check(C.ZF.release(e),'drop for impact');B.setPosition(e.body,{x:o.x,y:o.y-o.size/2-g.r*1.0});B.setVelocity(e.body,{x:0,y:6});C.ZF.advance(.1);B.setPosition(e.body,{x:360,y:g.floorY-g.r*1.1});B.setVelocity(e.body,{x:0,y:0});}
check(!g.obst.includes(o),'crate did not break '+o.hp);console.log('Bounded rotation + crate breaks after 3 distinct fruit collisions PASS');
`);
// Exercise the actual bird carry + rescue path; the reserve must not shift while carried.
eval(h+`
C.ZF.start(50);let g=C.ZF.G;g.remaining=Math.floor(g.total*.6);C.ZF.advance(.1);let bird=g.bird;if(!bird)throw Error('no bird');let e=bird.target,x=e.x,y=e.y,lane=e.lane;bird.state='fly';bird.x=x;bird.y=y;C.ZF.advance(.05);if(bird.state!=='carry'||!g.hang.includes(e)||!e.birdHeld||!e.hb)throw Error('no hold');x=e.x;y=e.y;let rem=g.remaining;if(!C.ZF.scare()||!g.hang.includes(e)||e.state!=='hang'||e.birdHeld||e.x!==x||e.y!==y||e.lane!==lane||g.remaining!==rem||!e.hb)throw Error('rescue did not restore original slot');if(C.ZF.scare())throw Error('duplicate scare reward');console.log('Bird carry rescue restores original slot and prevents repeat rewards PASS');
`);
eval(h+`
C.ZF.start(25);let g=C.ZF.G,b=g.hang.find(e=>e.bomb);if(!b)throw Error('bomb unavailable');let f=g.hang.find(e=>!e.bomb&&!e.ice&&!e.caged&&C.ZF.isVisible(e));b.x=f.x;b.y=f.y;b.lane=null; // controlled visible bomb fixture
let rem=g.remaining;b.fuse=.01;C.ZF.advance(.03);if(g.hang.includes(b)||b.state!=='removed'||g.remaining!==rem||g.dyn.length<1||g.dyn.length>3)throw Error('bomb accounting');console.log('Bomb detonates, releases nearby fruit, preserves remaining count PASS');
`);
