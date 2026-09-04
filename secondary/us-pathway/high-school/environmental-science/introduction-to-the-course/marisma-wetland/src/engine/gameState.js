/* ============================================================================
 * engine/gameState.js — Game state machine + save/restart
 * ----------------------------------------------------------------------------
 * Wraps the pure engine with the running state, year history (for graphs and
 * the year-review), recorded predictions, the final drought stress test, report
 * generation and localStorage save/load. Still fully DOM-free.
 * ========================================================================== */
import { CONSTANTS, START_STATE, DECISIONS } from './config.js';
import { makeRng, stepYear, summariseChanges, deepCopy } from './model.js';

const SAVE_KEY = 'marisma_save_v2';

function snapshot(s) {
  return {
    year: s.year,
    biodiversity: s.biodiversity, waterQuality: s.waterQuality,
    waterAvailability: s.waterAvailability, resilience: s.resilience,
    wetlandArea: s.wetlandArea, nutrientLevel: s.nutrientLevel, algae: s.algae,
    employment: s.employment, tourismIncome: s.tourismIncome,
    foodProduction: s.foodProduction, publicSupport: s.publicSupport,
    budget: s.budget, climatePressure: s.climatePressure,
    pops: deepCopy(s.pops)
  };
}

export class Game {
  constructor(opts = {}) {
    this.mode = opts.mode || 'guided';
    this.seed = opts.seed != null ? opts.seed : (Date.now() % 2147483647);
    this.rng = makeRng(this.seed);
    this.state = deepCopy(START_STATE);
    this.history = [snapshot(this.state)];
    this.selected = [];
    this.prediction = '';
    this.predictions = [];
    this.lastResult = null;
    this.paused = false;
    this.finished = false;
    this.stressResult = null;
  }

  /* ---- Action selection --------------------------------------------------- */
  toggleAction(id) {
    const i = this.selected.indexOf(id);
    if (i >= 0) { this.selected.splice(i, 1); return true; }
    if (this.selected.indexOf('nothing') >= 0 && id !== 'nothing') this.selected = [];
    if (id === 'nothing') { this.selected = ['nothing']; return true; }
    if (this.selected.length >= CONSTANTS.MAX_ACTIONS_PER_YEAR) return false;
    this.selected.push(id);
    return true;
  }
  selectedCost() {
    const byId = {}; DECISIONS.forEach(d => { byId[d.id] = d; });
    return this.selected.reduce((sum, id) => sum + (byId[id] ? byId[id].cost : 0), 0);
  }
  canAfford() { return this.selectedCost() <= this.state.budget; }
  actionName(id) { const d = DECISIONS.find(x => x.id === id); return d ? d.name : id; }
  yearsLeft() { return CONSTANTS.TOTAL_YEARS - this.state.year; }

  /* ---- Advance one year --------------------------------------------------- */
  runYear() {
    if (this.finished || this.state.year >= CONSTANTS.TOTAL_YEARS) return null;
    if (!this.canAfford()) return { error: 'Not enough budget for those actions.' };
    const prev = deepCopy(this.state);
    this.predictions.push({ year: this.state.year + 1, text: this.prediction, selected: this.selected.slice() });
    const out = stepYear(this.state, this.selected, this.rng, {});
    this.state = out.state;
    const changes = summariseChanges(prev, this.state);
    this.lastResult = { log: out.log, event: out.event, changes, actions: this.selected.slice(), prev };
    this.history.push(snapshot(this.state));
    this.selected = [];
    this.prediction = '';
    if (this.state.year >= CONSTANTS.TOTAL_YEARS) { this.finished = true; this.runStressTest(); }
    this.save();
    return this.lastResult;
  }

