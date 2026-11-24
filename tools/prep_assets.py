import glob, os
from PIL import Image
SRC='/home/claude/assets_zip'
OUT='/home/claude/zfruit/www/assets'
def trim(im):
    bb=im.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
    return im.crop(bb) if bb else im
def defringe(im):
    # remove greenish chroma-key fringe on semi-transparent edge pixels
    px=im.load(); w,h=im.size
    for y in range(h):
        for x in range(w):
            r,g,b,a=px[x,y]
            if 0<a<255 and g>r+25 and g>b+25 and a<200:
                px[x,y]=(r,g,b,0)
    return im
def save(src,dst,maxsz,fr=False):
    im=Image.open(src).convert('RGBA')
    if fr: im=defringe(im)
    im=trim(im)
    s=maxsz/max(im.size)
    im=im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS)
    im.save(dst,optimize=True)
fruit_order=['06_strawberry','14_banana','11_grapes','09_orange','10_watermelon','15_pineapple','03_plum','13_apple',
 '07_mangosteen','08_star_fruit','17_kiwi','12_pear','26_blueberries','25_dragon_fruit','01_mango','02_peach','16_cherries',
 '21_pomegranate','18_lemon','19_lime','22_fig','04_apricot']
names=[]
for f in fruit_order:
    n=f.split('_',1)[1]; names.append(n)
    save(f'{SRC}/02_Fruits/Whole_28_Transparent_PNG/{f}.png',f'{OUT}/fruits/{n}.png',160,True)
el={'wood':'04_wooden_block_obstacle','rock':'05_rock_obstacle','cage':'06_metal_cage_obstacle','bird1':'07_bird_wings_up','bird2':'08_bird_wings_level','bird3':'09_bird_wings_down',
 'bee':'10_bee','bomb':'11_bomb_fruit_fuse','mystery':'12_mystery_fruit_question','heart':'13_heart_life','star':'14_gold_star','coin':'15_coin_star',
 'sparkle':'16_sparkle_burst','ring':'17_star_ring_effect','pop':'18_yellow_pop_effect','splash':'19_fruit_pop_splash','smoke':'26_smoke_puff','shards':'25_shards_sparkle'}
for k,v in el.items(): save(f'{SRC}/03_Game_Elements/Individual_Transparent_PNG/{v}.png',f'{OUT}/el/{k}.png',200)
ui=['back','close','settings','trash','trash_ad','plus','plus_ad','shuffle','shuffle_ad','sound_on','sound_off','play','pause','replay','home','share','lock','crown','leaderboard_trophy','next_level','reward_ad','heart_lives']
for k in ui: save(f'{SRC}/04_UI_Icons/Individual_Transparent_PNG/{k}.png',f'{OUT}/ui/{k}.png',128)
open('/home/claude/zfruit/tools/fruit_names.txt','w').write(','.join(names))
print(names)
