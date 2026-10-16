import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import './style.css';

const $ = (id) => document.getElementById(id);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const launchConfig = window.FireLineLaunchConfig || {};
const mapData = launchConfig.map || {};
const missionData = launchConfig.mission || null;
const terrainProfile = mapData.terrain || { base: 15, hills: 36, ridges: 29, detail: 8, frequency: 1 };
const mapPalette = mapData.palette || { low: '#334d3b', mid: '#536b4a', high: '#79775d', stone: '#716e60', trees: '#324b3e', mountains: '#697a75', sky: '#a3c0c6', water: '#62a9a4' };
let aircraftProfile = launchConfig.aircraft || { id: 'sparrow_at1', name: 'Sparrow AT-1', mass: 3900, scale: 1.35, tankCapacity: 3000, maxThrust: 32000, maxSpeed: 100, canScoop: false, fuelCapacity: 700 };
const WORLD_SIZE = 10000;
const FIRE_SIZE = 160;
const FIRE_CELL = WORLD_SIZE / FIRE_SIZE;
let PLANE_MASS = aircraftProfile.mass;
let TANK_CAPACITY = aircraftProfile.tankCapacity;
let AIRCRAFT_SCALE = aircraftProfile.scale;
const GROUND_CLEARANCE = 0.55;
const mapCenter = { x: 0, z: 0 };
const waterSource = { ...(mapData.water || { x: -230, z: 450, width: 620, depth: 290 }) };
const airport = { ...(launchConfig.airport || mapData.airport || { x: -900, z: 1260 }) };
const fireOrigin = { x: missionData?.fireX ?? 0, z: missionData?.fireZ ?? 0 };
const wind = new THREE.Vector3(...(mapData.wind || [2.7, -3.8]));
const keys = new Set();
const pointer = { pitch: 0, roll: 0, yaw: 0 };
const cameraRig = { mode: 0, yaw: 0, pitch: 0.24, distance: 44, snap: true, dragging: false, lastX: 0, lastY: 0 };
const cameraRaySample = new THREE.Vector3();
const godView = { x: 0, z: 0, height: 10500 };
const cameraModeNames = ['CHASE', 'COCKPIT', 'ORBIT', 'GOD'];
const state = {
  started: launchConfig.mode === 'mission', paused: false, ended: false, sandboxSetup: launchConfig.mode === 'sandbox', throttle: 0, water: 0, fuel: aircraftProfile.fuelCapacity || 300,
  doorOpen: false, gearRetracted: false, dropping: false, loading: false, scoopInput: false,
  seconds: 0, burnedCells: 0, burnedAcres: 0, litersDropped: 0, litersOnTarget: 0,
  missionAcresLimit: missionData?.failAcres || 80,
  dropClock: 0, simClock: 0, fireClock: 0, hudClock: 0, heldKeys: new Set(),
};

const renderer = new THREE.WebGLRenderer({ canvas: $('world'), antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(mapPalette.sky);
scene.fog = new THREE.FogExp2(mapPalette.sky, 0.000075);
const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 18000);

const hemisphere = new THREE.HemisphereLight('#dcecff', '#425344', 1.25);
scene.add(hemisphere);
const sun = new THREE.DirectionalLight('#fff0cf', 3.1);
sun.position.set(-800, 1500, 500);
sun.castShadow = true;
sun.shadow.mapSize.set(3072, 3072);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 5000;
sun.shadow.camera.left = -1700;
sun.shadow.camera.right = 1700;
sun.shadow.camera.top = 1700;
sun.shadow.camera.bottom = -1700;
sun.shadow.bias = -0.00012;
sun.shadow.normalBias = 0.025;
scene.add(sun);

const physics = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.81, 0), allowSleep: false });
physics.broadphase = new CANNON.SAPBroadphase(physics);
physics.solver.iterations = 8;
physics.defaultContactMaterial.friction = 0.58;
physics.defaultContactMaterial.restitution = 0.05;
const localTorqueScratch = new CANNON.Vec3();
const worldTorqueScratch = new CANNON.Vec3();
const localGroundForceScratch = new CANNON.Vec3();
const worldGroundForceScratch = new CANNON.Vec3();
const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
physics.addBody(groundBody);

function rawTerrainHeight(x, z) {
  const frequency = terrainProfile.frequency || 1;
  return terrainProfile.base
    + Math.sin(x * 0.0027 * frequency) * terrainProfile.hills
    + Math.sin(z * 0.0022 * frequency + x * 0.0008) * terrainProfile.ridges
    + Math.cos((x + z) * 0.00155 * frequency) * terrainProfile.ridges * 0.93
    + Math.sin(x * 0.006 * frequency + z * 0.002) * terrainProfile.detail;
}

let airportElevation = rawTerrainHeight(airport.x, airport.z);
const airportAnchor = { x: airport.x, z: airport.z, elevation: airportElevation };
const airportGroup = new THREE.Group();
let terrainMesh = null;

function terrainHeight(x, z) {
  const naturalHeight = rawTerrainHeight(x, z);
  const distanceFromAirport = Math.hypot(x - airport.x, z - airport.z);
  const blend = clamp((distanceFromAirport - 450) / 350, 0, 1);
  const smoothBlend = blend * blend * (3 - 2 * blend);
  return lerp(airportElevation, naturalHeight, smoothBlend);
}

function createGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  let seed = 77131;
  const next = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  context.fillStyle = '#78836a';
  context.fillRect(0, 0, 512, 512);
  const colors = ['#596c50', '#657354', '#879078', '#9a987e', '#736f5d', '#a2a187', '#50654d'];
  for (let i = 0; i < 26000; i++) {
    const size = 1 + next() * 4;
    context.globalAlpha = 0.12 + next() * 0.36;
    context.fillStyle = colors[Math.floor(next() * colors.length)];
    context.fillRect(next() * 512, next() * 512, size, size * (0.35 + next() * 0.8));
  }
  context.globalAlpha = 1;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(150, 150);
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return texture;
}

function makeTerrain() {
  const segments = 384;
  const geometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const positions = geometry.attributes.position;
  const colors = [];
  const low = new THREE.Color(mapPalette.low);
  const mid = new THREE.Color(mapPalette.mid);
  const high = new THREE.Color(mapPalette.high);
  const stone = new THREE.Color(mapPalette.stone);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    const height = terrainHeight(x, z);
    positions.setY(i, height);
    const slope = Math.abs(Math.sin(x * 0.0027) + Math.cos(z * 0.0022 + x * 0.0008));
    const color = height < 10 ? low.clone().lerp(mid, (height + 30) / 40)
      : height < 52 ? mid.clone().lerp(high, (height - 10) / 42)
        : high.clone().lerp(stone, clamp(slope * 0.55, 0, 0.78));
    const variation = (Math.sin(x * 0.045 + z * 0.02) * Math.cos(z * 0.038) + 1) * 0.025;
    color.offsetHSL(variation * 0.09, 0, variation);
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ map: createGroundTexture(), vertexColors: true, roughness: 0.93, metalness: 0.015 });
  const ground = new THREE.Mesh(geometry, material);
  ground.receiveShadow = true;
  ground.position.y = 0;
  terrainMesh = ground;
  scene.add(ground);

  const lake = new THREE.Mesh(new THREE.PlaneGeometry(waterSource.width, waterSource.depth), new THREE.MeshPhysicalMaterial({ color: mapPalette.water, roughness: 0.24, metalness: 0.06, clearcoat: 0.65, transparent: true, opacity: 0.92 }));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(waterSource.x, terrainHeight(waterSource.x, waterSource.z) + 2.5, waterSource.z);
  scene.add(lake);
  const shoreline = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 48), new THREE.MeshBasicMaterial({ color: '#b2bc99', side: THREE.DoubleSide, transparent: true, opacity: 0.46 }));
  shoreline.rotation.x = -Math.PI / 2;
  shoreline.position.copy(lake.position);
  shoreline.scale.set(waterSource.width / 2 + 20, waterSource.depth / 2 + 20, 1);
  scene.add(shoreline);
  createAirport();
  createPines();
  createLandmarks();
}

