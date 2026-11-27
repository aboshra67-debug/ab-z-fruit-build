# VC171 – merge fix for shaped fruit
Cause: since VC167 fruit colliders follow the sprite shape; pomegranate (2.16r) and dragon fruit (2.28r) rest farther apart than the old circle distance (`G.r*BODY_K*2*1.06`), so touching pairs never merged and the 15 s grace started.
Fix (game.js, update merge loop): same kind AND both in the channel AND (old distance OR real body contact via `Matter.Collision.collides`, only checked when centres are within 1.5*DRAW_K*r). Kind check unchanged: different kinds never merge.
Tests: `tools/verify_vc171.js` – 22 kinds x 4 angles merge; 22 different-kind pairs never merge. Regression 153/154/161/162/165/166/166_shapes/169/170/136/139/148-151/155/160/121_early/132 PASS. 159 and 134 fail identically on VC170 (pre-existing, 159 expects the pre-grace instant loss).
Not tested: real device.
