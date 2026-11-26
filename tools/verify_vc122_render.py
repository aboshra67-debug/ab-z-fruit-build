from pathlib import Path
import mimetypes,base64,re,json
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent.parent/'www'
assets={str(f.relative_to(root)):'data:'+ (mimetypes.guess_type(f.name)[0] or 'application/octet-stream')+';base64,'+base64.b64encode(f.read_bytes()).decode() for f in (root/'assets').rglob('*') if f.is_file()}
html=(root/'index.html').read_text(); html=re.sub(r'<link[^>]*href="style.css"[^>]*>',lambda m:'<style>'+ (root/'style.css').read_text()+'</style>',html); html=re.sub(r'<script src="([^"]+)"\s*></script>',lambda m:'<script>'+ (root/m.group(1)).read_text()+'</script>',html)
html=html.replace('<head>','<head><script>window.requestAnimationFrame=()=>0;const assetMap='+json.dumps(assets)+'; const desc=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,"src");Object.defineProperty(HTMLImageElement.prototype,"src",{get:desc.get,set(v){this.zfPath=v;desc.set.call(this,assetMap[v]||v)}});</script>',1)
html=re.sub(r'(src="|url\([\'\"]?)(assets/[^\"\'\)]+)',lambda m:m.group(1)+assets.get(m.group(2),m.group(2)),html)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for w,h in [(412,915),(360,640),(699,1536)]:
        page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html);page.wait_for_timeout(1100)
        page.evaluate('''() => {
          window.spriteDraws=[]; const proto=CanvasRenderingContext2D.prototype, orig=proto.drawImage;
          proto.drawImage=function(im,...a){
            if(this.canvas.id==='cv' && im.zfPath && /assets\\/(fruits\\/|el\\/(bomb|mystery)\\.png)/.test(im.zfPath) && a.length===4){
              let t=this.getTransform(),[x,y,w,h]=a, ps=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([u,v])=>t.transformPoint(new DOMPoint(u,v)));
              let sc=innerWidth/720, H=Math.round(Math.min(1700,Math.max(1200,innerHeight/sc))), off=(innerHeight-H*sc)/2;
              spriteDraws.push({src:im.zfPath.split('/').pop(), top:(Math.min(...ps.map(p=>p.y))-off)/sc});
            } return orig.call(this,im,...a);
          };
        }''')
        result=page.evaluate('''() => {
          const assert=(c,m)=>{if(!c)throw Error(m)};
          let count=0, hidden=0;
          for(let n of [1,10,12,13,16,45,80,117,300]){
            ZF.start(n);let g=ZF.G;
            for(let step=0;step<3;step++){
              spriteDraws.length=0; ZF.render();
              for(let d of spriteDraws)assert(d.top>=g.topY+.95,'clipped '+n+' '+JSON.stringify(d));
              assert(spriteDraws.length===g.hang.filter(ZF.isVisible).length,'draw and visibility disagree '+n+' '+spriteDraws.length+' '+g.hang.filter(ZF.isVisible).length);
              count+=spriteDraws.length;
              let e=g.hang.find(e=>!ZF.isVisible(e)&&!e.bomb);if(e){assert(!ZF.release(e),'hidden selectable');hidden++;}
              const coords=g.hang.map(e=>[e.x,e.y]);ZF.render();assert(g.hang.every((e,i)=>e.x===coords[i][0]&&e.y===coords[i][1]),'render moved fruit');
              ZF.advance(.1);
            }
          }
          ZF.start(13);let g=ZF.G, e=g.hang.find(e=>!e.bomb&&!e.caged&&!e.ice);g.hang=[e];e.mystery=false;e.x=360;
          for(let kind=0;kind<ZF_FRUITS.length;kind++)for(let angle of [-.36,0,.36]){
            e.kind=kind;e.visualAngle=angle;e.y=g.topY+g.r*.5;spriteDraws.length=0;ZF.render();assert(!ZF.isVisible(e)&&!spriteDraws.length,'partial visible '+kind);
            e.y=g.topY+g.r*2;spriteDraws.length=0;ZF.render();assert(ZF.isVisible(e)&&spriteDraws.length===1&&spriteDraws[0].top>=g.topY+.95,'full sprite '+kind);count++;
          }
          return {draws:count,hiddenChecks:hidden,assets:ZF_FRUITS.length};
        }''')
        assert not errors,errors
        page.evaluate('ZF.start(13);ZF.render()');page.screenshot(path=f'/tmp/z122_preview_{w}.png')
        print(w,h,result,'PASS',flush=True);page.close()
    browser.close()
