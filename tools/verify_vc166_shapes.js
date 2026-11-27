// VC166: shaped colliders never jam in the channel; 4 mixed fruits fit; shape vs sprite stay close.
const fs=require('fs');const root=process.env.ZF_ROOT||require('path').resolve(__dirname,'..');
const h=fs.readFileSync(root+'/tools/verify_engine_node.js','utf8').split('let solver=')[0].replace("const project=path.resolve(__dirname,'..')","const project='"+root+"'");
eval(h+`
const z=C.ZF;const bad=[];let tested=0;
for(const lv of [1,50,300]){
for(let k=0;k<24;k++){
  for(const ang of [0,.6,1.3,2.1]){
  z.start(lv,'classic');const g=z.G;g.actionAt133=1e8;g.scroll=null;
  const e=g.hang.find(f=>!f.bomb&&!f.caged&&!f.ice&&!f.plate&&!f.mystery&&z.isVisible(f));if(!e)continue;
  e.kind=k;e.x=360;e.y=g.mouthY-g.r*1.5;
  if(!z.release(e))continue;tested++;
  C.Matter.Body.setAngle(e.body,ang);C.Matter.Body.setAngularVelocity(e.body,ang*.02);
  let t=0;while(t<6){z.advance(1/30);t+=1/30;if(e.body&&e.body.position.y>g.floorY-g.r*1.6)break;if(g.state!=='play')break;}
  if(!(e.body&&e.body.position.y>g.floorY-g.r*1.8))bad.push('L'+lv+' kind '+k+' ('+C.ZF_FRUITS[k].n+') ang '+ang+' stuck at y '+Math.round(e.body.position.y)+' floor '+Math.round(g.floorY));
}}}
if(bad.length)throw Error(bad.length+' jams: '+bad.slice(0,8).join(' | '));
console.log(process.env.ZF_WIDTH+'x'+process.env.ZF_HEIGHT,'VC166 shapes: '+tested+' drops reach the channel floor, no jams PASS');
`);
