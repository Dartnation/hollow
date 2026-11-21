# HOLLOW V2.1S — CLEAN FOREST ART PASS
## Creative Director implementation specification · 21 November 2026

**Status:** Design brief, not implemented and not approved. **V2.1S** is a second polishing/rebuild pass on top of **V2.1R PR #6**, not V2.2. Owner explicitly wants much cleaner and more professionally designed forest visuals. Scope: **forest only**, including tree/plant/ground art, placement, silhouettes and rendering. Preserve existing working basic flashlight and lighting, V1 mission, hut, player, monster and sound. Professional light/atmosphere is still V4, audio V3, missions V5.

**Code basis:** `feature/v2.1r-forest-revision` (PR #6, head `d119d85822dd07512bfda2a15c28f26609938026` at review time). **Do not branch from `main` or the documentation-only V2 PR #3.**

## 1. Desired art direction

**Polished grounded Nordic horror; restrained stylized realism.** Forest should look coherent, credible and intentionally composed, rather than like a dense scatter of basic polygons. Aim at clean silhouettes and physically convincing hierarchy in a dark, wet spruce-and-pine forest. **"Clean" means visual clarity and material consistency, not a sterile forest or simplistic low-poly game.**

The experience should be:
- Dense at mid-distance, **readable within 2–8 m**: trunks, brush and trails clearly separable from each other.
- Varied without visual randomness: expressive trees, clustered undergrowth, fallen timber, occasional clearings and purposeful sightline reveals.
- Scary because of near concealment, broken views, shadows and plausible terrain — not because every pixel has debris.
- Stable and performant: visual quality must be evident in actual owner-run browser.

### Specific observations from owner-supplied V2.1R images (five views)
1. **Near forest:** thick dark trunks frame scene, but widely spaced thin branches hold pale polygon "origami" foliage. Too many leaf blocks dominate.
2. **Longer forest view:** same branch structure repeats on almost every tree; distant background becomes a forest of skinny sticks and floating pale clumps.
3. **Ridge/edge view:** wide, uniform grey void on left shows the map/horizon edge too clearly. Need a natural layered border and landscape continuity.
4. **Undergrowth:** blade and fern meshes look like vertical spikes/fans instead of plants; ground is a large homogeneous dark plane.
5. **Hut view:** foreground trees partly screen the house but are still clearly artificial; leave architectural redesign for V2.2, improve forest framing now.

## 2. Trees are the highest-priority asset change (P0)
In `src/render/forest/trees.ts`, `clump()` currently builds each foliage mass with a **single tapered cylinder-like mesh**. `spruce()` builds only 4 whorls, `pine()` 4 sets of arms. This is the main source of artificial geometric tufts and exposed branch grids.

**Required:**
- Replace the current pale chunky-taper foliage geometry with **believable needle masses**, dense branchlets, asymmetrical crowns and tapered organic outer silhouettes. Avoid repeating the same visible 3–4 leaf/branch levels on every tree.
- Create at least **three visibly distinct high-quality mature tree archetypes** (full spruce, slender/partly dead spruce, irregular pine) plus dead/broken trees, and natural age variation and saplings. Archetypes should be legible from human eye height.
- Trunks have appropriate bark texture scale, root flare and gradual taper; branches vary by age, species, pitch, angle, direction and irregular gaps. Spruce foliage typically denser in lower/middle tiers than the current geometry.
- Foliage materials should be predominantly **dark, low-saturation green** with limited subtle natural variation. Remove cyan/pale mint-grey bulk foliage unless justified by a deliberately localized appearance.
- Build a silhouette-matched LOD family: near/medium/far transitions should not replace dense crowns with naked branch poles or visually different trees.
- Materials/shading should remain coherent, including double-sided cutout foliage only where needed. Avoid obvious z-fighting, alpha halos, light leaking and flat low-poly sparkling.

**Implementation options:**
- Preferred outcome is **asset quality**, not a hard ban on imported geometry. Cursor may develop better procedural meshes/alpha-card clusters, or present a short curated plan for licensed vegetation assets (GLB/glTF, atlas/PBR).
- **No external asset download/import committed without owner's explicit permission and recorded commercial-use license/attribution, file source, performance budget.** If quality cannot be met procedurally, present that trade-off rather than delivering another primitive tree pass and calling it done.

## 3. Understory that looks natural rather than scattered (P0)
`src/render/forest/undergrowth.ts` still creates simple fan meshes and a few repeated tapered spikes for grass, saplings and bushes, then distributes thousands of copies. High count does not imply visual quality.

**Required:**
- Improve silhouettes of ferns, tufted grasses, small spruce saplings, low blueberry/heath-like shrubs, roots, leaf and needle litter, fallen branches. Several variants per class, limited sensible scale variation, coherent natural material colors.
- Structure as **patches and microhabitats**: dense moss under trees, thicker fern groups in moist pockets, sparse center of walkable trails, fallen branches next to trunks, stones/roots near slopes.
- Keep 1.2–2.0 m of clear readable traversal where the route demands it, but use vegetation to soften the edges, not a hard perfectly straight empty corridor.
- Remove giant blocky leaf planes in foreground that clip into camera. No floating plant meshes, visible repetitive fan stamps or abrupt LOD changes.
- If a decorative fallen tree visually implies a hiding spot, align it with collision and line-of-sight rules before presenting it as cover. Otherwise avoid misleading gameplay silhouettes.

## 4. Ground/material quality and composition (P0)
`src/render/forest/floor.ts` currently paints a **single 1024 px albedo for the entire ~246×266 m world** plus 512 px procedural bump. These are insufficient to create detailed ground at first-person scale without an independent tiling/multiscale detail system.

**Required:**
- Add tileable multi-scale detail and controlled blend masks for earthy trail, damp soil, needles, moss, stone and wet patches. Keep close detail readable from walking height; no full-map albedo stretch that causes muddy pixels.
- Introduce a cohesive palette; ground dark and believable but not a uniform black plane or high-contrast procedural blobs.
- Readable trail should curve and narrow organically with worn edges, leaf/fallen branches; avoid obvious painted lane and abrupt color edges.
- Replace bare map-edge grey void with believable layered tree line / ridge/rock border and fog-based distance continuation. Do not change V1 gameplay geometry just to mask a background defect.
- Art-direct **3–5 scenic microzones** within the existing routes: arrival framed by trunks; fork signs visible inside forest; dark damp ridge; bridge/stream transition; warm hut light framed by trunks. Distinct but cohesive.

## 5. Gameplay and performance constraints (P0)
- Preserve `WORLD`, `LANDMARKS`, V1 mission, checkpoints, nav/grid, AI sensor math, save compatibility, both routes, functioning flashlight/hut lights. Do not rebuild the house/player/monster in this pass.
- Latest PR #6 reports about **1.0 million active triangles**, ~30 FPS at 1920×1080 visible Chromium, though 60 headless FPS. Optimize true quality-cost ratio rather than blindly increasing tree density and triangles. Record same test hardware, browser, display resolution, settings and repeatable location/seed for fair comparison.
- Examine rendering of near-tree crown clusters, shadow casting, tiling material cost, overdraw and distant LOD. Introduce **quality profiles** (Performance/Balanced/High) if needed, with actual differentiating settings and default Balanced. Avoid unnecessary processing on the main thread.
- LOD transition threshold is currently `FOREST_NEAR=32` and refresh every 12 m; use hysteresis/crossfade or equivalent to eliminate obvious pop on camera movement and ensure matching near/far silhouette.
- Performance target: **60 FPS goal** on a capable test PC, 30 FPS is not considered evidence of optimization success. If actual hardware cannot reach it, report honest frame times and identify bottlenecks; do not claim a hardware guarantee.

## 6. Mandatory proof (before asking for approval)
A. Save baseline screenshots of PR #6 and new screenshots on **the exact same seed (170147), resolution, angle, FOV, camera position** at: arrival, first path, fork, slope ridge/left map edge, undergrowth close-up, bridge and hut approach.

B. Publish **at least two clean daytime-neutral inspection views in a debug/editor mode** (not as player-facing daytime game), to judge bark, crown silhouettes, ground material quality without dark fog masking shortcomings. Preserve game's nighttime identity for actual gameplay.

C. Compare the naturalness of tree silhouette, hue consistency, understory detail, ground detail, LOD behavior and visible map border. Include a brief visual defect checklist; a passing build/test suite alone does not mean graphics are approved.

D. Test on seed 170147 and one additional seed, and verify world position of thin instances; no pop-in or placement artifacts after running/walking >12 m. Regression tests for collision, walkable bridge/slope, hut door, monster navigation and save/load. A Playwright QA teleport is **not** a real end-to-end playthrough; label appropriately.

E. Provide browser-playable localhost build, build/unit/browser test logs, performance measurements in **visible browser at 1920×1080**, and clear comparison screenshots. Include owner-ready playtest steps.

## 7. Acceptance conditions and ownership gate
- No obvious broadleaf-like grey polygon clumps on spruce/pine crowns, no forest of naked repeating radial sticks at distance.
- Trees read convincingly at near and mid distance, ground exhibits visible high-frequency detail, understory reads as plants rather than green spikes.
- First three screenshots are clearly more polished and cleaner than V2.1R without becoming empty.
- Hidden or visually integrated terrain limits with no flat grey world edge in normal exploration.
- Both established paths remain navigable and safe from softlocks.
- Frame times / FPS are honestly measured and adequately improved or a clear documented limitation/trade-off is supplied.
- Owner tests and decides. **No merge or V2.2; no start on V3 sound / V4 filmic lighting / V5 mission work.**

Deliver this as **V2.1S – Clean Forest Art Pass** on a new isolated feature branch based on `feature/v2.1r-forest-revision`. New draft PR should target that branch.
