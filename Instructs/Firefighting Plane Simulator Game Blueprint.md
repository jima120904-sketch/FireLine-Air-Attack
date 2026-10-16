# Firefighting Plane Simulator: Game Blueprint

A technical and design blueprint for an indie firefighting aircraft simulator, written to be handed to GitHub Copilot in small, well-scoped pieces.

## 1. Recommended Tech Stack

**Engine: Unity (2022 LTS or Unity 6) with C#, using the Universal Render Pipeline (URP).**

Why this fits your project:

- **Copilot is strongest at C#.** There is a huge amount of Unity C# in the wild, so suggestions are accurate and idiomatic.
- **Asset Store and packages** cover terrain, water, clouds, vegetation, and vehicle physics, so you don't build everything from scratch.
- **ScriptableObjects** make upgrades, aircraft, maps, and skins data-driven, which is exactly what a game with lots of content needs.
- **One codebase, many platforms:** PC first, consoles and mobile possible later.

**Alternatives, and when to pick them:**

| Engine | Language | Pick it if |
| --- | --- | --- |
| Godot 4 | GDScript or C# | You want a free, lightweight engine and a simpler, more stylized game. Copilot is weaker with GDScript. |
| Unreal Engine 5 | C++ and Blueprints | You want photorealistic terrain and fire. Steeper learning curve, and Copilot helps less with Blueprints. |

**Key packages and tools**

- Unity Input System (controller, keyboard, flight stick support)
- Cinemachine (cameras)
- Terrain Tools plus Gaia, MapMagic, or World Creator (map generation)
- VFX Graph (fire, smoke, water drops)
- Crest, Stylized Water, or Unity's built-in water (lakes and sea for scooping)
- FMOD or Wwise (audio), or Unity's built-in audio to start
- Newtonsoft JSON or Unity's JsonUtility (save data)
- Git plus Git LFS (version control for large assets)

## 2. Core Game Pillars

1. **Satisfying flight.** Low, slow, precise flying over burning terrain is the fantasy.
2. **Readable fire.** The player must understand where fire is spreading and why.
3. **Meaningful progression.** Money earned from missions buys better aircraft and upgrades.
4. **Personal expression.** Skins and liveries make the plane feel like yours.

## 3. Game Loop

1. Choose a **contract** (map, fire type, difficulty).
2. Pick an **aircraft** and **loadout**.
3. Take off and fly to the fire.
4. Collect water or retardant (airport reload, lake scoop, or helibucket dip).
5. Drop on target, then repeat while managing fuel, payload, and wind.
6. Land and receive a **score and payout**.
7. Spend money on **upgrades, new aircraft, and skins**, then pick the next contract.

## 4. Feature List

### 4.1 Aircraft (upgradeable vehicles)

| Class | Example role | Notes |
| --- | --- | --- |
| Light air tractor | Starter plane | Fast to reload, small payload, agile |
| Water scooper amphibian | Scoops from lakes and sea | Needs water access, medium payload |
| Heavy air tanker | Large retardant loads | Slow turning, needs airport reloads |
| Firefighting helicopter | Hover and bucket | Different flight model (post-MVP) |
| Very large tanker (late game) | Massive payload | Needs long runways |

**Upgrade categories**

- Engine (power, climb rate, fuel efficiency)
- Tank (capacity, drop rate, drop pattern)
- Fuel tank (range)
- Airframe (durability, handling)
- Avionics (fire map overlay, wind indicator, drop-line predictor, autopilot assist)
- Scoop or door system (faster fill, drop in a line or a single dump)

Upgrades are data-driven: each has a cost, a prerequisite, and stat modifiers.

### 4.2 Maps

Start with 3 maps for MVP and grow to 6 or more.

- **Pine Valley** (forest, rolling hills, lakes): the tutorial map.
- **Coastal Mediterranean** (dry scrub, steep cliffs, sea scooping).
- **Desert Canyon** (narrow canyons, thermals, few water sources).
- **Alpine Range** (high altitude, thin air, strong wind).
- **Boreal Wilderness** (huge, remote, long flights).
- **Suburban Interface** (homes at risk, high-stakes drops).

Each map has airports, water sources, weather presets, and a set of fire scenarios.

### 4.3 Fire Simulation

Use a **grid-based cellular automaton** (not per-tree physics). It is fast, controllable, and easy to visualize.

Each cell stores:

- Fuel type and amount (grass, brush, forest, structure)
- Moisture
- Burn state (unburned, igniting, burning, burned out)
- Temperature or intensity

Spread factors:

- **Wind** direction and speed (fire spreads faster downwind)
- **Slope** (fire spreads faster uphill)
- **Fuel type** and **moisture**
- **Spotting** (embers jump ahead in high wind)

Player effects:

- Water drop: raises moisture in a footprint and cools cells.
- Retardant drop: sets a long-lasting fire break on cells.

Performance tip: run the simulation on a fixed tick (for example 4 times per second) with a job system or compute shader, separate from rendering.

### 4.4 Flight Model

Aim for **arcade-sim hybrid**: believable, but not punishing.

- Lift, drag, thrust, and weight simplified into tunable values
- Payload weight changes handling and drops suddenly when releasing water
- Stall behavior, turbulence from heat and terrain
- Optional **difficulty modes**: Arcade (forgiving), Realistic (stalls, fuel, engine damage)

### 4.5 Water and Retardant Systems

- Tank has capacity, fill rate, and drop rate.
- Drop is a particle and trigger-volume system: droplets fall with wind drift and spread based on altitude and speed.
- Higher drops spread wider but weaker. Low drops hit hard and accurate.
- Scooping: fly low and level over water at a minimum speed to fill.

### 4.6 Skins and Liveries

- Each aircraft has a **base material** with a **mask texture** (paintable regions).
- Player customizes: primary, secondary, accent colors, patterns, stripes, number decals, and logos.
- Skins are stored as small JSON (colors plus decal IDs) so they are easy to save, share, and extend.
- Unlock skins via progression, achievements, or purchase.
- Later: import custom PNG decals, workshop or code sharing.

### 4.7 Missions and Contracts

- Contain a fire (limit acres burned)
- Protect structures
- Rescue run (drop on a fire cutting off an evacuation route)
- Timed responses
- Multi-fire days (prioritize which fire to fight)
- Free flight and sandbox mode

Scoring: area saved, structures saved, time, fuel efficiency, drop accuracy, and safety (no crashes).

### 4.8 Progression and Economy

- Money from contracts, bonus for performance.
- Reputation unlocks higher-tier contracts and maps.
- Maintenance and fuel costs (optional, in Realistic mode).
- Hangar screen to view, upgrade, and customize aircraft.

### 4.9 Weather and Time of Day

- Wind, gusts, visibility, and temperature presets
- Day, dusk, night (night operations as a later challenge)
- Smoke reduces visibility and affects flight

### 4.10 UI and HUD

- Cockpit or chase camera toggle
- HUD: altitude, airspeed, payload, fuel, wind arrow, drop-line prediction
- Minimap with fire overlay, airports, and water
- Mission briefing and results screens
- Hangar, shop, and settings menus
- Controller and flight stick support with remappable inputs

### 4.11 Audio

Engine loops by RPM, wind, water release, fire crackle by proximity, radio chatter, and music that responds to intensity.

### 4.12 Save System

Save: money, owned aircraft, upgrades, skins, unlocked maps, mission history, and settings. Use JSON with a version number so old saves can migrate.

## 5. Project Architecture (Unity)

### 5.1 Folder structure

```
Assets/
  _Project/
    Scripts/
      Core/          (GameManager, SceneLoader, ServiceLocator, EventBus)
      Aircraft/      (AircraftController, FlightModel, PayloadSystem, DamageSystem)
      Fire/          (FireGrid, FireCell, FireSimulation, FireVisuals)
      Environment/   (WindSystem, WeatherSystem, WaterSource, Airport)
      Missions/      (Mission, MissionManager, Objective, ScoreCalculator)
      Progression/   (Wallet, UpgradeManager, UnlockManager, SaveSystem)
      Customization/ (SkinData, SkinApplier, LiveryEditor)
      UI/            (HUD, Minimap, Menus, Hangar, Shop)
      Audio/
      Data/          (ScriptableObject definitions)
    ScriptableObjects/
      Aircraft/  Upgrades/  Maps/  Missions/  Skins/
    Prefabs/  Scenes/  Materials/  Textures/  VFX/  Audio/  Art/
  Tests/
```

### 5.2 Data-driven design with ScriptableObjects

- `AircraftData`: name, class, base stats, prefab, price, available upgrade slots
- `UpgradeData`: category, cost, stat modifiers, prerequisites
- `MapData`: scene name, display name, unlock requirement, weather presets, fire scenarios
- `MissionData`: map, fire setup, objectives, rewards
- `SkinData`: id, name, target aircraft, colors, decals, unlock condition

### 5.3 Key design patterns

