from PIL import Image
import numpy as np
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'www/assets/el'
im=Image.open(p/'monkey.png').convert('RGBA'); w,h=im.size
# Smooth inverse deformation, anchored at shoulders and hips. Preserve original fur texture.
y,x=np.mgrid[0:h,0:w].astype(float)
for i in range(12):
 t=2*np.pi*i/12
 arm=np.clip((x-265)/150,0,1)*np.exp(-((y-112)/45)**2)
 legs=np.clip((y-135)/95,0,1)*np.exp(-((x-155)/135)**2)
 tail=np.exp(-((x-43)/48)**2-((y-55)/70)**2)
 dx=legs*10*np.sin(t+(x>155)*np.pi)+arm*5*np.cos(t)
 dy=arm*15*np.sin(t)+tail*7*np.cos(t)+legs*5*np.cos(t+(x>155)*np.pi)
 # mesh warp with bilinear sampling
 mesh=[]
 for yy in range(0,h,8):
  for xx in range(0,w,8):
   X=min(xx+8,w);Y=min(yy+8,h)
   def q(a,b):
    j=min(b,h-1);k=min(a,w-1);return (a-dx[j,k],b-dy[j,k])
   mesh.append(((xx,yy,X,Y),q(xx,yy)+q(xx,Y)+q(X,Y)+q(X,yy)))
 im.transform(im.size,Image.Transform.MESH,mesh,Image.Resampling.BICUBIC).save(p/f'monkey140_{i}.png',optimize=True)
