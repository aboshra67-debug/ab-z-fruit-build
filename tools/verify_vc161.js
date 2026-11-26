const fs=require('fs'),path=require('path');let h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];h=h.replace('classList:{add:noop,remove:noop,toggle:noop,contains:()=>true}',`classList:(()=>{const a=new Set();return {add:k=>a.add(k),remove:k=>a.delete(k),toggle:(k,v)=>{if(v===undefined)v=!a.has(k);v?a.add(k):a.delete(k);return v},contains:k=>a.has(k)}})()`);
eval(h+`
const z=C.ZF,assert=(v,m)=>{if(!v)throw Error(m)},w=C.innerWidth,vh=C.innerHeight,scale=w/720,H=Math.round(Math.max(1200,Math.min(1700,vh/scale))),off=(vh-H*scale)/2;
for(const n of [1,17,21,50,100,150,200,250,300]){
 z.start(n,'classic');let g=z.G,r=g.r,size=Math.max(34,Math.min(50,Math.floor((w-36)/7))),any=g.cfg.defense152.length>0;
 let helperTop=vh-8-size,defTop=helperTop-8-size,footerTop=any?defTop:helperTop;
 assert(g.dockY*scale+off<=footerTop,'dock overlaps tools '+n);
 assert(g.floorY-g.mouthY>(g.cfg.cap*2-1)*r*1.1,'channel capacity '+n);
 assert(g.floorY+r*2*.98*3+r*1.9<g.dockY,'extension clearance '+n);
 assert(nodes.def149_bar.classList.contains('hidden')===!any,'defense visibility '+n);
 assert(nodes.hudBottom.style.bottom==='8px','helper bottom '+n);
 assert(nodes.def149_bar.style.bottom===(8+size+8)+'px','defense bottom '+n);
 assert(g.total===C.ZF_LEVELS.gen(n).count,'fruit count '+n);
}
console.log(w+'x'+vh+': 9 stages, footer separation, capacity, defense visibility, original fruit counts PASS');
`);