function createAirport() {
  const apronY = airportElevation + 0.35;
  const runway = new THREE.Mesh(new THREE.PlaneGeometry(82, 600), new THREE.MeshStandardMaterial({ color: '#343a35', roughness: 0.9 }));
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(airport.x, apronY, airport.z - 20);
  runway.receiveShadow = true;
  airportGroup.add(runway);
  const dashMaterial = new THREE.MeshBasicMaterial({ color: '#d4d1b4' });
  for (let i = 0; i < 13; i++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 22), dashMaterial);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(airport.x, apronY + 0.15, airport.z + 280 - i * 48);
    airportGroup.add(dash);
  }
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(230, 180), new THREE.MeshStandardMaterial({ color: '#757968', roughness: 1 }));
  apron.rotation.x = -Math.PI / 2;
  apron.position.set(airport.x + 113, apronY - 0.15, airport.z + 70);
  airportGroup.add(apron);
  const pad = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), new THREE.MeshBasicMaterial({ color: '#e8ca67', transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(airport.x + 78, apronY + 0.3, airport.z + 88);
  airportGroup.add(pad);
  const hangar = new THREE.Mesh(new THREE.BoxGeometry(72, 28, 53), new THREE.MeshStandardMaterial({ color: '#555d54', roughness: 0.84 }));
  hangar.position.set(airport.x + 150, apronY + 14, airport.z + 150);
  hangar.castShadow = true;
  airportGroup.add(hangar);
  const label = makeLabel('PINE VALLEY AIR TANKER BASE', '#d6d9c8');
  label.position.set(airport.x + 90, apronY + 37, airport.z + 155);
  airportGroup.add(label);
  scene.add(airportGroup);
}

function makeLabel(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  context.fillStyle = color;
  context.font = '500 25px monospace';
  context.textAlign = 'center';
  context.fillText(text, 256, 43);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(170, 22, 1);
  return sprite;
}

function createPines() {
  const treeMaterial = new THREE.MeshStandardMaterial({ color: mapPalette.trees, roughness: 1 });
  const trunkGeometry = new THREE.CylinderGeometry(1.3, 2.2, 8, 5);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: '#594c3a', roughness: 1 });
  let seed = 1241;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const treeData = [];
  for (let i = 0; i < 4200; i++) {
    const extent = random() < 0.72 ? 4200 : WORLD_SIZE;
    const x = (random() - 0.5) * extent;
    const z = (random() - 0.5) * extent;
    const nearAirport = Math.hypot(x - airport.x, z - airport.z) < 360;
    const nearLake = Math.abs(x - waterSource.x) < 380 && Math.abs(z - waterSource.z) < 270;
    const nearFire = Math.hypot(x - fireOrigin.x, z - fireOrigin.z) < 180;
    if (nearAirport || nearLake || nearFire) continue;
    treeData.push({ x, z, height: terrainHeight(x, z), scale: 0.65 + random() * 0.8, yaw: random() * Math.PI });
  }

  const lodMeshes = [
    new THREE.InstancedMesh(new THREE.ConeGeometry(7, 25, 7), treeMaterial, treeData.length),
    new THREE.InstancedMesh(new THREE.ConeGeometry(5.4, 19, 5), treeMaterial, treeData.length),
    new THREE.InstancedMesh(new THREE.ConeGeometry(3.8, 13, 4), treeMaterial, treeData.length),
  ];
  const trunkMeshes = [
    new THREE.InstancedMesh(trunkGeometry, trunkMaterial, treeData.length),
    new THREE.InstancedMesh(trunkGeometry, trunkMaterial, treeData.length),
  ];
  for (const mesh of [...lodMeshes, ...trunkMeshes]) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  const dummy = new THREE.Object3D();
  const counts = [0, 0, 0, 0, 0];
  const lastLodPosition = new THREE.Vector3(Infinity, Infinity, Infinity);
  function updateLod(force = false) {
    if (!force && camera.position.distanceToSquared(lastLodPosition) < 62500) return;
    lastLodPosition.copy(camera.position);
    counts.fill(0);
    for (const tree of treeData) {
      const distance = Math.hypot(tree.x - camera.position.x, tree.z - camera.position.z);
      const level = distance < 1400 ? 0 : distance < 4200 ? 1 : 2;
      dummy.position.set(tree.x, tree.height + (level === 0 ? 10 : level === 1 ? 7.5 : 5.2) * tree.scale, tree.z);
      dummy.rotation.set(0, tree.yaw, 0);
      dummy.scale.setScalar(tree.scale * (level === 0 ? 1 : level === 1 ? 0.78 : 0.56));
      dummy.updateMatrix();
      lodMeshes[level].setMatrixAt(counts[level]++, dummy.matrix);
      if (level < 2) {
        const trunkIndex = level + 3;
        dummy.position.y = tree.height + 2.5 * tree.scale;
        dummy.scale.setScalar(tree.scale);
        dummy.updateMatrix();
        trunkMeshes[level].setMatrixAt(counts[trunkIndex]++, dummy.matrix);
      }
    }
    for (let i = 0; i < lodMeshes.length; i++) {
      lodMeshes[i].count = counts[i];
      lodMeshes[i].instanceMatrix.needsUpdate = true;
      lodMeshes[i].computeBoundingSphere();
    }
    for (let i = 0; i < trunkMeshes.length; i++) {
      trunkMeshes[i].count = counts[i + 3];
      trunkMeshes[i].instanceMatrix.needsUpdate = true;
      trunkMeshes[i].computeBoundingSphere();
    }
  }
  scene.userData.updateTreeLod = updateLod;
  updateLod(true);
}

function createLandmarks() {
  const ridge = new THREE.Group();
  for (let i = 0; i < 11; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(45 + i * 5, 0), new THREE.MeshStandardMaterial({ color: i % 2 ? '#797561' : '#686955', roughness: 1 }));
    const x = 100 + i * 70;
    const z = -640 - Math.sin(i * 0.65) * 110;
    rock.position.set(x, terrainHeight(x, z) + 22, z);
    rock.scale.set(1.2 + Math.sin(i) * 0.4, 0.75 + (i % 3) * 0.2, 1.1);
    rock.rotation.set(0.12, i * 0.3, 0.1);
    rock.castShadow = true;
    ridge.add(rock);
  }
  scene.add(ridge);
  const distantRange = new THREE.Group();
  const mountainMaterial = new THREE.MeshStandardMaterial({ color: mapPalette.mountains, roughness: 1, flatShading: true });
  for (let i = 0; i < 36; i++) {
    const angle = i / 36 * Math.PI * 2;
    const radius = 4050 + Math.sin(i * 3.7) * 360;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(180 + (i % 5) * 32, 360 + (i % 7) * 62, 5 + i % 3), mountainMaterial);
    mountain.position.set(x, terrainHeight(x, z) + 115 + (i % 4) * 22, z);
    mountain.scale.set(1.4, 1, 1.1);
    mountain.rotation.y = angle;
    mountain.castShadow = true;
    distantRange.add(mountain);
  }
  scene.add(distantRange);
  const smoke = new THREE.Group();
  const plumeMaterial = new THREE.MeshStandardMaterial({ color: '#65615b', transparent: true, opacity: 0.13, roughness: 1 });
  for (let i = 0; i < 14; i++) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(18 + (i % 4) * 6, 1), plumeMaterial);
    puff.position.set(fireOrigin.x + Math.sin(i * 2.1) * 55 + i * 11, terrainHeight(fireOrigin.x, fireOrigin.z) + 35 + i * 27, fireOrigin.z + Math.cos(i * 1.3) * 38);
    puff.scale.set(1.4, 1.5, 1.2);
    smoke.add(puff);
  }
  smoke.userData.puffs = smoke.children;
  scene.add(smoke);
  scene.userData.smoke = smoke;
}

makeTerrain();