- **Event bus** (C# events or a simple static EventBus) so systems stay decoupled, for example `OnFireExtinguished`, `OnDropCompleted`, `OnMissionComplete`.
- **State machines** for aircraft states and game flow.
- **Object pooling** for water droplets, smoke, and UI elements.
- **Interfaces** like `IDamageable` and `IUpgradable`.
- **Assembly definitions** to keep compile times fast.

## 6. Development Roadmap

### Milestone 1: Flight prototype (weeks 1 to 3)

One plane, one flat test terrain, flight controls, chase camera, basic HUD.

### Milestone 2: Water and fire (weeks 4 to 7)

Fire grid simulation, simple fire visuals, tank, drop mechanic, scooping, wind.

### Milestone 3: First playable mission (weeks 8 to 10)

One real map, airport with takeoff and landing, one mission type, scoring, results screen.

### Milestone 4: Progression (weeks 11 to 14)

Money, hangar, three aircraft, upgrade system, save and load.

### Milestone 5: Content and customization (weeks 15 to 20)

Two more maps, more mission types, skin system, weather, audio pass.

### Milestone 6: Polish and release prep (weeks 21 to 26)

UI polish, tutorial, settings, controller support, optimization, bug fixing, Steam page and trailer.

Timelines assume part-time solo work and will vary.

## 7. Working With GitHub Copilot

**Set it up for success**

- Add this document to your repo as `docs/BLUEPRINT.md` and keep it open while coding.
- Create `.github/copilot-instructions.md` with your standards (see section 8).
- Work in **small, single-purpose scripts**. Copilot does best with focused files.
- Write a **descriptive comment or XML summary first**, then let Copilot complete.
- Use Copilot Chat to explain errors, refactor, and write unit tests.
- Always **read and test generated code**. Copilot can produce plausible but wrong physics, API calls, or Unity methods that don't exist.

**Prompt pattern that works well**

> Context: Unity 2022 LTS, C#, URP. We use ScriptableObjects for data and a static EventBus. Task: Create `PayloadSystem` for a firefighting aircraft. It holds current and max water, supports Fill(amount), StartDrop(), StopDrop(), and raises events when the payload changes. Drop rate comes from `AircraftData`. Constraints: no per-frame allocations, use `[SerializeField]` for inspector fields, add XML doc comments.

## 8. Starter `copilot-instructions.md`

```markdown
# Project Instructions

- Engine: Unity 2022 LTS (or Unity 6), C#, Universal Render Pipeline.
- Use the new Input System, not the legacy Input class.
- Follow Microsoft C# naming conventions. Private fields use _camelCase with [SerializeField].
- Put each class in its own file under Assets/_Project/Scripts/<Module>/.
- Use ScriptableObjects for static game data (aircraft, upgrades, maps, missions, skins).
- Communicate between systems via the EventBus, not direct references where avoidable.
- Avoid allocations in Update. Cache component references. Pool frequently spawned objects.
- Never use FindObjectOfType in hot paths.
- Add XML summary comments to public methods.
- Write EditMode tests for pure logic (fire spread, scoring, upgrade math).
```

## 9. Copilot Prompt Sequence (copy and paste in order)

1. "Create the folder structure and assembly definitions described in the blueprint section 5.1."
2. "Create a static EventBus class with generic subscribe, unsubscribe, and publish methods."
3. "Create `AircraftData`, `UpgradeData`, `MapData`, `MissionData`, and `SkinData` ScriptableObjects as described in section 5.2."
4. "Create an `AircraftController` using Rigidbody and a simplified flight model with throttle, pitch, roll, yaw, lift, and drag. Read stats from `AircraftData`."
5. "Create a chase camera using Cinemachine with speed-based FOV."
6. "Create a `PayloadSystem` and a `WaterDropEmitter` that spawns pooled droplets affected by wind."
7. "Create a `FireGrid` class: a 2D grid of `FireCell` structs covering the terrain, with a fixed-tick `FireSimulation` that spreads fire based on fuel, moisture, wind, and slope."
8. "Create `FireVisuals` that reads the FireGrid and drives VFX Graph fire and smoke only near the camera."
9. "Create `WaterSource` with scooping logic requiring low altitude and minimum speed."
10. "Create `Mission`, `Objective`, and `MissionManager` with area-saved and structures-saved objectives plus a `ScoreCalculator`."
11. "Create `Wallet`, `UpgradeManager`, and `SaveSystem` using versioned JSON."
12. "Create a hangar UI that lists owned aircraft, lets me buy upgrades, and previews skins."
13. "Create `SkinApplier` that uses a mask texture and MaterialPropertyBlock to apply colors and decals at runtime."

## 10. Risks and How to Handle Them

| Risk | Mitigation |
| --- | --- |
| Scope creep (this feature list is big) | Ship an MVP of 1 plane, 1 map, and 1 mission type first |
| Fire simulation too slow | Fixed tick, job system or compute shader, cull far-away cells |
| Flight feels bad | Playtest early, expose tuning values in ScriptableObjects, add Arcade mode |
| Large terrain performance | Terrain LODs, streaming, limit vegetation draw distance |
| Copilot errors | Small tasks, test each piece, use version control and commit often |
| Art workload | Use asset packs and stylized visuals first, replace later |

## 11. Suggested MVP (what to build first)

- 1 aircraft (light air tractor)
- 1 map (Pine Valley)
- Grid fire with wind and slope
- Water drops with a refill at the airport
- 1 mission type (contain the fire)
- Money plus 3 upgrades
- Save and load

Once that is fun, everything else in this blueprint is an expansion.

## 12. Next Steps

- Decide on engine and install Unity Hub with a 2022 LTS or Unity 6 editor.
- Create the Git repo with a Unity `.gitignore` and Git LFS.
- Add this blueprint and the Copilot instructions file.
- Start with prompt 1 from section 9.

# Part II: Implementation Spec for AI Coding

Part I is the design. Part II is the build spec: conventions, data schemas, class contracts, algorithms, tuning numbers, and an ordered task list with acceptance criteria. Working title: **FireWing** (rename freely). Feed it to Copilot one section at a time, in order.

## 13. Rules for the AI Assistant

Paste this at the top of every Copilot Chat or agent session:

```text
Project: FireWing, a firefighting aircraft simulator.
Engine: Unity 2022.3 LTS or Unity 6, C# 9, URP, new Input System package.
(Unity 6 renamed Rigidbody.velocity to linearVelocity and angularVelocity to angularVelocity; use whichever the installed version supports.)

Rules:
1. One public class per file. File name equals class name. Namespace FireWing.<Module>.
2. Implement only the task I ask for. Do not invent extra systems or rename existing ones.
3. No allocations in Update or FixedUpdate: no LINQ, no new collections, no string concatenation.
4. Cache component references in Awake. Never call Find* methods at runtime.
5. Tunable numbers are [SerializeField] fields or ScriptableObject values, never magic numbers.
6. Systems talk through EventBus<T> events, not direct references, unless a direct reference is clearly simpler.
7. Every public member gets an XML summary comment.
8. Static game content lives in ScriptableObjects in FireWing.Data.
9. After each task, list the files you created or changed and exactly how I test it in the Unity editor.
10. If you are unsure an API exists in this Unity version, say so instead of guessing.
```

## 14. Project Setup Checklist

1. Create a new Unity project from the **3D (URP)** template.
2. Install packages: Input System, Cinemachine, Burst, Collections, Mathematics, Jobs, TextMeshPro, Visual Effect Graph, Test Framework.
3. Player Settings: Active Input Handling = **Input System Package (New)**; Color Space = **Linear**.
4. Time: Fixed Timestep **0.02**.
5. Create layers and tags below.
6. Create the folder structure from section 5.1.
7. Create one assembly definition (.asmdef) per module, with the dependency direction shown below.
8. Initialize Git with a Unity .gitignore and Git LFS for \*.png, \*.psd, \*.fbx, \*.wav, \*.exr, \*.tga.

**Layers**

| Index | Name | Used for |
| --- | --- | --- |
| 8 | Terrain | Ground, for altitude raycasts |
| 9 | Water | Lakes and sea surfaces |
| 10 | Aircraft | Player aircraft colliders |
| 11 | Structure | Buildings |
| 12 | Airport | Runways and reload zones |

**Tags:** Player, WaterSource, Runway, ReloadZone.

**Assembly dependencies (no cycles):**

```text
FireWing.Core        (no dependencies)
FireWing.Data        -> Core
FireWing.Environment -> Core, Data
FireWing.Fire        -> Core, Data, Environment
FireWing.Aircraft    -> Core, Data, Environment, Fire
FireWing.Missions    -> Core, Data, Fire, Aircraft
FireWing.Progression -> Core, Data
FireWing.Customization -> Core, Data
FireWing.UI          -> everything above
FireWing.Tests       -> everything above (Editor only)
```

**Scenes**

| Scene | Purpose |
| --- | --- |
| Boot | Creates persistent managers (GameManager, SaveSystem, AudioManager), then loads MainMenu |
| MainMenu | Title, continue, settings |
| Hangar | Aircraft selection, upgrades, livery editor |
| Map\_PineValley, Map\_Coastal, Map\_Desert, ... | One scene per map |
| UI\_HUD | Loaded additively over a map scene |

**Gameplay scene hierarchy (each Map\_ scene)**

```text
--- Managers ---
FireSimulation, FireVisuals, WindSystem, WeatherSystem, DropletManager, MissionManager
--- Environment ---
Terrain, WaterSurfaces, Airports (Runway, ReloadZone, SpawnPoint), Structures
--- Player ---
AircraftSpawnPoint (the aircraft is instantiated here)
--- Cameras ---
Cinemachine brain, ChaseCam, CockpitCam, FlyByCam
```

## 15. Input Map

Create one Input Actions asset named `FireWingControls` with a Flight action map.

| Action | Type | Keyboard and mouse | Gamepad |
| --- | --- | --- | --- |
| Pitch | Axis | S (up) / W (down) | Left stick Y |
| Roll | Axis | A / D | Left stick X |
| Yaw | Axis | Q / E | Left and right bumpers |
| Throttle | Axis | Left Shift (up) / Left Ctrl (down) | Right and left triggers |
| Drop | Button (hold) | Space | A |
| ScoopDoor | Button (toggle) | R | X |
| Flaps | Button (cycle) | F | D-pad up |
| Camera | Button | C | Y |
| Map | Button | M | Back |
| Pause | Button | Esc | Start |

All actions must be rebindable and saved in settings.

## 16. Data Schemas (ScriptableObjects)

Each type goes in its own file in `Scripts/Data/`. All values below are starting numbers to be tuned in play.

```csharp
using System;
using System.Collections.Generic;
using UnityEngine;

namespace FireWing.Data
{
    public enum AircraftClass { LightTanker, Scooper, HeavyTanker, Helicopter, VeryLargeTanker }
    public enum StatType { MaxThrust, FuelCapacity, FuelBurnRate, TankCapacity, DropRate, ScoopRate, MaxHealth, ControlAuthority }
    public enum ModifierOp { Add, Multiply }
    public enum UpgradeCategory { Engine, Tank, FuelTank, Airframe, Avionics, ScoopDoor }
    public enum AvionicsFeature { None, WindIndicator, FireOverlayMinimap, DropPredictor, LevelAutopilot }
    public enum FuelType : byte { None = 0, Grass, Brush, Forest, Structure, Rock, Water }

    [Serializable]
    public struct StatModifier
    {
        public StatType stat;
        public ModifierOp op;
        public float value;
    }

    [CreateAssetMenu(menuName = "FireWing/Aircraft")]
    public class AircraftData : ScriptableObject
    {
        [Header("Identity")]
        public string id;
        public string displayName;
        public AircraftClass aircraftClass;
        public GameObject prefab;
        public Sprite icon;
        public int price;
        public List<UpgradeCategory> upgradeSlots = new List<UpgradeCategory>();

        [Header("Mass and aerodynamics")]
        public float emptyMass = 3000f;            // kg
        public float wingArea = 40f;               // m2
        public float liftSlope = 0.1f;             // lift coefficient per degree of angle of attack
        public float maxLiftCoefficient = 1.5f;
        public float stallAngle = 15f;             // degrees
        public float zeroLiftDrag = 0.03f;
        public float inducedDragFactor = 0.05f;
        public float maxSpeed = 85f;               // m/s, thrust fades to zero here

        [Header("Propulsion and fuel")]
        public float maxThrust = 25000f;           // N
        public float fuelCapacity = 300f;          // kg
        public float fuelBurnRate = 0.1f;          // kg/s at full throttle

        [Header("Control authority (deg/s^2 at full deflection)")]
        public float pitchAuthority = 60f;
        public float rollAuthority = 120f;
        public float yawAuthority = 30f;

        [Header("Firefighting")]
        public float tankCapacity = 3000f;         // liters
        public float dropRate = 600f;              // liters per second
        public bool canScoop;
        public float scoopRate = 0f;               // liters per second
        public float minScoopSpeed = 35f;          // m/s
        public float maxScoopAltitude = 8f;        // meters above water

        [Header("Durability")]
        public float maxHealth = 100f;
    }

    [CreateAssetMenu(menuName = "FireWing/Upgrade")]
    public class UpgradeData : ScriptableObject
    {
        public string id;
        public string displayName;
        [TextArea] public string description;
        public Sprite icon;
        public UpgradeCategory category;
        public int tier = 1;
        public int price;
        public UpgradeData prerequisite;           // null for tier 1
        public List<StatModifier> modifiers = new List<StatModifier>();
        public AvionicsFeature unlocksFeature;
        public List<AircraftData> compatibleAircraft = new List<AircraftData>(); // empty means all
    }

    [Serializable]
    public class WeatherPreset
    {
        public string name = "Clear";
        public float windSpeed = 4f;               // m/s
        public float windDirectionDeg = 270f;      // direction wind blows FROM, compass degrees
        public float gustiness = 0.2f;             // 0..1
        public float temperatureC = 28f;
        public float humidity = 0.3f;              // 0..1
        public float visibilityMeters = 10000f;
        public float timeOfDayHours = 14f;
    }

    [CreateAssetMenu(menuName = "FireWing/Map")]
    public class MapData : ScriptableObject
    {
        public string id;
        public string displayName;
        [TextArea] public string description;
        public string sceneName;
        public Sprite preview;
        public int requiredReputation;
        public Vector2 sizeMeters = new Vector2(4000f, 4000f);
        public float cellSizeMeters = 10f;
        public List<WeatherPreset> weatherPresets = new List<WeatherPreset>();
        public List<MissionData> missions = new List<MissionData>();
    }

    public enum ObjectiveType { ExtinguishAll, ContainBelowAcres, ProtectStructures, FinishWithinSeconds, LandAtAirport }

    [Serializable]
    public class ObjectiveDef
    {
        public ObjectiveType type;
        public float value;                        // acres, fraction of structures lost, or seconds
        public bool required = true;
        public int bonusPayout;                    // paid when a non-required objective is met
    }

    [Serializable]
    public struct IgnitionPoint
    {
        public Vector2 positionNormalized;         // 0..1 across the map
        public float radiusMeters;
        public float delaySeconds;
    }

    [CreateAssetMenu(menuName = "FireWing/Mission")]
    public class MissionData : ScriptableObject
    {
        public string id;
        public string title;
        [TextArea] public string briefing;
        public MapData map;
        [Range(1, 5)] public int difficulty = 1;
        public int basePayout = 3000;
        public int requiredReputation;
        public int weatherPresetIndex;
        public string startAirportId;
        public float timeLimitSeconds = 900f;
        public float failAreaAcres = 200f;         // mission fails if more than this burns
        public List<IgnitionPoint> ignitions = new List<IgnitionPoint>();
        public List<ObjectiveDef> objectives = new List<ObjectiveDef>();
        public List<AircraftClass> allowedClasses = new List<AircraftClass>();
    }

    [Serializable]
    public struct DecalPlacement
    {
        public string decalId;
        public Vector2 uvPosition;
        public float rotationDeg;
        public float scale;
    }

    [CreateAssetMenu(menuName = "FireWing/Skin")]
    public class SkinData : ScriptableObject
    {
        public string id;
        public string displayName;
        public AircraftData aircraft;              // null means usable on any aircraft
        public Color primary = Color.white;
        public Color secondary = Color.red;
        public Color accent = Color.yellow;
        public Texture2D patternMask;              // optional extra stripe or camo pattern
        public List<DecalPlacement> decals = new List<DecalPlacement>();
        public int price;                          // 0 with unlockReputation > 0 means reputation unlock
        public int unlockReputation;
    }
}
```

**Unity note for the AI:** ScriptableObjects that reference each other (Map and Mission) are fine inside one assembly. Create sample assets via the CreateAssetMenu entries, then store them in `ScriptableObjects/` and load them through an `AssetCatalog` ScriptableObject that holds lists of all aircraft, upgrades, maps, missions, and skins (so the game can look up any asset by its id string).

## 17. Core Infrastructure

```csharp
using System;
using UnityEngine;

namespace FireWing.Core
{
    /// <summary>Type-safe static event bus. One channel per event struct.</summary>
    public static class EventBus<T> where T : struct
    {
        static Action<T> _handlers;
        public static void Subscribe(Action<T> handler) { _handlers += handler; }
        public static void Unsubscribe(Action<T> handler) { _handlers -= handler; }
        public static void Publish(T evt) { _handlers?.Invoke(evt); }
        /// <summary>Remove all handlers. Call from GameManager when leaving a gameplay scene.</summary>
        public static void Clear() { _handlers = null; }
    }

    // Events.cs: all event structs live in one file
    public struct GameStateChanged { public GameState state; }
    public struct PayloadChanged { public float current; public float max; }
    public struct FuelChanged { public float current; public float max; }
    public struct HealthChanged { public float current; public float max; }
    public struct DropStateChanged { public bool dropping; }
    public struct FireStatsChanged
    {
        public int burningCells; public int burnedCells;
        public float burnedAcres;
        public int structuresBurned; public int structuresTotal;
    }
    public struct MissionStarted { public string missionId; }
    public struct MissionEnded { public string missionId; public bool success; public int score; public int payout; public string rank; }
    public struct AircraftCrashed { public Vector3 position; }
    public struct MoneyChanged { public int amount; }
    public struct SaveLoaded { }

    public enum GameState { Boot, MainMenu, Hangar, Briefing, InFlight, Paused, Results }

    /// <summary>Persistent singleton that owns the high-level state machine.</summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }
        public GameState State { get; private set; } = GameState.Boot;

        void Awake()
        {
            if (Instance != null) { Destroy(gameObject); return; }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        public void SetState(GameState next)
        {
            if (next == State) return;
            State = next;
            Time.timeScale = next == GameState.Paused ? 0f : 1f;
            EventBus<GameStateChanged>.Publish(new GameStateChanged { state = next });
        }
    }
}
```

Domain reload note: if Enter Play Mode options disable domain reload, static events persist between runs. Keep domain reload enabled, or call `Clear()` on each EventBus channel at startup.

## 18. Aircraft Systems

### 18.1 AircraftStats (applies upgrades to base stats)

Formula for every stat: `final = (base + sum of Add modifiers) * product of Multiply modifiers`. A Multiply value of 1.2 means +20 percent.

```csharp
using System;
using System.Collections.Generic;
using FireWing.Data;

namespace FireWing.Aircraft
{
    public class AircraftStats
    {
        readonly AircraftData _d;
        readonly float[] _add;
        readonly float[] _mul;

        public AircraftStats(AircraftData data, IReadOnlyList<UpgradeData> installed)
        {
            _d = data;
            int n = Enum.GetValues(typeof(StatType)).Length;
            _add = new float[n];
            _mul = new float[n];
            for (int i = 0; i < n; i++) _mul[i] = 1f;
            for (int u = 0; u < installed.Count; u++)
                foreach (var m in installed[u].modifiers)
                {
                    if (m.op == ModifierOp.Add) _add[(int)m.stat] += m.value;
                    else _mul[(int)m.stat] *= m.value;
                }
        }

        float R(StatType t, float b) => (b + _add[(int)t]) * _mul[(int)t];

        public float MaxThrust => R(StatType.MaxThrust, _d.maxThrust);
        public float FuelCapacity => R(StatType.FuelCapacity, _d.fuelCapacity);
        public float FuelBurnRate => R(StatType.FuelBurnRate, _d.fuelBurnRate);
        public float TankCapacity => R(StatType.TankCapacity, _d.tankCapacity);
        public float DropRate => R(StatType.DropRate, _d.dropRate);
        public float ScoopRate => R(StatType.ScoopRate, _d.scoopRate);
        public float MaxHealth => R(StatType.MaxHealth, _d.maxHealth);
        public float ControlAuthority => R(StatType.ControlAuthority, 1f);
    }
}
```

### 18.2 AircraftRuntime (per-aircraft state holder)

A MonoBehaviour on the aircraft prefab root. Responsibilities:

- `Initialize(AircraftData data, IReadOnlyList<UpgradeData> upgrades)` builds `Stats`, sets `FuelKg = Stats.FuelCapacity`, `Health = Stats.MaxHealth`, and sizes the PayloadSystem.
- Public read-only: `Data`, `Stats`, `FuelKg`, `Health`, `Payload` (PayloadSystem), `Flight` (FlightModel), `Features` (set of AvionicsFeature unlocked).
- `ConsumeFuel(float kg)`: subtracts fuel, publishes `FuelChanged`.
- `Refuel(float kg)`: adds fuel up to capacity.
- `TakeDamage(float amount)`: subtracts health, publishes `HealthChanged`; at zero publishes `AircraftCrashed` and disables controls.
- `HasFeature(AvionicsFeature f)`.

### 18.3 FlightModel

Arcade-sim hybrid using one Rigidbody. Forces: lift, drag, thrust, and gravity (from Rigidbody). Rotation: input torque scaled by airspeed, plus a small stability assist.

```csharp
using UnityEngine;
using FireWing.Data;

namespace FireWing.Aircraft
{
    public struct FlightInput { public float pitch, roll, yaw, throttle; } // pitch +1 = nose up, roll +1 = right bank, throttle 0..1

    [RequireComponent(typeof(Rigidbody))]
    public class FlightModel : MonoBehaviour
    {
        [SerializeField] AircraftRuntime runtime;
        [SerializeField] float throttleSpoolPerSecond = 0.5f;
        [SerializeField] float stabilityAssist = 0.6f;
        [SerializeField] float stallLiftFactor = 0.5f;
        [SerializeField] float stallExtraDrag = 0.2f;
        [SerializeField] LayerMask terrainMask;

        Rigidbody _rb;
        FlightInput _input;
        float _throttle;

        public float Speed { get; private set; }
        public float AngleOfAttack { get; private set; }
        public bool IsStalled { get; private set; }
        public float AltitudeAGL { get; private set; }
        public float Throttle => _throttle;
        public float StallSpeed { get; private set; }
        public void SetInput(FlightInput input) { _input = input; }

        void Awake() { _rb = GetComponent<Rigidbody>(); }

        void FixedUpdate()
        {
            if (runtime.IsDestroyed) return;
            float dt = Time.fixedDeltaTime;
            var d = runtime.Data;
            var s = runtime.Stats;

            _throttle = Mathf.MoveTowards(_throttle, _input.throttle, throttleSpoolPerSecond * dt);
            _rb.mass = d.emptyMass + runtime.FuelKg + runtime.Payload.Liters; // 1 liter of water is about 1 kg

            Vector3 vel = _rb.linearVelocity; // use _rb.velocity on Unity 2022
            Vector3 localVel = transform.InverseTransformDirection(vel);
            Speed = vel.magnitude;
            AngleOfAttack = Speed > 1f ? Mathf.Atan2(-localVel.y, localVel.z) * Mathf.Rad2Deg : 0f;

            float rho = 1.225f * Mathf.Exp(-transform.position.y / 8500f);
            float q = 0.5f * rho * Speed * Speed;

            float cl = Mathf.Clamp(AngleOfAttack * d.liftSlope, -d.maxLiftCoefficient, d.maxLiftCoefficient);
            IsStalled = Mathf.Abs(AngleOfAttack) > d.stallAngle;
            if (IsStalled) cl *= stallLiftFactor;
            float cd = d.zeroLiftDrag + d.inducedDragFactor * cl * cl + (IsStalled ? stallExtraDrag : 0f);

            Vector3 lift = transform.up * (q * d.wingArea * cl);
            Vector3 drag = Speed > 0.01f ? -vel.normalized * (q * d.wingArea * cd) : Vector3.zero;

            float fade = Mathf.Clamp01(1f - (Speed * Speed) / (d.maxSpeed * d.maxSpeed));
            float hasFuel = runtime.FuelKg > 0f ? 1f : 0f;
            Vector3 thrust = transform.forward * (s.MaxThrust * _throttle * fade * hasFuel * (rho / 1.225f));

            _rb.AddForce(lift + drag + thrust, ForceMode.Force);

            StallSpeed = Mathf.Sqrt(2f * _rb.mass * 9.81f / (1.225f * d.wingArea * d.maxLiftCoefficient));
            float effectiveness = Mathf.Clamp01(Speed / (StallSpeed * 1.2f));
            Vector3 torque = new Vector3(-_input.pitch * d.pitchAuthority, _input.yaw * d.yawAuthority, -_input.roll * d.rollAuthority);
            _rb.AddRelativeTorque(torque * (Mathf.Deg2Rad * s.ControlAuthority * effectiveness), ForceMode.Acceleration);

            if (Speed > 5f)
            {
                Vector3 align = Vector3.Cross(transform.forward, vel.normalized);
                _rb.AddTorque(align * (stabilityAssist * effectiveness), ForceMode.Acceleration);
            }

            // Turbulence from heat and wind
            float turb = FireWing.Environment.WindSystem.Instance.GetTurbulence(transform.position);
            if (turb > 0f)
                _rb.AddRelativeTorque(Random.insideUnitSphere * (turb * 0.4f), ForceMode.Acceleration);

            runtime.ConsumeFuel(s.FuelBurnRate * _throttle * dt);

            AltitudeAGL = Physics.Raycast(transform.position, Vector3.down, out var hit, 5000f, terrainMask) ? hit.distance : 5000f;
        }

        void OnCollisionEnter(Collision c)
        {
            const float safeImpactSpeed = 6f;
            const float damagePerMps = 6f;
            float over = c.relativeVelocity.magnitude - safeImpactSpeed;
            if (over > 0f) runtime.TakeDamage(over * damagePerMps);
        }
    }
}
```

**Verify in the editor:** Unity's local-axis sign conventions can invert pitch or roll depending on how the model is oriented. If a control is reversed, flip the sign on that line, not elsewhere. Rigidbody settings: angular damping 1.5 to 3, interpolation on, collision detection continuous dynamic.

**Ground handling (same task as the flight model):** three WheelColliders (nose and two main). Brake on the Brake axis. Nose steering follows yaw input when ground speed is below 15 m/s. Takeoff is rotating the nose up past about 1.1 times stall speed.

**Tuning checklist for the starter plane (Sparrow AT-1):** with a full tank it should lift off around 45 m/s, cruise near 60 m/s, stall around 41 m/s, and be able to climb at roughly 3 to 5 m/s with a full load. Expose these as live-tunable values in a debug panel (IMGUI is fine).

## 19. Water Systems

### 19.1 PayloadSystem

Owns the tank: `Liters`, `Capacity` (from Stats), `IsDropping`, `Mode` (Water or Retardant). `Fill(float liters)` clamps to capacity. `SetDropping(bool)` ignores true if empty. In FixedUpdate while dropping: `amount = min(Liters, Stats.DropRate * dt)`, subtract it, call `DropletManager.Instance.Emit(...)` from the belly drop point with the aircraft's velocity, and publish `PayloadChanged` only when the value changed by at least 1 liter. Stop automatically at zero and publish `DropStateChanged`.

### 19.2 DropletManager (central droplet simulation, no per-droplet GameObjects)

```csharp
using UnityEngine;
using FireWing.Fire;
using FireWing.Environment;

namespace FireWing.Aircraft
{
    public class DropletManager : MonoBehaviour
    {
        public static DropletManager Instance { get; private set; }

        [SerializeField] int capacity = 4096;
        [SerializeField] float litersPerDroplet = 5f;
        [SerializeField] float dragPerSecond = 0.35f;     // pulls droplet velocity toward wind
        [SerializeField] float impactRadius = 4f;
        [SerializeField] float evaporationPerSecond = 0.01f;

        struct Droplet { public Vector3 pos, vel; public float liters; public bool active, retardant; }

        Droplet[] _d;
        int _cursor;
        float _carry;

        public float LitersDropped { get; private set; }
        public float LitersOnTarget { get; private set; }

        void Awake() { Instance = this; _d = new Droplet[capacity]; }

        public void ResetStats() { LitersDropped = 0f; LitersOnTarget = 0f; }

        /// <summary>Queue liters for release. Spawns whole droplets and carries the remainder.</summary>
        public void Emit(Vector3 origin, Vector3 inheritedVelocity, float liters, float spreadDeg, bool retardant)
        {
            LitersDropped += liters;
            _carry += liters;
            while (_carry >= litersPerDroplet)
            {
                _carry -= litersPerDroplet;
                Vector3 jitter = Random.insideUnitSphere * Mathf.Tan(spreadDeg * Mathf.Deg2Rad) * 10f;
                ref Droplet dr = ref _d[_cursor];
                dr.pos = origin;
                dr.vel = inheritedVelocity + jitter;
                dr.liters = litersPerDroplet;
                dr.retardant = retardant;
                dr.active = true;
                _cursor = (_cursor + 1) % capacity;
            }
        }

        void FixedUpdate()
        {
            float dt = Time.fixedDeltaTime;
            var terrain = Terrain.activeTerrain;
            float baseY = terrain.GetPosition().y;
            for (int i = 0; i < _d.Length; i++)
            {
                if (!_d[i].active) continue;
                ref Droplet dr = ref _d[i];
                Vector3 wind = WindSystem.Instance.GetWind(dr.pos);
                dr.vel += Physics.gravity * dt + (wind - dr.vel) * (dragPerSecond * dt);
                dr.pos += dr.vel * dt;
                dr.liters *= 1f - evaporationPerSecond * dt;
                float ground = terrain.SampleHeight(dr.pos) + baseY;
                if (dr.pos.y <= ground)
                {
                    bool onFire = FireSimulation.Instance.Apply(dr.pos, impactRadius, dr.liters, dr.retardant);
                    if (onFire) LitersOnTarget += dr.liters;
                    dr.active = false;
                }
            }
        }
    }
}
```

Visuals: a VFX Graph effect for the falling water streak. Do not spawn one VFX per droplet; instead emit from the aircraft's drop point with the same inherited velocity and let the GPU particles fall independently. The CPU droplets above are for gameplay only.

### 19.3 ScoopController

```csharp
using UnityEngine;

namespace FireWing.Aircraft
{
    public class ScoopController : MonoBehaviour
    {
        [SerializeField] AircraftRuntime runtime;
        [SerializeField] FlightModel flight;
        [SerializeField] LayerMask waterMask;
        public bool DoorOpen { get; set; }
        public bool IsScooping { get; private set; }

        void FixedUpdate()
        {
            IsScooping = false;
            if (!runtime.Data.canScoop || !DoorOpen) return;
            if (flight.Speed < runtime.Data.minScoopSpeed) return;
            if (runtime.Payload.Liters >= runtime.Payload.Capacity) return;
            if (!Physics.Raycast(transform.position, Vector3.down, runtime.Data.maxScoopAltitude, waterMask)) return;
            IsScooping = true;
            runtime.Payload.Fill(runtime.Stats.ScoopRate * Time.fixedDeltaTime);
        }
    }
}
```

While scooping: play spray VFX at the belly, play the scoop audio loop, and apply a small extra drag. If the aircraft touches water below minScoopSpeed with the door open, apply damage.

## 20. Fire Simulation

### 20.1 Data

```csharp
namespace FireWing.Fire
{
    public enum CellState : byte { Unburned, Burning, BurnedOut }

    public struct FireCell
    {
        public FireWing.Data.FuelType fuel;
        public CellState state;
        public float fuelLeft;     // seconds of burn time remaining
        public float moisture;     // 0..1
        public float retardant;    // seconds of protection remaining
        public float heat;         // 0..1, for visuals and turbulence
    }

    public class FireGrid
    {
        public readonly int width, height;
        public readonly float cellSize;
        public readonly UnityEngine.Vector3 origin;   // world position of the corner of cell (0,0)
        public readonly FireCell[] cells;
        public readonly float[] elevation;

        public FireGrid(FireWing.Data.FuelMapAsset map)
        {
            width = map.width; height = map.height; cellSize = map.cellSize; origin = map.origin;
            cells = new FireCell[width * height];
            elevation = (float[])map.elevation.Clone();
            // fuelLeft and moisture are set by FireSimulation.Initialize from FireConfig
            for (int i = 0; i < cells.Length; i++) cells[i].fuel = (FireWing.Data.FuelType)map.fuel[i];
        }

        public bool InBounds(int x, int y) => x >= 0 && y >= 0 && x < width && y < height;
        public int Index(int x, int y) => y * width + x;
        public bool WorldToCell(UnityEngine.Vector3 w, out int x, out int y)
        {
            x = UnityEngine.Mathf.FloorToInt((w.x - origin.x) / cellSize);
            y = UnityEngine.Mathf.FloorToInt((w.z - origin.z) / cellSize);
            return InBounds(x, y);
        }
        public UnityEngine.Vector3 CellToWorld(int x, int y) =>
            new UnityEngine.Vector3(origin.x + (x + 0.5f) * cellSize, elevation[Index(x, y)], origin.z + (y + 0.5f) * cellSize);
    }
}
```

Also create in FireWing.Data:

```csharp
[CreateAssetMenu(menuName = "FireWing/Fuel Map")]
public class FuelMapAsset : ScriptableObject
{
    public int width, height;
    public float cellSize = 10f;
    public Vector3 origin;
    public byte[] fuel;          // FuelType per cell
    public float[] elevation;    // meters per cell
}
```

### 20.2 FireConfig (ScriptableObject, tuned values)

| Field | Default | Meaning |
| --- | --- | --- |
| tickSeconds | 0.25 | Simulation step |
| baseIgnitionRate | 0.15 | Ignitions per second per burning neighbor, before modifiers |
| windGain | 0.12 | Extra spread per m/s of wind, downwind |
| slopeGain | 2.0 | Extra spread per unit of uphill slope |
| extinguishMoisture | 0.5 | Moisture at which a burning cell goes out |
| moisturePerMm | 0.25 | Moisture added per liter per square meter |
| moistureDryPerSecond | 0.004 | Drying back toward the fuel's base moisture |
| retardantSeconds | 900 | How long a retardant line protects cells |
| retardantIgnitionFactor | 0.05 | Ignition multiplier on retardant cells |
| spottingWindThreshold | 8 | Wind (m/s) above which embers jump |
| spottingAttemptsPerTick | 3 | Spotting tries per tick |
| spottingDistanceCells | 5 to 20 | Spot distance range |
| spottingChance | 0.1 | Probability per attempt |

**Fuel table**

| FuelType | flammability | burnSeconds | baseMoisture |
| --- | --- | --- | --- |
| Grass | 1.0 | 20 | 0.05 |
| Brush | 0.7 | 60 | 0.10 |
| Forest | 0.5 | 180 | 0.15 |
| Structure | 0.4 | 240 | 0.05 |
| Rock, Water, None | 0 | 0 | 0 |

FireConfig exposes `FuelProfile Get(FuelType)` backed by an array indexed by `(int)type`, built in `OnValidate`.

### 20.3 FireSimulation algorithm

Fixed tick, driven from FixedUpdate with an accumulator. Keep an active list of burning cell indices so the cost scales with fire size, not map size.

```text
Tick(dt):
  wind = WindSystem.GetWind(map center); windDir = normalized (x, z); windSpeed = magnitude
  clear _pending
  for each index i in _burning:
      c = cells[i]
      if c.state != Burning: skip (it was extinguished)
      c.fuelLeft -= dt
      if c.fuelLeft <= 0: state = BurnedOut, heat = 0, burned++, (if Structure) structuresBurned++; skip
      c.heat = 0.3 + 0.7 * clamp01(c.fuelLeft / burnSeconds)
      keep i in _nextBurning
      for each of 8 neighbors n of cell i:
          if n.state != Unburned or n.fuelLeft <= 0 or flammability == 0: continue
          dist = 1 or 1.414 (diagonal); dir = unit vector from i to n in (x, y)
          windFactor  = max(0.1, 1 + windGain * windSpeed * dot(dir, windDir))
          slope       = (elevation[n] - elevation[i]) / (cellSize * dist)
          slopeFactor = clamp(1 + slopeGain * slope, 0.2, 4)
          rate = baseIgnitionRate * flammability(n) * (1 - moisture(n)) * windFactor * slopeFactor / dist
          if n.retardant > 0: rate *= retardantIgnitionFactor
          p = 1 - exp(-rate * dt)
          if rng.NextDouble() < p: add n to _pending
  spotting: if windSpeed > spottingWindThreshold:
      repeat spottingAttemptsPerTick times:
          pick a random index from _burning; with probability spottingChance
          target = that cell + windDir * random(spottingDistanceCells) (rounded)
          if target is in bounds and Unburned and flammable: add to _pending
  commit: for each index in _pending: if state is still Unburned, set Burning, heat 1, add to _nextBurning
  swap _burning and _nextBurning
  modified cells: for each index in the _modified set:
      moisture = max(baseMoisture, moisture - moistureDryPerSecond * dt)
      retardant = max(0, retardant - dt)
      remove from the set when moisture is at base and retardant is 0
  once per second publish FireStatsChanged
```

Use `System.Random` with an injectable seed so tests are repeatable. To avoid allocations, the modified set is a `HashSet<int>` iterated into a reusable scratch list before editing.

### 20.4 Public API

```csharp
public void Initialize(FuelMapAsset map, int seed);                 // builds grid, sets fuelLeft = burnSeconds, moisture = base
public void IgniteWorld(Vector3 world, float radiusMeters);        // used by missions
public bool Apply(Vector3 world, float radius, float liters, bool retardant); // returns true if the impact was on or beside fire
public float HeatAt(Vector3 world);                                 // max heat in the 3x3 around the cell, 0 if out of bounds
public FireStatsChanged Stats { get; }
public static FireSimulation Instance { get; }
```

`Apply` details:

```text
convert world to cell; if out of bounds return false
effectiveRadius = max(radius, cellSize / 2)
area = max(pi * radius^2, cellSize^2);  dosePerM2 = liters / area   (liters per square meter equals millimeters)
for every cell whose center is within effectiveRadius:
    if retardant: cell.retardant = retardantSeconds
    else: cell.moisture = min(1, moisture + dosePerM2 * moisturePerMm)
          if state is Burning and moisture >= extinguishMoisture: state = Unburned, heat = 0
    add the cell to the _modified set
onFire = any burning cell within effectiveRadius, or any burning cell within 2 cells of the center
return onFire
```

Extinguished cells keep their remaining `fuelLeft`, so they can reignite if they dry out beside a fire.

### 20.5 FireVisuals (rendering the grid)

1. **Ground overlay:** write the grid into a `Texture2D` (R = heat, G = 1 when burned out) every 0.25 s using `SetPixelData` and `Apply`. The terrain shader blends char black where G is 1 and an orange glow where R is high.
2. **Flame particles:** every 0.5 s find up to 200 burning cells nearest the camera (partial sort on distance), and place pooled VFX Graph flame emitters on them. Scale flame size by heat and fuel type.
3. **Smoke:** one larger smoke plume emitter per cluster of burning cells, placed at cluster centers (simple 50 m bucket clustering), drifting with the wind.
4. **Distance LOD:** beyond about 800 m, show only the ground overlay and a minimap blob.

## 21. Environment Systems

### 21.1 WindSystem

```csharp
using UnityEngine;
using FireWing.Data;

namespace FireWing.Environment
{
    public class WindSystem : MonoBehaviour
    {
        public static WindSystem Instance { get; private set; }
        WeatherPreset _preset = new WeatherPreset();
        Vector3 _baseWind;

        void Awake() { Instance = this; SetPreset(_preset); }

        /// <summary>Wind direction in the preset is where it blows FROM (compass degrees, north = +Z).</summary>
        public void SetPreset(WeatherPreset p)
        {
            _preset = p;
            float to = (p.windDirectionDeg + 180f) * Mathf.Deg2Rad;
            _baseWind = new Vector3(Mathf.Sin(to), 0f, Mathf.Cos(to)) * p.windSpeed;
        }

        public Vector3 GetWind(Vector3 pos)
        {
            float t = Time.time * 0.15f;
            float gust = 1f + _preset.gustiness * (Mathf.PerlinNoise(t, pos.x * 0.001f) - 0.5f) * 2f;
            float altitude = 1f + Mathf.Clamp(pos.y, 0f, 1500f) / 500f * 0.3f;
            return _baseWind * (gust * altitude);
        }

        /// <summary>0..1 turbulence: base from gustiness, plus thermals above hot ground.</summary>
        public float GetTurbulence(Vector3 pos)
        {
            float baseT = _preset.gustiness * 0.3f;
            float heat = FireWing.Fire.FireSimulation.Instance != null ? FireWing.Fire.FireSimulation.Instance.HeatAt(pos) : 0f;
            return Mathf.Clamp01(baseT + heat * 0.7f);
        }
    }
}
```

The Environment assembly must not reference Fire (cycle). Resolve this by moving `HeatAt` behind an interface `IHeatSource { float HeatAt(Vector3 world); }` defined in Core, implemented by FireSimulation, and assigned to WindSystem at startup.

### 21.2 WeatherSystem

- Applies a `WeatherPreset` at mission start: sets wind, fog, sun, and ambient light.
- Fog: exponential fog with `RenderSettings.fogDensity = 3.9 / visibilityMeters`.
- Time of day: rotate the directional light; sun elevation from `timeOfDayHours` (noon is overhead, 6 and 18 are at the horizon). Night (hour below 6 or above 19) needs the night lighting profile and HUD aids.
- Smoke reduces visibility: add to fog density in proportion to burning cells within 1 km of the camera.

### 21.3 Airports and reloading

- **Airport prefab:** runway mesh (layer Airport), 2 spawn points, a ReloadZone trigger (tag ReloadZone) in the apron.
- **ReloadZone:** while the player is inside and ground speed is below 2 m/s, refill `Payload` at 400 L/s and refuel at 2 kg/s. Charge fuel cost through the Wallet (section 23). Retardant is chosen in the briefing for heavy tankers.
- **Water sources:** lakes and sea use a mesh with a collider on layer Water. Rivers can be narrow collider strips. ScoopController finds them with a downward raycast.
- **Landing check:** `LandAtAirport` objective passes when the aircraft is on the Runway layer, speed below 3 m/s, and not destroyed.

## 22. Missions and Scoring

### 22.1 Mission flow (MissionManager)

States: `Idle`, `Active`, `Succeeded`, `Failed`.

```text
StartMission(MissionData m, AircraftData a, owned upgrades, skin):
  1. Load the map scene, then the UI_HUD scene additively.
  2. WeatherSystem.Apply(m.map.weatherPresets[m.weatherPresetIndex]).
  3. FireSimulation.Initialize(map fuel asset, seed = hash of mission id).
  4. DropletManager.ResetStats().
  5. Instantiate the aircraft prefab at the start airport spawn point.
     runtime.Initialize(a, upgrades); SkinApplier.Apply(skin).
  6. Start the clock. For each IgnitionPoint, at delaySeconds call
     FireSimulation.IgniteWorld(mapOrigin + normalizedPos * mapSize, radiusMeters).
  7. Publish MissionStarted. GameManager.SetState(InFlight).

Every 1 second (not every frame):
  evaluate objectives (below), check end conditions, update HUD objective list.

End conditions:
  Success: all ignitions have happened, burning cells == 0, every required objective satisfied.
  Fail:    burnedAcres > failAreaAcres, OR elapsed > timeLimitSeconds,
           OR the aircraft crashed, OR a required objective can no longer be met.
  On end: compute score, apply payout and reputation, save, publish MissionEnded, SetState(Results).
```

**Objective evaluation**

| ObjectiveType | Satisfied when | Permanently failed when |
| --- | --- | --- |
| ExtinguishAll | burning cells == 0 and all ignitions done | Never (time limit covers it) |
| ContainBelowAcres (value) | At mission end, burned acres is at or below value | burned acres exceeds value |
| ProtectStructures (value as max fraction lost) | At mission end, structuresBurned divided by structuresTotal is at or below value | The fraction exceeds value |
| FinishWithinSeconds (value) | Mission success reached with elapsed at or below value | elapsed exceeds value |
| LandAtAirport | Aircraft on Runway layer, speed below 3 m/s, alive | Aircraft destroyed |

A non-required objective that is met adds its `bonusPayout`.

### 22.2 ScoreCalculator (pure function, unit-test this first)

```csharp
using UnityEngine;

namespace FireWing.Missions
{
    public struct ScoreInput
    {
        public float burnedAcres, failAreaAcres;
        public int structuresBurned, structuresTotal;
        public float elapsedSeconds, timeLimitSeconds;
        public float litersDropped, litersOnTarget;
        public float healthFraction;     // 0..1
        public bool crashed, allRequiredMet;
        public int difficulty, basePayout, bonusPayout;
    }

    public struct ScoreResult { public int score; public string rank; public bool success; public int payout; public int reputationGain; }

    public static class ScoreCalculator
    {
        public static ScoreResult Calculate(in ScoreInput s)
        {
            float containment = 400f * (1f - Mathf.Clamp01(s.burnedAcres / Mathf.Max(1f, s.failAreaAcres)));
            float structures = s.structuresTotal <= 0 ? 250f : 250f * (1f - (float)s.structuresBurned / s.structuresTotal);
            float time = 150f * Mathf.Clamp01(1f - s.elapsedSeconds / Mathf.Max(1f, s.timeLimitSeconds));
            float accuracy = s.litersDropped <= 1f ? 0f : 100f * Mathf.Clamp01(s.litersOnTarget / s.litersDropped);
            float safety = 100f * Mathf.Clamp01(s.healthFraction);

            int score = Mathf.RoundToInt(containment + structures + time + accuracy + safety);
            bool success = s.allRequiredMet && !s.crashed;
            string rank = !success ? "F" : score >= 900 ? "S" : score >= 750 ? "A" : score >= 600 ? "B" : score >= 400 ? "C" : "D";
            int rankMult = rank == "S" ? 5 : rank == "A" ? 4 : rank == "B" ? 3 : rank == "C" ? 2 : rank == "D" ? 1 : 0;

            return new ScoreResult
            {
                score = score,
                rank = rank,
                success = success,
                payout = success ? Mathf.RoundToInt(s.basePayout * (0.5f + score / 1000f)) + s.bonusPayout : 0,
                reputationGain = success ? s.difficulty * rankMult * 5 : 0
            };
        }
    }
}
```

Score weights: containment 400, structures 250, time 150, accuracy 100, safety 100 (total 1000). Fuel is charged separately at reload time, so it is not subtracted here.

### 22.3 Integration notes (apply when coding sections 17 to 21)

- `AircraftRuntime` needs a read-only `bool IsDestroyed` (true once health reaches zero).
- `AircraftRuntime` exposes `PayloadSystem Payload` and `FlightModel Flight` as serialized references.
- `FireSimulation.Apply(...)` is the name DropletManager calls. `IgniteWorld` and `Initialize` are called by MissionManager.
- Interfaces in Core to avoid assembly cycles: `IHeatSource` (implemented by FireSimulation, assigned to WindSystem at startup).
- Anything that must run once per second uses a simple timer in the owning MonoBehaviour, not a coroutine allocation per tick.

## 23. Economy and Progression

### 23.1 Starting state

Money 5000, reputation 0, aircraft: Sparrow AT-1 (owned), map: Pine Valley unlocked.

### 23.2 Aircraft roster (initial tuning)

| id | Name | Class | Price | Empty mass kg | Wing area m2 | Max thrust N | Tank L | Fuel kg | Max speed m/s | Scoop L/s |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| sparrow\_at1 | Sparrow AT-1 | LightTanker | 0 | 3000 | 40 | 25000 | 3000 | 300 | 85 | none |
| heron\_s2 | Heron S-2 | Scooper | 90000 | 12000 | 70 | 60000 | 5500 | 900 | 80 | 500 |
| atlas\_t4 | Atlas T-4 | HeavyTanker | 220000 | 20000 | 100 | 110000 | 12000 | 2500 | 95 | none |
| condor\_vlt | Condor VLT | VeryLargeTanker | 600000 | 90000 | 250 | 400000 | 40000 | 12000 | 120 | none |
| kestrel\_h1 | Kestrel H-1 (post-MVP) | Helicopter | 150000 | 2500 | n/a | rotor model | 2500 bucket | 400 | 60 | 200 |

The helicopter needs its own flight model (`HelicopterFlightModel`): collective, cyclic, and pedals, with a hanging bucket on a rope. Build it after the MVP.

### 23.3 Upgrade table (3 tiers per category; Multiply values shown as the multiplier)

| Category | Tier | Price | Prerequisite | Effect |
| --- | --- | --- | --- | --- |
| Engine | 1 | 8000 | none | MaxThrust x1.10 |
| Engine | 2 | 20000 | Engine 1 | MaxThrust x1.20 |
| Engine | 3 | 45000 | Engine 2 | MaxThrust x1.30, FuelBurnRate x0.90 |
| Tank | 1 | 6000 | none | TankCapacity x1.15 |
| Tank | 2 | 15000 | Tank 1 | TankCapacity x1.30, DropRate x1.10 |
| Tank | 3 | 35000 | Tank 2 | TankCapacity x1.50, DropRate x1.25 |
| FuelTank | 1 | 4000 | none | FuelCapacity x1.20 |
| FuelTank | 2 | 10000 | FuelTank 1 | FuelCapacity x1.40 |
| FuelTank | 3 | 22000 | FuelTank 2 | FuelCapacity x1.60 |
| Airframe | 1 | 5000 | none | MaxHealth x1.25 |
| Airframe | 2 | 14000 | Airframe 1 | MaxHealth x1.50 |
| Airframe | 3 | 30000 | Airframe 2 | MaxHealth x2.00, ControlAuthority x1.10 |
| Avionics | 1 | 3000 | none | Unlocks WindIndicator |
| Avionics | 2 | 9000 | Avionics 1 | Unlocks FireOverlayMinimap |
| Avionics | 3 | 20000 | Avionics 2 | Unlocks DropPredictor |
| Avionics | 4 | 35000 | Avionics 3 | Unlocks LevelAutopilot |
| ScoopDoor (scoopers only) | 1 | 10000 | none | ScoopRate x1.25 |
| ScoopDoor (scoopers only) | 2 | 25000 | ScoopDoor 1 | ScoopRate x1.50 |

Prices are for the Sparrow. Multiply the price by an aircraft price factor (Sparrow 1, Heron 3, Atlas 6, Condor 12) so upgrades scale with the aircraft.

### 23.4 Money and reputation

| Difficulty | Base payout | Typical aircraft |
| --- | --- | --- |
| 1 | 3000 | Sparrow |
| 2 | 6000 | Sparrow, Heron |
| 3 | 12000 | Heron, Atlas |
| 4 | 25000 | Atlas |
| 5 | 50000 | Atlas, Condor |

- Fuel costs 1.5 per kg, charged when refueling. Water is free. Retardant costs 0.2 per liter.
- Map unlock reputation: Pine Valley 0, Coastal 100, Desert 250, Alpine 500, Boreal 800, Suburban 1200.
- Reputation also gates higher difficulty missions inside a map.

### 23.5 Progression services (FireWing.Progression)

```text
Wallet
  int Money { get; }
  bool TrySpend(int amount)   // false if insufficient; publishes MoneyChanged; autosaves
  void Earn(int amount)       // publishes MoneyChanged; autosaves

UpgradeManager
  IReadOnlyList<UpgradeData> GetInstalled(string aircraftId)
  bool CanBuy(AircraftData a, UpgradeData u, out string reason)
      // reasons: NotOwned, AlreadyInstalled, MissingPrerequisite, Incompatible, CantAfford
  bool Buy(AircraftData a, UpgradeData u)   // spends money, records in SaveData, autosaves

AircraftShop
  bool IsOwned(string aircraftId)
  bool Buy(AircraftData a)                  // spends money, adds to ownedAircraft

UnlockManager
  bool IsMapUnlocked(MapData m)             // reputation >= requiredReputation
  bool IsMissionAvailable(MissionData m)
  bool IsSkinUnlocked(SkinData s)
```

## 24. Save System

```csharp
using System;
using System.Collections.Generic;
using System.IO;
using UnityEngine;

namespace FireWing.Progression
{
    [Serializable] public class UpgradeState { public string aircraftId; public List<string> upgradeIds = new List<string>(); }
    [Serializable] public class CustomLivery
    {
        public Color primary = Color.white, secondary = Color.red, accent = Color.yellow;
        public string patternId;
        public List<FireWing.Data.DecalPlacement> decals = new List<FireWing.Data.DecalPlacement>();
    }
    [Serializable] public class EquippedSkin { public string aircraftId; public string skinId; public CustomLivery custom; }
    [Serializable] public class MissionRecord { public string missionId; public string bestRank; public int bestScore; public int timesCompleted; }
    [Serializable] public class SettingsData
    {
        public float masterVolume = 1f, musicVolume = 0.7f, sfxVolume = 1f;
        public int graphicsQuality = 2;
        public bool invertPitch;
        public float controlSensitivity = 1f;
        public int difficultyMode;          // 0 Arcade, 1 Realistic
        public string rebindsJson;
    }

    [Serializable]
    public class SaveData
    {
        public int version = 1;
        public int money = 5000;
        public int reputation;
        public string selectedAircraftId = "sparrow_at1";
        public List<string> ownedAircraft = new List<string> { "sparrow_at1" };
        public List<UpgradeState> upgrades = new List<UpgradeState>();
        public List<string> unlockedSkins = new List<string>();
        public List<EquippedSkin> equippedSkins = new List<EquippedSkin>();
        public List<string> unlockedMaps = new List<string> { "pine_valley" };
        public List<MissionRecord> missionRecords = new List<MissionRecord>();
        public SettingsData settings = new SettingsData();
    }

    public static class SaveSystem
    {
        const int LatestVersion = 1;
        static string FilePath => Path.Combine(Application.persistentDataPath, "save.json");
        public static SaveData Current { get; private set; }

        public static void Load()
        {
            try
            {
                if (File.Exists(FilePath))
                {
                    Current = JsonUtility.FromJson<SaveData>(File.ReadAllText(FilePath));
                    if (Current != null) Migrate(Current);
                }
            }
            catch (Exception e)
            {
                Debug.LogException(e);
                try { File.Copy(FilePath, FilePath + ".corrupt", true); } catch { }
            }
            if (Current == null) Current = new SaveData();
            FireWing.Core.EventBus<FireWing.Core.SaveLoaded>.Publish(new FireWing.Core.SaveLoaded());
        }

        /// <summary>Atomic write: temp file, then replace, keeping a .bak of the previous save.</summary>
        public static void Save()
        {
            string tmp = FilePath + ".tmp";
            File.WriteAllText(tmp, JsonUtility.ToJson(Current, true));
            if (File.Exists(FilePath)) File.Replace(tmp, FilePath, FilePath + ".bak");
            else File.Move(tmp, FilePath);
        }

        static void Migrate(SaveData d)
        {
            // while (d.version < LatestVersion) { apply step d.version -> d.version + 1 }
            d.version = LatestVersion;
        }
    }
}
```

Autosave triggers: mission end, any purchase, equipping a skin, settings change, `OnApplicationPause(true)`, and `OnApplicationQuit`. JsonUtility cannot serialize Dictionary, so use lists as above. Provide Continue, New Game (with confirm), and a debug "Reset save" button.

## 25. Customization (Skins and Liveries)

### 25.1 Shader Graph: `FireWing/AircraftLivery` (URP Lit)

Properties:

| Property | Type | Meaning |
| --- | --- | --- |
| \_BaseMap | Texture2D | Grayscale-ish base albedo with panel lines and dirt |
| \_MaskMap | Texture2D | R = primary region, G = secondary region, B = accent region |
| \_PatternMask | Texture2D | Optional extra stripe or camo pattern (white = secondary) |
| \_PrimaryColor, \_SecondaryColor, \_AccentColor | Color | Livery colors |
| \_DecalOverlay | Texture2D | RGBA texture with placed decals baked in |
| \_Smoothness, \_Metallic | Float | Paint finish |

Graph logic:

```text
base     = sample(_BaseMap)
paint    = _PrimaryColor * mask.r + _SecondaryColor * mask.g + _AccentColor * mask.b
region   = saturate(mask.r + mask.g + mask.b)
albedo   = lerp(base.rgb, paint * luminance(base.rgb) * 1.5, region)
albedo   = lerp(albedo, _SecondaryColor, pattern.r * region)
albedo   = lerp(albedo, decal.rgb, decal.a)
```

### 25.2 SkinApplier

```csharp
using UnityEngine;
using FireWing.Data;

namespace FireWing.Customization
{
    public class SkinApplier : MonoBehaviour
    {
        [SerializeField] Renderer[] renderers;
        static readonly int Primary = Shader.PropertyToID("_PrimaryColor");
        static readonly int Secondary = Shader.PropertyToID("_SecondaryColor");
        static readonly int Accent = Shader.PropertyToID("_AccentColor");
        static readonly int Pattern = Shader.PropertyToID("_PatternMask");
        static readonly int Decals = Shader.PropertyToID("_DecalOverlay");
        MaterialPropertyBlock _mpb;

        public void Apply(Color primary, Color secondary, Color accent, Texture pattern, Texture decalOverlay)
        {
            if (_mpb == null) _mpb = new MaterialPropertyBlock();
            foreach (var r in renderers)
            {
                r.GetPropertyBlock(_mpb);
                _mpb.SetColor(Primary, primary);
                _mpb.SetColor(Secondary, secondary);
                _mpb.SetColor(Accent, accent);
                if (pattern != null) _mpb.SetTexture(Pattern, pattern);
                if (decalOverlay != null) _mpb.SetTexture(Decals, decalOverlay);
                r.SetPropertyBlock(_mpb);
            }
        }

        public void Apply(SkinData s, Texture decalOverlay) => Apply(s.primary, s.secondary, s.accent, s.patternMask, decalOverlay);
    }
}
```

### 25.3 Decal compositing

`LiveryCompositor.Build(IList<DecalPlacement> decals, DecalLibrary lib)` returns a 1024 by 1024 RenderTexture (cleared transparent). For each decal: set the RenderTexture active, push a pixel matrix, apply a Translate-Rotate-Scale matrix built from `uvPosition`, `rotationDeg`, and `scale`, then `Graphics.DrawTexture` the decal sprite. Cache the result per aircraft and rebuild only when decals change. `DecalLibrary` is a ScriptableObject mapping `decalId` to Texture2D. Starter set: numbers 0 to 9, letters A to Z, 10 stripes, 5 flame patterns, stars, 4 emblem shapes, and a blank logo slot.

### 25.4 Livery editor (Hangar tab)

- Live 3D preview with orbit camera on a turntable.
- Color pickers for primary, secondary, and accent (HSV wheel plus hex input) and a preset row.
- Pattern selector (none, stripes, camo, checker).
- Decal panel: pick a decal, drag it on the aircraft surface (raycast to UV with a MeshCollider), rotate and scale with handles, delete, layer order.
- Save to the aircraft's equipped skin. **Export** a livery as a short text code (Base64 of the JSON) and **Import** from a code.
- Unlockable preset skins from `SkinData` assets (price, reputation, or achievement).

## 26. UI Specification

Use **UI Toolkit** or **uGUI with TextMeshPro** (pick one and stay consistent; uGUI is better documented for Copilot). All screens support gamepad navigation.

| Screen | Contents | Key events and rules |
| --- | --- | --- |
| MainMenu | Continue, New Game, Settings, Quit; background fly-by | Continue disabled if no save |
| Hangar | Tabs: Aircraft, Upgrades, Livery. Money and reputation top right | Buying calls AircraftShop or UpgradeManager; shows reason if disabled; stat bars compare before and after |
| ContractSelect | Map carousel, mission list with difficulty, payout, weather, required aircraft class | Locked maps show the reputation needed |
| Briefing | Map preview with ignition markers, weather, objectives, aircraft and loadout choice (water or retardant) | Start button calls MissionManager.StartMission |
| HUD | See list below | Driven only by EventBus events, no polling of gameplay objects except FlightModel readouts |
| Pause | Resume, Settings, Restart mission, Abort to hangar | Time.timeScale = 0 |
| Results | Rank letter, score breakdown (5 categories), payout, reputation gained, retry and continue | Plays a short rank sting |
| Settings | Audio sliders, graphics quality, controls rebinding, invert pitch, sensitivity, difficulty mode | Saved immediately |

**HUD elements**

- Airspeed (knots) and altitude above ground (feet), both with a toggle for metric
- Vertical speed indicator, compass heading strip, artificial horizon
- Throttle bar, fuel bar with low-fuel warning, payload bar with drop-active indicator
- Wind arrow and speed (needs Avionics 1)
- Minimap with fire overlay, airports, and water (fire overlay needs Avionics 2)
- Drop-line predictor drawn on the ground (needs Avionics 3)
- Objective checklist, burned acres, structures at risk, timer
- Warnings: STALL, LOW FUEL, TERRAIN, DAMAGE, DOOR OPEN, with matching audio
- Optional cinematic mode that hides the HUD

## 27. Maps and Content

### 27.1 Map roster

| Map | Size | Theme | Fuel mix | Water | Airports | Wind presets | Signature challenge |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pine Valley (tutorial) | 4 x 4 km | Rolling forested hills, small lakes | 50% Forest, 25% Grass, 15% Brush, 10% Rock | 3 lakes | 1 main, 1 airstrip | Calm, Breezy, Gusty | Learning to read slope and wind |
| Coastal Mediterranean | 5 x 5 km | Dry scrub on cliffs above the sea | 50% Brush, 20% Grass, 15% Forest, 10% Structure, 5% Rock | Sea (full coastline) | 1 coastal | Sea Breeze, Sirocco | Scooping from the sea, cliff turbulence |
| Desert Canyon | 6 x 6 km | Canyons, mesas, sparse brush | 40% Grass, 30% Brush, 30% Rock | 1 reservoir | 1 remote strip | Dry Calm, Thermal Heat | Few water sources, canyon winds |
| Alpine Range | 6 x 6 km | High mountains, thin air, snow | 45% Forest, 30% Rock, 15% Grass, 10% Structure | 2 alpine lakes | 1 valley | Mountain Gusts, Foehn | High altitude lowers lift and thrust |
| Boreal Wilderness | 8 x 8 km | Huge conifer forest, rivers, bogs | 70% Forest, 10% Brush, 20% Water or bog | Many lakes and rivers | 1 base | Smoky Haze, Dry Front | Long flights, crown fires, fuel management |
| Suburban Interface | 5 x 5 km | Neighborhoods beside wildland | 35% Structure, 30% Brush, 20% Grass, 15% Forest | 1 reservoir | 1 municipal | Santa Ana, Evening Calm | Protecting structures, precise drops |

Each map needs: Terrain (heightmap and painted layers), WaterSurfaces, Airports, Structures (prefabs on the Structure layer), a baked `FuelMapAsset`, and one `MapData`.

**Terrain workflow:** build the heightmap in World Creator, Gaia, or Terrain Tools (or import a public elevation dataset), paint splat layers for grass, brush, forest floor, rock, and sand, scatter trees and grass with the terrain detail system, then bake the fuel map as below.

### 27.2 FuelMapBaker (editor tool)

A MonoBehaviour placed in each map scene with a context menu command. It reads the terrain and writes the `FuelMapAsset`.

```csharp
using UnityEngine;
using FireWing.Data;

namespace FireWing.Fire
{
    public class FuelMapBaker : MonoBehaviour
    {
        [SerializeField] Terrain terrain;
        [SerializeField] FuelMapAsset target;
        [SerializeField] FuelType[] layerToFuel;        // one entry per terrain layer, in layer order
        [SerializeField] float cellSize = 10f;
        [SerializeField] LayerMask structureMask;
        [SerializeField] float waterHeight = -1000f;    // cells at or below this height become Water
        [SerializeField] float rockSlopeDeg = 55f;

        [ContextMenu("Bake Fuel Map")]
        void Bake()
        {
            var td = terrain.terrainData;
            Vector3 size = td.size;
            Vector3 pos = terrain.GetPosition();
            int w = Mathf.CeilToInt(size.x / cellSize);
            int h = Mathf.CeilToInt(size.z / cellSize);
            var fuel = new byte[w * h];
            var elev = new float[w * h];
            float[,,] alpha = td.GetAlphamaps(0, 0, td.alphamapWidth, td.alphamapHeight); // [z, x, layer]
            int layers = alpha.GetLength(2);

            for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
            {
                int i = y * w + x;
                float nx = (x + 0.5f) * cellSize / size.x;
                float nz = (y + 0.5f) * cellSize / size.z;
                float hgt = td.GetInterpolatedHeight(nx, nz) + pos.y;
                elev[i] = hgt;

                int ax = Mathf.Clamp((int)(nx * td.alphamapWidth), 0, td.alphamapWidth - 1);
                int az = Mathf.Clamp((int)(nz * td.alphamapHeight), 0, td.alphamapHeight - 1);
                int best = 0; float bw = 0f;
                for (int l = 0; l < layers; l++) if (alpha[az, ax, l] > bw) { bw = alpha[az, ax, l]; best = l; }

                FuelType f = best < layerToFuel.Length ? layerToFuel[best] : FuelType.None;
                if (hgt <= waterHeight) f = FuelType.Water;
                else if (td.GetSteepness(nx, nz) > rockSlopeDeg) f = FuelType.Rock;

                Vector3 center = new Vector3(pos.x + (x + 0.5f) * cellSize, hgt + 2f, pos.z + (y + 0.5f) * cellSize);
                if (Physics.CheckBox(center, new Vector3(cellSize * 0.5f, 5f, cellSize * 0.5f), Quaternion.identity, structureMask))
                    f = FuelType.Structure;

                fuel[i] = (byte)f;
            }

            target.width = w; target.height = h; target.cellSize = cellSize;
            target.origin = new Vector3(pos.x, 0f, pos.z);
            target.fuel = fuel; target.elevation = elev;
#if UNITY_EDITOR
            UnityEditor.EditorUtility.SetDirty(target);
            UnityEditor.AssetDatabase.SaveAssets();
#endif
            Debug.Log("Fuel map baked: " + w + " x " + h + " cells");
        }
    }
}
```

Also add a debug overlay (gizmo or texture) that colors cells by fuel type so you can verify the bake.

### 27.3 Mission roster (first release)

| id | Title | Map | Diff | Aircraft | Setup | Objectives |
| --- | --- | --- | --- | --- | --- | --- |
| pv\_01 | First Response | Pine Valley | 1 | Any | One grass ignition, 3 m/s wind | Required: ExtinguishAll. Bonus: finish within 480 s |
| pv\_02 | Ridge Fire | Pine Valley | 2 | Any | Forest on a slope, 8 m/s wind | Required: ContainBelowAcres 60 |
| pv\_03 | Cabin Country | Pine Valley | 2 | Any | Fire near 12 cabins | Required: ProtectStructures 0.1 |
| pv\_04 | Two Fronts | Pine Valley | 3 | Any | Second ignition after 120 s | Required: ExtinguishAll. Bonus: LandAtAirport |
| cs\_01 | Cliffside Brush | Coastal | 2 | Scooper preferred | Brush on cliffs, sea breeze | Required: ContainBelowAcres 80 |
| cs\_02 | Harbor Wind | Coastal | 3 | Any | Strong onshore wind near a town | Required: ProtectStructures 0.15 |
| cs\_03 | Night Blaze | Coastal | 4 | Any | Dusk start, night falls during mission | Required: ExtinguishAll |
| ds\_01 | Canyon Spark | Desert | 3 | Any | Fire in a canyon, wind funnels | Required: ContainBelowAcres 100 |
| ds\_02 | Dry Lightning | Desert | 4 | Heavy | 4 ignitions over 10 minutes | Required: ContainBelowAcres 250 |
| al\_01 | Thin Air | Alpine | 3 | Any | High altitude start | Required: ExtinguishAll |
| al\_02 | Ski Village | Alpine | 4 | Any | Fire above a village | Required: ProtectStructures 0.1 |
| bo\_01 | Crown Fire | Boreal | 4 | Heavy or Scooper | Fast-moving crown fire | Required: ContainBelowAcres 400 |
| bo\_02 | Long Haul | Boreal | 5 | Heavy | Remote fire, 25 km from base | Required: ExtinguishAll |
| sb\_01 | Edge of Town | Suburban | 4 | Any | Brush fire at the interface | Required: ProtectStructures 0.05 |
| sb\_02 | Firestorm | Suburban | 5 | Heavy, VLT | Multiple ignitions, strong wind | Required: ProtectStructures 0.2 |

## 28. Audio and Art Asset List

**Audio (each as a short looped or one-shot clip)**

- Aircraft: engine loops per class (idle, mid, full), prop or turbine whine, wind rush scaled by speed, stall buffet, gear and flap sounds, touchdown, scrape, crash
- Water: tank door, drop whoosh, scoop spray, impact splashes
- Fire: ambient crackle (near and far), big flame roar, structure fire, steam hiss when water hits fire
- Cockpit: stall warning, low fuel chime, terrain warning, UI clicks and confirms, radio static
- Radio chatter: 20 short dispatch lines (generic, with no real organization names)
- Music: menu theme, calm flight loop, tense fire loop, results sting

**Art**

- Aircraft models (LOD0, LOD1, LOD2): Sparrow, Heron, Atlas, Condor, Kestrel; exterior mask maps, cockpit interior, propeller or rotor, damage decals
- Environment: terrain textures (grass, dry grass, dirt, rock, snow, sand), trees (pine, scrub, deciduous), buildings (cabins, houses, barns, village pieces), airport props, hangars, trucks
- VFX: flames, smoke, embers, water stream, splash, scoop spray, dust, contrails
- UI: icons for aircraft, upgrades, maps, ranks, skins; fonts; HUD frame elements

**Sourcing:** Unity Asset Store packs, Kenney (CC0), Quaternius (CC0), Freesound (check each license), and Sketchfab (check each license). Keep a `CREDITS.md` and a spreadsheet of every third-party asset and its license from day one. Check the license terms of any AI-generated asset before shipping it.

## 29. Build Order: Tasks with Acceptance Tests

Give Copilot **one task at a time**, commit after each, and do not start a task until the previous task's acceptance test passes.

| # | Task | Acceptance test |
| --- | --- | --- |
| T01 | Project setup (section 14): folders, asmdefs, layers, Git | Empty project compiles with all assemblies; no cycles |
| T02 | Core: EventBus, Events, GameManager | EditMode test: subscribe, publish, unsubscribe works; state change publishes |
| T03 | Data ScriptableObjects, AssetCatalog, Sparrow asset | Sparrow asset created in the Project window with the values from 23.2 |
| T04 | Input actions asset and AircraftInputReader | Debug log shows pitch, roll, yaw, throttle, drop for keyboard and gamepad |
| T05 | AircraftStats with unit tests | Test: Multiply and Add modifiers produce expected values |
| T06 | AircraftRuntime and PayloadSystem (fill, hold, no drop yet) | Fuel and health events fire; payload clamps to capacity |
| T07 | FlightModel and ground handling on a flat test terrain with a runway | Takeoff, climb, turn, stall, and landing all work with the Sparrow; debug tuning panel |
| T08 | Cameras: chase and cockpit with Cinemachine | Camera toggle works; speed-based FOV |
| T09 | Basic HUD: speed, altitude, throttle, fuel, payload | Values match FlightModel readouts |
| T10 | WindSystem and WeatherSystem | Wind arrow debug shows direction; fog density changes by preset |
| T11 | FireGrid, FireConfig, FuelMapAsset, FireSimulation core with tests | Seeded tests: downwind spreads faster than upwind; uphill faster than downhill; fire stops at rock |
| T12 | FuelMapBaker | Baking the test terrain produces a map whose debug overlay matches the painted layers |
| T13 | FireVisuals: ground overlay, flame pool, smoke | Visible fire with at least 60 FPS at 5000 burning cells |
| T14 | DropletManager, PayloadSystem drop, FireSimulation.Apply | Dropping on fire raises moisture and extinguishes cells; retardant blocks spread (test) |
| T15 | Water drop and scoop VFX | A visible stream falls and is wind-drifted |
| T16 | Airports, ReloadZone, fuel charge | Landing in the zone refills water and fuel and charges money |
| T17 | Wallet and SaveSystem with tests | Save, quit, reload keeps all data; corrupt file falls back safely |
| T18 | MissionManager, ScoreCalculator, mission pv\_01 | Complete and fail paths both reach the Results state |
| T19 | Results screen, payout, reputation | Payout and reputation applied once, then saved |
| T20 | MainMenu, Hangar (aircraft tab), ContractSelect, Briefing | Full loop from menu to mission and back |
| T21 | UpgradeManager and Upgrades tab | Buy rules from 23.5 enforced; stat bars update |
| T22 | AircraftShop, Heron aircraft, ScoopController, water sources | Heron scoops from a lake at speed and low altitude only |
| T23 | Minimap, fire overlay, drop predictor, warnings | Features appear only with matching avionics upgrades |
| T24 | Skin shader, SkinApplier, 6 preset skins | Skin changes in Hangar and in flight |
| T25 | Livery editor, decals, export and import code | Round trip: export, import, identical result |
| T26 | Pine Valley full map and pv\_02 to pv\_04 | Three missions playable end to end |
| T27 | Coastal map and cs\_01 to cs\_03 (with night) | Scooping from the sea; night lighting works |
| T28 | Desert map and ds\_01 to ds\_02 | Canyon wind visible in turbulence |
| T29 | Atlas heavy tanker and retardant mode | Retardant lines persist and block spread |
| T30 | Audio pass | All events in section 28 have sound |
| T31 | Settings, rebinding, difficulty modes | Rebinds persist; Realistic mode adds stalls and engine damage |
| T32 | Tutorial missions and onboarding tooltips | New player can finish pv\_01 without outside help |
| T33 | Alpine, Boreal, Suburban maps; Condor VLT; remaining missions | All missions in 27.3 playable |
| T34 | Performance pass, build settings, QA, store page assets | Targets in section 30 met on the reference machine |

## 30. Testing and Performance

### 30.1 EditMode unit tests (write alongside each task)

- **ScoreCalculator:** perfect run scores at least 900; a crash gives rank F and no payout; missing required objective gives no payout; rank boundaries at 900, 750, 600, 400.
- **AircraftStats:** no upgrades returns base; Add then Multiply order; several upgrades stack.
- **EventBus:** handler receives events; unsubscribed handler does not.
- **SaveSystem:** round trip equals original; missing file creates defaults; corrupt file does not crash and creates a .corrupt copy.
- **UpgradeManager and Wallet:** cannot buy without money, without prerequisite, or twice; money never goes negative.
- **FireSimulation (seeded):** with a fixed seed, downwind spread exceeds upwind spread; uphill exceeds downhill; fire does not cross Rock or Water; water above the extinguish threshold puts out a burning cell; retardant cells resist ignition; burned cell count only increases.

### 30.2 PlayMode tests

- Spawn the aircraft, hold full throttle, and confirm takeoff within the runway length.
- Drop 3000 liters on a burning area and confirm the burning count decreases.
- Run a scripted mission to success and to failure and confirm the Results state and saved changes.

### 30.3 Performance targets (reference: GTX 1060 class GPU, 6 core CPU, 1080p)

| Metric | Target |
| --- | --- |
| Frame rate | 60 FPS in flight, 30 FPS minimum in the largest fire |
| FireSimulation tick | Under 2 ms with 10,000 burning cells on a 160,000 cell grid |
| DropletManager | Under 0.5 ms with 4096 active droplets |
| GC allocations in flight | Zero per frame after warm-up (check the Profiler) |
| Load time | Under 15 s per map |
| Draw calls | Under 2000 with terrain, vegetation, and fire |

If the fire tick is too slow: move the inner loop to a Burst job over NativeArrays, then tick on a worker thread and read results on the main thread.

### 30.4 Manual QA checklist

- Controller, keyboard, and flight stick all fly the same aircraft acceptably
- Pausing mid-drop resumes cleanly; alt-tab does not break input
- Saving during a mission is blocked or safe; quitting mid-mission loses only mission progress
- Every upgrade changes the stat it says it changes
- Every skin looks right on every aircraft it is allowed on
- Every mission can be won and can be lost
- No stuck states after crashing, running out of fuel, or landing in water

## 31. Stretch Features (post-launch or if time allows)

- **Helicopter** with a hanging bucket and a hover mode
- **Career mode:** a base that grows, hired ground crews, repairs and maintenance costs, seasonal fire risk
- **Night operations** with night-vision style HUD and landing lights
- **Co-op multiplayer:** two to four pilots on one fire, with shared fire state on the host
- **Workshop or mod support:** custom liveries first, then custom maps and missions via ScriptableObject bundles
- **Photo mode and replay system** with free camera
- **Achievements and daily challenges** (same seed for everyone, leaderboards)
- **Dynamic weather events:** wind shifts mid-mission, dry lightning
- **Ground crew AI:** fire trucks that fight fires and need air support
- **Accessibility:** color-blind modes, subtitles, scalable UI, remappable everything, one-handed control scheme
- **Localization** from day one in string tables (Unity Localization package)
- **VR cockpit support**
- **Controller haptics** for stalls and turbulence

## 32. Copilot Prompt Kit and Definition of Done

### 32.1 Task prompt template

```text
Context: FireWing, Unity 2022 LTS or Unity 6, C#, URP. Follow the project rules in the Copilot instructions file.
Task: <paste ONE task row, e.g. T14 and the matching section of the blueprint>
What already exists: <list the files and classes already built that this uses>
Constraints: no per-frame allocations, tunable values serialized or in ScriptableObjects, XML docs on public members, events through EventBus.
Deliver: the new or changed files in full, then a short list of how I test it in the editor and any Inspector setup I must do by hand.
Do not: rename existing classes, add features beyond the task, or change public APIs unless you tell me first.
```

### 32.2 Other useful prompts

- **Review:** "Review this class for per-frame allocations, null reference risks, event subscriptions that are never unsubscribed, and anything that breaks the rules file. List problems with line references, then propose fixes."
- **Debug:** "Here is the error and the relevant class. Explain the cause in two sentences, then give the smallest fix. Do not rewrite unrelated code."
- **Tests:** "Write EditMode tests for \<class> covering the cases listed in section 30.1. Use NUnit. No Unity scene dependencies."
- **Tuning:** "Add a debug IMGUI panel that live-edits these values from \<ScriptableObject>: \<list>."
- **Optimize:** "Profile target: \<metric>. Suggest the three biggest likely costs in this class and a Burst or pooling change for each."

### 32.3 Working habits that keep AI-generated code from rotting

1. Commit after every task that passes its acceptance test.
2. Never accept a big generated change you have not run. Run it, then commit it.
3. Keep the blueprint open and update it when you change a decision, so new prompts stay consistent.
4. When Copilot invents an API, paste the exact compiler error back into chat rather than guessing.
5. Keep scripts small. If a file grows past about 300 lines, ask for it to be split.

### 32.4 Definition of Done (for the first release)

- All tasks T01 to T34 pass their acceptance tests
- All unit tests green; the 30.2 PlayMode tests green
- Performance targets in 30.3 met on the reference machine
- Every mission in 27.3 is winnable and losable, and pays out correctly
- Save and load verified across a full playthrough, including after force-quitting during a purchase
- No Console errors or warnings in a 30 minute session
- Credits and licenses file complete
- Windows build runs on a clean machine without the editor installed

### 32.5 Release checklist

- Create a Steam developer account and store page (capsule art, trailer, screenshots, short description)
- Add a settings option for graphics quality presets and resolution
- Build for Windows first; test Linux and macOS afterward if you want them
- Run a closed playtest with 5 to 10 people and fix the top three complaints
- Write patch notes and keep the Git tag for each build

## 33. Game Name and Branding

**Chosen title: FIRELINE: Air Attack**

*Fireline* is the real term for the barrier that stops a wildfire's spread, which is exactly what the player builds from the air. *Air Attack* is the industry term for aerial firefighting. It is short, easy to say, and reads clearly as a flight sim.

**Internal codename:** keep `FireWing` as the code namespace and project folder name. The Part II code and Copilot prompts already use it, so nothing needs renaming. Only player-facing text, the store page, and the build name use the title above.

**Backup names**

| Name | Feel |
| --- | --- |
| Hotshot Skies | Punchy and arcade-leaning |
| Backburn | Short and moody, a bit more serious |
| Red Flag Warning | Dramatic, references the weather alert |
| Smokejumper Air | Authentic to firefighting culture |
| Waterline | Calm, scooper-focused |
| Tanker Command | Management-sim flavor for the career mode |

**Tagline options**

- Hold the line from above.
- Fly low. Drop fast. Save the forest.
- Every second burns another acre.

**Short store description (draft)**

Take command of a fleet of firefighting aircraft and fight wildfires that spread with the wind and the terrain. Scoop water from lakes, lay retardant lines, protect homes, earn contracts, upgrade your planes, and paint them your way across six maps.

**Before you commit to the name**

1. Search the title on Steam, itch.io, and Google for existing games with the same name.
2. Check that a matching domain and social handles are free.
3. Run a quick trademark search (in the US, USPTO TESS) for the name in the games category.
4. If it clashes, fall back to the next name on the list.

**Logo and visual identity ideas**

- Wordmark with a flame shaped into the F or the I, or a single wing silhouette cutting through a flame.
- Palette: deep charcoal, ember orange, signal yellow, and a cool water blue as the accent.
- Main menu background: a tanker silhouette against an orange smoke sky, with the title lockup in the lower left.

## 34. Water Loading Rules (supersedes 19.3 and 21.3 where they differ)

The tank is a resource the player must manage. Every sortie is a loop: **load, fly, drop, return**.

### 34.1 Core rules

1. **Aircraft start every mission with an empty tank**, parked on the apron at the start airport. Fuel starts full.
2. **Airport loading:** taxi to a load pad, stop, and hold the Interact key while the tank fills at a fixed rate. This is how every aircraft reloads, and the only way for heavy and very large tankers.
3. **Scooping from water:** only aircraft with `canScoop` (the Heron amphibian, and later the helicopter) can fill by flying low over water. This is the real-world technique, so it only works on maps and water bodies that allow it.
4. **Maps decide which methods exist.** Some maps are airport-only, which makes tankers the right choice and forces turnaround planning. Maps with big lakes or sea make scoopers shine.
5. Water fills 1 liter per kilogram of weight, so a full tank changes handling immediately (heavier, slower climb, higher stall speed).

### 34.2 Which maps allow scooping

| Map | Scooping | Why |
| --- | --- | --- |
| Pine Valley | Yes (3 lakes) | Teaches both methods; first missions are airport-only to teach the basics |
| Coastal Mediterranean | Yes (sea) | Long open water, but waves and wind make it harder |
| Desert Canyon | **No** | Only a shallow, restricted reservoir; airport loading only |
| Alpine Range | **No** | Lakes are too small and too high for the thin air; airport loading only |
| Boreal Wilderness | Yes (many lakes and rivers) | The scooper's home turf; airport is 25 km from the fire |
| Suburban Interface | **No** | Reservoir is boxed in by power lines; airport loading only |

Add `public bool scoopingAllowed;` to `MapData`. When false, `ScoopController` refuses to fill and the briefing screen shows no water icons for that map.

### 34.3 Ground loading

Add to `AircraftData`: `public float groundLoadRate;` (liters per second) and `public float groundFuelRate;` (kg per second).

| Aircraft | Ground load L/s | Full tank time | Ground fuel kg/s |
| --- | --- | --- | --- |
| Sparrow AT-1 | 100 | about 30 s | 2 |
| Heron S-2 | 150 | about 37 s | 4 |
| Atlas T-4 | 250 | about 48 s | 10 |
| Condor VLT | 500 | about 80 s | 40 |

**LoadPad behavior (replaces the automatic ReloadZone refill):**

- A trigger area on the apron marked with painted lines and a sign. Tag `ReloadZone`.
- Conditions to load: aircraft inside the pad, ground speed under 1 m/s, throttle under 20 percent, wheels on the ground.
- The player **holds Interact**; a progress bar fills and a fuel truck or hose animation plays. Releasing, moving, or throttling up cancels it, and the partial load is kept.
- Fuel loads in the same stop (topping up costs money at the fuel price from section 23.4). Water is free. Retardant, chosen in the briefing for tankers, costs money per liter.
- Optional: a pit-crew mini bonus. A perfectly stopped aircraft aligned with the pad loads 15 percent faster.

### 34.4 WaterSource component

```csharp
using UnityEngine;

namespace FireWing.Environment
{
    /// <summary>Put on any collider on the Water layer. Describes whether and how it can be scooped.</summary>
    public class WaterSource : MonoBehaviour
    {
        public bool scoopable = true;
        public float depthMeters = 10f;        // below minDepth, scooping is refused and the aircraft is damaged
        public float roughness = 0.2f;         // 0 calm .. 1 rough; raises damage risk and lowers fill rate
        public string displayName = "Lake";
    }
}
```

Place one on every lake, sea surface, and river strip. The map's `scoopingAllowed` flag is checked first; a WaterSource is only used when that flag is true.

### 34.5 ScoopController (full version)

Requirements to fill, all at once: door open, map allows scooping, airspeed at least `minScoopSpeed`, height above water at most `maxScoopAltitude`, bank angle under 15 degrees, water is scoopable and deep enough, and the tank is not full.

```csharp
using UnityEngine;
using FireWing.Environment;
using FireWing.Core;

namespace FireWing.Aircraft
{
    public class ScoopController : MonoBehaviour
    {
        [SerializeField] AircraftRuntime runtime;
        [SerializeField] FlightModel flight;
        [SerializeField] Rigidbody body;
        [SerializeField] LayerMask waterMask;
        [SerializeField] float maxBankDeg = 15f;
        [SerializeField] float scoopDragPerFill = 0.00004f;   // extra drag while filling
        [SerializeField] float minDepth = 3f;
        [SerializeField] float damagePerSecondUnsafe = 15f;

        public bool DoorOpen { get; set; }
        public bool IsScooping { get; private set; }
        public string BlockedReason { get; private set; }     // shown on the HUD
        public bool MapAllowsScooping { get; set; }

        void FixedUpdate()
        {
            IsScooping = false;
            BlockedReason = null;
            var d = runtime.Data;
            if (!d.canScoop || !DoorOpen) return;
            if (!MapAllowsScooping) { BlockedReason = "NO SCOOPING ON THIS MAP"; return; }

            if (!Physics.Raycast(transform.position, Vector3.down, out var hit, d.maxScoopAltitude, waterMask)) return;
            if (!hit.collider.TryGetComponent<WaterSource>(out var water) || !water.scoopable)
            { BlockedReason = "WATER NOT SCOOPABLE"; return; }

            bool tooSlow = flight.Speed < d.minScoopSpeed;
            bool shallow = water.depthMeters < minDepth;
            float bank = Mathf.Abs(Vector3.SignedAngle(Vector3.up, transform.up, transform.forward));
            bool banked = bank > maxBankDeg;

            if (tooSlow || shallow || banked)
            {
                BlockedReason = shallow ? "TOO SHALLOW" : banked ? "WINGS LEVEL" : "TOO SLOW TO SCOOP";
                // Touching water with the door open in an unsafe state hurts the aircraft
                runtime.TakeDamage(damagePerSecondUnsafe * (shallow ? 2f : 1f) * Time.fixedDeltaTime);
                return;
            }

            if (runtime.Payload.Liters >= runtime.Payload.Capacity) { BlockedReason = "TANK FULL"; return; }

            IsScooping = true;
            float rate = runtime.Stats.ScoopRate * (1f - 0.5f * water.roughness);
            float amount = rate * Time.fixedDeltaTime;
            runtime.Payload.Fill(amount);
            body.AddForce(-body.linearVelocity * (amount * scoopDragPerFill * body.mass), ForceMode.Force); // use .velocity on Unity 2022
        }
    }
}
```

**Scoop run feel:** with Heron tuning (scoop 500 L/s, cruise near 55 m/s), a full 5,500 liter fill takes about 11 seconds, which is roughly 600 meters of flight. The lake must be long enough for the run; make sure each lake and bay has a clear straight stretch of at least 800 meters. Small lakes force multiple passes or a partial load.

### 34.6 Signals and feedback

- **HUD:** TANK EMPTY (flashing), DOOR OPEN, SCOOPING with a percent fill, and the BlockedReason string.
- **Minimap:** scoopable lakes drawn in blue; non-scoopable water in gray; airport load pads as pad icons. Water icons only appear on maps where scooping is allowed.
- **Audio:** door motor, rushing spray loop pitched by speed, and a thump when the tank hits full.
- **VFX:** a rooster-tail spray behind the scoop probes, ripples on the water, and a wake line.
- **Briefing screen:** lists the loading methods available on the chosen map, so players pick the right aircraft.

### 34.7 Mission and flow changes

- MissionManager step 5 (spawn the aircraft): set `Payload.Liters = 0` and place the aircraft on the apron at the load pad.
- Optional **Pre-loaded start** toggle in the briefing, available only on the tutorial missions and in Arcade difficulty, which starts with a full tank.
- The Realistic difficulty mode adds: refuel and reload cost real time (no skipping), flaps required for takeoff with a full tank, and engine damage if the aircraft takes off overweight.
- Score accuracy (section 22.2) already rewards drops that land on fire, so efficient turnarounds matter because the time component of the score keeps running while loading.
- Add a mission objective type `FinishWithinSeconds` bonus on turnaround-heavy missions to reward fast loading and scooping.

### 34.8 Tests and acceptance additions

| Test | Expected |
| --- | --- |
| Mission start | Tank is empty, fuel is full |
| Ground load | Fills at `groundLoadRate`, cancels on movement, keeps the partial load |
| Scoop on a scooping map | Fills at speed, low altitude, wings level |
| Scoop on Desert, Alpine, or Suburban | Refused with NO SCOOPING ON THIS MAP |
| Scoop below `minScoopSpeed` or in shallow water | Refused and the aircraft takes damage |
| Non-scooper aircraft with door key pressed | Nothing happens |
| Full tank | Scooping stops with TANK FULL |

Add these to tasks T16 (ground loading) and T22 (scooping) so each is verified when it is built.
