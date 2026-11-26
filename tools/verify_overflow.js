const fs=require('fs'),path=require('path'),vm=require('vm');
const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
eval(h+`
const B=C.Matter.Body;
function check(ok,msg){if(!ok)throw Error(msg);}
C.ZF.start(8);let g=C.ZF.G,r=g.r;
let fruits=g.hang.filter(e=>C.ZF.isVisible(e)&&!e.bomb&&!e.caged),distinct=[];
for(let e of fruits)if(!distinct.some(a=>a.kind===e.kind))distinct.push(e);
check(distinct.length>=5,'not enough distinct visible test fruits');
for(let i=0;i<4;i++){let e=distinct[i];check(C.ZF.release(e),'release');B.setPosition(e.body,{x:360,y:g.floorY-r*1.1-i*r*2.19});B.setVelocity(e.body,{x:0,y:0});}
C.ZF.advance(2.2);check(g.state==='play','4 legitimate fruits must not lose');check(g.stackNow===4,'4 actual channel occupants');
let e=distinct[4];check(C.ZF.release(e),'fifth release');B.setPosition(e.body,{x:360-r*.1,y:g.mouthY-r*1.2});B.setVelocity(e.body,{x:5,y:0});
C.ZF.advance(3);check(g.state==='lost','moving overflow failed '+g.state+' stack='+g.stackNow+' fullT='+g.fullT);console.log('4 fruits safe; moving fifth fruit triggers loss PASS');
`);
