import sys
from playwright.sync_api import sync_playwright
exec(open('solve.py').read().split("levels=")[0])
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':412,'height':915})
    pg.goto(url); pg.wait_for_timeout(1200)
    pg.evaluate("""()=>{window.__lost=[];}""")
    r=pg.evaluate(SOLVER,int(sys.argv[1]))
    print(r)
    print(pg.evaluate("""()=>{const G=ZF.G; return {lost:G.lostLog, dyn:G.dyn.map(e=>[e.kind,Math.round(e.body.position.x),Math.round(e.body.position.y),+e.body.speed.toFixed(2)]), geom:[G.chL,G.chR,G.mouthY,G.floorY,G.r], hang:G.hang.map(e=>[e.kind,e.caged,e.stung,e.bomb,e.cageHp,Math.round(e.x),Math.round(e.y)]), rem:G.remaining, popped:G.popped, total:G.total}}"""))
    b.close()
