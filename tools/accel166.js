// VC166: acceleration of fruit falling through the channel region (same quadratic-fit method used on the videos), 720-unit px/frame^2.
const fs=require('fs');const root=process.env.ZF_ROOT||require('path').resolve(__dirname,'..');
const h=fs.readFileSync(root+'/tools/verify_engine_node.js','utf8').split('let solver=')[0].replace("const project=path.resolve(__dirname,'..')","const project='"+root+"'");
eval(h+`
const z=C.ZF;const acc=[];
for(const lv of [1,34,150]){for(let k=0;k<12;k++){
  z.start(lv,'classic');const g=z.G;g.actionAt133=1e8;g.scroll=null;g.hang.slice().forEach(f=>{if(f.hb)Composite=null;});
  const e=g.hang.find(f=>!f.bomb&&!f.caged&&!f.ice&&!f.plate&&!f.mystery&&z.isVisible(f));e.kind=k;e.x=360+(k%3-1)*10;e.y=g.mouthY-g.r*8;
  g.hang.forEach(f=>{if(f!==e&&f.hb){C.Matter.Composite.remove(g.engine.world,f.hb);f.hb=null;}});
  if(!z.release(e))continue;const ys=[];let t=0;
  while(t<6){z.advance(1/60);t+=1/60;const y=e.body.position.y;if(y>g.mouthY-g.r*3&&y<g.floorY-g.r*2)ys.push([ys.length,y]);if(y>g.floorY-g.r*1.5)break;}
  if(ys.length<8)continue;const n=ys.length,xs=ys.map(a=>a[0]),Y=ys.map(a=>a[1]);
  const sx=xs.reduce((a,b)=>a+b),sx2=xs.reduce((a,b)=>a+b*b,0),sx3=xs.reduce((a,b)=>a+b**3,0),sx4=xs.reduce((a,b)=>a+b**4,0),sy=Y.reduce((a,b)=>a+b),sxy=xs.reduce((a,b,i)=>a+b*Y[i],0),sx2y=xs.reduce((a,b,i)=>a+b*b*Y[i],0);
  // solve least squares y=a+bx+cx^2
  const M=[[n,sx,sx2],[sx,sx2,sx3],[sx2,sx3,sx4]],R=[sy,sxy,sx2y];
  const det=m=>m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
  const D=det(M);const Mc=M.map((r,i)=>r.map((v,j)=>j===2?R[i]:v));acc.push(2*det(Mc)/D);
}}
acc.sort((a,b)=>a-b);console.log('accel median',acc[acc.length>>1].toFixed(3),'p25',acc[acc.length>>2].toFixed(3),'p75',acc[3*acc.length>>2].toFixed(3),'n',acc.length);
`);
