const fs=require('fs'),path=require('path'),vm=require('vm');
const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
eval(h+`
function check(ok,msg){if(!ok)throw Error(msg);}
C.ZF.start(12);let g=C.ZF.G;g.beeT=0;C.ZF.advance(.05);let b=g.bees[0];check(b,'bee missing');b.x=b.target.x;b.y=b.target.y-4;C.ZF.advance(.05);let e=b.target;check(e.stung&&e.taken&&e.state==='hang','bee must block target');check(!C.ZF.release(e),'bee lock ignored');C.ZF.advance(3.2);check(!e.stung&&!e.taken&&e.state==='hang','bee lock not released');console.log('Bee lock blocks tap temporarily, releases without auto-drop PASS');
C.ZF.start(12);g=C.ZF.G;g.remaining=Math.floor(g.total*.65);C.ZF.advance(.05);b=g.bird;check(b,'bird missing');e=b.target;b.state='fly';b.x=e.x;b.y=e.y;C.ZF.advance(.05);check(e.birdHeld&&e.state==='hang','bird lock missing');let x=e.x,y=e.y;check(!C.ZF.release(e),'held fruit accepted');C.ZF.advance(2.15);check(!e.birdHeld&&!e.taken&&e.state==='hang'&&e.x===x&&e.y>=y,'bird forced drop or movement');console.log('Bird timeout returns control without launching fruit PASS');
`);
