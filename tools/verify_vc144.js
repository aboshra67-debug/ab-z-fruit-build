const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
const assert=(v,m)=>{if(!v)throw Error(m)};
const counts={};for(let n=1;n<=300;n++){let c=C.ZF_LEVELS.gen(n);assert(c.action143.sequence.length<=2,'profile');for(let k of c.action143.sequence)counts[k]=(counts[k]||0)+1;}
for(let k of ['snake','spider','vortex'])assert(counts[k]>0,k);console.log('300 profiles PASS',JSON.stringify(counts));
for(let n of [1,17,21,51,100,200,300])for(let k of ['snake','spider','vortex']){
 C.ZF.start(n);let g=C.ZF.G;g.actionAt133=1e6;let total=g.remaining,before=new Map(g.hang.map(e=>[e.id,[e.kind,e.pairId]]));C.ZF.action134(k);let h=g.hazard144;assert(h&&h.items.length>=2,'start '+k+' '+n);let pos=h.items.map(e=>[e.x,e.y]);assert(!C.ZF.release(h.items[0]),'reserved '+k);C.ZF.action134('monkey');assert(!g.monkey134,'no overlap');
 for(let i=0;i<Math.ceil((h.dur+.15)*60);i++){C.ZF.advance(1/60);if(g.hazard144)C.ZF.render();}
 assert(!g.hazard144&&g.hang.every(e=>!e.hazard144),'clear '+k);assert(g.remaining===total,'count');assert(g.hang.every(e=>before.get(e.id)[0]===e.kind&&before.get(e.id)[1]===e.pairId),'identities');if(k==='vortex')assert(h.items.some((e,i)=>Math.hypot(e.x-pos[i][0],e.y-pos[i][1])>g.r),'moves');
 if(k!=='vortex'){C.ZF.start(n);g=C.ZF.G;g.actionAt133=1e6;C.ZF.action134(k);h=g.hazard144;C.ZF.advance(h.dur*.35);for(let i=0;i<3;i++)C.ZF.hazardTap144(h.x,h.y);assert(!g.hazard144&&g.hang.every(e=>!e.hazard144),'tap rescue');}
 console.log(k,n,'PASS');
}
`);