const plane = new THREE.Group();
const fuselageMaterial = new THREE.MeshStandardMaterial({ color: '#df6842', metalness: 0.19, roughness: 0.42 });
const wingMaterial = new THREE.MeshStandardMaterial({ color: '#f1cd59', metalness: 0.12, roughness: 0.48 });
const darkMaterial = new THREE.MeshStandardMaterial({ color: '#242c29', metalness: 0.42, roughness: 0.36 });
const glassMaterial = new THREE.MeshPhysicalMaterial({ color: '#4d9fa7', metalness: 0.3, roughness: 0.12, transparent: true, opacity: 0.58, clearcoat: 0.9 });
const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(2.8, 18, 5, 10), fuselageMaterial);
fuselage.rotation.x = Math.PI / 2;
fuselage.castShadow = true;
plane.add(fuselage);
const nose = new THREE.Mesh(new THREE.ConeGeometry(2.8, 7, 10), fuselageMaterial);
nose.rotation.x = -Math.PI / 2;
nose.position.z = -14;
plane.add(nose);
const mainWing = new THREE.Mesh(new THREE.BoxGeometry(34, 0.85, 5.6), wingMaterial);
mainWing.position.y = 1.2;
mainWing.castShadow = true;
plane.add(mainWing);
const wingLeadingEdge = new THREE.Mesh(new THREE.BoxGeometry(34.1, 0.14, 0.58), new THREE.MeshStandardMaterial({ color: '#f5efe0', roughness: 0.52 }));
wingLeadingEdge.position.set(0, 1.55, -2.25);
plane.add(wingLeadingEdge);
const wingTrailingEdge = new THREE.Mesh(new THREE.BoxGeometry(33.8, 0.13, 0.42), new THREE.MeshBasicMaterial({ color: '#c94f38' }));
wingTrailingEdge.position.set(0, 1.48, 2.42);
plane.add(wingTrailingEdge);
const tailWing = new THREE.Mesh(new THREE.BoxGeometry(12, 0.55, 3.1), wingMaterial);
tailWing.position.set(0, 1.1, 11);
plane.add(tailWing);
const fin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 5.2, 4.2), wingMaterial);
fin.position.set(0, 3.1, 10);
plane.add(fin);
const cockpit = new THREE.Mesh(new THREE.SphereGeometry(3.6, 12, 8), glassMaterial);
cockpit.scale.set(0.85, 0.7, 1.7);
cockpit.position.set(0, 3.2, -5.3);
plane.add(cockpit);
const cockpitFrameMaterial = new THREE.MeshStandardMaterial({ color: '#323c38', metalness: 0.55, roughness: 0.32 });
for (const x of [-2.55, 2.55]) {
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.7, 0.38), cockpitFrameMaterial);
  frame.position.set(x, 3.25, -6.1);
  frame.rotation.x = -0.22;
  plane.add(frame);
}
const dashboard = new THREE.Mesh(new THREE.BoxGeometry(11, 1.2, 2.1), darkMaterial);
dashboard.position.set(0, 1.45, -8.9);
plane.add(dashboard);
const gaugeMaterial = new THREE.MeshBasicMaterial({ color: '#e9c45f' });
for (let i = -2; i <= 2; i++) {
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 12), gaugeMaterial);
  gauge.rotation.x = Math.PI / 2;
  gauge.position.set(i * 1.7, 1.52, -10.02);
  plane.add(gauge);
}
const tankPod = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 9, 10), new THREE.MeshStandardMaterial({ color: '#d2d0b9', metalness: 0.14, roughness: 0.52 }));
tankPod.rotation.x = Math.PI / 2;
tankPod.position.set(0, -2.1, 2);
plane.add(tankPod);
const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.2, 20), new THREE.MeshBasicMaterial({ color: '#ed6842' }));
stripe.position.set(0, 2.35, -1);
plane.add(stripe);
const propeller = new THREE.Group();
for (let i = 0; i < 2; i++) {
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.8, 10, 0.6), darkMaterial);
  blade.rotation.z = i * Math.PI;
  propeller.add(blade);
}
propeller.position.set(0, 0, -18);
plane.add(propeller);
const engineHub = new THREE.Mesh(new THREE.SphereGeometry(1.35, 12, 8), darkMaterial);
engineHub.position.set(0, 0, -18.5);
plane.add(engineHub);
const gearMaterial = new THREE.MeshStandardMaterial({ color: '#2f3530', roughness: 0.7 });
for (const x of [-7, 7]) {
  const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 5, 7), darkMaterial);
  strut.position.set(x, -3.3, 1.8);
  strut.rotation.z = x * 0.02;
  plane.add(strut);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.42, 8, 12), gearMaterial);
  wheel.position.set(x, -5.5, 1.8);
  wheel.rotation.y = Math.PI / 2;
  plane.add(wheel);
}
const noseWheelAssembly = new THREE.Group();
const noseStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 4.6, 8), darkMaterial);
noseStrut.position.set(0, -3.25, -12);
noseWheelAssembly.add(noseStrut);
const noseWheel = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.34, 8, 12), gearMaterial);
noseWheel.position.set(0, -5.45, -12);
noseWheel.rotation.y = Math.PI / 2;
noseWheelAssembly.add(noseWheel);
plane.add(noseWheelAssembly);
let wheelSteerAmount = 0;
const navLightLeft = new THREE.PointLight('#ed5142', 0.8, 16);
navLightLeft.position.set(-17, 1, 0);
plane.add(navLightLeft);
const navLightRight = new THREE.PointLight('#63d9ab', 0.8, 16);
navLightRight.position.set(17, 1, 0);
plane.add(navLightRight);
function addAircraftMarking(text, side) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff5df';
  context.font = '700 54px monospace';
  context.textAlign = 'center';
  context.fillText(text, 256, 79);
  const texture = new THREE.CanvasTexture(canvas);
  const marking = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  marking.position.set(side * 2.84, 1.05, 1.2);
  marking.rotation.y = side * Math.PI / 2;
  plane.add(marking);
}
addAircraftMarking('TANKER 07', 1);
addAircraftMarking('TANKER 07', -1);
plane.scale.setScalar(AIRCRAFT_SCALE);
plane.updateMatrixWorld(true);
let planeBounds = new THREE.Box3();
let aircraftSupportPoints = [];
function rebuildAircraftSupportPoints() {
  plane.updateMatrixWorld(true);
  planeBounds.setFromObject(plane);
  aircraftSupportPoints = [];
  for (const x of [planeBounds.min.x, planeBounds.max.x]) {
    for (const y of [planeBounds.min.y, planeBounds.max.y]) {
      for (const z of [planeBounds.min.z, planeBounds.max.z]) aircraftSupportPoints.push(new CANNON.Vec3(x, y, z));
    }
  }
}
rebuildAircraftSupportPoints();
scene.add(plane);

const aircraftBody = new CANNON.Body({ mass: PLANE_MASS, linearDamping: 0.015, angularDamping: 0.32, allowSleep: false });
aircraftBody.addShape(new CANNON.Box(new CANNON.Vec3(3 * AIRCRAFT_SCALE, 2.1 * AIRCRAFT_SCALE, 9 * AIRCRAFT_SCALE)));
aircraftBody.position.set(airport.x + 78, terrainHeight(airport.x + 78, airport.z + 88) + 30, airport.z + 88);
aircraftBody.quaternion.setFromEuler(0, 0, 0);
physics.addBody(aircraftBody);
const supportPointScratch = new CANNON.Vec3();

function getAircraftGroundHeight() {
  let requiredHeight = -Infinity;
  for (const point of aircraftSupportPoints) {
    aircraftBody.quaternion.vmult(point, supportPointScratch);
    const terrain = terrainHeight(aircraftBody.position.x + supportPointScratch.x, aircraftBody.position.z + supportPointScratch.z);
    requiredHeight = Math.max(requiredHeight, terrain - supportPointScratch.y + GROUND_CLEARANCE);
  }
  return requiredHeight;
}

function getAircraftAGL() {
  let lowestClearance = Infinity;
  for (const point of aircraftSupportPoints) {
    aircraftBody.quaternion.vmult(point, supportPointScratch);
    const terrain = terrainHeight(aircraftBody.position.x + supportPointScratch.x, aircraftBody.position.z + supportPointScratch.z);
    lowestClearance = Math.min(lowestClearance, aircraftBody.position.y + supportPointScratch.y - terrain);
  }
  return Math.max(0, lowestClearance);
}

function applyAircraftProfile(profile) {
  aircraftProfile = profile;
  PLANE_MASS = profile.mass;
  TANK_CAPACITY = profile.tankCapacity;
  AIRCRAFT_SCALE = profile.scale;
  plane.scale.setScalar(AIRCRAFT_SCALE);
  rebuildAircraftSupportPoints();
  aircraftBody.removeShape(aircraftBody.shapes[0]);
  aircraftBody.addShape(new CANNON.Box(new CANNON.Vec3(3 * AIRCRAFT_SCALE, 2.1 * AIRCRAFT_SCALE, 9 * AIRCRAFT_SCALE)));
  aircraftBody.mass = PLANE_MASS;
  aircraftBody.updateMassProperties();
  aircraftBody.position.set(airport.x + 78, 0, airport.z + 88);
  aircraftBody.position.y = getAircraftGroundHeight() + GROUND_CLEARANCE + 0.45;
  aircraftBody.velocity.setZero();
  aircraftBody.angularVelocity.setZero();
  state.water = 0;
  state.fuel = profile.fuelCapacity || 300;
  state.throttle = 0;
  $('aircraftName').textContent = profile.name;
  updateCamera(0.016);
  updateHud(1);
}

function applyAirportLocation(option) {
  const previousElevation = airportElevation;
  airport.x = option.x;
  airport.z = option.z;
  airportElevation = rawTerrainHeight(airport.x, airport.z);
  airportGroup.position.set(airport.x - airportAnchor.x, airportElevation - airportAnchor.elevation, airport.z - airportAnchor.z);
  const positions = terrainMesh.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) positions.setY(i, terrainHeight(positions.getX(i), positions.getZ(i)));
  positions.needsUpdate = true;
  terrainMesh.geometry.computeVertexNormals();
  terrainMesh.geometry.computeBoundingSphere();
  aircraftBody.position.set(airport.x + 78, 0, airport.z + 88);
  aircraftBody.position.y = getAircraftGroundHeight() + GROUND_CLEARANCE + 0.45;
  aircraftBody.velocity.setZero();
  aircraftBody.angularVelocity.setZero();
  $('aircraftState').textContent = 'ON GROUND';
  updateCamera(0.016);
  updateHud(1);
  if (Math.abs(previousElevation - airportElevation) > 25) toast('AIRPORT MOVED · TERRAIN REBUILT');
}

aircraftBody.position.y = getAircraftGroundHeight() + 0.45;

const fireCells = new Array(FIRE_SIZE * FIRE_SIZE);
const fireMaterial = new THREE.MeshStandardMaterial({ color: '#ff7a35', emissive: '#f44b19', emissiveIntensity: 2.2, roughness: 0.8 });
const fireMesh = new THREE.InstancedMesh(new THREE.ConeGeometry(5.8, 23, 5), fireMaterial, fireCells.length);
fireMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
fireMesh.count = 0;
scene.add(fireMesh);
const fireMatrix = new THREE.Object3D();
const burnedGeometry = new THREE.PlaneGeometry(FIRE_CELL * 0.93, FIRE_CELL * 0.93);
const burnedMaterial = new THREE.MeshBasicMaterial({ color: '#252923', transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide });
const burnedMesh = new THREE.InstancedMesh(burnedGeometry, burnedMaterial, fireCells.length);
burnedMesh.count = 0;
scene.add(burnedMesh);
let fireInstanceCount = 0;
let burnedInstanceCount = 0;
const burning = new Set();
const pending = new Set();
let rngSeed = 91821;
const random = () => { rngSeed = (rngSeed * 48271) % 2147483647; return rngSeed / 2147483647; };

