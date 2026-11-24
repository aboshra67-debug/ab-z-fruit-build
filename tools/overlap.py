import sys
from playwright.sync_api import sync_playwright
url='file:///home/claude/zfruit/www/index.html'
JS="""
(n)=>{
  ZF.start(n); const G=ZF.G; let minRatio=9, worst=null, steps=0, cross=0;
  const br=(G.br||G.r*0.9);
  while(G.state==='play' && steps<600){
    steps++;
    const f=G.hang.filter(e=>!e.bomb&&!e.caged&&!e.stung);
    // drop 3 random fruits quickly like a fast player
    for(let k=0;k<3&&f.length;k++){ const e=f.splice(Math.floor(Math.random()*f.length),1)[0]; ZF.release(e); }
    for(let t=0;t<8;t++){
      ZF.advance(0.06);
      const d=G.dyn;
      for(let i=0;i<d.length;i++)for(let j=i+1;j<d.length;j++){
        const a=d[i].body.position,b=d[j].body.position; const dist=Math.hypot(a.x-b.x,a.y-b.y);
        const ratio=dist/(2*br); if(ratio<minRatio){minRatio=ratio;worst=[Math.round(a.x),Math.round(a.y),Math.round(b.x),Math.round(b.y)];}
      }
      // fruit in channel zone with x offset exceeding channel
      d.forEach(e=>{const p=e.body.position; if(p.y>G.mouthY+br && Math.abs(p.x-360)>G.cw/2) cross++;});
    }
    if(G.hang.filter(e=>!e.bomb).length===0&&G.dyn.length===0)break;
  }
  return {n,state:G.state,r:G.r,cw:G.cw,cap:G.cfg.cap,minRatio:+minRatio.toFixed(2),worst,cross,steps};
}
"""
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':412,'height':915}); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(1200)
    for n in [int(x) for x in sys.argv[1:]] or [1,6]:
        for t in range(3): print(pg.evaluate(JS,n))
    print(errs); b.close()
