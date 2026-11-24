import glob, json, re, os, sys
sys.path.insert(0,'/home/claude/zfruit/tools')
from PIL import Image
SRC='/home/claude/assets_zip/02_Fruits/Sliced_28_Transparent_PNG'
OUT='/home/claude/zfruit/www/assets/fruits'
def trim(im):
    bb=im.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
    return im.crop(bb) if bb else im
def defringe(im):
    px=im.load(); w,h=im.size
    for y in range(h):
        for x in range(w):
            r,g,b,a=px[x,y]
            if 0<a<255 and g>r+25 and g>b+25 and a<200: px[x,y]=(r,g,b,0)
    return im
def avg(im):
    px=im.load(); w,h=im.size; R=G=B=N=0
    for y in range(0,h,2):
        for x in range(0,w,2):
            r,g,b,a=px[x,y]
            if a>200: R+=r;G+=g;B+=b;N+=1
    return '#%02x%02x%02x'%(R//N,G//N,B//N)
s=open('/home/claude/zfruit/www/fruits.js').read()
whole=json.loads(s[s.index('['):s.rindex(']')+1])
whole=[w for w in whole if not w['n'].endswith('_cut')]
cuts=[]
for f in sorted(glob.glob(SRC+'/*.png')):
    n=os.path.basename(f)[3:-11]
    im=Image.open(f).convert('RGBA'); im=defringe(im); im=trim(im)
    sc=160/max(im.size); im=im.resize((max(1,round(im.width*sc)),max(1,round(im.height*sc))),Image.LANCZOS)
    im.save(f'{OUT}/{n}_cut.png',optimize=True)
    cuts.append({'n':n+'_cut','c':avg(im),'f':n})
for w in whole: w['f']=w['n']
open('/home/claude/zfruit/www/fruits.js','w').write('window.ZF_FRUITS='+json.dumps(whole+cuts)+';\n')
print(len(whole),len(cuts))
