const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
const z=C.ZF,assert=(v,m)=>{if(!v)throw Error(m)},stock=z.save.def149;
for(let n of [1,17,21,100,200,300]){
 for(let [action,k] of [['spider','cut'],['monkey','cut'],['falcon','shield'],['bee','spray'],['wind','fan'],['vortex','anchor']]){
  z.start(n);let g=z.G;g.actionAt133=1e6;stock[k]=3;let total=g.remaining;z.action134(action);
  if(action==='spider')z.advance(g.hazard144.dur+.1);if(action==='monkey'||action==='falcon')z.advance(.35);
  if(!z.activeDefense149(k)){if(action==='bee')continue;throw Error('inactive '+action);}
  assert(z.useDefense149(k),action+' use');let f=g.defFx150;assert(f.kind===k&&f.dur>=1.85&&Number.isFinite(f.x)&&Number.isFinite(f.y),action+' snapshot');
  for(let i=0;i<Math.ceil(f.dur*60)+5;i++){z.render();z.advance(1/60);}
  z.render();assert(!g.defFx150,action+' expired');assert(stock[k]===2,action+' stock');assert(g.remaining===total,action+' fruit count');
  z.start(n);assert(!z.G.defFx150,'no stale animation');
 }
 console.log(n,'PASS staged defense, render at each frame, reset and fruit count');
}
`);
