import sys
from playwright.sync_api import sync_playwright
url='file:///home/claude/zfruit/www/index.html'
n=int(sys.argv[1])
JS="""
(n)=>{ZF.start(n);const G=ZF.G;let out=null;
 function free(e){return e.state==='hang'&&!e.bomb&&!e.caged&&!e.stung;}
 for(let st=0;st<400;st++){
   for(const e of G.hang.slice()) if(e.bomb) ZF.release(e);
   const settled=G.dyn.every(e=>e.body.speed<0.35 && e.body.position.x>G.chL-6 && e.body.position.x<G.chR+6 && e.body.position.y>G.mouthY-G.r*0.5);
   if(settled){const nx=G.order.find(free); if(nx){ZF.release(nx);}}
   ZF.advance(0.45);
   if(G.state!=='play')break;
   if(st>30 && G.dyn.length && G.dyn.every(e=>e.body.speed<0.35 && !(e.body.position.x>G.chL-6&&e.body.position.x<G.chR+6&&e.body.position.y>G.mouthY-G.r*0.5))){
     // stuck for 6s?
     ZF.advance(6);
     if(G.dyn.every(e=>e.body.speed<0.35)){
       out={dyn:G.dyn.map(e=>[e.kind,Math.round(e.body.position.x),Math.round(e.body.position.y)]),r:G.r,mouth:G.mouthY,chL:G.chL,chR:G.chR,
         near:G.dyn.map(d=>G.hang.filter(h=>Math.hypot(h.x-d.body.position.x,h.y-d.body.position.y)<G.r*3).map(h=>[Math.round(h.x),Math.round(h.y),h.kind,h.caged?'cg':'',h.stung?'st':''])),
         obst:G.obst.map(o=>[o.type,Math.round(o.x),Math.round(o.y)]), ord:G.order.find(free)&&[G.order.find(free).ord,Math.round(G.order.find(free).x),Math.round(G.order.find(free).y)]};
       break;}
   }
 }
 return out||{state:G.state,rem:G.remaining};}
"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':412,'height':915}); pg.goto(url); pg.wait_for_timeout(1000)
    print(pg.evaluate(JS,n)); b.close()