function fireIndex(x, z) { return z * FIRE_SIZE + x; }
function fireWorld(x, z) { return { x: fireOrigin.x + (x - FIRE_SIZE / 2) * FIRE_CELL, z: fireOrigin.z + (z - FIRE_SIZE / 2) * FIRE_CELL }; }
function fireCellAt(worldX, worldZ) {
  const x = Math.floor((worldX - fireOrigin.x) / FIRE_CELL + FIRE_SIZE / 2);
  const z = Math.floor((worldZ - fireOrigin.z) / FIRE_CELL + FIRE_SIZE / 2);
  return x >= 0 && z >= 0 && x < FIRE_SIZE && z < FIRE_SIZE ? { x, z, cell: fireCells[fireIndex(x, z)] } : null;
}

for (let z = 0; z < FIRE_SIZE; z++) {
  for (let x = 0; x < FIRE_SIZE; x++) {
    const world = fireWorld(x, z);
    const d = Math.hypot(world.x - fireOrigin.x, world.z - fireOrigin.z);
    const terrain = terrainHeight(world.x, world.z);
    const overWater = mapData.scoopingAllowed && Math.abs(world.x - waterSource.x) < waterSource.width / 2 && Math.abs(world.z - waterSource.z) < waterSource.depth / 2;
    const ridge = terrain > 45 && random() > 0.28;
    fireCells[fireIndex(x, z)] = {
      x, z, worldX: world.x, worldZ: world.z, state: 'unburned', fuel: overWater ? 0 : ridge ? 0.68 : 0.92,
      moisture: 0.08 + random() * 0.1, retardant: 0, heat: 0,
      burnLeft: 14 + random() * 18, burned: false,
      terrain: terrain, fuelType: overWater ? 0 : (random() > 0.77 ? 2 : 1),
    };
  }
}
function igniteWorld(x, z, radius) {
  const center = fireCellAt(x, z);
  if (!center) return;
  const reach = Math.ceil(radius / FIRE_CELL);
  for (let dz = -reach; dz <= reach; dz++) for (let dx = -reach; dx <= reach; dx++) {
    const cell = fireCells[fireIndex(center.x + dx, center.z + dz)];
    if (cell && Math.hypot(cell.worldX - x, cell.worldZ - z) <= radius && cell.fuel > 0) {
      cell.state = 'burning'; cell.heat = 1; burning.add(fireIndex(cell.x, cell.z));
    }
  }
}
if (missionData) {
  const initialRadius = missionData.fireRadius || 44;
  igniteWorld(fireOrigin.x, fireOrigin.z, initialRadius);
  if (missionData.severity >= 4) igniteWorld(fireOrigin.x + initialRadius * 1.4, fireOrigin.z + initialRadius, initialRadius * 0.48);
  if (missionData.severity >= 5) igniteWorld(fireOrigin.x - initialRadius * 1.8, fireOrigin.z + initialRadius * 0.4, initialRadius * 0.42);
}

const waterDrops = [];
const dropGeometry = new THREE.SphereGeometry(1, 5, 4);
const dropMaterial = new THREE.MeshBasicMaterial({ color: '#b3edf0', transparent: true, opacity: 0.75 });
const dropMesh = new THREE.InstancedMesh(dropGeometry, dropMaterial, 320);
dropMesh.count = 0;
scene.add(dropMesh);
const dropDummy = new THREE.Object3D();
const smokeParticles = [];
const smokeParticleGeometry = new THREE.SphereGeometry(5, 5, 4);
const smokeParticleMaterial = new THREE.MeshBasicMaterial({ color: '#4d5048', transparent: true, opacity: 0.22, depthWrite: false });
const smokeMesh = new THREE.InstancedMesh(smokeParticleGeometry, smokeParticleMaterial, 100);
smokeMesh.count = 0;
scene.add(smokeMesh);
const smokeDummy = new THREE.Object3D();

function emitDrop(liters) {
  state.water = Math.max(0, state.water - liters);
  state.litersDropped += liters;
  const origin = new THREE.Vector3().setFromMatrixPosition(plane.matrixWorld).add(new THREE.Vector3(0, -2.8, 0).applyQuaternion(plane.quaternion));
  const velocity = new THREE.Vector3(aircraftBody.velocity.x, aircraftBody.velocity.y, aircraftBody.velocity.z);
  const count = Math.min(6, Math.ceil(liters / 18));
  for (let i = 0; i < count; i++) {
    if (waterDrops.length >= 320) waterDrops.shift();
    waterDrops.push({ x: origin.x + (random() - 0.5) * 15, y: origin.y, z: origin.z + (random() - 0.5) * 13, vx: velocity.x + (random() - 0.5) * 7, vy: velocity.y - 1.2, vz: velocity.z + (random() - 0.5) * 7, liters: liters / count, active: true });
  }
}

function applyWater(worldX, worldZ, radius, liters) {
  const center = fireCellAt(worldX, worldZ);
  if (!center) return false;
  let onTarget = false;
  const range = Math.ceil(radius / FIRE_CELL) + 1;
  for (let dz = -range; dz <= range; dz++) for (let dx = -range; dx <= range; dx++) {
    const cell = fireCells[fireIndex(center.x + dx, center.z + dz)];
    if (!cell || Math.hypot(cell.worldX - worldX, cell.worldZ - worldZ) > radius + FIRE_CELL * 0.35) continue;
    if (cell.state === 'burning' || Math.hypot(cell.worldX - worldX, cell.worldZ - worldZ) < FIRE_CELL * 2.3 && burning.size > 0) onTarget = true;
    const area = Math.PI * radius * radius;
    cell.moisture = Math.min(1, cell.moisture + liters / Math.max(area, FIRE_CELL * FIRE_CELL) * 0.12);
    if (cell.state === 'burning' && cell.moisture > 0.54) {
      cell.state = 'unburned'; cell.heat = 0; burning.delete(fireIndex(cell.x, cell.z));
    }
  }
  if (onTarget) state.litersOnTarget += liters;
  return onTarget;
}

function simulateFire(dt) {
  pending.clear();
  const windDirX = wind.x / Math.hypot(wind.x, wind.z);
  const windDirZ = wind.z / Math.hypot(wind.x, wind.z);
  for (const index of burning) {
    const cell = fireCells[index];
    if (cell.state !== 'burning') continue;
    cell.burnLeft -= dt;
    cell.heat = clamp(cell.burnLeft / 18, 0.24, 1);
    if (cell.burnLeft <= 0) {
      cell.state = 'burned'; cell.burned = true; cell.heat = 0; state.burnedCells++; burning.delete(index); continue;
    }
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dz === 0) continue;
      const nx = cell.x + dx; const nz = cell.z + dz;
      if (nx < 0 || nz < 0 || nx >= FIRE_SIZE || nz >= FIRE_SIZE) continue;
      const neighborIndex = fireIndex(nx, nz);
      const next = fireCells[neighborIndex];
      if (next.state !== 'unburned' || next.fuel <= 0 || next.retardant > 0) continue;
      const length = dx && dz ? 1.414 : 1;
      const alongWind = (dx / length) * windDirX + (dz / length) * windDirZ;
      const windFactor = Math.max(0.08, 1 + alongWind * 0.32);
      const slope = (next.terrain - cell.terrain) / (FIRE_CELL * length);
      const slopeFactor = clamp(1 + slope * 2.6, 0.2, 3.2);
      const fuelFactor = next.fuelType === 2 ? 1.12 : 0.78;
      const rate = 0.16 * fuelFactor * (1 - next.moisture) * windFactor * slopeFactor / length;
      if (random() < 1 - Math.exp(-rate * dt)) pending.add(neighborIndex);
    }
  }
  for (const index of pending) {
    const cell = fireCells[index];
    if (cell.state !== 'unburned') continue;
    cell.state = 'burning'; cell.heat = 1; cell.burnLeft = 14 + random() * 18; burning.add(index);
  }
  for (const cell of fireCells) {
    if (cell.moisture > 0.08) cell.moisture = Math.max(0.08, cell.moisture - dt * 0.002);
    if (cell.retardant > 0) cell.retardant = Math.max(0, cell.retardant - dt);
  }
}

function createSmoke(dt) {
  for (let i = smokeParticles.length - 1; i >= 0; i--) {
    const p = smokeParticles[i];
    p.x += (wind.x * 0.25 + p.vx) * dt;
    p.y += p.vy * dt;
    p.z += (wind.z * 0.25 + p.vz) * dt;
    p.age += dt;
    if (p.age > p.life) smokeParticles.splice(i, 1);
  }
  if (burning.size && Math.random() < dt * 18 && smokeParticles.length < 100) {
    const index = [...burning][Math.floor(Math.random() * burning.size)];
    const cell = fireCells[index];
    smokeParticles.push({ x: cell.worldX, y: terrainHeight(cell.worldX, cell.worldZ) + 18, z: cell.worldZ, vx: (random() - 0.5) * 4, vy: 7 + random() * 7, vz: (random() - 0.5) * 4, age: 0, life: 5 + random() * 4, size: 8 + random() * 12 });
  }
}

