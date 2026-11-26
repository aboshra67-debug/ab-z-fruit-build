const fs=require('fs'),path=require('path');const h=fs.readFileSync(path.join(__dirname,'verify_engine_node.js'),'utf8').split('let solver=')[0];eval(h+`
C.ZF.start(1);let g=C.ZF.G;C.ZF.action134('bee');if(!g.bees.length)throw Error('bee missing');let b=g.bees[0],a=b.target,c=b.second,k=b.newKind;C.ZF.advance(8);if(a.kind!==k||c.kind!==k)throw Error('pair not converted');console.log('level 1 manual bee and two conversions PASS');
`);
