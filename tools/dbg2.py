from playwright.sync_api import sync_playwright
url='file:///home/claude/zfruit/www/index.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':412,'height':915})
    pg.goto(url); pg.wait_for_timeout(1200)
    print(pg.evaluate("""()=>{ZF.start(8); const G=ZF.G; 
      const f=G.hang.find(e=>!e.bomb); f.x=150; f.y=560; ZF.release(f);
      const out=[]; for(let i=0;i<12;i++){ZF.advance(0.25); const p=f.body.position; out.push([Math.round(p.x),Math.round(p.y),+f.body.speed.toFixed(2), f.body.isSleeping]);}
      return {slopeTop:G.slopeTopY, mouth:G.mouthY, chL:G.chL, out}}"""))
    b.close()
