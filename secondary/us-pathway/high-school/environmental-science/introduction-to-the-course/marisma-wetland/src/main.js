/* ============================================================================
 * main.js — Bootstrap, game loop, turn flow, cinematics, inspection
 * ----------------------------------------------------------------------------
 * The only module that touches everything. It owns the render loop and wires
 * the Game (state) to the WorldRenderer + EntitySystem (render), the UI and the
 * AudioManager. Each subsystem stays unaware of the others.
 * ========================================================================== */
import * as THREE from 'three';
import { WorldRenderer } from './world/WorldRenderer.js';
import { EntitySystem } from './world/EntitySystem.js';
import { Game } from './engine/gameState.js';
import { DECISIONS } from './engine/config.js';
import { SPECIES } from './engine/model.js';
import { AudioManager } from './audio/AudioManager.js';
import { HUD } from './ui/HUD.js';
import { UIManager } from './ui/UIManager.js';
import { UI_ICONS } from './ui/icons.js';

const $ = (id) => document.getElementById(id);

/* ---- Core subsystems (persist across restarts) -------------------------- */
const world = new WorldRenderer($('scene'));
const entities = new EntitySystem(world.scene, world.assets, world);
const audio = new AudioManager();
let game = null;
let mode = 'guided';
let phase = 'intro';         // intro | play | predict | review | report
const hud = new HUD($('hud'), $('feedback'));
const ui = new UIManager(null, {
  sfx: (k) => audio[k] && audio[k](),
  onToggleAction: toggleAction,
  onOpenPredict: openPredict,
  onConfirm: confirmYear,
  onNextYear: nextYear,
  onWhy: () => ui.renderWhy(),
  onRestart: restart
});

/* ======================================================================
 * RENDER LOOP — always running so the world feels alive behind menus
 * ==================================================================== */
function loop() {
  const dt = world.update();
  entities.update(dt, world.time);
  world.render();
  updateInspectAnchor();
  requestAnimationFrame(loop);
}

/* ======================================================================
 * BOOT
 * ==================================================================== */
function boot() {
  ui.buildBriefing();
  $('btnMute').innerHTML = UI_ICONS.sound;
  ui.init(); // sets top-right icons + action bar (bar hidden until play)
  // Give the world a neutral starting look behind the intro.
  entities.applyState(new Game({ mode }).state);
  world.applyState(new Game({ mode }).state, { immediate: true });
  $('loader').classList.add('hidden');
  if (Game.hasSave()) $('btnContinue').classList.remove('hidden');
  wireStaticUI();
  loop();
}

function wireStaticUI() {
  // Intro mode cards
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected'); mode = card.dataset.mode;
    });
  });
  $('btnBegin').addEventListener('click', () => startGame(null));
  $('btnContinue').addEventListener('click', () => startGame(Game.load()));

  // Prediction dialog
  $('predictBack').addEventListener('click', () => { ui.hide('predictDialog'); phase = 'play'; });
  $('predictConfirm').addEventListener('click', confirmYear);

  // Year review
  $('reviewWhy').addEventListener('click', () => ui.renderWhy());
  $('reviewNext').addEventListener('click', nextYear);

  // Scientist view / menu / mute
  $('btnData').addEventListener('click', () => ui.openScientist());
  $('closeData').addEventListener('click', () => ui.closeScientist());
  document.querySelectorAll('.dtab[data-tab]').forEach(t => t.addEventListener('click', () => ui.selectTab(t.dataset.tab)));
  $('btnMenu').addEventListener('click', () => $('menu').classList.remove('hidden'));
  $('menuResume').addEventListener('click', () => $('menu').classList.add('hidden'));
  $('menuScientist').addEventListener('click', () => { $('menu').classList.add('hidden'); ui.openScientist(); });
  $('menuRestart').addEventListener('click', () => { $('menu').classList.add('hidden'); restart(); });
  $('btnMute').addEventListener('click', () => { const m = audio.toggleMute(); $('btnMute').innerHTML = m ? UI_ICONS.mute : UI_ICONS.sound; });

  // Inspection: click the world
  $('scene').addEventListener('pointerdown', onScenePointer);
  window.addEventListener('resize', () => world.resize());
}

