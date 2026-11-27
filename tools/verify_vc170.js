// VC170: fruit rests on top of the basket lid (not inside it); basket lies fully below the channel floor; pair drops into the basket.
const fs=require('fs');const root=process.env.ZF_ROOT||require('path').resolve(__dirname,'..');
const h=fs.readFileSync(root+'/tools/verify_engine_node.js','utf8').split('let solver=')[0].replace("const project=path.resolve(__dirname,'..')","const project='"+root+"'");
eval(h+`
const z=C.ZF,M=C.Matter;const assert=(v,m)=>{if(!v)throw Error(m)};
let lvls=0;
for(const n of [1,21,60,150,300]){
 z.start(n,'classic');const g=z.G;g.actionAt133=1e8;g.scroll=null;const r=g.r;
 const w=Math.min(720*.43,g.cw*1.9),h=w*.618,by=g.floorY-h*.19+r*.12,lidY=by+h*.19;
 assert(Math.abs(lidY-(g.floorY+r*.12))<1e-6,'lid at floor '+n);
 assert(by+h*1.065+r*2*.98*3<g.dockY,'basket + extensions above the dock '+n);
 const seen=new Set(),sel=[];for(const f of g.hang){if(f.bomb||f.caged||f.ice||f.plate||f.mystery||!z.isVisible(f)||seen.has(f.kind))continue;seen.add(f.kind);sel.push(f);if(sel.length===2)break;}
 sel.forEach((f,i)=>{z.release(f);M.Body.setPosition(f.body,{x:360,y:g.floorY-r*1.1-i*r*2.2});M.Body.setVelocity(f.body,{x:0,y:0});});
 for(let i=0;i<120;i++)z.advance(1/60);
 const low=Math.max(...sel.map(f=>f.body.bounds.max.y));
 assert(low<=g.floorY+1.5,'lowest fruit rests on the lid, not inside the basket '+n+' '+low.toFixed(1)+' vs '+g.floorY.toFixed(1));
 lvls++;
}
// pair: rises, drops into basket, counter increases once
{z.start(21,'classic');const g=z.G;g.actionAt133=1e8;g.scroll=null;const r=g.r;const seen=new Set(),sel=[];
 for(const f of g.hang){if(f.bomb||f.caged||f.ice||f.plate||f.mystery||!z.isVisible(f)||seen.has(f.kind))continue;seen.add(f.kind);sel.push(f);if(sel.length===3)break;}
 const ex=g.hang.find(f=>!sel.includes(f)&&!f.bomb&&!f.caged&&!f.ice&&!f.plate&&!f.mystery&&z.isVisible(f));
 sel.forEach((f,i)=>{z.release(f);M.Body.setPosition(f.body,{x:360,y:g.floorY-r*1.1-i*r*2.2});M.Body.setVelocity(f.body,{x:0,y:0});});
 for(let i=0;i<90;i++)z.advance(1/60);
 sel[1].kind=sel[0].kind;let sawCollect=false,dur=0;
 for(let i=0;i<60*2;i++){z.advance(1/60);if(g.collecting&&g.collecting.length){sawCollect=true;dur=g.collecting[0].dur;}}
 assert(sawCollect&&Math.abs(dur-.55)<1e-6,'pair animation runs .55s '+dur);assert(g.remaining===g.total-2,'counter +2 '+g.remaining+'/'+g.total);}
console.log(process.env.ZF_WIDTH+'x'+process.env.ZF_HEIGHT,'VC170: fruit rests on the lid, basket below the floor, pair drops in PASS');
`);
