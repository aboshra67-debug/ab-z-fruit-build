const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
const z=C.ZF,assert=(v,m)=>{if(!v)throw Error(m)},stock=z.save.def149;
for(let n of [1,17,21,100,200,300]){
 Object.keys(stock).forEach(k=>stock[k]=3);
 function start(){z.start(n);let g=z.G;g.actionAt133=1e6;return g;}
 function use(k){let old=stock[k];assert(z.activeDefense149(k),k+' active');assert(z.useDefense149(k),k+' used');assert(stock[k]===old-1,k+' one consumed');assert(!z.useDefense149(k),k+' double rejected');assert(stock[k]===old-1,k+' no extra consumption');}
 let g=start();assert(!z.useDefense149('cut')&&stock.cut===3,'no idle use');z.action134('spider');z.advance(g.hazard144.dur+.1);assert(g.web147,'persistent');use('cut');assert(!g.web147&&g.hang.every(e=>!e.hazard144),'unlocked');
 g=start();z.action134('monkey');z.advance(1.2);assert(g.monkey134,'monkey');use('cut');assert(g.monkey134.ropeCut149&&g.hang.every(e=>!e.monkeyHeld&&!e.monkeyDest143),'rope release');z.advance(1);assert(!g.monkey134,'rope exit');
 g=start();z.action134('falcon');use('shield');assert(g.bird.state==='leave'&&g.hang.every(e=>!e.birdHeld&&!e.birdDest143&&!e.taken),'shield unlock');
 g=start();z.action134('wind');use('fan');assert(g.wind134<=g.time,'fan');
 g=start();z.action134('vortex');let slots=g.hazard144.items.map(e=>[e,e.x,e.y]);use('anchor');assert(!g.hazard144&&slots.every(([e,x,y])=>e.x===x&&e.y===y&&!e.taken),'anchor slots');
 g=start();z.action134('bee');if(g.bees.length){use('spray');assert(g.hang.every(e=>!e.beeReserved&&!e.stung),'bee unlock');}
 g=start();z.action134('bee');if(g.bees.length){let b=g.bees[0];for(let i=0;i<300&&!b.phase;i++)z.advance(1/60);if(b.phase&&b.state!=='leave'){let second=b.second;assert(z.useDefense149('spray'),'late bee');assert(second.kind===b.newKind&&!second.beeReserved,'paired conversion preserved');}}
 g=start();z.save.coins=100;let before=stock.fan;assert(z.buyDefense149('fan')&&stock.fan===before+1&&z.save.coins===70,'purchase');z.save.coins=0;assert(!z.buyDefense149('fan')&&stock.fan===before+1,'no balance');stock.fan=0;z.action134('wind');assert(!z.useDefense149('fan')&&g.wind134>g.time,'zero inventory');z.render();console.log(n,'PASS defense actions, inventory, no double charge, shop, web, rope');
}
`);
