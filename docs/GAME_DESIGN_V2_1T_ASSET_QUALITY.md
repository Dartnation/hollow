# HOLLOW V2.1T — ASSET QUALITY & TERRAIN REPAIR
**Creative Director design and acceptance brief · 22 November 2026**

## Status, baseline and immovable scope
- **DESIGN / NOT IMPLEMENTED.** Owner has reviewed screenshots of **V2.1S** [PR #8](https://github.com/Dartnation/hollow/pull/8) and explicitly says density/size is now satisfactory. Next is **quality of existing assets**: cleaner trees, believable forest floor, finer materials and correction of large black areas.
- Implementation base: `feature/v2.1s-clean-forest`, PR #8 head `8739b5c5a01aff3b80f0c03514c7fc587ad6464b` at review time; compare fresh head before branching.
- New implementation branch: `feature/v2.1t-asset-quality`; draft PR base `feature/v2.1s-clean-forest`. Keep PR #2/#4/#6/#8 draft, no merge.
- **DO NOT alter** tree count/density, routes, world coordinates, mission M01, house, player, monster, AI, checkpoints, controls, save schema, audio events, basic flashlight or shadow gameplay. Work only on forest asset geometry, forest materials, terrain/skirt bug and necessary rendering plumbing. No V2.2, V3 audio, V4 filmic lighting, V5 missions.
- There is **no authorization to download/import third-party assets**; owner must explicitly approve a specific proposed source/license before import.

## Visual diagnosis grounded in screenshots and code
- Five owner screenshots of V2.1S show thick trees, so density goal is reached; crowns still have repeated **wide flat jagged shelves** and artificial treetop silhouettes. The visual reading is layered paper cards instead of spruce needles.
- `src/render/forest/trees.ts` implements `shelves()` as 2 intersecting `MeshAccum.addCard` leaves each of 5–8 vertical tiers. This is inherently too flat from near side and above, even with an alpha needle texture. Bark is more acceptable but needs measured UV scale/cleaner lighting.
- `src/render/forest/undergrowth.ts` still uses 1–3 crossed quads for ferns, grass and shrubs; the repeated stamp pattern and sparse ground microdetail are visible.
- `src/render/forest/floor.ts` creates a vast untextured `forest-skirt` ground `width+280 x depth+280` at **Y=-0.05**; `terrainHeight()` can fall below this level in natural valleys and the stream. This **could be rendering over ground** and may explain the huge nearly-black rectangles in user screenshots #4 and #5. Verify experimentally rather than assert without reproduction. Fix using terrain-following extension, contour/skirt edges below true ground min, or a physically correct far background — not a giant plane crossing playable terrain.
- User screenshots show dark/flat ground patches and tree silhouettes dominating; test in both `?inspect=1` and game night. For comparison use identical camera, seed 170147, resolution/FOV; do not hide faults with darkness/fog.
- `src/render/app.ts` calls `audio.resume()` on beginning; `src/render/audio.ts` was modified to silence playback in PR #8. There is **no instruction to disable V1's functioning sound events** merely because professional audio belongs to V3. Restore prior behavior or provide an explicit accessible mute toggle, keeping V1 audio functional. Do not work on new music/audio content in V2.1T. Verify owner intent if muted mode was intentional and preserve user preference.

## Critical quality direction: small high-quality asset prototypes first
**Do not mass-replace the forest immediately.**
1. Create a **small forest asset showroom**, isolated QA scene or dev-only debug route with neutral lighting, contrasting the **current** spruce against one proposed **new** high-quality spruce and one new pine, at eye level 1.5–5 m, plus one fern/ground patch.
2. First create actual good shape: credible branch structure, needle clusters, tapered trunk and trunk roots. At normal player distance, tree must look organic from front, side, below and walking around; no giant flat stacked card planes, no overly regular radial whorls. Three-dimensional low/medium-poly branches with small alpha needle clusters can be effective if restrained and visually coherent.
3. Use **at most 4–6 distinct conifer archetypes** (age/shape/partially dead), variations driven by seeded scale, tilt and palette; avoid overdraw and huge near-model triangles. Preserve instance placement exactly.
4. Before importing external geometry/atlases, have Cursor present up to three **game-ready** options with link, exact license, file size, mesh/triangle/texture budget, commercial-use rights and representative image. Favor appropriately scaled high-quality stylized-realistic nature assets, not Quaternius's extremely low-poly models if that still looks like the current prototype, nor unreduced 8–17M triangle scans. Owner approval is mandatory. A proposed asset is **not** automatically approved.
5. If no imported asset approved, build the best possible **procedural sample** and show it at neutral lighting; do not pretend a slightly recolored billboard meets the goal. Stop after sample for approval rather than repeatedly mass-rebuilding.
6. Once sample is approved, replace only the **appearance** across the existing map, not density, ecology, routes or simulation.

## Ground and undergrowth polish
- Fix suspected `forest-skirt` terrain overlap as P0. Add automated regression proving background mesh is not visible above gameplay terrain at sample near valley/stream and all route camera positions. Check triangle winding, normals and height vs grounded vertices; inspect camera positions and near clipping as alternative causes of solid black fields.
- Provide detailed repeatable ground at foot scale with tiling albedo/normal, correct UVs, macro/micro detail blending, broken needles, moss and roots, and subtle wetness. Avoid overly high-contrast blotchy grayscale patterns. Same overall forest footprint and no mission coordinate changes.
- Improve grass/fern silhouettes and use coherent colors with the tree family. Hide obvious repeated cross quads at close view. Prefer well-made few variations to doubling foliage count.
- No "visual cover" objects that block player view but not monster LOS unless documented and intentionally decorative. Retain all existing functional cover semantics.

## Color, lighting and framing
- Leave professional lighting pass for V4. For now fix material response and **visibility** so object quality can be judged in neutral QA lighting and still reads in night.
- Choose restrained forest palette: brown bark, low-saturation dark spruce green, varied damp-ground browns/olive moss. Avoid broad cyan cards, near-black untextured panels and regular repeating triangles.
- Maintain clear trail/landmark readability; keep forest dense as approved, but no foreground leafy cards intersecting the player's camera.
- The left/west map boundary should look natural without huge exposed square foreground fill.

## Performance protection
- V2.1S reported **16.56ms average (~60 FPS), 351,924 active triangles at 1920x1080** in Cursor's visible Chromium test. This is a measured baseline, not a promise on owner's machine.
- Aim to preserve the baseline **within ~20% in average frame time at identical conditions** where practical; if beyond this, supply itemized visual-quality tradeoffs, GPU vs CPU timing and optional Balanced quality preset. The owner may prioritize quality, so do not silently butcher trees to hit a number.
- Alpha-card overdraw, shadow cost, texture memory, LOD popping, frustum culling and instancing overhead are primary budget risks. Don't use high-poly scans raw.
- A 20% slowdown from 16.56ms would be ~19.9ms/frame (~50FPS), so document actual measured effect; **60 FPS remains aspirational.**

## Required evidence and acceptance
- **Stage 1 – Showroom/asset sample:** neutral lit front/side/close-up screenshots of new spruce, pine, fern, ground patch *next to current*. Owner signs off on design **before bulk forest replacement**.
- **Stage 2 – Whole forest after sample approval:** same-camera/screenshots for arrival, fork, ridge, bridge, forest floor, hut approach and affected screenshot #4/#5 near-black areas, all at seed 170147. Include neutral debug screenshots and original gameplay night screenshots.
- Reproduce and resolve the black horizontal/surface artefact specifically. Must show no foreign flat plane above playable terrain or camera, and no visible broken horizon.
- Demonstrate no unintentional differences in tree density; world seed, tree placements, mission, AI, save, flashlight, route navigation and UI remain intact. Unit/build/Playwright plus an explicit in-browser manual walk.
- Distinguish Playwright QA teleports from true E2E mission completion; do not claim COMPLETE based on test teleport.
- PR remains draft pending human playtest and Creative Director review. No V2.2 until the owner approves this and the forest.

**Primary principle:** We now improve **asset craftsmanship**, not quantity of trees. If we cannot get a good result with procedural low-poly cards, the next step is owner-approved higher-quality 3D models — not another near-identical recolor.
