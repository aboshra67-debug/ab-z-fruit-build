// VC171: same-kind fruits touching in the channel merge for all 22 kinds and several angles; different kinds never merge.
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
const h=fs.readFileSync(root+'/tools/verify_engine_node.js','utf8').split('let solver=')[0].replace("const project=path.resolve(__dirname,'..')","const project='"+root+"'");
eval(h+`
const z=C.ZF,M=C.Matter;const names=C.ZF_FRUITS.map(f=>f.n);let fail=0;
function trial(k1,k2,ang){
  z.start(21,'classic');const g=z.G;g.actionAt133=1e8;g.scroll=null;const r=g.r;
  const c=g.hang.filter(f=>!f.bomb&&!f.caged&&!f.ice&&!f.plate&&!f.mystery&&z.isVisible(f)).slice(0,3);
  c[0].kind=k1;c[1].kind=k2;c[2].kind=(k1+7)%22;
  c.slice(0,2).forEach((f,i)=>{z.release(f);M.Body.setPosition(f.body,{x:360+(i?3:0),y:g.floorY-r*1.1-i*r*2.4});M.Body.setAngle(f.body,ang[i]);M.Body.setVelocity(f.body,{x:0,y:0});});
  for(let i=0;i<150;i++){z.advance(1/60);if(g.remaining<g.total)return true;}
  return false;
}
const angs=[[0,0],[0.5,-0.7],[1.2,2.5],[-1.5,0.3]];
for(let k=0;k<22;k++)for(const a of angs){if(!trial(k,k,a)){fail++;console.log('FAIL same-kind not merged',names[k],a);}}
for(let k=0;k<22;k++){if(trial(k,(k+1)%22,[0,0.4])){fail++;console.log('FAIL different kinds merged',names[k],names[(k+1)%22]);}}
console.log(fail?'FAILED '+fail:'PASS: 22 kinds x 4 angles merge; 22 different-kind pairs never merge');process.exit(fail?1:0);
`);