function updateFireVisuals(time) {
  fireInstanceCount = 0;
  burnedInstanceCount = 0;
  const cameraPosition = camera.position;
  for (let i = 0; i < fireCells.length; i++) {
    const cell = fireCells[i];
    if (cell.state === 'burning') {
      const distance = Math.hypot(cell.worldX - cameraPosition.x, cell.worldZ - cameraPosition.z);
      if (distance > 1750) continue;
      fireMatrix.position.set(cell.worldX, terrainHeight(cell.worldX, cell.worldZ) + 10 + cell.heat * 5, cell.worldZ);
      const pulse = 0.8 + Math.sin(time * 7 + i * 0.7) * 0.17 + random() * 0.12;
      fireMatrix.scale.set(pulse, pulse * (0.75 + cell.heat * 0.5), pulse);
      fireMatrix.rotation.set(0, i * 0.31, Math.sin(time * 3 + i) * 0.11);
      fireMatrix.updateMatrix();
      fireMesh.setMatrixAt(fireInstanceCount++, fireMatrix.matrix);
    } else if (cell.burned) {
      const distance = Math.hypot(cell.worldX - cameraPosition.x, cell.worldZ - cameraPosition.z);
      if (distance > 1400) continue;
      fireMatrix.position.set(cell.worldX, terrainHeight(cell.worldX, cell.worldZ) + 0.5, cell.worldZ);
      fireMatrix.rotation.set(-Math.PI / 2, 0, 0);
      fireMatrix.scale.setScalar(1);
      fireMatrix.updateMatrix();
      burnedMesh.setMatrixAt(burnedInstanceCount++, fireMatrix.matrix);
    }
  }
  fireMesh.count = fireInstanceCount;
  burnedMesh.count = burnedInstanceCount;
  fireMesh.instanceMatrix.needsUpdate = true;
  burnedMesh.instanceMatrix.needsUpdate = true;
  dropMesh.count = 0;
  for (const p of waterDrops) {
    if (!p.active) continue;
    dropDummy.position.set(p.x, p.y, p.z);
    dropDummy.scale.set(0.45, 2.3, 0.45);
    dropDummy.quaternion.copy(camera.quaternion);
    dropDummy.updateMatrix();
    dropMesh.setMatrixAt(dropMesh.count++, dropDummy.matrix);
  }
  dropMesh.instanceMatrix.needsUpdate = true;
  smokeMesh.count = 0;
  for (const p of smokeParticles) {
    smokeDummy.position.set(p.x, p.y, p.z);
    smokeDummy.scale.setScalar(p.size * (0.6 + p.age / p.life));
    smokeDummy.updateMatrix();
    smokeMesh.setMatrixAt(smokeMesh.count++, smokeDummy.matrix);
  }
  smokeMesh.instanceMatrix.needsUpdate = true;
}

function createWindSparks() {
  const geometry = new THREE.BufferGeometry();
  const points = [];
  for (let i = 0; i < 450; i++) points.push((random() - 0.5) * 2600, random() * 140 + 5, (random() - 0.5) * 2600);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: '#e6d59a', size: 1.2, transparent: true, opacity: 0.22, sizeAttenuation: true }));
  scene.add(particles);
  scene.userData.sparks = particles;
}
createWindSparks();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const gtaoPass = new GTAOPass(scene, camera, innerWidth, innerHeight);
gtaoPass.blendIntensity = 1.05;
gtaoPass.pdSamples = 8;
gtaoPass.updateGtaoMaterial({ radius: 7, distanceExponent: 1.15, thickness: 0.12 });
composer.addPass(gtaoPass);
composer.addPass(new OutputPass());
function resizeGtaoPass() {
  const scale = renderer.getPixelRatio() * 0.55;
  gtaoPass.setSize(Math.max(1, Math.floor(innerWidth * scale)), Math.max(1, Math.floor(innerHeight * scale)));
}
resizeGtaoPass();

function getForward() { return new THREE.Vector3(0, 0, -1).applyQuaternion(plane.quaternion); }
function getFlightSpeed() { return Math.hypot(aircraftBody.velocity.x, aircraftBody.velocity.y, aircraftBody.velocity.z); }
function getGroundHeight() { return terrainHeight(aircraftBody.position.x, aircraftBody.position.z); }
function getAltitudeAGL() { return getAircraftAGL(); }

function updatePhysics(dt) {
  const body = aircraftBody;
  if (keys.has('ShiftLeft') || keys.has('ShiftRight')) state.throttle = Math.min(1, state.throttle + 0.55 * dt);
  if (keys.has('ControlLeft') || keys.has('ControlRight')) state.throttle = Math.max(0, state.throttle - 0.48 * dt);
  const forward = new CANNON.Vec3(0, 0, -1);
  body.quaternion.vmult(forward, forward);
  const speed = body.velocity.length();
  const rho = Math.exp(-Math.max(0, body.position.y) / 9500);
  const maxSpeed = aircraftProfile.maxSpeed || 94;
  const wingArea = 40 * (AIRCRAFT_SCALE / 1.35) ** 2;
  const thrust = state.throttle * (aircraftProfile.maxThrust || 25500) * rho * clamp(1 - (speed / maxSpeed) ** 2, 0.07, 1);
  body.applyForce(forward.scale(thrust), body.position);
  const liftDir = new CANNON.Vec3(0, 1, 0);
  body.quaternion.vmult(liftDir, liftDir);
  const localVelocity = body.quaternion.conjugate().vmult(body.velocity);
  const angleOfAttack = Math.atan2(-localVelocity.y, Math.max(1, -localVelocity.z));
  const liftCoefficient = clamp(0.18 + angleOfAttack * 3.7, -0.35, 1.52);
  const dynamicPressure = 0.5 * 1.225 * rho * speed * speed;
  const liftForce = dynamicPressure * wingArea * liftCoefficient;
  body.applyForce(liftDir.scale(liftForce), body.position);
  if (speed > 0.1) {
    const gearDrag = state.gearRetracted ? 0.018 : 0.065;
    const dragCoefficient = 0.028 + liftCoefficient * liftCoefficient * 0.043 + gearDrag + (Math.abs(angleOfAttack) > 0.27 ? 0.24 : 0);
    const dragScale = dynamicPressure * wingArea * dragCoefficient;
    body.applyForce(body.velocity.scale(-dragScale / speed), body.position);
  }
  const massRatio = clamp((PLANE_MASS + state.water) / PLANE_MASS, 1, 1.9);
  const torque = 54000 / massRatio;
  const pitch = pointer.pitch + (keys.has('KeyW') ? 1 : 0) + (keys.has('KeyS') ? -1 : 0);
  const wheelSteerInput = (keys.has('KeyA') ? 1 : 0) + (keys.has('KeyD') ? -1 : 0);
  const groundContact = !state.gearRetracted && body.position.y <= getAircraftGroundHeight() + 2.2 && speed < 40;
  wheelSteerAmount = groundContact ? wheelSteerInput * 0.42 : 0;
  noseWheelAssembly.rotation.y = wheelSteerAmount;
  const roll = pointer.roll + (keys.has('KeyA') ? 1 : 0) + (keys.has('KeyD') ? -1 : 0);
  const yaw = pointer.yaw + (keys.has('KeyQ') ? 1 : 0) + (keys.has('KeyE') ? -1 : 0);
  const authority = clamp(speed / 22, 0.12, 1);
  const yawControl = groundContact ? (yaw + wheelSteerInput * 1.5) * 32000 * clamp(speed / 5, 0, 1) : yaw * 18000 * authority;
  localTorqueScratch.set(pitch * torque * authority, yawControl, (groundContact ? 0 : roll) * torque * 1.35 * authority);
  body.quaternion.vmult(localTorqueScratch, worldTorqueScratch);
  body.torque.vadd(worldTorqueScratch, body.torque);
  if (groundContact) {
    localGroundForceScratch.set(-localVelocity.x * body.mass * 7.5, 0, 0);
    body.quaternion.vmult(localGroundForceScratch, worldGroundForceScratch);
    body.applyForce(worldGroundForceScratch, body.position);
  }
  if (speed > 9) {
    const align = forward.cross(body.velocity.clone().scale(1 / speed));
    body.torque.x += align.x * 9500;
    body.torque.z += align.z * 9500;
  }
  const currentMass = PLANE_MASS + state.water;
  if (body.mass !== currentMass) {
    body.mass = currentMass;
    body.updateMassProperties();
  }
  state.fuel = Math.max(0, state.fuel - state.throttle * Math.max(0.12, PLANE_MASS / 3000 * 0.1) * dt);
  if (state.fuel <= 0) state.throttle = Math.min(state.throttle, 0.25);
  physics.step(1 / 60, dt, 3);

  const groundSupportHeight = getAircraftGroundHeight();
  if (body.position.y < groundSupportHeight) {
    body.position.y = groundSupportHeight;
    if (body.velocity.y < 0) body.velocity.y *= -0.14;
    body.velocity.x *= 0.986;
    body.velocity.z *= 0.986;
    body.angularVelocity.x *= 0.85;
    body.angularVelocity.z *= 0.85;
  }
  const rollAngle = Math.abs(THREE.MathUtils.radToDeg(new THREE.Euler().setFromQuaternion(plane.quaternion, 'YXZ').z));
  state.airspeed = speed;
  const stallSpeed = Math.sqrt((2 * body.mass * 9.81) / (1.225 * wingArea * 1.52));
  state.stalled = speed < stallSpeed && getAltitudeAGL() > 8;
  state.onGround = body.position.y <= groundSupportHeight + 0.8 && speed < 22;
  state.bank = rollAngle;
}

