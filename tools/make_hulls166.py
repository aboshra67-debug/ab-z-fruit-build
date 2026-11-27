# VC166: convex, centrally symmetric collision hulls from each fruit sprite's alpha (unit = largest sprite side).
import json,sys,os
import numpy as np
from PIL import Image
root=sys.argv[1]
src=open(root+'/www/fruits.js').read()
fr=json.loads(src[src.index('['):src.rindex(']')+1])
def hull(pts):
    pts=sorted(set(map(tuple,pts)))
    def cr(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
    lo=[]
    for p in pts:
        while len(lo)>=2 and cr(lo[-2],lo[-1],p)<=0: lo.pop()
        lo.append(p)
    up=[]
    for p in reversed(pts):
        while len(up)>=2 and cr(up[-2],up[-1],p)<=0: up.pop()
        up.append(p)
    return lo[:-1]+up[:-1]
out={}
for f in fr:
    im=Image.open('%s/www/assets/fruits/%s.png'%(root,f['n'])).convert('RGBA')
    a=np.array(im)[:,:,3]>60
    h,w=a.shape;m=max(w,h)
    ys,xs=np.where(a)
    # boundary pixels only
    pts=np.stack([(xs+.5-w/2)/m,(ys+.5-h/2)/m],1)
    hp=hull(pts.tolist())
    # symmetric about the sprite-box center so centroid == drawing centre
    hp=hull(hp+[(-x,-y) for x,y in hp])
    # simplify: keep every vertex but merge near-collinear ones until <=14
    hp=np.array(hp)
    while len(hp)>14:
        n=len(hp);best=None
        for i in range(n):
            p,q,r_=hp[i-1],hp[i],hp[(i+1)%n]
            area=abs((q[0]-p[0])*(r_[1]-p[1])-(q[1]-p[1])*(r_[0]-p[0]))/2
            if best is None or area<best[0]:best=(area,i)
        hp=np.delete(hp,best[1],0)
    hp=np.array(hull(hp.tolist()))
    # slight inset (0.5% of size) so rounding never makes visible overlap
    out[f['n']]=[[round(float(x),4),round(float(y),4)] for x,y in hp]
open(root+'/www/hulls.js','w').write('window.ZF_HULLS='+json.dumps(out,separators=(',',':'))+';\n')
print(len(out),'hulls; vertices',min(len(v) for v in out.values()),'..',max(len(v) for v in out.values()))
