AIRCRAFT REDESIGN TASK: FireWing (Unity, C#, URP, new Input System)

GOAL
Redesign the whole aircraft system. The current plane model (visuals AND flight handling) is bad. I want it to feel like War Thunder aircraft, but every aircraft is a firefighting aircraft. Each plane must have its own personality, its own handling, its own drop system, and its own place in an unlock tree that the player buys through with cash earned from missions.

WHAT "LIKE WAR THUNDER" MEANS HERE
- Distinct aircraft: a light crop-duster-style plane, a twin-prop tanker, a WWII bomber converted to a tanker, an amphibian scooper, a jet scooper, a cargo-plane tanker, a jumbo-jet tanker, and helicopters. Each flies noticeably differently.
- Three handling modes: Arcade, Realistic, Simulator (details below).
- Believable flight: stall, spin entry, torque, flaps, gear, engine power vs altitude, structural limits.
- Detailed external models with animated parts, plus a cockpit view with working instruments.
- A component damage model.
- A tech tree: buy the next aircraft with cash earned from missions.
- Real aircraft are only inspiration. Use the fictional names below in the game.

HOW TO WORK
- Follow the project rules in the Copilot instructions file: one class per file, namespace FireWing.<Module>, no per-frame allocations, serialized or ScriptableObject tunables, EventBus for events, XML docs on public members.
- Work in the phases below, ONE PHASE AT A TIME. After each phase: list files created or changed, how I test it in the editor, and any Inspector setup I must do by hand. Then stop and wait for me to say "next".
- Do not rename existing public classes. Where you must change a public API (for example AircraftData, FlightModel, AircraftRuntime, ScoopController, PayloadSystem), tell me first, list every call site you will update, and keep the project compiling.
- Existing systems to keep working: EventBus, FireSimulation, DropletManager, WindSystem, MissionManager, SaveSystem, Wallet, UpgradeManager, SkinApplier, water loading rules (airport load pads, scooping only on maps where it is allowed).
- If you are unsure an API exists in this Unity version, say so instead of guessing.

PHASE 1: DATA ARCHITECTURE
1. Extend AircraftData with: tier (1 to 5), branch (Light, Scooper, Heavy, Helicopter), unlockedByAircraftId, requiredReputation, price, engineCount, engineType (Piston, Turboprop, Jet, Turbine), groundLoadRate, groundFuelRate, maxGForcePositive, maxGForceNegative, neverExceedSpeed (Vne), maxFlapsSpeed, maxGearSpeed, and a reference to an AircraftFlightProfile asset.
2. Create AircraftFlightProfile (ScriptableObject) with AnimationCurves:
   - liftCoefficientByAoA, dragCoefficientByAoA
   - controlEffectivenessBySpeed (pitch, roll, yaw separately)
   - enginePowerByAltitude, propellerEfficiencyBySpeed (for propeller aircraft) or thrustBySpeed (for jets)
   - flap settings array (each with extra lift, extra drag, max speed)
   - gear drag, stall behavior (stall angle, stall sharpness, wing-drop tendency, spin tendency)
   - torque tendency (yaw and roll from engine torque and prop wash for single-engine propeller aircraft)
   - engine-out asymmetry strength for multi-engine aircraft
   - inertia tensor scale (roll, pitch, yaw), so heavy aircraft feel heavy
   - center of gravity offset and how much dropping water shifts pitch trim
3. Create DropPatternData (ScriptableObject): drop door count, release mode (Salvo, Line, Gated), flow rate, line length and width at a reference altitude, spread angle, supports water, retardant, and foam.
4. Create TechTreeData (ScriptableObject): list of nodes (aircraft id, parent id, branch, tier) and helper methods CanUnlock(aircraft), GetChildren(aircraft).
5. Update the AssetCatalog to include flight profiles, drop patterns, and the tech tree.

PHASE 2: FLIGHT MODEL REWRITE
Rewrite FlightModel to use the AircraftFlightProfile. Keep one Rigidbody. Per FixedUpdate compute:
- Lift and drag from the AoA curves, dynamic pressure (with altitude air density), and wing area. Lift acts perpendicular to the airflow. Add ground effect close to the ground.
- Thrust: propeller aircraft use power times propeller efficiency divided by airspeed, with static thrust capped; jets use the thrust curve. Engine power falls with altitude per the curve. Throttle spools with a lag (slow for jets, quick for piston).
- Flaps (stages) and landing gear (up and down) changing lift, drag, and stall speed. Overspeed with flaps or gear down causes damage over time.
- Control effectiveness depends on airspeed, with prop wash giving extra elevator and rudder authority on propeller aircraft at low speed and high power.
- Torque effect: a single-engine propeller plane yaws and rolls under power, strongest at low speed and full throttle.
- Stall: lift drops sharply past the stall angle; in Realistic and Simulator modes the stalled wing can drop and enter a spin. Add a stall warning value the HUD can read.
- G-force limits: exceeding max G in Realistic and Simulator modes applies structural damage; in Arcade modes it softly limits turn rate instead.
- Multi-engine aircraft: engine failure creates a yaw moment toward the dead engine; rudder must compensate.
- Weight and balance: mass changes with fuel and water; dropping water shifts the center of gravity and causes a visible pitch-up surge, strongest for heavy tankers dumping all at once. Optional: water slosh in a part-filled tank slightly affecting pitch.
- Ground handling: three-point or tricycle gear via WheelColliders, brakes, nose or tail wheel steering, and taxi speed limits. Tail-draggers are harder to steer.
- Keep everything tunable per aircraft through the flight profile. Expose a debug IMGUI panel to edit the values live and show lift, drag, thrust, AoA, G, and stall margin.

PHASE 3: HANDLING MODES (selected in settings, and per mission in Briefing)
- Arcade: mouse-aim or simple stick control with automatic stabilization, coordinated turns, no spin, soft G and stall limits, generous damage thresholds.
- Realistic: assisted control, stall and spin possible but recoverable, G-limit damage, flaps and gear matter, engine overheat only for piston engines.
- Simulator: full manual control, strong torque and prop wash, no assists, engine management (mixture, prop pitch, cowl flaps for pistons), required flaps for loaded takeoff, spins hard to recover.
Create a HandlingMode enum and apply it as multipliers and assist toggles on top of the same flight profile, rather than writing three separate flight models.

PHASE 4: AIRCRAFT VISUALS AND ANIMATION
I cannot ship real art yet, so make the aircraft visuals replaceable.
1. Define an AircraftVisualRig component. It lists named, animatable Transforms: Fuselage, WingLeft, WingRight, TailVertical, TailHorizontal, AileronLeft, AileronRight, ElevatorLeft, ElevatorRight, Rudder, FlapLeft, FlapRight, GearNose, GearMainLeft, GearMainRight, DropDoors (array), ScoopProbes (array), Propellers or RotorBlades (array), CockpitCameraAnchor, ExternalCameraAnchor, DropPoint, Smoke and engine exhaust anchors, NavLights.
2. Write a ProceduralAircraftBuilder (editor tool) that generates a recognizable placeholder aircraft from parameters: fuselage length and radius, wingspan and chord, wing mount (low, mid, high), engine count and positions, tail style (conventional, T-tail, twin-boom), gear type, float or hull for amphibians. Use tapered capsule and extruded wing meshes with sensible proportions. Output a prefab with a populated AircraftVisualRig, a collider set, and three LOD levels.
3. A visual animator (AircraftVisualAnimator) that reads FlightModel and PayloadSystem and moves the parts: control surfaces follow input, flaps follow flap setting, gear retracts and extends with timing, drop doors open during a drop, scoop probes lower while scooping, propellers spin with RPM and swap to a blur disc at high RPM, rotors for helicopters.
4. Cockpit view: a simple cockpit mesh with working instruments (airspeed, altimeter, vertical speed, heading, fuel, payload, flap and gear indicators, stall warning light). Instruments read from FlightModel and AircraftRuntime through a small read-only data struct.
5. Cameras: chase, cockpit, tail, drop-cam (looks down at the drop area), fly-by, with smooth blends.
6. Skins: keep the existing livery shader and SkinApplier working with the generated prefabs by giving each a mask texture.
7. Hangar: orbit viewer with animated parts toggles (gear, flaps, doors) and a stat comparison panel.
8. Document the contract clearly so I can later drop in real FBX models from the Asset Store or Blender and only re-map the AircraftVisualRig transforms.

PHASE 5: DAMAGE MODEL
- Components with health: WingLeft, WingRight, Tail, EachEngine, Tank, Gear, ControlSurfaces, Cockpit.
- Damage sources: hard landings and collisions, overspeed, overstress (G), flying through intense fire heat or low through smoke, unsafe scooping, water impact with doors open.
- Effects: lost lift on a damaged wing (roll toward it), reduced engine power or engine failure, leaking tank (loses water over time), stuck gear, reduced control authority, smoke and fire visuals on damaged engines, warning lights and audio.
- Aircraft crashes when the airframe health is zero, or a wing or tail is destroyed.
- After a mission, show a repair bill (cost scales with damage and aircraft tier) that is deducted from the payout on the results screen. The player can fly with damage carried over if they decline to repair (the aircraft starts the next mission damaged).

PHASE 6: DROP SYSTEMS
- Every aircraft uses a DropPatternData asset: Salvo (all at once, big pitch surge), Line (sequential doors for a long even line), Gated (player taps to release batches), helicopter bucket (single dump with a swinging bucket).
- Drop altitude and speed change the footprint (higher is wider and weaker; lower is concentrated).
- Heavy tankers can carry water, retardant, or foam. Retardant lays a lasting line. Foam is stronger but costs more.
- Update PayloadSystem and DropletManager to use the drop pattern, and update the HUD predictor line to match.

PHASE 7: AIRCRAFT ROSTER (create all as assets, flight profiles, drop patterns, and procedural prefabs)
Use these fictional names. "Inspired by" is only a handling reference.

Name | Inspired by | Tier | Branch | Unlocked by | Price | Engines | Tank (L) | Cruise m/s | Stall m/s (loaded, flaps) | Vne m/s | Max G | Personality
Sparrow AT-1 | single-turboprop ag tanker | 1 | Light | (starter) | 0 | 1 turboprop | 3000 | 60 | 38 | 95 | +4/-1.5 | Forgiving, strong torque roll, great first plane
Wren AT-0 | small piston ag plane | 1 | Light | Sparrow | 25000 | 1 piston | 1500 | 48 | 32 | 75 | +4.5/-2 | Very agile, short field, low power, cheap to run
Tracker T-2 | twin-turboprop naval tracker | 2 | Light | Sparrow | 70000 | 2 turboprop | 3800 | 75 | 42 | 120 | +3.5/-1 | Four-door line drops, engine-out asymmetry
Heron S-2 | twin-turboprop scooper amphibian | 2 | Scooper | Sparrow | 90000 | 2 turboprop | 5500 | 70 | 40 | 110 | +3/-1 | Scoops 500 L/s, hull planing, stable but sluggish
Kestrel H-1 | light firefighting helicopter | 2 | Helicopter | Wren | 150000 | 1 turbine | 2500 bucket | 45 | n/a | 60 | +3/-0.5 | Hover, bucket dips in lakes, swinging load
Privateer P-4 | WWII four-engine bomber conversion | 3 | Heavy | Tracker | 160000 | 4 piston | 9000 | 80 | 48 | 130 | +3/-1 | Heavy controls, engine temperature management, classic warbird feel
Osprey B-6 | twin-jet scooper amphibian | 3 | Scooper | Heron | 200000 | 2 jet | 12000 | 150 | 52 | 200 | +3/-1 | Scoops 850 L/s, fast, slow engine spool
Atlas T-4 | four-turboprop heavy tanker | 3 | Heavy | Tracker | 220000 | 4 turboprop | 12000 | 95 | 55 | 140 | +2.5 | Solid and stable, retardant capable
Skycrane H-2 | heavy-lift helicopter | 4 | Helicopter | Kestrel | 400000 | 2 turbine | 10000 snorkel | 50 | n/a | 70 | +2.5 | Hover-refill from lakes, huge load, low speed
Titan C-3 | four-turboprop cargo plane with a pressurized tank module | 4 | Heavy | Atlas | 350000 | 4 turboprop | 11000 | 100 | 52 | 150 | +2.5 | Short-field STOL, rear-door drops, mid-air handling is steady
Condor VLT | three-jet airliner converted to tanker | 5 | Heavy | Atlas | 600000 | 3 jet | 36000 | 110 | 78 | 150 | +2 | Massive load, slow roll, needs a long runway
Colossus 7 | four-jet jumbo tanker | 5 | Heavy | Condor | 1200000 | 4 jet | 74000 | 120 | 85 | 160 | +2 | Enormous inertia, dramatic drops, expert-only

Each aircraft needs distinct flight profile curves so they truly feel different (a Wren should snap-roll and stall sharply; a Colossus should feel like it is steering a building). Provide starting numbers I can tune, and a debug panel to tune them live.

PHASE 8: PROGRESSION, TECH TREE, AND MISSION REWARDS
- Cash only for buying aircraft. After every mission the results screen shows: base payout, performance bonus, first-clear bonus, repair bill, fuel and retardant costs, NET CASH, and a progress bar toward the next affordable unlock.
- Tech tree screen: four columns (Light, Scooper, Heavy, Helicopter) by five tiers, drawn with connecting lines. Locked aircraft show as silhouettes with the parent requirement, reputation requirement, and price. An aircraft is purchasable only if the player owns its parent, meets the reputation requirement, and has the cash. Show a NEW AIRCRAFT AVAILABLE banner on the results screen when a purchase becomes possible.
- Selling an aircraft refunds 60 percent of the price. Owned aircraft keep their upgrades and skins.
- Per-aircraft mastery: every mission flown in an aircraft gives that aircraft mastery XP. Mastery levels unlock upgrade tiers and exclusive skins for that aircraft, and give small discounts on its upgrades.
- Mission requirements: missions list allowed aircraft classes. The briefing screen shows which owned aircraft qualify and recommends the best match.
- Save everything in SaveData with a version bump and a migration from the current version.
- Rebalance payouts so a skilled player can afford a new aircraft every two or three missions early on, then slow down as prices rise. Output a table of payout versus price so I can check the pacing.

PHASE 9: TESTS
Write EditMode tests: tech tree unlock rules, purchase and refund math, flight profile curve sanity (no NaN, lift rises then falls with AoA), stall speed formula per aircraft, repair cost math, save migration. Write PlayMode tests: each aircraft spawns, takes off, and lands without errors; each drop pattern produces the expected footprint; a gear and flap overspeed causes damage.

ACCEPTANCE CHECKS (I will run these by hand)
- Flying the Wren, Heron, Atlas, and Colossus feels clearly different.
- Arcade is easy to fly with a mouse, Simulator can stall and spin.
- Every aircraft has animated gear, flaps, control surfaces, drop doors or scoop probes, and spinning props or rotors.
- Cockpit instruments match the HUD numbers.
- Buying down the tree works, and locked aircraft cannot be bought out of order.
- No per-frame allocations in flight (check the Profiler).

START WITH PHASE 1 ONLY. Before you write code, restate the plan for Phase 1 in five lines and list any existing class you will change.