from playwright.sync_api import sync_playwright
url='file:///home/claude/zfruit/www/index.html'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox','--allow-file-access-from-files'])
    pg=b.new_page(viewport={'width':412,'height':915})
    pg.goto(url); pg.wait_for_timeout(1200)
    print(pg.evaluate("""()=>{ZF.start(8); const G=ZF.G; 
      const f=G.hang.find(e=>!e.bomb); f.x=150; f.y=560; ZF.release(f); ZF.advance(2);
      const bs=G.engine.world.bodies; const pairs=G.engine.pairs.list.filter(p=>p.isActive).map(p=>[p.bodyA.label,Math.round(p.bodyA.position.x),Math.round(p.bodyA.position.y),+p.bodyA.angle.toFixed(2),p.bodyB.label, p.friction, p.frictionStatic]);
      return {pairs, fr:[f.body.friction,f.body.frictionStatic], gs:G.engine.gravity, fruitPos:f.body.position, bodies:bs.map(b=>[b.label,Math.round(b.position.x),Math.round(b.position.y),+b.angle.toFixed(2),b.bounds.min.x|0,b.bounds.max.x|0,b.bounds.min.y|0,b.bounds.max.y|0])}}"""))
    b.close()
