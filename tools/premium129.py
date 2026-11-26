from PIL import Image
import numpy as np
from scipy.ndimage import label,binary_fill_holes
from pathlib import Path
import sys
im=Image.open(sys.argv[1]).convert('RGB'); a=np.array(im).astype(float)
# background is near pure green; preserve enclosed green details and natural leaves
r,g,b=a.transpose(2,0,1); bg=(g>175)&(r<65)&(b<65)&(g>r*2.7)&(g>b*2.7)
l,n=label(~bg); counts=np.bincount(l.ravel()); ids=[i for i in range(1,len(counts)) if counts[i]>5000]; print(len(ids),[(i,int(counts[i])) for i in ids]);
objects=[]
for i in ids:
 y,x=np.where(l==i); objects.append((x.mean(),y.mean(),i))
objects.sort(key=lambda p:p[1]); rows=[sorted(objects[i:i+6]) for i in range(0,len(objects),6)]; assert len(objects)==24
names='strawberry banana grapes orange watermelon pineapple plum apple mangosteen star_fruit kiwi pear blueberries dragon_fruit mango peach cherries pomegranate lemon lime fig apricot coconut_cut papaya_cut'.split()
for name,(_,_,i) in zip(names,sum(rows,[])):
 mask=binary_fill_holes(l==i); y,x=np.where(mask); box=(x.min(),y.min(),x.max()+1,y.max()+1); rgba=np.dstack((a.astype('uint8'),mask.astype('uint8')*255)); out=Image.fromarray(rgba).crop(box); out.thumbnail((160,160),Image.Resampling.LANCZOS); out.save(Path(__file__).resolve().parents[1]/'www/assets/fruits'/f'{name}.png',optimize=True); print(name,box,out.size)