/* ======================================================================
 * START / RESTART
 * ==================================================================== */
function startGame(loaded) {
  audio.start();
  game = loaded || new Game({ mode });
  ui.setGame(game);
  ui.currentGraph = 'populations';
  syncWorld(true);
  hud.update(game.state, false);
  $('intro').classList.add('hidden');
  $('ui').classList.remove('hidden');
  ui.updateActionBar();
  phase = 'play';
  if (game.finished) { endSequence(); return; }
  // Cinematic opening sweep, then a welcome toast.
  world.introSweep(() => {
    hud.toast(loaded ? 'Marsh restored from your last save.' : `Year ${game.state.year + 1}: choose up to three actions.`, 'good');
  });
}

function restart() {
  Game.clearSave();
  $('report').classList.add('hidden');
  $('ui').classList.add('hidden');
  ui.closeScientist();
  $('intro').classList.remove('hidden');
  phase = 'intro';
}

/* Reflect the whole current state in world + entities + hud. */
function syncWorld(immediate = false) {
  world.applyState(game.state, { immediate });
  entities.applyState(game.state);
  audio.setMood({ climate: game.state.climatePressure / 100, waterQuality: game.state.waterQuality / 100 });
}

/* ======================================================================
 * TURN FLOW
 * ==================================================================== */
function toggleAction(id) {
  if (phase !== 'play') return;
  const ok = game.toggleAction(id);
  audio.select();
  ui.updateActionBar();
  // Highlight the affected zone of the most recently selected action.
  const last = game.selected[game.selected.length - 1];
  const dec = DECISIONS.find(d => d.id === last);
  if (dec && dec.zone) world.highlightZone(dec.zone); else world.clearHighlight();
  if (!ok && game.selected.length >= 3) hud.toast('Up to three actions per year.', '');
}

function openPredict() {
  if (game.selected.length === 0) return;
  phase = 'predict';
  audio.confirm();
  ui.openPredict();
}

function confirmYear() {
  // Record the prediction, run the simulated year, then play the end-of-year
  // sequence (apply changes, focus camera, event effects) before the review.
  game.prediction = $('predictText').value.trim();
  ui.hide('predictDialog');
  world.clearHighlight();
  const result = game.runYear();
  if (!result || result.error) { hud.toast(result ? result.error : 'Could not run year.', 'bad'); phase = 'play'; return; }
  phase = 'review';
  audio.year();

  // Event visuals
  if (result.event) {
    audio.event(result.event.tone);
    const zone = eventZone(result.event.id);
    if (result.event.id === 'wildfire') { world.setSmokeOrigin(world.zoneCenter('edge')); world.triggerWeather('wildfire'); }
    if (result.event.id === 'flood') world.triggerWeather('flood');
    if (result.event.id === 'drought' || result.event.id === 'heatwave') audio.whoosh();
  }

  // Apply new state to the world (eased transitions show deterioration/recovery)
  syncWorld(false);
  hud.update(game.state);

  // Report this year to a host Discovery Lab activity (fills its Record).
  postRecord(result);

  // Focus the camera on the most affected area, then reveal the review.
  const focusZone = result.event ? eventZone(result.event.id) : (DECISIONS.find(d => d.id === result.actions[0]) || {}).zone;
  const target = world.zoneCenter(focusZone || 'water');
  const dir = target.clone().setY(0).normalize();
  const camPos = target.clone().add(new THREE.Vector3(dir.x * 30 + 6, 34, dir.z * 30 + 34));
  world.moveCamera(camPos, target, 1.6, () => { world.controls.enabled = false; });
  setTimeout(() => { if (phase === 'review') ui.showYearReview(result); }, 1500);
}

function nextYear() {
  // Evidence answer is captured for the teacher's discussion (not graded).
  ui.hide('yearReview');
  world.moveCamera(new THREE.Vector3(0, 62, 88), new THREE.Vector3(0, 0, 0), 1.6, () => { world.controls.enabled = true; });
  if (game.finished) { endSequence(); return; }
  phase = 'play';
  ui.updateActionBar();
  hud.toast(`Year ${game.state.year + 1}: plan your next actions.`, '');
}

