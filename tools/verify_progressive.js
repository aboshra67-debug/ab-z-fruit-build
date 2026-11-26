// Reuse the real-engine Node harness; no browser/device is implied.
const fs=require('fs'),vm=require('vm'),path=require('path');
const harness=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
const checks=`
function check(ok,msg){if(!ok)throw Error(msg);}
let totals=[];
for(let n of (process.env.ZF_ALL_LEVELS?Array.from({length:300},(_,i)=>i+1):[1,4,5,6,10,15,20,25,50,80,120,150,200,300])){
 C.ZF.start(n);let g=C.ZF.G; let fruits=g.hang.filter(e=>!e.bomb); let visible=fruits.filter(C.ZF.isVisible).length;
 check(fruits.length===g.cfg.count && g.remaining===g.cfg.count,'count '+n);
 check(fruits.every(e=>e.kind>=0),'kind '+n);
 const hist={};fruits.forEach(e=>hist[e.kind]=(hist[e.kind]||0)+1);check(Object.values(hist).every(v=>v%2===0),'pairs '+n);
 check(visible>0,'visible '+n);
 if([1,5,10,20,25,50,80,120,300].includes(n))totals.push([n,g.total,visible,g.total-visible,g.r]);
 if(g.scroll){let hidden=fruits.find(e=>!C.ZF.isVisible(e));if(hidden)check(C.ZF.release(hidden)===false,'hidden clickable '+n);}
}
console.log('Level initializations, exact counts, even pairs, hidden input PASS; level,total,visible,hidden,r',JSON.stringify(totals));
C.ZF.start(20);let g=C.ZF.G;let hidden=g.hang.filter(e=>!e.bomb&&!C.ZF.isVisible(e));let initial=hidden.map(e=>e.y);let moved=false;for(let j=0;j<200&&!moved&&g.state==='play';j++){
 for(const e of g.hang.slice())if(e.bomb&&C.ZF.isVisible(e))C.ZF.release(e);
 if(g.dyn.every(e=>e.body.speed<.35&&e.body.position.y>g.mouthY&&e.body.position.x>g.chL&&e.body.position.x<g.chR)){
 let next=g.order.find(e=>e.state==='hang'&&C.ZF.isVisible(e)&&!e.caged&&!e.stung);if(next)C.ZF.release(next);}
 C.ZF.advance(.45);moved=hidden.some((e,i)=>e.y>initial[i]+.1);}
 check(moved,'no downward motion');console.log('Reserve downward motion PASS');
C.ZF.start(1);g=C.ZF.G;let a=g.order[0],b=g.order.find(e=>e!==a&&e.kind===a.kind);C.ZF.release(a);C.ZF.release(b);let r=g.r;
// Two identical touching dynamic fruit above the funnel must remain.
const B=C.Matter.Body;B.setPosition(a.body,{x:360-r*1.05,y:g.mouthY-r*5});B.setPosition(b.body,{x:360+r*1.05,y:g.mouthY-r*5});B.setVelocity(a.body,{x:0,y:0});B.setVelocity(b.body,{x:0,y:0});let rem=g.remaining;C.ZF.advance(1/60);check(g.remaining===rem,'premature matching');
B.setPosition(a.body,{x:360,y:g.floorY-r*1.1});B.setPosition(b.body,{x:360,y:g.floorY-r*3.25});B.setVelocity(a.body,{x:0,y:0});B.setVelocity(b.body,{x:0,y:0});C.ZF.advance(1/60);check(g.remaining===rem-2,'channel matching failed');console.log('Outside match rejected / inside match accepted PASS');
`;
// Execute in module lexical scope with its own __dirname and require.
eval(harness+checks);
