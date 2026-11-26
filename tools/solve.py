import sys, json
from playwright.sync_api import sync_playwright
url='file:///home/claude/zfruit/www/index.html'
SOLVER = """
(n)=>{
  ZF.start(n); const G=ZF.G; let steps=0;
  const info={n, r:G.r, cap:G.cfg.cap, total:G.total, obst:G.obst.length};
  function free(e){return e.state==='hang'&&ZF.isVisible(e)&&!e.bomb&&!e.caged&&!e.stung;}
  while(G.state==='play' && steps<5000){
    steps++;
    for(const e of G.hang.slice()) if(e.bomb&&ZF.isVisible(e)) ZF.release(e);
    if(G.bird && (G.bird.state==='fly'||G.bird.state==='carry')) { try{ ZF.scare(); }catch(e){} }
    for(const b of G.bees.slice()) { if(b.target){b.target.stung=false;b.target.taken=false;} b.state='leave'; }
    const settled=G.dyn.every(e=>e.body.speed<0.35 && e.body.position.x>G.chL-6 && e.body.position.x<G.chR+6 && e.body.position.y>G.mouthY-G.r*0.5);
    if(settled){
      const nxt=G.order.find(free);
      if(nxt) ZF.release(nxt);
    }
    ZF.advance(0.45);
    if(G.hang.filter(e=>!e.bomb).length===0 && G.dyn.length===0) break;
  }
  info.state=G.state; if(G.state==='lost') info.dyn_pos=G.dyn.map(e=>[e.kind,Math.round(e.body.position.x),Math.round(e.body.position.y),+e.body.speed.toFixed(2)]); info.deadlock=!!G.deadlock; info.bird=G.birdDone; info.rem=G.remaining; info.time=Math.round(G.time); info.hang=G.hang.length; info.dyn=G.dyn.length; info.steps=steps; info.maxStack=G.maxStack;
  return info;
}
"""
levels=[int(x) for x in sys.argv[1:]] or [1,3,8,15,25]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':412,'height':915})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(1200)
    for n in levels:
        r=pg.evaluate(SOLVER,n); print(r)
    print('errors',errs)
    b.close()