/* ======================================================================
 * DISCOVERY LAB BRIDGE — when embedded as the Investigate step of a Discovery
 * Lab activity, post each simulated year up to the host page so the student's
 * Investigation Record fills itself (mirrors the whale game's contract:
 * {source, kind:"record", row}). Guarded so standalone play is unaffected.
 * ==================================================================== */
function postRecord(result) {
  try {
    if (!(window.parent && window.parent !== window)) return;
    const s = game.state;
    const actions = (result.actions && result.actions.length)
      ? result.actions.map(id => game.actionName(id)).join(', ')
      : 'Saved budget';
    const row = {
      year: 'Year ' + s.year,
      action: actions,
      event: result.event ? result.event.name : '—',
      biodiversity: Math.round(s.biodiversity),
      water: Math.round(s.waterQuality),
      resilience: Math.round(s.resilience)
    };
    window.parent.postMessage({ source: 'marisma-wetland', kind: 'record', row }, '*');
  } catch (e) { /* standalone or cross-origin — ignore */ }
}

/* Post the final 20-year + drought outcome as one summary row. */
function postFinalRow() {
  try {
    if (!(window.parent && window.parent !== window) || !game.stressResult) return;
    const st = game.stressResult, s = st.finalState;
    const row = {
      year: 'Final (after drought)',
      action: '20-year outcome',
      event: st.survived ? 'Survived the drought' : 'Failed the drought',
      biodiversity: Math.round(s.biodiversity),
      water: Math.round(s.waterQuality),
      resilience: Math.round(s.resilience)
    };
    window.parent.postMessage({ source: 'marisma-wetland', kind: 'record', row }, '*');
  } catch (e) { /* ignore */ }
}

/* Map an event to a world zone for the camera focus + effects. */
function eventZone(id) {
  return ({ wildfire: 'edge', drought: 'water', flood: 'water', heatwave: 'water',
    invasiveOutbreak: 'water', fishDisease: 'water', tourismBoom: 'tourism',
    grant: 'edge', protest: 'housing' })[id] || 'water';
}

/* ======================================================================
 * FINAL DROUGHT SEQUENCE + REPORT
 * ==================================================================== */
function endSequence() {
  phase = 'report';
  $('ui').classList.add('hidden');
  hud.toast('The final five-year drought begins…', 'bad');
  world.droughtPullback();
  audio.event('bad');

  // Animate the marsh drying down through the stress-test series.
  const series = game.stressResult.series;
  let i = 0;
  const dr=setInterval(() => {
    i++;
    if (i >= series.length) {
      clearInterval(dr);
      postFinalRow();
      setTimeout(() => ui.showReport(), 900);
      return;
    }
    // Push each drought year's snapshot into the live state view.
    const snap = series[i];
    const s = game.state;
    s.waterAvailability = snap.waterAvailability; s.waterQuality = snap.waterQuality;
    s.biodiversity = snap.biodiversity; s.algae = snap.algae; s.pops = snap.pops;
    s.climatePressure = snap.climatePressure; s.wetlandArea = snap.wetlandArea;
    syncWorld(false);
    audio.whoosh();
  }, 1400);
}

/* ======================================================================
 * INSPECTION — click terrain or creatures
 * ==================================================================== */
const ndc = new THREE.Vector2();
let inspectAnchor = null; // world position we keep the card pinned to

function onScenePointer(e) {
  if (phase === 'intro' || phase === 'report') return;
  ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
  ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
  const targets = [world.terrain, world.water, ...entities.getInspectables()];
  const hits = world.raycast(ndc, targets);
  if (!hits.length) { ui.hideInspect(); inspectAnchor = null; return; }
  const hit = hits[0];
  const info = inspectInfo(hit.object.name, hit.point);
  if (!info) { ui.hideInspect(); inspectAnchor = null; return; }
  inspectAnchor = hit.point.clone();
  const sp = world.worldToScreen(inspectAnchor);
  ui.showInspect(info, sp.x, sp.y);
  audio.hover();
}

