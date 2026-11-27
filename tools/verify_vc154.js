const fs=require('fs'),path=require('path');
let h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
h=h.replace('classList:{add:noop,remove:noop,toggle:noop,contains:()=>true}',`classList:(()=>{const a=new Set();return {add:k=>a.add(k),remove:k=>a.delete(k),toggle:(k,v)=>{if(v===undefined)v=!a.has(k);v?a.add(k):a.delete(k);return v},contains:k=>a.has(k)}})()`);
eval(h+`
const z=C.ZF,assert=(v,m)=>{if(!v)throw Error(m)},keys=['cut','shield','spray','fan','anchor'];
for(let n=1;n<=300;n++){
 z.start(n);const g=z.G, wanted=g.cfg.defense152;
 for(const k of keys){assert(nodes['def149_'+k].classList.contains('hidden')===!wanted.includes(k),'defense visibility '+n+' '+k);assert(nodes['buy149_'+k].classList.contains('hidden')===!wanted.includes(k),'shop visibility '+n+' '+k);}
 assert(nodes.def149_bar.classList.contains('hidden')===!wanted.length,'rail visibility '+n);
 assert(((function(){const w=Math.min(720*.43,g.cw*1.9),h=w*.618;return g.floorY-h*.19+g.r*.12+h*1.065;})())+g.r*2*.98*3<g.dockY,'basket clearance '+n);
 const w=Math.min(720*.36,g.cw*2.42);assert(360-w/2>720*.27&&360+w/2<720*.73,'basket side clearance '+n);
}
console.log('300 stages: defense rail + shop visibility, basket extension and horizontal side clearance PASS');
`);
