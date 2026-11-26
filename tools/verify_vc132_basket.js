const fs=require('fs'),path=require('path'),vm=require('vm');
const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];
eval(h+`
const B=C.Matter.Body,Comp=C.Matter.Composite;
function check(ok,msg){if(!ok)throw Error(msg);}
function fixture(n,k){C.ZF.start(n);const g=C.ZF.G;let a=g.hang.filter(e=>!e.bomb&&!e.caged&&!e.ice&&C.ZF.isVisible(e)).slice(0,k);check(a.length===k,'fixture fruits');for(const e of g.hang.slice())if(!a.includes(e)&&e.hb)Comp.remove(g.engine.world,e.hb);g.hang=a;g.order=a;return {g,a};}
function place(e,x,y){e.x=x;e.y=y;B.setPosition(e.hb,{x,y});}
let {g,a}=fixture(1,2),r=g.r;g.scroll=null;a[0].kind=a[1].kind=0;place(a[0],360,g.floorY-r*1.1);place(a[1],360,g.floorY-r*3.3-1);let before=g.remaining,first=a[0],second=a[1];check(C.ZF.release(first),'first');check(C.ZF.release(second),'second');let seen=false;for(let i=0;i<180;i++){C.ZF.advance(1/60);if(g.collecting&&g.collecting.length){seen=true;check(g.remaining===before,'premature count');C.ZF.render();}if(g.remaining===before-2)break;}check(seen&&g.remaining===before-2,'basket arrival');console.log('Basket animation and delayed count PASS');
`);