function updateInspectAnchor() {
  if (!inspectAnchor || $('inspectCard').classList.contains('hidden')) return;
  const sp = world.worldToScreen(inspectAnchor);
  const card = $('inspectCard');
  if (!sp.visible) { card.style.opacity = '0'; return; }
  card.style.opacity = '1';
  let px = sp.x + 16, py = sp.y - 20;
  if (px + 240 > window.innerWidth - 12) px = sp.x - 256;
  card.style.left = px + 'px'; card.style.top = Math.max(12, py) + 'px';
}

/* Build an info card from what was clicked. */
function inspectInfo(name, point) {
  const s = game.state;
  const speciesByMesh = {
    reeds: 'reeds', fish: 'smallFish', fishBig: 'largeFish', birds: 'waterBirds',
    raptors: 'birdsOfPrey', frogs: 'frogs', crayfish: 'invasive'
  };
  if (speciesByMesh[name]) {
    const key = speciesByMesh[name];
    const sp = SPECIES.find(x => x.key === key);
    const K = s._K || {};
    return {
      title: sp.label, sci: sp.fictional,
      rows: [['Role', sp.trophic], ['Abundance', Math.round(s.pops[key]) + ' / 100'],
        ...(game.mode === 'advanced' && K[key] != null ? [['Habitat capacity', Math.round(K[key])]] : [])],
      text: trophicNote(key)
    };
  }
  if (name === 'water') {
    return { title: 'Open water', sci: 'The heart of the marsh',
      rows: [['Water quality', Math.round(s.waterQuality)], ['Water level', Math.round(s.waterAvailability)],
        ['Algae', Math.round(s.algae)], ['Nutrients', Math.round(s.nutrientLevel)]],
      text: s.waterQuality < 40 ? 'Murky and low-oxygen — nutrients and algae are stressing aquatic life.' : 'Clear and reflective — good conditions for fish and plants.' };
  }
  if (name === 'houseWalls') return { title: 'Housing', sci: 'Human development', rows: [['Housing level', Math.round(s.levers.housingLevel)], ['Employment', Math.round(s.employment)]], text: 'Homes bring jobs and income but shrink habitat and add runoff.' };
  if (name === 'farm') return { title: 'Farmland', sci: 'Agriculture', rows: [['Farming', Math.round(s.levers.farmingIntensity)], ['Food', Math.round(s.foodProduction)], ['Fertiliser', Math.round(s.levers.fertiliserUse)]], text: 'Fertiliser boosts food now but drives the nutrient → algae chain.' };
  if (name === 'treeCanopy') return { title: 'Woodland', sci: 'Habitat & corridors', rows: [['Corridors', Math.round(s.levers.corridors)], ['Biodiversity', Math.round(s.biodiversity)]], text: 'Trees and corridors link habitats and support birds of prey.' };
  if (name === 'terrain') return { title: 'Marsh ground', sci: 'Reed beds & shore', rows: [['Wetland area', Math.round(s.wetlandArea) + ' ha'], ['Water level', Math.round(s.waterAvailability)]], text: s.waterAvailability < 45 ? 'Cracked, drying soil — the water has retreated.' : 'Damp, vegetated ground fringing the water.' };
  return null;
}
function trophicNote(key) {
  return ({
    reeds: 'Reeds filter water and shelter birds, fish and frogs.',
    smallFish: 'Feed on insects and plants; food for large fish and birds.',
    largeFish: 'Top aquatic predator; sensitive to fishing and low oxygen.',
    waterBirds: 'Eat fish, frogs and insects; disturbed by tourism.',
    birdsOfPrey: 'Apex predator; needs healthy prey and connected habitat.',
    frogs: 'Eat insects; very sensitive to water quality.',
    invasive: 'Red swamp crayfish — preys on natives and stirs up sediment.'
  })[key] || '';
}

// Error boundary: if boot fails, surface it instead of a silent black screen.
try {
  boot();
} catch (err) {
  console.error('Marisma failed to start:', err);
  const l = $('loader');
  if (l) l.innerHTML = '<div class="loader-inner"><p>Sorry — the game failed to start.<br>' +
    'Check the browser console, and make sure it is served over http:// (not file://).</p></div>';
}
