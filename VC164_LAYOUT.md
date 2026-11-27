# VC164 — 1.7.1
Safe patch from VC163 (lower-screen layout only). No gameplay, physics, level, save, attack, defense or adaptive rule changes. Native code unchanged (classes.dex identical to VC163).
- Basket artwork width cap 43% -> 47% of board width, still bounded by the real room above the footer (`basketGeometry158`); channel width and capacity untouched.
- `drawSand164`: quiet sand decoration (pebbles, grass tufts) beside the channel and basket; canvas-only, no bodies, no input.
- Tool rows: gap between the scissors/shop row and the seven-tool row 5px -> 8px (`dockHeight161`, `positionRails154`), tool gap 4px, shop row gap 6px. Button IDs, order, sizes and behaviour unchanged.
- Hint: compact capsule anchored just above the buttons (`hintAnchor164`, called from `showHint` and `positionRails154`), instead of the top of the screen.
- Version code 164 / name 1.7.1.
Checks (Node, 412x915 and 360x640): verify_vc162, 161 (updated to the 8px row gap), 160, 159, 155, 154, 153; 412x915 also vc152, 149, 150, 151, 148. verify_vc157 at 412x915 and verify_vc141-147 fail identically on untouched VC163 (legacy tests). New `tools/verify_vc164_layout.py` (headless Chrome, 3 viewports x 6 levels, no JS errors/overflow). Visual renders in headless Chrome only; no real phone test, no FPS measurement.
Build: Gradle 8.7 / Java 17 on GitHub Actions (branch vc164-build, workflow build-vc164.yml, no KS_PASS so the shared test key signs it). apksigner: v2 verified, cert SHA-256 8a9d7359216034cd71d2060fbbad454ace828124c0d3691636f3d53df914a28a (same as VC163); zipalign OK; package com.absoftware.zfruit, versionCode 164. APK assets equal www byte-for-byte; only game.js and style.css differ from VC163. Signing key not included.