function updateDrops(dt) {
  for (let i = waterDrops.length - 1; i >= 0; i--) {
    const p = waterDrops[i];
    p.vx += (wind.x - p.vx) * 0.14 * dt;
    p.vz += (wind.z - p.vz) * 0.14 * dt;
    p.vy -= 9.81 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
    if (p.y <= terrainHeight(p.x, p.z) + 2) {
      applyWater(p.x, p.z, 31, p.liters);
      p.active = false;
      waterDrops.splice(i, 1);
    }
  }
}

function updateLoading(dt) {
  const nearPad = Math.hypot(aircraftBody.position.x - (airport.x + 78), aircraftBody.position.z - (airport.z + 88)) < 47;
  const canLoad = nearPad && getFlightSpeed() < 1.8 && state.throttle < 0.2 && getAltitudeAGL() < 13;
  const canScoop = aircraftProfile.canScoop && mapData.scoopingAllowed && state.doorOpen && Math.abs(aircraftBody.position.x - waterSource.x) < waterSource.width / 2
    && Math.abs(aircraftBody.position.z - waterSource.z) < waterSource.depth / 2
    && getAltitudeAGL() < 15 && getFlightSpeed() >= 34 && state.bank < 15;
  if (state.loading && canLoad) {
    state.water = Math.min(TANK_CAPACITY, state.water + (aircraftProfile.groundLoadRate || 100) * dt);
    if (state.water >= TANK_CAPACITY) toast(`TANK FULL · ${TANK_CAPACITY.toLocaleString()} L READY`);
  } else if (state.loading && !canLoad) {
    state.loading = false;
    toast(nearPad ? 'LOADING CANCELLED · PARTIAL LOAD KEPT' : 'RETURN TO THE LOAD PAD');
  }
  if (state.scoopInput && state.doorOpen && canScoop && state.water < TANK_CAPACITY) {
    const fillRate = 500 * dt;
    state.water = Math.min(TANK_CAPACITY, state.water + fillRate);
    aircraftBody.applyForce(aircraftBody.velocity.clone().scale(-fillRate * 0.00004 * aircraftBody.mass), aircraftBody.position);
  } else if (state.scoopInput && state.doorOpen && !canScoop) {
    if (Math.hypot(aircraftBody.position.x - waterSource.x, aircraftBody.position.z - waterSource.z) < 540 && getFlightSpeed() < 30 && Math.random() < 0.016) {
      state.damage = (state.damage || 0) + 1;
      toast('UNSAFE WATER CONTACT · BUILD SPEED');
    }
  }
  state.nearPad = nearPad;
  state.canScoop = canScoop;
  state.padConditions = canLoad;
}

function updateMission(dt) {
  state.seconds += dt;
  state.fireClock += dt;
  state.simClock += dt;
  if (state.fireClock >= 0.32) { simulateFire(state.fireClock); state.fireClock = 0; }
  if (state.simClock >= 0.12) { updateDrops(state.simClock); createSmoke(state.simClock); state.simClock = 0; }
  if (state.dropping && state.water > 0) {
    state.dropClock += dt;
    if (state.dropClock >= 0.075) { emitDrop(Math.min(10, state.water)); state.dropClock = 0; }
  }
  if (missionData && state.seconds > 30 && Math.floor(state.seconds / 120) !== Math.floor((state.seconds - dt) / 120) && missionData.severity >= 3) {
    const x = fireOrigin.x + Math.sin(state.seconds * 0.11) * 210;
    const z = fireOrigin.z + Math.cos(state.seconds * 0.09) * 170;
    igniteWorld(x, z, Math.max(14, (missionData.fireRadius || 44) * 0.35));
    toast('NEW SPOT FIRE · CHECK TACTICAL MAP');
  }
  state.burnedAcres = state.burnedCells * (FIRE_CELL * FIRE_CELL / 4046.86);
  if (missionData && burning.size === 0 && state.seconds > 15) finishMission(true);
  if (missionData && state.burnedAcres > state.missionAcresLimit) finishMission(false);
  if (missionData && state.seconds >= 360) finishMission(false);
}

let toastTimer = 0;
function toast(message) {
  const element = $('toast');
  element.textContent = message;
  element.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('visible'), 2100);
}

function finishMission(success) {
  if (state.ended) return;
  state.ended = true; state.paused = true; state.dropping = false; state.loading = false;
  $('resultsScreen').classList.remove('hidden');
  $('resultKicker').textContent = success ? 'MISSION COMPLETE' : 'CONTRACT FAILED';
  $('resultTitle').innerHTML = success ? 'FIRE<br /><em>CONTAINED</em>' : 'LINE<br /><em>OVERRUN</em>';
  $('resultSummary').textContent = success ? 'The ridge is secure. Good flying, tanker.' : 'The fire crossed the control line. Try a lower, tighter drop.';
  $('resultAcres').textContent = state.burnedAcres.toFixed(1);
  $('resultAccuracy').textContent = `${Math.round(100 * state.litersOnTarget / Math.max(1, state.litersDropped))}%`;
  $('resultPay').textContent = success ? `$${Math.round(3000 * (0.5 + (1 - state.burnedAcres / 80) * 0.5)).toLocaleString()}` : '$0';
}

function setDoor(open) {
  state.doorOpen = open;
  $('doorLamp').classList.toggle('open', open);
  $('doorStatus').textContent = open ? 'SCOOP DOOR OPEN' : 'SCOOP DOOR CLOSED';
  $('doorButton').textContent = open ? 'CLOSE' : 'OPEN';
}

function toggleGear() {
  if (!state.gearRetracted && getAircraftAGL() < 8) {
    toast('GEAR RETRACTION LOCKED · CLIMB ABOVE 8 M');
    return;
  }
  state.gearRetracted = !state.gearRetracted;
  $('gearLamp').classList.toggle('open', !state.gearRetracted);
  $('gearStatus').textContent = state.gearRetracted ? 'LANDING GEAR UP' : 'LANDING GEAR DOWN';
  $('gearButton').textContent = state.gearRetracted ? 'EXTEND' : 'RETRACT';
  toast(state.gearRetracted ? 'GEAR UP · LOWER DRAG' : 'GEAR DOWN · READY TO LAND');
}

function startSandboxSortie() {
  if (!state.sandboxSetup || state.started) return;
  state.started = true;
  state.sandboxSetup = false;
  cameraRig.mode = 0;
  cameraRig.snap = true;
  $('game').classList.remove('godview-setup');
  $('sandboxPanel').classList.add('hidden');
  $('dispatchStatus').textContent = `${airport.name || 'SANDBOX'} · ACTIVE`;
  toast('SANDBOX SORTIE STARTED · FIRES WILL NOW SPREAD');
  updateHud(0);
}

