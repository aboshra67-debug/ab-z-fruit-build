const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
function check(x,m){if(!x)throw Error(m)}
for(let n=1;n<=300;n++){C.ZF.start(n);check(C.ZF.G.n===n,'level');}console.log('300 levels initialize PASS');
C.ZF.start(1);let g=C.ZF.G;C.ZF.save.coins=0;C.ZF.arm133('freeze');check(g.freezeUntil>g.time&&C.ZF.save.coins===0,'free freeze');C.ZF.advance(5.1);check(g.freezeUntil<g.time,'freeze ends');C.ZF.action134('ice');let e=g.hang.find(e=>e.ice);check(e&&!C.ZF.release(e),'ice');C.ZF.advance(5.1);check(!e.ice,'thaw');C.ZF.start(1);g=C.ZF.G;C.ZF.action134('falcon');check(g.bird,'falcon');C.ZF.render();C.ZF.start(1);g=C.ZF.G;C.ZF.action134('monkey');check(g.monkey134,'monkey');C.ZF.render();C.ZF.advance(1.7);check(g.monkey134.done,'monkey action');C.ZF.action134('wind');check(g.wind134>g.time,'wind');C.ZF.render();console.log('free freeze, ice, falcon, monkey, wind PASS');
`);
