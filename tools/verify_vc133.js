const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
function check(x,m){if(!x)throw Error(m)}
C.ZF.start(120);let g=C.ZF.G,e=g.hang.find(e=>C.ZF.isVisible(e)&&!e.bomb&&!e.caged&&!e.plate);e.ice=true;e.iceUntil=5;check(!C.ZF.release(e),'ice lock');C.ZF.advance(4.9);check(e.ice,'early thaw');C.ZF.advance(.2);check(!e.ice,'auto thaw');C.ZF.save.coins=100;C.ZF.arm133('freeze');check(g.freezeUntil>g.time&&C.ZF.save.coins===75,'freeze');C.ZF.advance(5.1);check(g.freezeUntil<g.time,'freeze ends');C.ZF.render();console.log('ice 5s, freeze 5s, coin debit PASS');
for(let n=1;n<=300;n++){C.ZF.start(n);check(C.ZF.G.n===n,'level');}console.log('300 levels initialize PASS');
`);