function initializeRuntimeUi() {
  $('aircraftName').textContent = aircraftProfile.name;
  $('mapNameReadout').textContent = (mapData.name || 'PINE VALLEY').toUpperCase();
  if (missionData) {
    $('contractId').textContent = missionData.id.toUpperCase();
    $('missionTitle').textContent = missionData.missionTitle;
    $('missionBrief').textContent = `${missionData.briefing} Keep it below ${missionData.failAcres} acres.`;
    $('containmentReadout').textContent = `0.0 / ${missionData.failAcres} AC`;
    $('objectiveText').textContent = 'Load water at the apron';
    $('dispatchStatus').textContent = `${missionData.missionTitle.toUpperCase()} ACTIVE`;
    state.missionAcresLimit = missionData.failAcres;
    state.started = true;
    return;
  }

  $('contractId').textContent = 'FREE FLIGHT';
  $('missionTitle').textContent = 'Sandbox';
  $('missionBrief').textContent = `${mapData.name || 'Pine Valley'} · Set up ignition points, choose your aircraft and base, then start whenever you're ready.`;
  $('objectiveText').textContent = 'Place fires in god view';
  $('containmentReadout').textContent = 'FREE FLIGHT';

  const catalog = window.FireLineMenuCatalog;
  const airports = catalog.airportOptions(mapData);
  const aircraftSelect = $('godAircraftSelect');
  const airportSelect = $('godAirportSelect');
  for (const profile of catalog.aircraft) {
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = `${profile.name} · ${profile.className}`;
    option.selected = profile.id === aircraftProfile.id;
    aircraftSelect.append(option);
  }
  for (let i = 0; i < airports.length; i++) {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = airports[i].name;
    option.selected = airports[i].x === airport.x && airports[i].z === airport.z;
    airportSelect.append(option);
  }

  state.started = false;
  state.sandboxSetup = true;
  cameraRig.mode = 3;
  cameraRig.snap = true;
  $('dispatchStatus').textContent = 'GOD VIEW · SIMULATION HOLD';
  $('sandboxPanel').classList.remove('hidden');
  $('game').classList.add('godview-setup');
  $('cameraModeReadout').textContent = 'GOD';

  $('sandboxFireRadius').addEventListener('input', (event) => {
    $('sandboxFireRadiusValue').textContent = `${event.target.value} M`;
  });
  $('applySandboxSetup').addEventListener('click', () => {
    const profile = catalog.aircraft.find((item) => item.id === aircraftSelect.value);
    const airportOption = airports[Number(airportSelect.value)] || airports[0];
    if (profile && profile.id !== aircraftProfile.id) applyAircraftProfile(profile);
    applyAirportLocation(airportOption);
    toast(`${aircraftProfile.name.toUpperCase()} · ${airportOption.name.toUpperCase()}`);
  });
  $('startSandboxButton').addEventListener('click', startSandboxSortie);
  $('leaveSandboxButton').addEventListener('click', () => location.reload());
  $('world').addEventListener('pointerdown', (event) => {
    if (!state.sandboxSetup || state.started || event.button !== 0) return;
    const bounds = $('world').getBoundingClientRect();
    const screenPoint = new THREE.Vector2(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(screenPoint, camera);
    const hit = raycaster.intersectObject(terrainMesh, false)[0];
    if (!hit) return;
    const radius = Number($('sandboxFireRadius').value);
    igniteWorld(hit.point.x, hit.point.z, radius);
    $('godViewInstructions').textContent = `Ignition ${burning.size} placed at ${Math.round(hit.point.x)}, ${Math.round(hit.point.z)}. Place more fires or start the sortie.`;
  });
}

function togglePause(force) {
  if (!state.started || state.ended) return;
  state.paused = typeof force === 'boolean' ? force : !state.paused;
  $('pauseScreen').classList.toggle('hidden', !state.paused);
  state.dropping = false;
  state.loading = false;
}

function updateHud(dt) {
  state.hudClock += dt;
  if (state.hudClock < 0.08) return;
  state.hudClock = 0;
  const speedKt = Math.round((state.airspeed || 0) * 1.94384);
  const altitudeFt = Math.round(getAltitudeAGL() * 3.28084 / 10) * 10;
  $('speedReadout').textContent = String(speedKt).padStart(3, '0');
  $('altitudeReadout').textContent = String(altitudeFt).padStart(3, '0');
  $('speedBar').style.width = `${clamp(speedKt / 190 * 100, 0, 100)}%`;
  $('altitudeBar').style.width = `${clamp(altitudeFt / 9000 * 100, 0, 100)}%`;
  $('waterReadout').innerHTML = `${Math.round(state.water).toLocaleString()} <small>/ ${TANK_CAPACITY.toLocaleString()} L</small>`;
  $('waterBar').style.width = `${state.water / TANK_CAPACITY * 100}%`;
  $('fuelReadout').innerHTML = `${Math.round(state.fuel)} <small>/ ${Math.round(aircraftProfile.fuelCapacity || 300)} KG</small>`;
  $('fuelBar').style.width = `${state.fuel / (aircraftProfile.fuelCapacity || 300) * 100}%`;
  $('throttleReadout').textContent = `${Math.round(state.throttle * 100)}%`;
  $('throttleSlider').value = Math.round(state.throttle * 100);
  $('throttleSlider').style.background = `linear-gradient(90deg,var(--signal) ${state.throttle * 100}%,#d8ddcf55 ${state.throttle * 100}%)`;
  $('mobileThrottle').value = Math.round(state.throttle * 100);
  $('missionClock').textContent = `${String(Math.floor(state.seconds / 60)).padStart(2, '0')}:${String(Math.floor(state.seconds % 60)).padStart(2, '0')}`;
  $('headingReadout').textContent = `${String(Math.round((THREE.MathUtils.radToDeg(plane.rotation.y) + 360) % 360)).padStart(3, '0')}°`;
  $('headingNeedle').style.transform = `rotate(${-plane.rotation.y}rad)`;
  $('cameraModeReadout').textContent = cameraModeNames[cameraRig.mode];
  $('cameraButton').title = `Camera view: ${cameraModeNames[cameraRig.mode]} (C)`;
  $('aircraftState').textContent = state.onGround ? (state.nearPad ? 'LOAD PAD' : 'ON GROUND') : state.stalled ? 'STALL' : state.airspeed > 0 ? 'IN FLIGHT' : 'ON APRON';
  $('aircraftState').style.color = state.stalled ? 'var(--fire)' : 'var(--signal)';
  $('gearLamp').classList.toggle('open', !state.gearRetracted);
  $('gearStatus').textContent = state.gearRetracted ? 'LANDING GEAR UP' : 'LANDING GEAR DOWN';
  $('gearButton').textContent = state.gearRetracted ? 'EXTEND' : 'RETRACT';
  $('gearButton').disabled = !state.gearRetracted && getAircraftAGL() < 8;
  $('containmentReadout').textContent = missionData ? `${state.burnedAcres.toFixed(1)} / ${state.missionAcresLimit} AC` : `${state.burnedAcres.toFixed(1)} AC BURNED`;
  $('containmentBar').style.width = missionData ? `${clamp(state.burnedAcres / state.missionAcresLimit * 100, 0, 100)}%` : '0%';
  const loaded = state.water > 10;
  const closeFire = Math.hypot(aircraftBody.position.x - fireOrigin.x, aircraftBody.position.z - fireOrigin.z) < 1050;
  $('objectiveText').textContent = missionData
    ? (!loaded ? (state.nearPad ? 'Hold F to load water' : 'Return to load pad') : closeFire ? `Drop water near ${missionData.name}` : `Fly to ${missionData.name}`)
    : state.sandboxSetup ? 'Place fires in god view' : (loaded ? 'Free flight · drop water anywhere' : 'Free flight · load water or scoop');
  $('objectiveMarker').classList.toggle('done', loaded && closeFire);
  $('loadButton').classList.toggle('active', state.loading);
  $('loadButton').disabled = !state.nearPad && !state.loading;
  $('loadButton').querySelector('small').textContent = state.nearPad ? (state.padConditions ? 'HOLD F · FILLING' : 'STOP ON PAD') : 'HOLD F · APRON ONLY';
  $('loadProgress').style.width = `${state.water / TANK_CAPACITY * 100}%`;
  $('scoopButton').classList.toggle('active', state.scoopInput && state.canScoop);
  $('scoopButton').querySelector('small').textContent = state.canScoop ? `SCOOPING · ${aircraftProfile.scoopRate || 500} L/S` : 'HOLD R · LOW & LEVEL';
  $('dropButton').classList.toggle('active', state.dropping);
  $('warningBanner').classList.toggle('active', state.started && !state.paused && (state.stalled || state.water < 1 || state.fuel < 40));
  $('warningText').textContent = state.stalled ? 'STALL · LOWER THE NOSE' : state.fuel < 40 ? 'LOW FUEL · RETURN TO BASE' : state.water < 1 ? 'TANK EMPTY · RETURN TO BASE OR SCOOP' : '';
  $('windReadout').textContent = `WIND ${String(Math.round(Math.hypot(wind.x, wind.z) * 1.94384)).padStart(2, '0')} KT`;
  updateMinimap();
}

function updateMinimap() {
  const canvas = $('minimap');
  const context = canvas.getContext('2d');
  const w = canvas.width; const h = canvas.height;
  context.clearRect(0, 0, w, h);
  context.fillStyle = '#26352e'; context.fillRect(0, 0, w, h);
  context.strokeStyle = '#89937822'; context.lineWidth = 1;
  for (let x = 0; x < w; x += 18) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, h); context.stroke(); }
  for (let y = 0; y < h; y += 18) { context.beginPath(); context.moveTo(0, y); context.lineTo(w, y); context.stroke(); }
  const scale = w / WORLD_SIZE;
  const px = (x) => w / 2 + x * scale;
  const py = (z) => h / 2 + z * scale;
  context.fillStyle = '#5fa8a7'; context.beginPath(); context.ellipse(px(waterSource.x), py(waterSource.z), waterSource.width * scale / 2, waterSource.depth * scale / 2, 0, 0, Math.PI * 2); context.fill();
  context.strokeStyle = '#9bd8c5'; context.setLineDash([4, 4]); context.beginPath(); context.moveTo(px(airport.x), py(airport.z + 300)); context.lineTo(px(airport.x), py(airport.z - 360)); context.stroke(); context.setLineDash([]);
  context.fillStyle = '#d4c56b'; context.fillRect(px(airport.x) - 2, py(airport.z) - 2, 5, 5);
  for (const index of burning) {
    const cell = fireCells[index];
    context.fillStyle = '#ff683b'; context.globalAlpha = 0.65 + Math.sin(performance.now() * 0.005 + index) * 0.25;
    context.fillRect(px(cell.worldX) - 1, py(cell.worldZ) - 1, 3, 3);
  }
  context.globalAlpha = 1;
  const planeX = px(aircraftBody.position.x); const planeY = py(aircraftBody.position.z);
  context.save(); context.translate(planeX, planeY); context.rotate(-plane.rotation.y); context.fillStyle = '#f4c34f'; context.beginPath(); context.moveTo(0, -7); context.lineTo(4, 5); context.lineTo(0, 3); context.lineTo(-4, 5); context.closePath(); context.fill(); context.restore();
}

function setInputFromPointer(event) {
  const rect = $('touchStick').getBoundingClientRect();
  const dx = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.36), -1, 1);
  const dy = clamp((event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.36), -1, 1);
  pointer.roll = dx;
  pointer.pitch = dy;
  $('touchStick').querySelector('i').style.transform = `translate(calc(-50% + ${dx * 17}px),calc(-50% + ${dy * 17}px))`;
}

const touchStick = $('touchStick');
touchStick.addEventListener('pointerdown', (event) => { touchStick.setPointerCapture(event.pointerId); setInputFromPointer(event); });
touchStick.addEventListener('pointermove', (event) => { if (touchStick.hasPointerCapture(event.pointerId)) setInputFromPointer(event); });
touchStick.addEventListener('pointerup', () => { pointer.roll = 0; pointer.pitch = 0; touchStick.querySelector('i').style.transform = 'translate(-50%,-50%)'; });
touchStick.addEventListener('pointercancel', () => { pointer.roll = 0; pointer.pitch = 0; });

