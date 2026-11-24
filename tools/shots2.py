from playwright.sync_api import sync_playwright
url='file:///home/claude/zfruit/www/index.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':412,'height':915},device_scale_factor=1.3)
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(1300)
    pg.evaluate("ZF.save.unlocked=60; ZF.start(45)"); pg.wait_for_timeout(600); pg.screenshot(path='/tmp/g45.png')
    pg.evaluate("ZF.start(130)"); pg.wait_for_timeout(600); pg.screenshot(path='/tmp/g130.png')
    # tap a fruit through real pointer events
    pos=pg.evaluate("(()=>{const G=ZF.G; const e=G.hang.find(f=>!f.bomb&&!f.caged); const s=412/720; const vh=915; return {x:e.x*s, y:e.y*s+(vh-G.H_*s)/2}})" ) if False else None
    pg.evaluate("ZF.start(3)"); pg.wait_for_timeout(300)
    pg.evaluate("ZF.advance(12)")
    pg.mouse.click(206,300)
    pg.evaluate("ZF.G.state='play'"); 
    pg.evaluate("(()=>{const G=ZF.G; ZF.release(G.hang[0]); ZF.release(G.hang.find(e=>e.kind===G.dyn[0].kind)); })()")
    pg.evaluate("ZF.advance(6)"); pg.wait_for_timeout(300); pg.screenshot(path='/tmp/g3.png')
    pg.evaluate("ZF.G.remaining=0; ZF.G.hang.length=0; ZF.G.dyn.length=0; ZF.advance(1)"); pg.wait_for_timeout(2200); pg.screenshot(path='/tmp/win.png')
    pg.evaluate("ZF.menu()"); pg.click('#btnLevels'); pg.wait_for_timeout(600); pg.screenshot(path='/tmp/levels.png')
    print(errs)
    b.close()
