from playwright.sync_api import sync_playwright
url='file:///home/claude/zfruit/www/index.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':412,'height':915},device_scale_factor=1.3)
    errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(1300)
    pg.evaluate("ZF.save.unlocked=60; ZF.start(40)"); pg.wait_for_timeout(600); pg.screenshot(path='/tmp/g40.png')
    print(errs); b.close()
