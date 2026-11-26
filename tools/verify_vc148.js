const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
const assert=(v,m)=>{if(!v)throw Error(m)};
for(let n=1;n<=300;n++){let cfg=C.ZF_LEVELS.gen(n);assert(!cfg.action143.sequence.includes('snake')&&!cfg.hazard144.snake,'no snake level '+n)}
for(const n of [1,17,21,100,200,300]){
 C.ZF.start(n);let g=C.ZF.G;g.actionAt133=1e6;let total=g.remaining;C.ZF.action134('snake');assert(!g.hazard144,'removed action no-op');assert(g.hang.every(e=>!e.hazard144),'no lock');
 C.ZF.action134('spider');let sp=g.hazard144;assert(sp&&sp.items.length>=2,'spider start');C.ZF.advance(sp.dur+1);C.ZF.render();assert(!g.hazard144&&g.web147,'persist');let e=g.web147.items[0];assert(!C.ZF.release(e),'web blocks');C.ZF.advance(15);assert(g.web147&&e.taken,'still persists');assert(C.ZF.cutWeb147(),'scissors');assert(!g.web147&&!e.hazard144&&!e.taken,'cut release');
 C.ZF.action134('spider');sp=g.hazard144;C.ZF.advance(sp.dur+1);e=g.web147.items[0];for(let i=0;i<4;i++)assert(C.ZF.hazardTap144(e.x,e.y),'tap');assert(g.web147,'four taps');C.ZF.hazardTap144(e.x,e.y);assert(!g.web147&&g.hang.every(e=>!e.hazard144)&&g.remaining===total,'five release');console.log(n,'removed action, web persistence, scissors, five taps PASS');
}
`);
