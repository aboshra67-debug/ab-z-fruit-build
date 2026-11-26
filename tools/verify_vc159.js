const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
const z=C.ZF,M=C.Matter,assert=(v,m)=>{if(!v)throw Error(m)};
for(let n=1;n<=300;n++){
 z.start(n,'classic');let g=z.G,r=g.r;
 for(let i=0;i<g.hang.length;i++){const a=g.hang[i];assert(a.x>=r*1.59&&a.x<=720-r*1.59,'margin '+n);for(let j=0;j<i;j++){let b=g.hang[j];assert(Math.hypot(a.x-b.x,a.y-b.y)>=r*2.2-.001,'overlap '+n);}}
 assert(g.floorY-g.mouthY>(g.cfg.cap*2-1)*r*1.1,'capacity geometry '+n);
}
for(let n of [1,17,50,150,300]){
 z.start(n,'classic');let g=z.G,r=g.r;g.actionAt133=1e6;g.scroll=null;let selected=[],seen=new Set();for(let e of g.hang){if(e.bomb||e.caged||e.ice||e.plate||e.mystery||!z.isVisible(e)||seen.has(e.kind))continue;seen.add(e.kind);selected.push(e);if(selected.length===g.cfg.cap)break;}
 assert(selected.length===g.cfg.cap,'test distinct '+n);
 for(let e of g.hang.slice())if(!selected.includes(e)&&e.hb)M.Composite.remove(g.engine.world,e.hb);g.hang=selected.slice();
 for(let o of g.obst)M.Composite.remove(g.engine.world,o.body);g.obst=[];
 selected.forEach((e,i)=>{assert(z.release(e),'release '+n);M.Body.setPosition(e.body,{x:360,y:g.floorY-r*1.1-i*r*2.2});M.Body.setVelocity(e.body,{x:0,y:0});});
 for(let i=0;i<80;i++)z.advance(1/60);assert(g.state==='play'&&g.stackNow===g.cfg.cap,'full channel count '+n+' '+g.stackNow);console.log(n,'capacity',g.stackNow,'PASS');
}
console.log('300 levels: initial clearances, collector capacity PASS');
`);
