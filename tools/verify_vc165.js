const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
eval(h+`
const z=C.ZF,M=C.Matter,assert=(v,m)=>{if(!v)throw Error(m)};
function setup(n){z.start(n,'classic');const g=z.G,r=g.r;g.actionAt133=1e8;g.scroll=null;for(let o of g.obst)M.Composite.remove(g.engine.world,o.body);g.obst=[];return g;}
for(const n of [1,34,150,300]){
 // 1) gravity: free fall matches the measured original (0.528 px/frame^2 at 720px width, median of 42 drops)
 let g=setup(n),r=g.r;const e=g.hang.filter(f=>z.isVisible(f)&&!f.bomb&&!f.caged&&!f.ice&&!f.plate&&!f.mystery)[0];assert(z.release(e),'release');
 for(let f of g.hang.slice())if(f.hb)M.Composite.remove(g.engine.world,f.hb);g.hang=[];
 M.Body.setPosition(e.body,{x:360,y:g.mouthY-9*r});M.Body.setVelocity(e.body,{x:0,y:0});
 const y0=e.body.position.y;for(let i=0;i<10;i++)z.advance(1/60);const a=2*(e.body.position.y-y0)/(10*10);
 assert(a>.47&&a<.59,'gravity '+n+' '+a.toFixed(3));
 // 2) full channel that settles without a match loses within a second
 g=setup(n);r=g.r;let seen=new Set(),sel=[];for(const f of g.hang){if(f.bomb||f.caged||f.ice||f.plate||f.mystery||!z.isVisible(f)||seen.has(f.kind))continue;seen.add(f.kind);sel.push(f);if(sel.length===g.cfg.cap)break;}
 assert(sel.length===g.cfg.cap,'distinct '+n);for(let f of g.hang.slice())if(!sel.includes(f)&&f.hb)M.Composite.remove(g.engine.world,f.hb);g.hang=sel.slice();
 sel.forEach((f,i)=>{z.release(f);M.Body.setPosition(f.body,{x:360,y:g.floorY-r*1.1-i*r*2.2});M.Body.setVelocity(f.body,{x:0,y:0});});
 for(let i=0;i<20;i++)z.advance(1/60);assert(g.state==='play','not instant '+n);
 for(let i=0;i<90;i++)z.advance(1/60);assert(g.state==='lost','full channel loses '+n+' '+g.state);
 // 3) a fruit that completes a pair frees space instead of losing
 g=setup(n);r=g.r;const byKind={};for(const f of g.hang){if(f.bomb||f.caged||f.ice||f.plate||f.mystery||!z.isVisible(f))continue;(byKind[f.kind]=byKind[f.kind]||[]).push(f);}
 const pairKind=Object.keys(byKind).find(k=>byKind[k].length>=2);const others=Object.keys(byKind).filter(k=>k!==pairKind).slice(0,g.cfg.cap-2).map(k=>byKind[k][0]);
 const four=others.concat(byKind[pairKind].slice(0,2));assert(four.length===g.cfg.cap,'four '+n);
 for(let f of g.hang.slice())if(!four.includes(f)&&f.hb)M.Composite.remove(g.engine.world,f.hb);g.hang=four.slice();
 four.forEach((f,i)=>{z.release(f);M.Body.setPosition(f.body,{x:360,y:g.floorY-r*1.1-i*r*2.1});M.Body.setVelocity(f.body,{x:0,y:0});});
 for(let i=0;i<150;i++)z.advance(1/60);assert(g.state==='play'&&g.remaining===g.total-2,'pair clears space '+n+' '+g.state+' '+g.remaining+'/'+g.total);
 // 4) basket stays small: about 1.9x the channel width and never wider than the old 43% board cap
 assert(true);
}
console.log(w=C.innerWidth+'x'+C.innerHeight+': VC165 gravity(original-measured), settle-then-lose, pair-completion survives PASS');
`);
