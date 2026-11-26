# VC141 / 1.4.8 — articulated monkey motion
Baseline: exact VC140 ANIMATION SAFE SOURCE + signed VC140 APK. Package com.absoftware.zfruit.
- 24 jump and 12 grasp poses derived from the existing artwork via separately controlled limb, head and tail landmarks; padded canvas, WebP with alpha. Not Monkey B3 or a real 3D rig (external model unavailable).
- Two ballistic-style hops, approach from closest edge, reaching hand anchored to fruit, one release at 1.83s, exit by 2.92s. The target is checked again before release.
- All existing level files, save key zfruit_v1, Java code and other action code unchanged. No natural sound recording was added; current audio remains.
- Node syntax, simulated monkey motion levels 1/17/20/100/200/300, target invalidation, wind on levels 1/20/100/300 and falcon relocation passed. Reviewed representative sprite frames. Browser runtime blocked by environment policy; Android device runtime untested.
- APK rebuilt from existing VC140 native shell with updated web assets and manifest version values, then signed with same certificate using APK Signature Scheme v2; verified signature, content digest, certificate SHA-256, ZIP CRC, stored alignment, manifest, and all asset bytes. Native dex/resources unchanged. Not a Gradle build. No signing key in this archive.
