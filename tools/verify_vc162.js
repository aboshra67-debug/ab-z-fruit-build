const fs=require('fs'),path=require('path');let h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
h=h.replace('const noop=()=>{};', 'const noop=()=>{}; const transforms=[], handlers={};').replace("k==='createLinearGradient'", "k==='setTransform'? (...a)=>transforms.push(a): k==='createLinearGradient'").replace('addEventListener:noop,setAttribute:noop','addEventListener:(k,fn)=>handlers[k]=fn,setAttribute:noop');
eval(h+`
const z=C.ZF,assert=(v,m)=>{if(!v)throw Error(m)},w=C.innerWidth,vh=C.innerHeight,scale=w/720,H=Math.round(Math.max(1200,Math.min(1700,vh/scale))),off=(vh-H*scale)/2;
for(let n of [1,17,21,50,100,150,200,250,300]){
 z.start(n,'classic');const g=z.G, r=g.r, w0=Math.min(720*.43,g.cw*1.9), h=w0*.618, y=g.floorY-r*1.0-h*.43;
 transforms.length=0;z.render();const a=transforms[2],zoom=a[3]/scale;assert(zoom>=.96&&zoom<=1.27,'stretch '+n);
 let bottom=a[3]*(y+h*1.065)+a[5];let dock=off+g.dockY*scale;assert(bottom<=dock,'basket clearance '+n);assert(dock-bottom<=65*scale,'gap '+n+' '+(dock-bottom));
 const e=g.hang.filter(e=>!e.plate&&!e.bomb&&!e.caged&&!e.ice&&!e.mystery&&z.isVisible(e)).sort((a,b)=>b.y-a.y)[0];assert(e,'visible '+n);handlers.pointerdown({clientX:e.x*scale,clientY:e.y*a[3]+a[5],button:0,isPrimary:true});assert(e.state==='fall','pointer mapping '+n);
 for(let k=0;k<=3;k++){g.floorY=g.floorBase+r*2*.98*k;transforms.length=0;z.render();const a=transforms[2],w1=Math.min(720*.43,g.cw*1.9),h=w1*.618,y=g.floorY-r*1.0-h*.43;assert(a[3]*(y+h*1.065)+a[5]<=dock,'extension overlaps '+n+' '+k);}
}
console.log(w+'x'+vh+': 9 levels: rendered coordinate mapping, actual pointer release, basket/footer clearance at all four capacities PASS');
`);