  /* ---- Final drought stress test ----------------------------------------- */
  runStressTest() {
    let s = deepCopy(this.state);
    const startBio = s.biodiversity;
    const series = [snapshot(s)];
    const rng = makeRng(this.seed + 777);
    for (let y = 0; y < CONSTANTS.STRESS_TEST_YEARS; y++) {
      const out = stepYear(s, [], rng, { forceEvent: 'drought' });
      s = out.state;
      s.waterAvailability = Math.max(0, s.waterAvailability - 10);
      s.waterQuality = Math.max(0, s.waterQuality - 4);
      series.push(snapshot(s));
    }
    const endBio = s.biodiversity;
    const retained = startBio > 0 ? Math.round((endBio / startBio) * 100) : 0;
    const survived = (endBio >= 40 && retained >= 60 && s.waterQuality >= 30);
    this.stressResult = { series, startBio: Math.round(startBio), endBio: Math.round(endBio), retained, survived, finalState: s };
    return this.stressResult;
  }

  /* ---- End-of-game report ------------------------------------------------- */
  buildReport() {
    const start = this.history[0];
    const end = this.history[this.history.length - 1];
    const score = Math.round(0.5 * end.biodiversity + 0.3 * end.resilience + 0.2 * end.waterQuality);
    const condition = score >= 70 ? 'Thriving' : score >= 55 ? 'Healthy' : score >= 40 ? 'Stressed' : score >= 25 ? 'Degraded' : 'Collapsed';

    const yearScores = [];
    for (let i = 1; i < this.history.length; i++) {
      const a = this.history[i - 1], b = this.history[i];
      const d = (b.biodiversity - a.biodiversity) + (b.resilience - a.resilience);
      const pred = this.predictions[i - 1] || { selected: [] };
      yearScores.push({ year: b.year, delta: Math.round(d * 10) / 10, actions: pred.selected });
    }
    const sorted = yearScores.slice().sort((x, y) => y.delta - x.delta);
    const strongest = sorted.slice(0, 2).filter(y => y.delta > 0);
    const weakest = sorted.slice(-2).filter(y => y.delta < 0).reverse();

    const consequences = [];
    const drop = (key, label, threshold) => {
      const a = start.pops[key], b = end.pops[key];
      if (a - b >= threshold) consequences.push(`${label} fell from ${Math.round(a)} to ${Math.round(b)}.`);
    };
    drop('smallFish', 'Small fish', 15);
    drop('frogs', 'Frogs', 15);
    drop('waterBirds', 'Water birds', 15);
    if (end.pops.invasive - start.pops.invasive >= 15) consequences.push(`The invasive species rose from ${Math.round(start.pops.invasive)} to ${Math.round(end.pops.invasive)}.`);
    if (start.waterQuality - end.waterQuality >= 12) consequences.push(`Water quality declined from ${Math.round(start.waterQuality)} to ${Math.round(end.waterQuality)}.`);
    if (start.wetlandArea - end.wetlandArea >= 60) consequences.push(`Wetland area shrank from ${Math.round(start.wetlandArea)} ha to ${Math.round(end.wetlandArea)} ha.`);
    if (consequences.length === 0) consequences.push('No major unintended declines — the system stayed reasonably balanced.');

    const predictionReview = this.predictions.map((p, idx) => {
      const res = this.history[idx + 1], prevH = this.history[idx];
      return {
        year: p.year, text: p.text || '(no prediction recorded)', actions: p.selected,
        bioChange: Math.round(res.biodiversity - prevH.biodiversity),
        wqChange: Math.round(res.waterQuality - prevH.waterQuality)
      };
    });

    return { score, condition, start, end, strongest, weakest, consequences, predictionReview, stress: this.stressResult };
  }

  /* ---- Save / restart ----------------------------------------------------- */
  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        mode: this.mode, seed: this.seed, state: this.state,
        history: this.history, predictions: this.predictions, finished: this.finished
      }));
    } catch (e) { /* storage unavailable — ignore */ }
  }
  static hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null;
      const d = JSON.parse(raw);
      const g = new Game({ mode: d.mode, seed: d.seed });
      g.state = d.state; g.history = d.history; g.predictions = d.predictions || [];
      g.finished = d.finished || false;
      // Re-advance the RNG so continued runs stay varied (best-effort).
      for (let i = 0; i < g.history.length; i++) g.rng();
      if (g.finished) g.runStressTest();
      return g;
    } catch (e) { return null; }
  }
  static clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
}

export { CONSTANTS };
