# V1.2.0 / VC113 – Premium Gameplay

Safe patch of VC112.
- Irregular jittered fruit bands with offscreen reserve; larger target radius, lower visible target, complete fruit sprites below HUD.
- Reduced terrain footprint, brighter existing five visual themes, compact HUD, shorter channel with same four-fruit capacity.
- Obstacle positions seeded and restricted to a safe single strip. Active wood/rock counts adapt to available space; all obstacle categories retained.
- Combo: 3.2 second interval; 2 coins for each third consecutive match. Enhanced synthesized sound and juice particles.
- Loss rescue: 35 coins, removes up to three channel fruits with their matching partners; no automatic extension into HUD. Existing test ad remains a stub.
- Save key and Android package unchanged.

Verification: 300 initializations, parity and logical solution orders on 412x915 and 360x640; progressive and channel-only matching checks pass on both. Full Matter.js engine solver completed 1,6,10,25,50,117,300 on both. Solver defuses bombs and scares pests. Browser render attempt was blocked by runtime policy; no actual Android or FPS validation. Real recorded music and new background artwork not added. APK repacked from VC112, AXML version updated at typed field, v2 signed with matching existing test certificate and checked cryptographically. Not a fresh Gradle build or production signing.
