const fs=require('fs');const root=process.env.ZF_ROOT||require('path').resolve(__dirname,'..');
const h=fs.readFileSync(root+'/tools/verify_engine_node.js','utf8').split('let solver=')[0].replace("const project=path.resolve(__dirname,'..')","const project='"+root+"'");
const levels=(process.env.LV||'1,10,34,80,150,250,300').split(',').map(Number);
eval(h+`
const z=C.ZF;let tot=0,ok=0,times=[];
for(const n of levels){
  z.start(n,'classic');let g=z.G;g.actionAt133=1e8;g.scroll=null;
  const cand=g.hang.filter(e=>z.isVisible(e)&&!e.bomb&&!e.caged&&!e.ice&&!e.plate&&!e.mystery).sort((a,b)=>b.y-a.y).slice(0,6);
  for(const e0 of cand){
    z.start(n,'classic');g=z.G;g.actionAt133=1e8;g.scroll=null;
    const e=g.hang.find(f=>f.id===e0.id);if(!e||!z.release(e))continue;
    tot++;let t=0,inCh=false;
    while(t<25){z.advance(1/30);t+=1/30;const p=e.body.position;if(p.x>g.chL&&p.x<g.chR&&p.y>g.mouthY){inCh=true;break;}if(g.state!=='play')break;}
    if(inCh){ok++;times.push(t);}
  }
}
times.sort((a,b)=>a-b);
console.log(process.env.ZF_WIDTH+'x'+process.env.ZF_HEIGHT,'reach channel',ok+'/'+tot,'median s',times[Math.floor(times.length/2)]?.toFixed(2),'max s',times[times.length-1]?.toFixed(2));
`);
