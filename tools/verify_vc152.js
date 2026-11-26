const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
const z=C.ZF,assert=(v,m)=>{if(!v)throw Error(m)};
const bands=[[1,20,24,60,0,2,0,0],[21,50,60,100,1,3,1,1],[51,100,100,140,2,4,1,2],[101,150,140,180,3,5,2,3],[151,200,180,220,4,6,2,3],[201,250,220,260,5,7,3,4],[251,300,260,300,6,8,3,4]];
let previous=0, reduced=0, rows=[];
for(let n=1;n<=300;n++){
 let c=C.ZF_LEVELS.gen(n),b=bands.find(b=>n>=b[0]&&n<=b[1]);
 assert(c.count>=b[2]&&c.count<=b[3]&&c.count%2===0&&c.count>=previous,'count '+n);previous=c.count;
 assert(c.barrier152>=b[4]&&c.barrier152<=b[5]&&c.wood+c.rock+Number(c.divider)===c.barrier152,'barriers '+n);
 assert(c.action143.sequence.length>=b[6]&&c.action143.sequence.length<=b[7]&&new Set(c.action143.sequence).size===c.action143.sequence.length,'actions '+n);
 assert(c.action143.sequence.every(k=>['monkey','falcon','bee','wind','spider','vortex'].includes(k)),'types '+n);
 z.start(n);let g=z.G;assert(g.total===c.count&&g.remaining===c.count&&g.order.length===c.count,'real count '+n);
 let pairs={};g.order.forEach(e=>{let a=pairs[e.pairId]??=[];a.push(e.kind)});assert(Object.values(pairs).every(a=>a.length===2&&a[0]===a[1]),'pairs '+n);
 let actual=g.obst.length+Number(!!g.divider);if(actual<c.barrier152)reduced++;assert(actual<=c.barrier152,'actual obstacles '+n);
 for(let o of g.obst){assert(o.x>=100&&o.x<=620,'edge '+n);assert(Number.isFinite(o.y),'position '+n);}
 for(let i=0;i<g.obst.length;i++)for(let j=i+1;j<g.obst.length;j++){let a=g.obst[i],b=g.obst[j];assert(Math.hypot(a.x-b.x,a.y-b.y)>a.size/2+b.size/2+g.r*2.2,'obstacle clearance '+n);}
 if([1,20,21,50,51,100,150,200,250,300].includes(n))rows.push([n,c.count,c.barrier152,actual,c.action143.sequence.join('/')]);
}
console.log(JSON.stringify({rows,reduced}));
for(let n of [1,10,20]){z.start(n);z.advance(30);assert(!z.G.actionIndex134&&!z.G.bird&&!z.G.monkey134&&!z.G.hazard144&&!z.G.bees.length,'tutorial scheduled attack '+n);}
for(let n of [21,50,100,150,200,250,300]){z.start(n);let g=z.G,p=g.cfg.action143;g.actionIndex134=p.maxAttacks;g.actionAt133=.001;z.advance(.05);assert(g.actionIndex134===p.maxAttacks&&!g.bird&&!g.monkey134&&!g.hazard144,'bounded schedule '+n);}
console.log('300 levels initialized: pairs, counts, attack allocation and obstacle clearance PASS; tutorial and attack cap PASS');
`);
