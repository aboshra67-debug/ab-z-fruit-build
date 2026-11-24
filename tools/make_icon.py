from PIL import Image, ImageDraw, ImageFont, ImageFilter
A='/home/claude/zfruit/www/assets/'
S=1024
img=Image.new('RGBA',(S,S),(0,0,0,0))
bg=Image.new('RGBA',(S,S))
d=ImageDraw.Draw(bg)
for y in range(S):
    t=y/S; c=(int(70+90*t),int(170+60*t),int(255-20*t),255); d.line([(0,y),(S,y)],fill=c)
# hills + soil
d.ellipse([-300,640,700,1300],fill=(110,200,70,255)); d.ellipse([350,700,1400,1300],fill=(80,170,50,255))
d.polygon([(0,760),(440,1024),(0,1024)],fill=(120,80,45,255)); d.polygon([(1024,760),(584,1024),(1024,1024)],fill=(120,80,45,255))
d.rectangle([440,880,584,1024],fill=(215,245,140,255))
d.line([(0,760),(440,1010)],fill=(70,200,40,255),width=26); d.line([(1024,760),(584,1010)],fill=(70,200,40,255),width=26)
mask=Image.new('L',(S,S),0); ImageDraw.Draw(mask).rounded_rectangle([0,0,S,S],radius=210,fill=255)
img.paste(bg,(0,0),mask)
def put(name,cx,cy,size,rot=0):
    f=Image.open(A+'fruits/'+name+'.png').convert('RGBA'); s=size/max(f.size); f=f.resize((int(f.width*s),int(f.height*s)),Image.LANCZOS)
    if rot: f=f.rotate(rot,expand=True,resample=Image.BICUBIC)
    sh=Image.new('RGBA',f.size,(0,0,0,0)); sh.paste((0,0,0,90),mask=f.getchannel('A')); sh=sh.filter(ImageFilter.GaussianBlur(10))
    img.alpha_composite(sh,(int(cx-f.width/2+8),int(cy-f.height/2+14))); img.alpha_composite(f,(int(cx-f.width/2),int(cy-f.height/2)))
put('grapes',250,640,300,-8); put('strawberry',770,620,290,10); put('orange',380,880,230); put('banana',650,900,260,-10); put('mango',512,420,420)
# ZZ letter badge
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',230)
d2=ImageDraw.Draw(img); d2.text((512,150),'Z',font=f,anchor='mm',fill=(255,214,60,255),stroke_width=14,stroke_fill=(190,80,20,255))
img.save('/home/claude/zfruit/icon_1024.png')
sizes={'mdpi':48,'hdpi':72,'xhdpi':96,'xxhdpi':144,'xxxhdpi':192}
for k,v in sizes.items():
    im=img.resize((v,v),Image.LANCZOS); im.save(f'/home/claude/zfruit/app/src/main/res/mipmap-{k}/ic_launcher.png')
img.resize((512,512),Image.LANCZOS).save('/home/claude/zfruit/store_icon_512.png')
print('ok')
