# FIRELINE: Air Attack

Playable browser prototype for the FIRELINE firefighting aircraft simulator blueprint. It opens to a lightweight menu; the Three.js world is dynamically imported only after a mission or sandbox map is selected. The campaign includes a tutorial and ten distinct maps/contracts with individual weather, terrain, airport, water access, fire severity, and acreage limits. Sandbox opens a paused god view where fires can be placed, then aircraft and airport can be selected before the sortie begins.

Maps are 10 km in diameter, with a runway-level spawn area, procedural ground texture, distance-based instanced forest LOD, and screen-space ray-marched ambient occlusion. Aircraft physics is independent of the orbit/chase/cockpit/god cameras.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates the production bundle in `dist/`.

## Controls

- `W` / `S`: pitch up / down
- `A` / `D`: bank left / right in flight; steer the nose wheel on the ground
- `Q` / `E`: rudder left / right
- `F`: hold on the load pad to load water
- `G`: retract/extend landing gear after climbing above 8 m AGL (gear model stays visually fixed)
- `Shift` / `Ctrl`: increase / decrease throttle
- `Space`: hold to drop water
- `O`: open or close the scoop door
- `R`: hold to scoop while low, fast, and wings-level over the lake
- `C`: cycle chase, cockpit, and orbit camera views
- Right-click drag: orbit around the aircraft; scroll to zoom in external views
- `Esc`: pause or resume

In sandbox god view, left-click terrain to place ignition points, right-drag to pan, scroll to zoom, then choose **Apply Aircraft / Airport** and **Start Sortie**. Flight simulation does not run during god-view setup.

External camera views are raised above the terrain when their sightline would cross a ridge. The lighting pass uses screen-space GTAO ray marching; it is not hardware ray tracing and therefore works with the browser's WebGL renderer.

Touch controls are available on narrow screens. Water loading requires the aircraft to be stopped on the apron pad. Scooping requires the scoop door open and a low, level pass over the lake.