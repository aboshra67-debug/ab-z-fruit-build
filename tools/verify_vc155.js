const fs=require('fs'),path=require('path');let h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];h=h.replace('classList:{add:noop,remove:noop,toggle:noop,contains:()=>true}',`classList:(()=>{const a=new Set();return {add:k=>a.add(k),remove:k=>a.delete(k),toggle:(k,v)=>{if(v===undefined)v=!a.has(k);v?a.add(k):a.delete(k);return v},contains:k=>a.has(k)}})()`);
eval(h+`
const z=C.ZF,assert=(v,m)=>{if(!v)throw Error(m)};
for(let n=1;n<=300;n++){z.start(n,'classic');assert(z.G.total===C.ZF_LEVELS.gen(n).count,'count '+n);assert(z.G.limit155===0,'classic timer');}
const unlocked=z.save.unlocked,stars=JSON.stringify(z.save.stars);
z.start(21,'timed');assert(z.G.limit155>=60,'timed');z.G.state='paused';let time=z.G.time;z.advance(1);assert(z.G.time===time,'pause');z.G.state='play';z.G.time=z.G.limit155-.01;z.advance(.05);assert(z.G.state==='lost','timed expiry');
z.start(51,'speed');assert(z.G.limit155===60,'60 sec');z.G.matchScore155=12;z.G.time=59.99;z.advance(.05);assert(z.G.state==='won'&&z.save.records155.speed_51.best===12,'speed record');
z.start(21,'action');assert(z.G.cfg.action143.sequence.length===6&&z.G.cfg.action143.first===5,'action');z.G.remaining=0;z.advance(.05);assert(z.G.state==='won','challenge win');assert(z.save.unlocked===unlocked&&JSON.stringify(z.save.stars)===stars,'campaign isolation');
z.start(21,'classic');const base=z.G.cfg.action143.interval;z.save.assist155['21']={fails:3,granted:false};z.start(21,'classic');assert(z.G.cfg.action143.interval>base,'attack easing');assert(z.G.order.every((e,i,a)=>i%2===0||e.kind===a[i-1].kind),'paired sequence');
z.start(1,'classic');z.G.time=18;z.advance(.05);assert(z.G.hintIds155.length>=1,'hint');
z.save.assist155['1']={fails:5,granted:true};z.start(1,'classic');assert(z.G.cfg.cap===5,'bonus slot');
console.log('VC155: 300 classic counts, timer/pause/expiry, speed score, action, campaign isolation, adaptive pair/hint/bonus PASS');
`);
