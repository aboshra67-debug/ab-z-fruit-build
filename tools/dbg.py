import sys
from playwright.sync_api import sync_playwright
exec(open('solve.py').read().split("levels=")[0])
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':412,'height':915})
    pg.goto(url); pg.wait_for_timeout(1200)
    pg.evaluate(SOLVER,8)
    print(pg.evaluate("""()=>{const G=ZF.G; return {geom:{chL:G.chL,chR:G.chR,mouth:G.mouthY,floor:G.floorY,r:G.r,cw:G.cw},obst:G.obst.map(o=>[o.type,Math.round(o.x),Math.round(o.y)]),dyn:G.dyn.map(e=>[e.kind,Math.round(e.body.position.x),Math.round(e.body.position.y),+e.body.speed.toFixed(2)])}}"""))
    pg.screenshot(path='/tmp/dbg8.png')
    b.close()
