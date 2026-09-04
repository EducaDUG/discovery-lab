/* ============================================================================
 * engine/model.js — Pure ecological / economic engine (UNCHANGED science)
 * ----------------------------------------------------------------------------
 * Same equations as v1, now an ES module. DOM-free and deterministic given a
 * seeded RNG, so it can be tested headlessly and drives both the game and the
 * final drought stress test.
 * ========================================================================== */
import { CONSTANTS as C, DECISIONS, EVENTS, SPECIES } from './config.js';

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const clamp01 = (x) => clamp(x, 0, 1);
export const clamp100 = (x) => clamp(x, 0, 100);
const toward = (cur, target, rate) => cur + (target - cur) * rate;
export const deepCopy = (o) => JSON.parse(JSON.stringify(o));

/* Seedable RNG (mulberry32) — reproducible runs for debugging/teaching. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 1. Apply the player's actions (spend budget, adjust levers/instant vars). */
function applyActions(s, actionIds, log) {
  const byId = {}; DECISIONS.forEach(d => { byId[d.id] = d; });
  (actionIds || []).forEach(id => {
    const d = byId[id]; if (!d) return;
    s.budget = Math.max(0, s.budget - d.cost);
    d.apply(s);
    log.push('You chose: ' + d.name + '.');
  });
}

/* 2. Climate warming trend. */
function advanceClimate(s) { s.climatePressure = clamp100(s.climatePressure + C.CLIMATE_PER_YEAR); }

/* 3. At most one weighted random event per year. */
function drawEvent(s, rng, log, forceNone) {
  if (forceNone) return null;
  if (rng() > C.EVENT_BASE_CHANCE) return null;
  const weights = EVENTS.map(e => Math.max(0, e.weight(s)));
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let r = rng() * total, acc = 0, chosen = null;
  for (let i = 0; i < EVENTS.length; i++) { acc += weights[i]; if (r <= acc) { chosen = EVENTS[i]; break; } }
  if (chosen) chosen.apply(s, log);
  return chosen ? { id: chosen.id, name: chosen.name, tone: chosen.tone, text: chosen.text } : null;
}

/* 4. Pollution chain: nutrients -> algae -> water quality (all lagged). */
function updateWaterChemistry(s) {
  const L = s.levers, p = s.pops;
  const nutrientTarget = clamp100(20 + 0.5 * L.fertiliserUse + 0.3 * L.farmingIntensity + 0.2 * L.housingLevel - 0.4 * L.wastewaterQuality - 0.10 * p.reeds - 0.06 * p.aquaticPlants);
  s.nutrientLevel = clamp100(toward(s.nutrientLevel, nutrientTarget, 0.6));

  const algaeTarget = clamp100(0.8 * Math.max(0, s.nutrientLevel - 30) + 0.4 * s.climatePressure + 0.3 * Math.max(0, 55 - s.waterAvailability));
  s.algae = clamp100(toward(s.algae, algaeTarget, 0.35));

  const wqTarget = clamp100(50 + 0.25 * (L.wastewaterQuality - 50) + 0.12 * (p.reeds - 50) - 0.55 * Math.max(0, s.nutrientLevel - 40) - 0.45 * s.algae - 0.20 * (p.invasive - 20) + 0.12 * (s.waterAvailability - 50));
  s.waterQuality = clamp100(toward(s.waterQuality, wqTarget, 0.45));

  const waterTarget = clamp100(85 - 0.5 * L.extractionLevel - 0.4 * s.climatePressure);
  s.waterAvailability = clamp100(toward(s.waterAvailability, waterTarget, 0.4));

  L.restoration = clamp100(L.restoration - 3);
  L.invasiveControl = Math.max(0, L.invasiveControl - 0.15);
  L.educationLevel = clamp100(L.educationLevel - 1);
}

/* 5. Food-web carrying capacities. */
export function carryingCapacities(s) {
  const p = s.pops, L = s.levers;
  const f = clamp(s.wetlandArea / C.START_AREA, 0.3, 1.25);
  const wq = s.waterQuality, wa = s.waterAvailability, alg = s.algae;
  const disturbance = clamp01(L.tourismLevel / 200 - L.educationLevel / 400);
  return {
    aquaticPlants: 100 * f * clamp01(0.35 + 0.40 * wa / 100 + 0.25 * wq / 100 - 0.55 * alg / 100),
    reeds:         100 * f * clamp01(0.40 + 0.35 * wa / 100 + 0.20 * wq / 100 + 0.15 * L.restoration / 100),
    insects:       100 *     clamp01(0.20 + 0.40 * p.aquaticPlants / 100 + 0.30 * p.reeds / 100 + 0.20 * wq / 100),
    smallFish:     100 *     clamp01(0.20 + 0.35 * p.insects / 100 + 0.25 * p.aquaticPlants / 100 + 0.30 * wq / 100 - 0.30 * p.invasive / 100),
    largeFish:     100 *     clamp01(0.15 + 0.60 * p.smallFish / 100 + 0.30 * wq / 100) * (1 - 0.5 * L.fishingPressure / 100),
    frogs:         100 *     clamp01(0.20 + 0.40 * p.insects / 100 + 0.25 * p.reeds / 100 + 0.30 * wq / 100 - 0.20 * p.invasive / 100),
    waterBirds:    100 * f * clamp01(0.15 + 0.30 * p.smallFish / 100 + 0.25 * p.frogs / 100 + 0.20 * p.insects / 100 + 0.20 * p.reeds / 100) * (1 - 0.3 * disturbance),
    birdsOfPrey:   100 *     clamp01(0.10 + 0.50 * p.waterBirds / 100 + 0.25 * p.frogs / 100 + 0.20 * p.smallFish / 100) * (0.7 + 0.3 * L.corridors / 100),
    invasive:      100 *     clamp01(0.20 + 0.40 * s.nutrientLevel / 100 + 0.30 * s.climatePressure / 100 + 0.20 * alg / 100) * (1 - L.invasiveControl)
  };
}

