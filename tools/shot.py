import sys, json
from playwright.sync_api import sync_playwright
url='file:///home/claude/zfruit/www/index.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':412,'height':915},device_scale_factor=1.5)
    errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(url); pg.wait_for_timeout(1500)
    pg.screenshot(path='/tmp/s_menu.png')
    pg.evaluate("ZF.start(1)"); pg.wait_for_timeout(800)
    pg.screenshot(path='/tmp/s_l1.png')
    info=pg.evaluate("({r:ZF.G.r,hang:ZF.G.hang.length,cells:0,cap:ZF.G.cfg.cap,mouth:ZF.G.mouthY,H:0})")
    print(info, errs)
    b.close()
