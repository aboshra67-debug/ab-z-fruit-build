import sys, json
from playwright.sync_api import sync_playwright
url='file:///home/claude/zfruit/www/index.html'
SOLVER = """
(n)=>{
  ZF.start(n); const G=ZF.G; let steps=0;
  const info={n, r:G.r, cap:G.cfg.cap, total:G.total, obst:G.obst.length};
  function free(e){return e.state==='hang'&&!e.bomb&&!e.caged&&!e.stung;}
  while(G.state==='play' && steps<4000){
    steps++;
    // bombs: defuse
    for(const e of G.hang.slice()) if(e.bomb) ZF.release(e);
    if(G.bird && G.bird.state!=='warn' && G.bird.state!=='leave'){ const bb=G.bird; const ev={clientX:bb.x*(412/720), clientY:0}; }
    // scare bird / bees like a player would
    if(G.bird && (G.bird.state==='fly'||G.bird.state==='carry')) { try{ ZF.scare(); }catch(e){} }
    for(const b of G.bees.slice()) { if(b.target){b.target.stung=false;b.target.taken=false;} b.state='leave'; }
    const dynKinds={}; G.dyn.forEach(d=>{dynKinds[d.kind]=(dynKinds[d.kind]||0)+1;});
    let acted=false;
    // channel top fruit
    const ch=G.dyn.filter(e=>e.body.speed<0.5).sort((a,b)=>a.body.position.y-b.body.position.y);
    if(G.dyn.length===0 || ch.length===G.dyn.length){
      const top=ch[0];
      if(top){ const tw=G.hang.find(e=>free(e)&&e.kind===top.kind); if(tw){ZF.release(tw);acted=true;} }
      if(!acted){ // start a new pair among free fruits
        const f=G.hang.filter(free); 
        for(const a of f){ const b=f.find(x=>x!==a&&x.kind===a.kind); if(b){ZF.release(a); ZF.advance(0.9); ZF.release(b); acted=true; break;} }
      }
    }
    ZF.advance(0.5);
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
