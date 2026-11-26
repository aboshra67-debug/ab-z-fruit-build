# V1.2.9 / VC122 — upper-edge fruit clipping
Base: VC121. Narrow rendering and input-visibility patch.
- Hide reserve fruit until its aspect-fitted rotated sprite and applicable outline fit below the existing top clip. Hidden fruit is not selectable. Full sprite is rendered at its actual position; no coordinate or physics changes. Dynamic fruits also use a top-bound rendering guard.
- No modification to feed motion, speed, layout, level counts, matching, collision, save data, fruit art or obstacles. Some marginal fruit previously shown as fragments now remain hidden until fully inside the playfield.
- Browser tests with real sprite assets: 50 types, three rotations, three viewport sizes (412x915, 360x640, 699x1536); nine sampled stages and multiple frames; no top clipping. See tools/results/vc122_render.log.
- Node tests: 300 initializations, exact counts/pairs, hidden input, natural reserve feed, matching and overflow on two sizes; motion fixtures passed. Separate difficulty run did not finish; no claim of a new full end-to-end run of all stages.
- APK: prior VC121 package updated with exact web assets and binary version fields, signed v2 and verified with matching original certificate and package data. No fresh Gradle build or physical Android device test.
