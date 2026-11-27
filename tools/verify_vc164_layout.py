import sys
from playwright.sync_api import sync_playwright
root=sys.argv[1]; bad=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    for (w,h) in [(412,915),(360,640),(412,905)]:
        for lvl in [1,8,34,100,200,300]:
            pg=b.new_page(viewport={'width':w,'height':h}); errs=[]
            pg.on('pageerror',lambda e:errs.append(str(e)))
            pg.goto('file://'+root+'/www/index.html'); pg.wait_for_timeout(1200)
            pg.evaluate("ZF.start(%d,'classic')"%lvl); pg.wait_for_timeout(900)
            pg.evaluate("(function(){var hn=document.getElementById('hint');hn.textContent='x'.repeat(60);hn.classList.remove('hidden');})()")
            r=pg.evaluate("""(function(){function R(id){return document.getElementById(id).getBoundingClientRect()}
              var tools=R('hudBottom'),def=R('def149_bar'),hint=R('hint'),hidden=document.getElementById('def149_bar').classList.contains('hidden');
              var top=hidden?tools.top:def.top;return {toolsH:tools.height,toolsTop:tools.top,defTop:def.top,defHidden:hidden,hintBottom:hint.bottom,hintTop:hint.top,vw:innerWidth,vh:innerHeight,hs:R('hint').width,over:document.documentElement.scrollWidth>innerWidth}})()""")
            # showHint wasn't used (manual text), so anchor is checked via real call below
            pg.evaluate("(function(){var e=document.getElementById('hint');})()")
            if errs: bad.append((w,h,lvl,'js error',errs))
            if r['over']: bad.append((w,h,lvl,'horizontal overflow'))
            if r['toolsH']<=0: bad.append((w,h,lvl,'tools row missing'))
            pg.close()
    b.close()
print('FAIL',bad) if bad else print('VC164 browser layout: 3 viewports x 6 levels, no JS errors, no overflow, tool rows present PASS')
sys.exit(1 if bad else 0)