function bindHold(element, down, up) {
  element.addEventListener('pointerdown', (event) => { event.preventDefault(); element.setPointerCapture(event.pointerId); down(); });
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(eventName, up);
}
bindHold($('loadButton'), () => { state.loading = true; }, () => { state.loading = false; });
bindHold($('dropButton'), () => { state.dropping = true; }, () => { state.dropping = false; });
bindHold($('scoopButton'), () => { state.scoopInput = true; }, () => { state.scoopInput = false; });
bindHold($('touchDrop'), () => { state.dropping = true; }, () => { state.dropping = false; });
bindHold($('touchLoad'), () => { state.loading = true; }, () => { state.loading = false; });
bindHold($('touchDoor'), () => setDoor(!state.doorOpen), () => {});
$('doorButton').addEventListener('click', () => setDoor(!state.doorOpen));
$('gearButton').addEventListener('click', toggleGear);
$('cameraButton').addEventListener('click', cycleCamera);
$('throttleSlider').addEventListener('input', (event) => { state.throttle = Number(event.target.value) / 100; });
$('mobileThrottle').addEventListener('input', (event) => { state.throttle = Number(event.target.value) / 100; });
$('resumeButton').addEventListener('click', () => togglePause(false));
$('retryButton').addEventListener('click', () => location.reload());

window.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  if (event.code === 'Escape' && !event.repeat) togglePause();
  if (event.code === 'KeyC' && !event.repeat) cycleCamera();
  if (event.code === 'KeyO' && !event.repeat) setDoor(!state.doorOpen);
  if (event.code === 'KeyG' && !event.repeat) toggleGear();
  if (event.code === 'KeyF') state.loading = true;
  if (event.code === 'KeyR') state.scoopInput = true;
  if (event.code === 'Space') state.dropping = true;
});
window.addEventListener('keyup', (event) => {
  keys.delete(event.code);
  if (event.code === 'KeyF') state.loading = false;
  if (event.code === 'KeyR') state.scoopInput = false;
  if (event.code === 'Space') state.dropping = false;
});
window.addEventListener('blur', () => { keys.clear(); state.dropping = false; state.loading = false; state.scoopInput = false; });
window.addEventListener('contextmenu', (event) => { if (state.started) event.preventDefault(); });
window.addEventListener('pointerdown', (event) => {
  if (event.button !== 2 || (!state.started && !state.sandboxSetup) || state.paused || state.ended) return;
  cameraRig.dragging = true;
  cameraRig.lastX = event.clientX;
  cameraRig.lastY = event.clientY;
  if (!state.sandboxSetup && cameraRig.mode !== 2) setCameraMode(2);
  $('game').classList.add('camera-dragging');
  event.preventDefault();
});
window.addEventListener('pointermove', (event) => {
  if (!cameraRig.dragging) return;
  const deltaX = event.clientX - cameraRig.lastX;
  const deltaY = event.clientY - cameraRig.lastY;
  cameraRig.lastX = event.clientX;
  cameraRig.lastY = event.clientY;
  if (state.sandboxSetup && cameraRig.mode === 3) {
    const worldPerPixel = 2 * godView.height * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / innerHeight;
    godView.x -= deltaX * worldPerPixel;
    godView.z -= deltaY * worldPerPixel;
  } else {
    cameraRig.yaw -= deltaX * 0.006;
    cameraRig.pitch = clamp(cameraRig.pitch + deltaY * 0.004, -0.18, 0.92);
  }
});
window.addEventListener('pointerup', (event) => {
  if (event.button !== 2) return;
  cameraRig.dragging = false;
  $('game').classList.remove('camera-dragging');
});
window.addEventListener('pointercancel', () => {
  cameraRig.dragging = false;
  $('game').classList.remove('camera-dragging');
});
window.addEventListener('wheel', (event) => {
  if (state.sandboxSetup && cameraRig.mode === 3) {
    godView.height = clamp(godView.height + event.deltaY * 12, 1500, 18000);
    return;
  }
  if (!state.started || state.paused || cameraRig.mode === 1) return;
  cameraRig.distance = clamp(cameraRig.distance + event.deltaY * 0.035, 22, 90);
}, { passive: true });
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(innerWidth, innerHeight);
  resizeGtaoPass();
});

function setCameraMode(mode) {
  cameraRig.mode = mode % cameraModeNames.length;
  cameraRig.snap = true;
  if (cameraRig.mode === 2) cameraRig.yaw = plane.rotation.y;
  $('cameraModeReadout').textContent = cameraModeNames[cameraRig.mode];
}

function cycleCamera() {
  setCameraMode(cameraRig.mode + 1);
}

function liftCameraOverTerrain(cameraPosition, target) {
  let requiredLift = 0;
  for (let i = 0; i <= 12; i++) {
    cameraRaySample.lerpVectors(target, cameraPosition, i / 12);
    const clearance = i === 12 ? 12 : 5;
    requiredLift = Math.max(requiredLift, terrainHeight(cameraRaySample.x, cameraRaySample.z) + clearance - cameraRaySample.y);
  }
  if (requiredLift > 0) cameraPosition.y += requiredLift + 2;
}

function updateCamera(dt) {
  plane.position.set(aircraftBody.position.x, aircraftBody.position.y, aircraftBody.position.z);
  plane.quaternion.set(aircraftBody.quaternion.x, aircraftBody.quaternion.y, aircraftBody.quaternion.z, aircraftBody.quaternion.w);
  plane.updateMatrixWorld();
  propeller.rotation.z += dt * (state.throttle * 70 + 1);
  let desiredPosition;
  let target;
  let targetFov;
  if (cameraRig.mode === 3) {
    const ground = terrainHeight(godView.x, godView.z);
    desiredPosition = new THREE.Vector3(godView.x, ground + godView.height, godView.z);
    target = new THREE.Vector3(godView.x, ground, godView.z);
    camera.up.set(0, 0, -1);
    camera.position.copy(desiredPosition);
    targetFov = 52;
  } else if (cameraRig.mode === 1) {
    desiredPosition = plane.localToWorld(new THREE.Vector3(0, 5.1, -8.2));
    target = plane.localToWorld(new THREE.Vector3(0, 4.4, -120));
    camera.up.set(0, 1, 0).applyQuaternion(plane.quaternion);
    camera.position.copy(desiredPosition);
    targetFov = 72;
  } else if (cameraRig.mode === 2) {
    const orbitTarget = plane.position.clone().add(new THREE.Vector3(0, 2.4, 0));
    const horizontal = cameraRig.distance * Math.cos(cameraRig.pitch);
    desiredPosition = orbitTarget.clone().add(new THREE.Vector3(
      Math.sin(cameraRig.yaw) * horizontal,
      Math.sin(cameraRig.pitch) * cameraRig.distance,
      Math.cos(cameraRig.yaw) * horizontal,
    ));
    target = orbitTarget;
    camera.up.set(0, 1, 0);
    if (cameraRig.snap) camera.position.copy(desiredPosition);
    else camera.position.lerp(desiredPosition, 1 - Math.exp(-dt * 4));
    targetFov = 50;
  } else {
    desiredPosition = plane.localToWorld(new THREE.Vector3(0, 14, cameraRig.distance));
    target = plane.localToWorld(new THREE.Vector3(0, 2.2, -7));
    camera.up.set(0, 1, 0);
    if (cameraRig.snap) camera.position.copy(desiredPosition);
    else camera.position.lerp(desiredPosition, 1 - Math.exp(-dt * 5));
    targetFov = 48 + clamp(state.airspeed / 14, 0, 5);
  }
  if (cameraRig.mode !== 1) liftCameraOverTerrain(desiredPosition, target);
  cameraRig.snap = false;
  camera.lookAt(target);
  camera.fov = lerp(camera.fov, targetFov, 1 - Math.exp(-dt * 3));
  camera.updateProjectionMatrix();
}

const clock = new THREE.Clock();
let accumulator = 0;
let elapsed = 0;
function animate() {
  requestAnimationFrame(animate);
  const frameDt = Math.min(clock.getDelta(), 0.05);
  elapsed += frameDt;
  if (state.started && !state.paused && !state.ended) {
    accumulator += frameDt;
    while (accumulator >= 1 / 60) {
      updatePhysics(1 / 60);
      updateLoading(1 / 60);
      updateMission(1 / 60);
      accumulator -= 1 / 60;
    }
  }
  updateCamera(frameDt);
  scene.userData.updateTreeLod?.();
  updateHud(frameDt);
  if (Math.floor(elapsed * 10) !== Math.floor((elapsed - frameDt) * 10)) updateFireVisuals(elapsed);
  const smoke = scene.userData.smoke;
  if (smoke) for (let i = 0; i < smoke.userData.puffs.length; i++) {
    const puff = smoke.userData.puffs[i];
    puff.position.x += wind.x * frameDt * 0.12;
    puff.position.z += wind.z * frameDt * 0.12;
    puff.material.opacity = 0.08 + Math.sin(elapsed * 0.7 + i) * 0.03;
  }
  const sparks = scene.userData.sparks;
  if (sparks) sparks.position.x = (elapsed * wind.x * 0.18) % 40;
  composer.render();
}

initializeRuntimeUi();
state.airspeed = 0;
state.onGround = true;
updateCamera(0.016);
updateHud(1);
animate();