import './style.css';

const maps = [
  {
    id: 'pine_valley', name: 'Pine Valley', region: 'Sierra foothills', missionTitle: 'First Response', severity: 1,
    briefing: 'A lightning strike started a grass fire on the east ridge. Contain it before it reaches the timber.', failAcres: 80, fireRadius: 44, fireX: 440, fireZ: -430,
    wind: [2.7, -3.8], airport: { name: 'Pine Valley Air Tanker Base', x: -900, z: 1260 }, water: { x: -230, z: 450, width: 620, depth: 290 }, scoopingAllowed: true,
    terrain: { base: 15, hills: 36, ridges: 29, detail: 8, frequency: 1 }, palette: { low: '#334d3b', mid: '#536b4a', high: '#79775d', stone: '#716e60', trees: '#324b3e', mountains: '#697a75', sky: '#a3c0c6', water: '#62a9a4' },
  },
  {
    id: 'coastal_mediterranean', name: 'Coastal Mediterranean', region: 'Costa Brava', missionTitle: 'Cliffside Brush', severity: 2,
    briefing: 'A dry brush front is climbing the headland toward the harbor road. Salt wind is carrying embers inland.', failAcres: 110, fireRadius: 67, fireX: 1200, fireZ: -600,
    wind: [7.2, -2.1], airport: { name: 'Cala Roja Airfield', x: 1650, z: 900 }, water: { x: -1850, z: 250, width: 1000, depth: 600 }, scoopingAllowed: true,
    terrain: { base: 8, hills: 52, ridges: 44, detail: 13, frequency: 1.3 }, palette: { low: '#77734e', mid: '#9b8b5d', high: '#b0a077', stone: '#8a8072', trees: '#566246', mountains: '#7d837e', sky: '#b2c7ce', water: '#4e8c98' },
  },
  {
    id: 'desert_canyon', name: 'Desert Canyon', region: 'Red Mesa', missionTitle: 'Canyon Spark', severity: 3,
    briefing: 'A canyon grass fire is being pushed toward the remote strip by a dry thermal wind. Airport reloads only.', failAcres: 145, fireRadius: 76, fireX: 300, fireZ: -900,
    wind: [4.5, -6.4], airport: { name: 'Red Mesa Strip', x: -1300, z: -1200 }, water: { x: 1400, z: 1250, width: 340, depth: 210 }, scoopingAllowed: false,
    terrain: { base: 20, hills: 48, ridges: 88, detail: 18, frequency: 1.8 }, palette: { low: '#8b714c', mid: '#a88052', high: '#c29a67', stone: '#91816e', trees: '#4d513b', mountains: '#807c72', sky: '#c0c8c3', water: '#477f87' },
  },
  {
    id: 'alpine_range', name: 'Alpine Range', region: 'North Divide', missionTitle: 'Thin Air', severity: 3,
    briefing: 'A high-altitude forest fire is crossing a steep saddle. Thin air limits climb and the alpine lakes are restricted.', failAcres: 130, fireRadius: 70, fireX: 500, fireZ: 200,
    wind: [5.5, 4.2], airport: { name: 'North Divide Airport', x: -1500, z: 1200 }, water: { x: 1900, z: -1100, width: 260, depth: 210 }, scoopingAllowed: false,
    terrain: { base: 120, hills: 78, ridges: 150, detail: 12, frequency: 1.45 }, palette: { low: '#576c55', mid: '#74846b', high: '#9a9a88', stone: '#a6a99e', trees: '#3e5a48', mountains: '#8b9998', sky: '#bad0dc', water: '#719da8' },
  },
  {
    id: 'boreal_wilderness', name: 'Boreal Wilderness', region: 'Taiga North', missionTitle: 'Crown Fire', severity: 4,
    briefing: 'A fast crown fire is running through dense conifers. The lake is your only practical water source.', failAcres: 220, fireRadius: 92, fireX: 900, fireZ: -400,
    wind: [8.4, -3.1], airport: { name: 'Taiga Base', x: -1750, z: -1550 }, water: { x: 800, z: 900, width: 880, depth: 540 }, scoopingAllowed: true,
    terrain: { base: 30, hills: 32, ridges: 24, detail: 10, frequency: 0.82 }, palette: { low: '#3e5a48', mid: '#58715a', high: '#73806b', stone: '#7d8176', trees: '#29463b', mountains: '#647b7c', sky: '#a9c1c6', water: '#528a91' },
  },
  {
    id: 'suburban_interface', name: 'Suburban Interface', region: 'Cedar Glen', missionTitle: 'Edge of Town', severity: 4,
    briefing: 'Wind is pushing a wildland fire toward homes and an evacuation route. Protect the eastern edge of town.', failAcres: 165, fireRadius: 82, fireX: 500, fireZ: -750,
    wind: [7.8, 1.2], airport: { name: 'Cedar Glen Municipal', x: -1300, z: -1250 }, water: { x: 1400, z: 1300, width: 330, depth: 260 }, scoopingAllowed: false,
    terrain: { base: 14, hills: 28, ridges: 18, detail: 7, frequency: 0.9 }, palette: { low: '#66734c', mid: '#7b8054', high: '#92866a', stone: '#80796b', trees: '#40583c', mountains: '#737d74', sky: '#b2c6c7', water: '#557f87' },
  },
  {
    id: 'redwood_coast', name: 'Redwood Coast', region: 'Pacific North', missionTitle: 'Old Growth Line', severity: 4,
    briefing: 'A wind-driven understory fire is approaching protected old-growth forest. Keep the fire south of the river.', failAcres: 190, fireRadius: 86, fireX: -500, fireZ: 300,
    wind: [-6.8, -2.6], airport: { name: 'Cape Alder Airstrip', x: 1850, z: -700 }, water: { x: -2050, z: 200, width: 920, depth: 460 }, scoopingAllowed: true,
    terrain: { base: 18, hills: 49, ridges: 56, detail: 12, frequency: 1.12 }, palette: { low: '#355744', mid: '#527259', high: '#76836c', stone: '#797d72', trees: '#274e3d', mountains: '#647c7d', sky: '#aec5cc', water: '#4d8992' },
  },
  {
    id: 'sierra_foothills', name: 'Sierra Foothills', region: 'Granite Basin', missionTitle: 'Granite Run', severity: 2,
    briefing: 'A grass-and-brush fire is spreading across rolling foothills. Catch it before afternoon gusts arrive.', failAcres: 100, fireRadius: 58, fireX: -250, fireZ: -550,
    wind: [3.8, 2.4], airport: { name: 'Granite Basin Field', x: -1600, z: 1500 }, water: { x: 1500, z: -1300, width: 470, depth: 330 }, scoopingAllowed: false,
    terrain: { base: 24, hills: 46, ridges: 32, detail: 10, frequency: 1.05 }, palette: { low: '#59684b', mid: '#777650', high: '#9a8c6d', stone: '#8e8779', trees: '#39543d', mountains: '#737f79', sky: '#aec3c8', water: '#55838b' },
  },
  {
    id: 'great_basin', name: 'Great Basin', region: 'Silver Flats', missionTitle: 'Dry Lightning', severity: 5,
    briefing: 'Four lightning ignitions are active across dry scrubland. Pick a priority and manage the long turnaround.', failAcres: 280, fireRadius: 104, fireX: 650, fireZ: 250,
    wind: [9.2, 5.6], airport: { name: 'Silver Flats Base', x: -600, z: -1800 }, water: { x: 2100, z: 300, width: 250, depth: 190 }, scoopingAllowed: false,
    terrain: { base: 40, hills: 56, ridges: 74, detail: 17, frequency: 1.65 }, palette: { low: '#82724d', mid: '#a28a5a', high: '#b59a70', stone: '#8b8373', trees: '#4c523c', mountains: '#85847c', sky: '#c2cccb', water: '#4f7a81' },
  },
  {
    id: 'cascade_range', name: 'Cascade Range', region: 'Rainshadow Pass', missionTitle: 'Pass Fire', severity: 3,
    briefing: 'A wind-funneled fire is climbing a forested pass toward a power corridor. Hold the western ridge.', failAcres: 150, fireRadius: 74, fireX: 250, fireZ: 700,
    wind: [-7.2, 6.8], airport: { name: 'Rainshadow Field', x: -1450, z: 1300 }, water: { x: 1700, z: 700, width: 610, depth: 390 }, scoopingAllowed: true,
    terrain: { base: 80, hills: 64, ridges: 120, detail: 13, frequency: 1.36 }, palette: { low: '#405b48', mid: '#5d7457', high: '#828677', stone: '#92968e', trees: '#2e4d3b', mountains: '#6f8383', sky: '#aec7cf', water: '#4e8994' },
  },
  {
    id: 'gulf_marsh', name: 'Gulf Marsh', region: 'Delta Coast', missionTitle: 'Marsh Front', severity: 5,
    briefing: 'A peat fire is smoldering under a wide marsh front. Use careful repeated drops before it reaches the village.', failAcres: 260, fireRadius: 100, fireX: -300, fireZ: 450,
    wind: [6.4, -7.1], airport: { name: 'Delta Coast Airfield', x: 0, z: -1750 }, water: { x: 0, z: 1700, width: 1100, depth: 780 }, scoopingAllowed: true,
    terrain: { base: 4, hills: 10, ridges: 7, detail: 4, frequency: 0.7 }, palette: { low: '#526b51', mid: '#718264', high: '#929078', stone: '#797d72', trees: '#355643', mountains: '#73847d', sky: '#b1c9ca', water: '#4f8790' },
  },
];

