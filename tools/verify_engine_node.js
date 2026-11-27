const fs=require('fs'),vm=require('vm');
const path=require('path'); const project=path.resolve(__dirname,'..'); const root=project+'/www/';
const noop=()=>{}; const ctx=new Proxy({}, {get:(o,k)=>k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop:noop}):k==='createPattern'?()=>({}):()=>{},set:()=>true});
const nodes={}; function node(){return {style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>true},addEventListener:noop,setAttribute:noop,getContext:()=>ctx,textContent:'',children:[],appendChild:noop,scrollIntoView:noop}};
const doc={getElementById:k=>nodes[k]??=node(),documentElement:{},querySelectorAll:()=>[],createElement:node};
const C={console,document:doc,localStorage:{getItem:()=>null,setItem:noop},navigator:{},innerWidth:Number(process.env.ZF_WIDTH||412),innerHeight:Number(process.env.ZF_HEIGHT||915),devicePixelRatio:1,addEventListener:noop,requestAnimationFrame:noop,setTimeout:noop,clearTimeout:noop,Image:class{set src(s){this.complete=true;this.naturalWidth=this.width=256;this.height=256;if(this.onload)this.onload()}},Math:Object.create(Math)};
C.window=C;C.self=C;C.globalThis=C;let seed=98765;C.Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};vm.createContext(C);for(const f of ['matter.min.js','fruits.js','hulls.js','levels.js','game.js'])vm.runInContext(fs.readFileSync(root+f,'utf8'),C,{filename:f});
let solver=fs.readFileSync(project+'/tools/solve.py','utf8').split('SOLVER = """')[1].split('"""')[0];
for(const n of process.argv.slice(2).map(Number)){const res=vm.runInContext('('+solver+')('+n+')',C);C.ZF.render();console.log(JSON.stringify(res));if(res.state!=='won'||res.rem!==0)process.exitCode=1}
