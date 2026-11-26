const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
const z=C.ZF,assert=(v,m)=>{if(!v)throw Error(m)};
let maxImbalance=0,minVisible=Infinity;
for(let n=1;n<=300;n++){
 z.start(n);let g=z.G,r=g.r, visible=g.hang.filter(e=>z.isVisible(e));
 assert(g.floorY+r*2*.98*3+r*1.8<g.dockY,'basket overlaps dock '+n);
 assert(g.mouthY>g.topY+r*4,'play area '+n);
 assert(visible.length>=8,'too few visible '+n);minVisible=Math.min(minVisible,visible.length);
 const left=visible.filter(e=>e.x<360).length,right=visible.filter(e=>e.x>360).length;
 assert(left>0&&right>0,'one-sided layout '+n);maxImbalance=Math.max(maxImbalance,Math.abs(left-right));
 for(let i=0;i<g.hang.length;i++){let a=g.hang[i];assert(a.x>=r*1.5&&a.x<=720-r*1.5,'side margin '+n);for(let j=i+1;j<g.hang.length;j++){let b=g.hang[j];assert(Math.hypot(a.x-b.x,a.y-b.y)>=r*2.2-.001,'fruit overlap '+n);}}
 z.render();
}
console.log('300 boards: basket clearance including all 3 extra slots, two-sided field, fruit spacing PASS; min visible='+minVisible+' max left-right imbalance='+maxImbalance);
`);