const aircraft = [
  { id: 'sparrow_at1', name: 'Sparrow AT-1', className: 'Light air tractor', mass: 3900, scale: 1.35, tankCapacity: 3000, fuelCapacity: 700, groundLoadRate: 100, scoopRate: 0, maxThrust: 32000, maxSpeed: 100, canScoop: false },
  { id: 'heron_s2', name: 'Heron S-2', className: 'Water scooper', mass: 12000, scale: 1.7, tankCapacity: 5500, fuelCapacity: 900, groundLoadRate: 150, scoopRate: 500, maxThrust: 60000, maxSpeed: 88, canScoop: true },
  { id: 'atlas_t4', name: 'Atlas T-4', className: 'Heavy air tanker', mass: 20000, scale: 2.05, tankCapacity: 12000, fuelCapacity: 2500, groundLoadRate: 250, scoopRate: 0, maxThrust: 110000, maxSpeed: 102, canScoop: false },
];

const airportOptions = (map) => [
  map.airport,
  { name: 'North Ridge Strip', x: map.airport.x + 1100, z: map.airport.z - 800 },
  { name: 'West Response Field', x: map.airport.x - 1200, z: map.airport.z + 450 },
];

window.FireLineMenuCatalog = { maps, aircraft, airportOptions };

const $ = (id) => document.getElementById(id);
const homeView = $('menuHome');
const missionView = $('missionPicker');
const sandboxView = $('sandboxPicker');
const mapGrid = $('sandboxMapGrid');
let selectedSandboxMap = maps[0];
let isLaunching = false;

