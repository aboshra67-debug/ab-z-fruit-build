const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
const assert=(v,m)=>{if(!v)throw Error(m)};
for(const n of [1,17,21,100,200,300]){
 C.ZF.start(n);let g=C.ZF.G;g.actionAt133=1e6;let total=g.remaining;C.ZF.action134('snake');let s=g.hazard144;assert(s.length>=g.r*15,'length');C.ZF.advance(4);C.ZF.render();let visible=s.points.filter(p=>p.x>=0&&p.x<=s.stopX);assert(visible.length>20,'visible span');assert(g.hang.some(e=>e.hazard144==='snake'&&e.taken),'snake lock');let x=s.x;C.ZF.advance(2);assert(s.x===x,'hold');C.ZF.advance(5);assert(!g.hazard144&&g.hang.every(e=>!e.hazard144)&&g.remaining===total,'snake clear');
 C.ZF.action134('spider');let sp=g.hazard144;assert(sp&&sp.items.length>=2,'spider start');C.ZF.advance(sp.dur+1);C.ZF.render();assert(!g.hazard144&&g.web147,'persist');let e=g.web147.items[0];assert(!C.ZF.release(e),'web blocks');C.ZF.advance(15);assert(g.web147&&e.taken,'still persists');assert(C.ZF.cutWeb147(),'scissors');assert(!g.web147&&!e.hazard144&&!e.taken,'cut release');
 C.ZF.action134('spider');sp=g.hazard144;C.ZF.advance(sp.dur+1);e=g.web147.items[0];for(let i=0;i<4;i++)assert(C.ZF.hazardTap144(e.x,e.y),'tap');assert(g.web147,'four taps');C.ZF.hazardTap144(e.x,e.y);assert(!g.web147&&g.hang.every(e=>!e.hazard144)&&g.remaining===total,'five release');console.log(n,'snake, web persistence, scissors, five taps PASS');
}
`);
