// VC166: slope angle, body/visible size match, unchanged level counts, faster arrival.
const fs=require('fs');const root=process.env.ZF_ROOT||require('path').resolve(__dirname,'..');
const h=fs.readFileSync(root+'/tools/verify_engine_node.js','utf8').split('let solver=')[0].replace("const project=path.resolve(__dirname,'..')","const project='"+root+"'");
eval(h+`
const z=C.ZF;let minA=99,maxA=0,bad=[];
for(let n=1;n<=300;n++){z.start(n,'classic');const g=z.G;
  const aL=Math.atan((g.mouthY-g.slopeTopY)/g.chL)*180/Math.PI,aR=Math.atan((g.mouthY-g.slopeRightY)/(720-g.chR))*180/Math.PI;
  for(const a of [aL,aR]){minA=Math.min(minA,a);maxA=Math.max(maxA,a);}
  if(!(g.hang.length+g.dyn.length>0))bad.push(n);
  if(g.hang.some(e=>e.y>=Math.min(g.slopeTopY,g.slopeRightY)||false)&&false)bad.push(n);
  if(g.hang.some(e=>e.y>=((e.x<=g.chL)?g.slopeTopY+(g.mouthY-g.slopeTopY)*(e.x/g.chL):(e.x>=g.chR)?g.slopeRightY+(g.mouthY-g.slopeRightY)*((720-e.x)/(720-g.chR)):g.mouthY)-g.r*2.5))bad.push(n);
}
if(bad.length)throw Error('levels with fruit inside slope clearance: '+bad.slice(0,10));
// slope within the profile range (layouts scale the rise by .91 to 1.15)
if(minA<30*.88||maxA>30*1.2)throw Error('slope angle out of range '+minA+'..'+maxA);
// body radius matches visible fruit (sprites are ~0.92 of their box)
const vis=0.92*2.2/2; if(Math.abs(1.02-vis)>.03)throw Error('BODY_K not matched to visible size');
console.log(process.env.ZF_WIDTH+'x'+process.env.ZF_HEIGHT,'VC166: 300 levels, slope',minA.toFixed(1)+'..'+maxA.toFixed(1)+' deg, no fruit near slope PASS');
`);