function showView(view) {
  homeView.classList.toggle('hidden', view !== 'home');
  missionView.classList.toggle('hidden', view !== 'missions');
  sandboxView.classList.toggle('hidden', view !== 'sandbox');
}

function renderMissions() {
  $('missionList').innerHTML = maps.map((map, index) => `
    <button class="mission-option ${index === 0 ? 'tutorial-option' : ''}" data-map="${map.id}">
      <span class="mission-index">${String(index === 0 ? 'T' : index).padStart(2, '0')}</span>
      <span class="mission-info"><strong>${map.missionTitle}</strong><small>${map.name} · ${map.region}</small></span>
      <span class="mission-severity"><small>SEVERITY ${map.severity}</small><b>${'◆'.repeat(map.severity)}${'◇'.repeat(5 - map.severity)}</b></span>
      <span class="mission-arrow">↗</span>
    </button>`).join('');
  $('missionList').querySelectorAll('[data-map]').forEach((button) => {
    button.addEventListener('click', () => {
      const map = maps.find((entry) => entry.id === button.dataset.map);
      launch({ mode: 'mission', map, mission: map, airport: map.airport, aircraft: aircraft[0] });
    });
  });
}

function renderSandboxMaps() {
  mapGrid.innerHTML = maps.map((map, index) => `
    <button class="sandbox-map-option ${map.id === selectedSandboxMap.id ? 'selected' : ''}" data-map="${map.id}">
      <span class="sandbox-map-index">${String(index === 0 ? 'T' : index).padStart(2, '0')}</span>
      <strong>${map.name}</strong><small>${map.region}</small>
    </button>`).join('');
  mapGrid.querySelectorAll('[data-map]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedSandboxMap = maps.find((entry) => entry.id === button.dataset.map);
      renderSandboxMaps();
      renderAirportOptions();
    });
  });
}

function renderAirportOptions() {
  $('sandboxAirport').innerHTML = airportOptions(selectedSandboxMap).map((option, index) => `<option value="${index}">${option.name}</option>`).join('');
}

function renderAircraftOptions() {
  $('sandboxAircraft').innerHTML = aircraft.map((item) => `<option value="${item.id}">${item.name} · ${item.className}</option>`).join('');
}

async function launch(config) {
  if (isLaunching) return;
  isLaunching = true;
  const game = $('game');
  const loading = $('loadingScreen');
  loading.classList.remove('hidden');
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.FireLineLaunchConfig = config;
  game.classList.add('runtime-active');
  $('mainMenu').classList.add('hidden');
  try {
    await import('./main.js');
    loading.classList.add('hidden');
  } catch (error) {
    console.error(error);
    game.classList.remove('runtime-active');
    $('mainMenu').classList.remove('hidden');
    loading.classList.add('hidden');
    isLaunching = false;
    alert('Map could not be loaded. Please try again.');
  }
}

$('missionsButton').addEventListener('click', () => showView('missions'));
$('sandboxButton').addEventListener('click', () => showView('sandbox'));
$('missionBack').addEventListener('click', () => showView('home'));
$('sandboxBack').addEventListener('click', () => showView('home'));
$('godViewButton').addEventListener('click', () => {
  const airportIndex = Number($('sandboxAirport').value || 0);
  const selectedAircraft = aircraft.find((item) => item.id === $('sandboxAircraft').value) || aircraft[0];
  launch({ mode: 'sandbox', map: selectedSandboxMap, mission: null, airport: airportOptions(selectedSandboxMap)[airportIndex], aircraft: selectedAircraft });
});

renderMissions();
renderSandboxMaps();
renderAirportOptions();
renderAircraftOptions();