function updatePopulations(s) {
  const K = carryingCapacities(s), p = s.pops, r = C.GROWTH_RATE;
  const grow = (key) => {
    const N = p[key], k = K[key];
    let next = N + r * N * (1 - N / Math.max(k, 1));
    if (k > 5 && next < 2) next = 2;
    return clamp100(next);
  };
  const np = {};
  Object.keys(p).forEach(key => { np[key] = grow(key); });
  np.smallFish  = clamp100(np.smallFish  - 0.05 * p.largeFish / 100 * np.smallFish - 0.04 * p.waterBirds / 100 * np.smallFish);
  np.frogs      = clamp100(np.frogs      - 0.05 * p.waterBirds / 100 * np.frogs);
  np.waterBirds = clamp100(np.waterBirds - 0.05 * p.birdsOfPrey / 100 * np.waterBirds);
  s.pops = np;
  s._K = K;
}

function updateDerived(s) {
  const p = s.pops;
  const natives = ['aquaticPlants', 'reeds', 'insects', 'smallFish', 'largeFish', 'frogs', 'waterBirds', 'birdsOfPrey'];
  const vals = natives.map(k => p[k]);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length / 100;
  const meanRaw = mean * 100;
  const variance = vals.reduce((a, v) => a + (v - meanRaw) * (v - meanRaw), 0) / vals.length;
  const evenness = clamp01(1 - Math.sqrt(variance) / 50);
  const invasivePenalty = p.invasive / 200;
  const bioTarget = clamp100(100 * (0.6 * mean + 0.4 * evenness) - invasivePenalty * 100);
  s.biodiversity = clamp100(toward(s.biodiversity, bioTarget, 0.5));
  s.resilience = clamp100(0.40 * s.biodiversity + 0.25 * s.waterQuality + 0.15 * s.waterAvailability + 0.10 * (100 - p.invasive) + 0.10 * s.levers.corridors);
}

function updateEconomy(s) {
  const L = s.levers;
  const employTarget = clamp100(30 + 0.25 * L.farmingIntensity + 0.20 * L.tourismLevel + 0.20 * L.housingLevel + 0.10 * L.fishingPressure - 0.15 * L.restoration);
  s.employment = clamp100(toward(s.employment, employTarget, 0.5));
  const foodTarget = clamp100(0.6 * L.farmingIntensity + 0.4 * (s.waterAvailability / 100 * 50));
  s.foodProduction = clamp100(toward(s.foodProduction, foodTarget, 0.5));
  const tourTarget = clamp100(10 + 0.40 * L.tourismLevel + 0.25 * (s.biodiversity * 0.5) + 0.20 * (s.waterQuality * 0.5));
  s.tourismIncome = clamp100(toward(s.tourismIncome, tourTarget, 0.5));
  const supportTarget = clamp100(30 + 0.30 * (s.employment * 0.5) + 0.20 * s.tourismIncome + 0.20 * (s.biodiversity * 0.5) + 0.20 * L.educationLevel);
  s.publicSupport = clamp100(toward(s.publicSupport, supportTarget, 0.4));
  const annualIncome = 25 + 0.5 * s.tourismIncome + 0.4 * s.foodProduction + 0.4 * L.housingLevel;
  s.budget = Math.round((s.budget + annualIncome) * 10) / 10;
  s._annualIncome = Math.round(annualIncome);
}

/* MAIN: run exactly one simulated year. */
export function stepYear(state, actionIds, rng, options = {}) {
  const s = deepCopy(state);
  const log = [];
  applyActions(s, actionIds, log);
  advanceClimate(s);

  let event = null;
  if (options.forceEvent) {
    const forced = EVENTS.find(e => e.id === options.forceEvent);
    if (forced) { forced.apply(s, log); event = { id: forced.id, name: forced.name, tone: forced.tone, text: forced.text }; }
  } else {
    event = drawEvent(s, rng, log, options.noEvent);
  }

  updateWaterChemistry(s);
  updatePopulations(s);
  updateDerived(s);
  updateEconomy(s);
  s.year = state.year + 1;
  return { state: s, log, event };
}

/* Describe the biggest changes between two states (for the year review / why). */
export function summariseChanges(prev, next) {
  const fields = [
    ['Biodiversity', 'biodiversity'], ['Water quality', 'waterQuality'],
    ['Water availability', 'waterAvailability'], ['Ecosystem resilience', 'resilience'],
    ['Public support', 'publicSupport'], ['Employment', 'employment'],
    ['Tourism income', 'tourismIncome'], ['Food production', 'foodProduction'],
    ['Invasive species', 'pops.invasive'], ['Small fish', 'pops.smallFish'],
    ['Large fish', 'pops.largeFish'], ['Frogs', 'pops.frogs'],
    ['Water birds', 'pops.waterBirds'], ['Reeds', 'pops.reeds'],
    ['Nutrient level', 'nutrientLevel'], ['Algae', 'algae']
  ];
  const get = (o, path) => path.split('.').reduce((a, k) => a[k], o);
  return fields.map(f => {
    const a = get(prev, f[1]), b = get(next, f[1]);
    return { label: f[0], from: Math.round(a), to: Math.round(b), delta: Math.round(b - a) };
  }).filter(c => Math.abs(c.delta) >= 1)
    .sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
}

export { SPECIES };
