"""Generate original 2D articulated poses using the project's existing monkey art.
No external model or rig is claimed. Reproducible with Pillow, NumPy, SciPy and OpenCV.
"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy.interpolate import RBFInterpolator
import cv2, json, math
root=Path(__file__).resolve().parents[1]/'www/assets/el'
base=Image.open(root/'monkey.png').convert('RGBA')
assert base.size==(440,244),base.size
# Padded canvas prevents limbs or tail from being clipped.
pad=np.array([35,42]); w,h=510,328
im=Image.new('RGBA',(w,h)); im.paste(base,tuple(pad))
a=np.asarray(im).astype(np.float32)/255
# Premultiplied interpolation prevents dark or colored transparency fringes.
a[:,:,:3]*=a[:,:,3:4]
# Original-art landmarks: torso/head, tail, each visible leg and reaching arm.
pts={
 'back':(162,54),'chest':(230,91),'belly':(184,129),'hip':(108,105),
 'neck':(250,68),'head':(280,40),'muzzle':(322,67),'ear':(258,38),
 'tailbase':(81,108),'tailbend':(28,115),'taillow':(11,76),'tailmid':(28,30),'tailtop':(61,10),'tailtip':(93,29),
 'rearhip':(103,115),'rearknee':(78,158),'rearankle':(31,192),'rearfoot':(49,230),
 'farhip':(166,134),'farknee':(170,167),'farankle':(151,207),'farfoot':(193,225),
 'frontshoulder':(230,113),'frontelbow':(238,156),'frontwrist':(264,215),'frontfoot':(299,230),
 'reachshoulder':(253,92),'reachelbow':(293,131),'reachwrist':(386,112),'reachhand':(421,91),
 }
keys=list(pts); src=np.array([pts[k] for k in keys],float)+pad
# Boundary anchors hold the empty padding steady.
border=np.array([(0,0),(w/2,0),(w-1,0),(0,h/2),(w-1,h/2),(0,h-1),(w/2,h-1),(w-1,h-1)],float)
y,x=np.mgrid[0:h:3,0:w:3]; grid=np.stack([x.ravel(),y.ravel()],axis=1)
# Full-resolution inverse map obtained from smooth, coarse displacement field.
poses={}
for i in range(16):
 t=2*math.pi*i/16; s=math.sin(t); c=math.cos(t); tuck=(1-c)/2
 d={k:np.zeros(2) for k in keys}
 # Overhead hand remains fixed. The other arm reaches and bends; legs and tail lag the swing.
 d.update(rearknee=np.array([15*tuck,-9*tuck]),rearankle=np.array([27*tuck,-15*tuck]),rearfoot=np.array([34*tuck,-21*tuck]),farknee=np.array([8*tuck,-7*tuck]),farankle=np.array([17*tuck+5*s,-17*tuck]),farfoot=np.array([22*tuck+6*s,-22*tuck]),frontelbow=np.array([3*s,-6*tuck]),frontwrist=np.array([7*s,-8*tuck]),frontfoot=np.array([10*s,-12*tuck]),head=np.array([2*s,2*tuck]),muzzle=np.array([3*s,2*tuck]),ear=np.array([s,2*tuck]))
 for j,k in enumerate(['tailbend','taillow','tailmid','tailtop','tailtip'],1):
  d[k]=np.array([j*1.5*math.sin(t-j*.15),j*2.4*math.sin(t-j*.23)])
 dst=src+np.array([d[k] for k in keys]); all_dst=np.vstack([dst,border]); all_src=np.vstack([src,border]); field=RBFInterpolator(all_dst,all_src-all_dst,kernel='thin_plate_spline',smoothing=0.0)(grid).reshape(y.shape+(2,))
 field=cv2.resize(field,(w,h),interpolation=cv2.INTER_CUBIC).astype(np.float32)
 yy,xx=np.mgrid[:h,:w].astype(np.float32); warped=cv2.remap(a,xx+field[:,:,0],yy+field[:,:,1],cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT)
 warped[:,:,:3]=np.divide(warped[:,:,:3],warped[:,:,3:4],out=np.zeros_like(warped[:,:,:3]),where=warped[:,:,3:4]>1e-5)
 out=Image.fromarray(np.round(np.clip(warped,0,1)*255).astype(np.uint8)).resize((408,262),Image.Resampling.LANCZOS)
 name=f'monkey142_{i:02d}'; out.save(root/(name+'.webp'),quality=91,method=5)
 # Grip and free hand relative to canvas center, normalized by image width.
 poses[name]=[[round(float(dst[keys.index(k)][0]/w-.5),5),round(float(dst[keys.index(k)][1]/w-h/w/2),5)] for k in ['reachhand','frontfoot']]
(root/'monkey142_anchors.json').write_text(json.dumps(poses,separators=(',',':'))+'\n')
print('Generated',len(poses),'rope poses')
