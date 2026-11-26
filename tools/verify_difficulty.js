// Test actual generated ordering: deterministic counts, stack safety, and spatial separation.
const fs=require('fs'),path=require('path'),vm=require('vm');
const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
eval(h+`
const groups=[];
for(let n=1;n<=300;n++){
 C.ZF.start(n);let g=C.ZF.G, stack=[],max=0,span=[],seen={};
 for(const e of g.order){
  if(stack.at(-1)?.kind===e.kind){let a=stack.pop();span.push(Math.hypot(a.x-e.x,a.y-e.y)/(2.2*g.r));}
  else {if(stack.some(a=>a.kind===e.kind))throw Error('interleaved identical kind at '+n);stack.push(e);max=Math.max(max,stack.length);}
 }
 if(stack.length||max>3||span.length*2!==g.total)throw Error('invalid solution at '+n);
 const nearest=g.order.map(e=>Math.min(...g.order.filter(o=>o!==e&&o.kind===e.kind).map(o=>Math.hypot(o.x-e.x,o.y-e.y)/(2.2*g.r))));
 if([1,10,25,50,80,117,160,220,300].includes(n))groups.push({level:n,total:g.total,types:new Set(g.order.map(e=>e.kind)).size,depth:max,meanPairSpan:+(span.reduce((a,b)=>a+b,0)/span.length).toFixed(2),meanNearestMatch:+(nearest.reduce((a,b)=>a+b,0)/nearest.length).toFixed(2)});
}
console.log('All 300 logical solution sequences PASS',JSON.stringify(groups));
`);
