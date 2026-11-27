// VC169: 15 s grace shows a counter; a swap that creates a pair during the grace cancels the loss; the lid opens while a pair drops.
const fs=require('fs');const root=process.env.ZF_ROOT||require('path').resolve(__dirname,'..');
const h=fs.readFileSync(root+'/tools/verify_engine_node.js','utf8').split('let solver=')[0].replace("const project=path.resolve(__dirname,'..')","const project='"+root+"'");
eval(h+`
const z=C.ZF,M=C.Matter;const assert=(v,m)=>{if(!v)throw Error(m)};
function four(n,sameLast){z.start(n,'classic');const g=z.G;g.actionAt133=1e8;g.scroll=null;const r=g.r;const seen=new Set(),sel=[];
 for(const f of g.hang){if(f.bomb||f.caged||f.ice||f.plate||f.mystery||!z.isVisible(f)||seen.has(f.kind))continue;seen.add(f.kind);sel.push(f);if(sel.length===g.cfg.cap)break;}
 for(let f of g.hang.slice())if(!sel.includes(f)&&f.hb&&Math.hypot(f.x-360,f.y-g.floorY)<r*8)M.Composite.remove(g.engine.world,f.hb);
 const extra=g.hang.filter(f=>!sel.includes(f)&&!f.bomb&&!f.caged&&!f.ice&&!f.plate&&!f.mystery&&z.isVisible(f));
 const ex=g.hang.find(f=>!sel.includes(f)&&!f.bomb&&!f.caged&&!f.ice&&!f.plate&&!f.mystery&&z.isVisible(f));g.hang=sel.concat(ex?[ex]:[]);sel.forEach((f,i)=>{z.release(f);M.Body.setPosition(f.body,{x:360,y:g.floorY-r*1.1-i*r*2.2});M.Body.setVelocity(f.body,{x:0,y:0});});return {g,sel};}
for(const n of [1,21,100]){
 const {g,sel}=four(n);
 for(let i=0;i<60*3;i++)z.advance(1/60);
 assert(g.state==='play'&&g.grace166>0&&g.grace166<=15,'grace started '+n+' '+g.grace166);
 // counter value decreases by ~1 per second
 const a=g.grace166;for(let i=0;i<120;i++)z.advance(1/60);assert(Math.abs((a-g.grace166)-2)<.1,'counter runs '+n);
 // swap a fruit during the grace so two channel fruits share a kind => pair forms, grace cancels, level continues
 const k=sel[0].kind;sel[1].kind=k;sel[1].pairId=sel[0].pairId;
 for(let i=0;i<60*2;i++)z.advance(1/60);
 assert(g.state==='play'&&g.grace166==null,'swap cancelled the loss '+n+' state '+g.state+' grace '+g.grace166);
 assert(g.remaining===g.total-2,'pair collected '+n+' '+g.remaining+'/'+g.total);
}
// the lid opens while a pair is collected and closes again afterwards
{const {g,sel}=four(1);for(let i=0;i<60;i++)z.advance(1/60);const k=sel[0].kind;sel[1].kind=k;let maxLid=0;
 for(let i=0;i<60;i++){z.advance(1/60);maxLid=Math.max(maxLid,g.lid166||0);}
 assert(maxLid>.9,'lid opens '+maxLid);for(let i=0;i<60;i++)z.advance(1/60);assert((g.lid166||0)<.02,'lid closes '+g.lid166);}
console.log(process.env.ZF_WIDTH+'x'+process.env.ZF_HEIGHT,'VC169: 15s grace, counter, swap cancels loss, lid opens/closes PASS');
`);
