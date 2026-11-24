from playwright.sync_api import sync_playwright
url='file:///home/claude/zfruit/www/index.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':412,'height':915})
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(1500)
    for n in (1,6,40):
        pg.evaluate(f"ZF.start({n})"); pg.wait_for_timeout(600)
        pg.screenshot(path=f'/tmp/s4_{n}.png')
    # mid-play: release some fruits at level 6
    pg.evaluate("ZF.start(6)"); 
    pg.evaluate("(()=>{const G=ZF.G;const f=G.hang.filter(e=>!e.bomb);for(let i=0;i<3;i++)ZF.release(f[i*5]);ZF.advance(1.6);})()")
    pg.wait_for_timeout(300); pg.screenshot(path='/tmp/s4_play.png')
    print(errs); b.close()
