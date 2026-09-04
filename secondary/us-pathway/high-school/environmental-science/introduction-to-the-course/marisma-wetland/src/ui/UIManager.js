/* ============================================================================
 * ui/UIManager.js — Action bar, dialogues, year-review, inspect cards,
 *                   Scientist View (graphs/variables/model/glossary) and report.
 * ----------------------------------------------------------------------------
 * Pure DOM. It reads the Game and calls back into main.js for anything that
 * touches the world, audio or the turn flow, so UI stays decoupled from render.
 * ========================================================================== */
import { DECISIONS, EVENTS, GLOSSARY } from '../engine/config.js';
import { SPECIES, carryingCapacities } from '../engine/model.js';
import { CONSTANTS } from '../engine/gameState.js';
import { ACTION_ICONS, UI_ICONS } from './icons.js';

const $ = (id) => document.getElementById(id);
const barColor = (v) => v >= 60 ? 'var(--good)' : v >= 35 ? 'var(--warn)' : 'var(--bad)';
const esc = (s) => (s || '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export class UIManager {
  constructor(game, cb) {
    this.game = game;
    this.cb = cb;            // { onToggleAction, onOpenPredict, onConfirm, onNextYear, onWhy, onRestart, sfx }
    this.currentGraph = 'populations';
  }
  setGame(g) { this.game = g; }

  /* ---- Static wiring of buttons (once) ----------------------------------- */
  init() {
    $('btnData').innerHTML = UI_ICONS.data;
    $('btnMenu').innerHTML = UI_ICONS.menu;
    $('closeData').innerHTML = UI_ICONS.close;
    this.renderActionBar();
  }

  /* ======================================================================
   * ACTION BAR
   * ==================================================================== */
  renderActionBar() {
    const bar = $('actionBar');
    bar.innerHTML = `
      <div class="action-scroll">${DECISIONS.map(d => `
        <button class="act cat-${d.category}" data-id="${d.id}">
          <span class="act-badge"></span>
          <span class="act-ic">${ACTION_ICONS[d.id] || ''}</span>
          <span class="act-name">${d.name}</span>
          <span class="act-cost ${d.cost === 0 ? 'free' : ''}">${d.cost === 0 ? 'Free' : d.cost}</span>
        </button>`).join('')}
      </div>
      <div class="bar-side">
        <div class="bar-info" id="barInfo"></div>
        <button class="primary-btn confirm-btn" id="btnConfirm" disabled>Plan year</button>
      </div>`;
    bar.querySelectorAll('.act').forEach(btn => {
      btn.addEventListener('click', () => this.cb.onToggleAction(btn.dataset.id));
      btn.addEventListener('mouseenter', () => this.cb.sfx('hover'));
    });
    $('btnConfirm').addEventListener('click', () => this.cb.onOpenPredict());
    this.updateActionBar();
  }

  updateActionBar() {
    const g = this.game;
    if (!g) return;                 // action bar is built before a game starts
    const cost = g.selectedCost();
    DECISIONS.forEach(d => {
      const btn = document.querySelector(`.act[data-id="${d.id}"]`);
      if (!btn) return;
      const selected = g.selected.includes(d.id);
      const atMax = !selected && g.selected.length >= CONSTANTS.MAX_ACTIONS_PER_YEAR;
      const afford = (cost + (selected ? 0 : d.cost)) <= g.state.budget;
      btn.classList.toggle('selected', selected);
      btn.classList.toggle('disabled', !selected && (atMax || !afford));
      const badge = btn.querySelector('.act-badge');
      if (selected) badge.textContent = g.selected.indexOf(d.id) + 1;
    });
    const info = $('barInfo');
    if (info) info.innerHTML = `<b>${g.selected.length}/${CONSTANTS.MAX_ACTIONS_PER_YEAR}</b> actions · cost <b>${cost}</b>`
      + (cost > g.state.budget ? ' <span style="color:var(--bad)">over budget</span>' : '');
    const confirm = $('btnConfirm');
    if (confirm) {
      confirm.disabled = g.selected.length === 0 || cost > g.state.budget;
      confirm.textContent = g.selected.length ? 'Plan year' : 'Choose actions';
    }
  }

  /* ======================================================================
   * PREDICTION DIALOG
   * ==================================================================== */
  openPredict() {
    const g = this.game;
    const chosen = g.selected.map(id => DECISIONS.find(d => d.id === id));
    const hints = new Set();
    chosen.forEach(d => d.predict.forEach(p => hints.add(p)));
    $('predictBody').innerHTML = `
      <p>You plan to:</p>
      <div class="chosen-list">${chosen.map(d => `<div class="ch">${ACTION_ICONS[d.id]}<span>${d.name}</span></div>`).join('')}</div>
      ${g.mode === 'guided' ? `<div class="predict-hints">Think about: ${[...hints].map(h => `<span>${h}</span>`).join('')}</div>` : ''}`;
    $('predictText').value = '';
    this._show('predictDialog');
    setTimeout(() => $('predictText').focus(), 60);
  }

  /* ======================================================================
   * YEAR REVIEW
   * ==================================================================== */
  showYearReview(result) {
    const g = this.game;
    const ev = $('reviewEvent');
    if (result.event) {
      ev.className = 'review-event show ' + result.event.tone;
      ev.innerHTML = `<span class="rv-ic">${this._eventIcon(result.event.tone)}</span>
        <div><b>${result.event.name}</b><br><small style="color:var(--ink-dim)">${result.event.text}</small></div>`;
    } else {
      ev.className = 'review-event'; ev.innerHTML = '';
    }
    $('reviewTitle').textContent = `Year ${g.state.year} — the marsh responds:`;

    // Up to three most important changes, with a plain-language cause line.
    const top = result.changes.slice(0, 3);
    const causeFor = (label) => {
      const l = result.log.find(x => x.toLowerCase().includes(label.toLowerCase().split(' ')[0]));
      return l || '';
    };
    $('reviewChanges').innerHTML = top.map(c => {
      const up = c.delta > 0;
      return `<div class="rc"><div class="rc-arrow ${up ? 'up' : 'down'}">${up ? '▲' : '▼'}</div>
        <div class="rc-text"><b>${c.label}</b> ${c.from} → ${c.to} (${up ? '+' : ''}${c.delta})
        <small>${esc(causeFor(c.label))}</small></div></div>`;
    }).join('') || '<div class="rc"><div class="rc-text">Little changed this year — pressures are still building.</div></div>';

    $('evidenceText').value = '';
    $('whyPanel').classList.add('hidden');
    $('reviewNext').textContent = g.finished ? 'See final report' : 'Next year';
    this._show('yearReview');
  }

  renderWhy() {
    const s = this.game.state;
    const K = s._K || carryingCapacities(s);
    const box = $('whyPanel');
    box.classList.toggle('hidden');
    if (box.classList.contains('hidden')) return;
    const lines = ['<h4>Main drivers this year</h4><ul>'];
    lines.push(`<li><b>Nutrients &amp; algae:</b> nutrient ${Math.round(s.nutrientLevel)}, algae ${Math.round(s.algae)} → water quality ${Math.round(s.waterQuality)} (with a lag).</li>`);
    lines.push(`<li><b>Water:</b> availability ${Math.round(s.waterAvailability)}; extraction &amp; climate (${Math.round(s.climatePressure)}) draw it down.</li>`);
    lines.push(`<li><b>Invasive:</b> ${Math.round(s.pops.invasive)} — competes with native fish, frogs &amp; plants.</li>`);
    lines.push('</ul>');
    if (this.game.mode === 'advanced') {
      lines.push('<h4>Carrying capacities (habitat limit)</h4><ul>');
      SPECIES.forEach(sp => {
        const pop = Math.round(s.pops[sp.key]), cap = Math.round(K[sp.key]);
        const tag = pop > cap + 3 ? ' <span style="color:var(--bad)">(over capacity → falling)</span>'
          : pop < cap - 3 ? ' <span style="color:var(--good)">(below capacity → can grow)</span>' : '';
        lines.push(`<li>${sp.label}: ${pop} / cap ${cap}${tag}</li>`);
      });
      lines.push('</ul>');
    } else {
      lines.push('<p style="color:var(--ink-dim)">Open Scientist View or Advanced mode for the model’s numbers.</p>');
    }
    box.innerHTML = lines.join('');
  }

  _eventIcon(tone) {
    if (tone === 'good') return '<svg viewBox="0 0 24 24" fill="none" stroke="var(--good)" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3Z"/></svg>';
    if (tone === 'bad') return '<svg viewBox="0 0 24 24" fill="none" stroke="var(--bad)" stroke-width="1.6" stroke-linecap="round"><path d="M12 4 3 20h18L12 4Z"/><path d="M12 10v5M12 18h.01"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="var(--warn)" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>';
  }

  /* ======================================================================
   * INSPECT CARD
   * ==================================================================== */
  showInspect(info, x, y) {
    const card = $('inspectCard');
    card.innerHTML = `<button class="ic-close">${UI_ICONS.close}</button>
      <h3>${info.title}</h3>${info.sci ? `<div class="sci">${info.sci}</div>` : ''}
      ${(info.rows || []).map(r => `<div class="row"><span>${r[0]}</span><b>${r[1]}</b></div>`).join('')}
      ${info.text ? `<p>${info.text}</p>` : ''}`;
    card.classList.remove('hidden');
    const w = 240, pad = 12;
    let px = x + 16, py = y - 20;
    if (px + w > window.innerWidth - pad) px = x - w - 16;
    if (py < pad) py = pad;
    if (py + card.offsetHeight > window.innerHeight - pad) py = window.innerHeight - card.offsetHeight - pad;
    card.style.left = px + 'px'; card.style.top = py + 'px';
    card.querySelector('.ic-close').addEventListener('click', () => this.hideInspect());
  }
  hideInspect() { $('inspectCard').classList.add('hidden'); }

  /* ======================================================================
   * SCIENTIST VIEW
   * ==================================================================== */
  openScientist(tab) {
    $('scientistView').classList.remove('hidden');
    if (tab) this.selectTab(tab); else this.renderDrawer(this._tab || 'graphs');
  }
  closeScientist() { $('scientistView').classList.add('hidden'); }
  selectTab(tab) {
    this._tab = tab;
    document.querySelectorAll('.dtab').forEach(t => t.classList.toggle('selected', t.dataset.tab === tab));
    this.renderDrawer(tab);
  }

  renderDrawer(tab) {
    const body = $('drawerBody');
    if (tab === 'graphs') {
      body.innerHTML = `<div class="chart-tabs">
        ${['populations', 'environment', 'economy'].map(g => `<button class="dtab ${g === this.currentGraph ? 'selected' : ''}" data-graph="${g}">${g[0].toUpperCase() + g.slice(1)}</button>`).join('')}
        </div><canvas id="sciChart" width="420" height="240"></canvas><div class="legend" id="sciLegend"></div>`;
      body.querySelectorAll('[data-graph]').forEach(b => b.addEventListener('click', () => { this.currentGraph = b.dataset.graph; this.renderDrawer('graphs'); }));
      this.drawChart();
    } else if (tab === 'variables') {
      body.innerHTML = this._variablesHtml();
    } else if (tab === 'model') {
      body.innerHTML = this._modelHtml();
    } else if (tab === 'glossary') {
      body.innerHTML = '<dl class="gloss">' + Object.keys(GLOSSARY).sort().map(t => `<dt>${t}</dt><dd>${GLOSSARY[t]}</dd>`).join('') + '</dl>';
    }
  }

  _variablesHtml() {
    const s = this.game.state;
    const vars = [
      ['Biodiversity', s.biodiversity], ['Water quality', s.waterQuality], ['Water availability', s.waterAvailability],
      ['Ecosystem resilience', s.resilience], ['Nutrient level', s.nutrientLevel], ['Algae', s.algae],
      ['Public support', s.publicSupport], ['Employment', s.employment], ['Tourism income', s.tourismIncome],
      ['Food production', s.foodProduction], ['Climate pressure', s.climatePressure], ['Invasive', s.pops.invasive]
    ];
    const pops = SPECIES.map(sp => [sp.label, s.pops[sp.key]]);
    const row = (n, v) => `<div class="var"><div class="vt"><span>${n}</span><b>${Math.round(v)}</b></div>
      <div class="vbar"><i style="width:${Math.max(0, Math.min(100, v))}%;background:${barColor(v)}"></i></div></div>`;
    return `<h4 style="margin-bottom:8px">System</h4><div class="var-grid">${vars.map(v => row(v[0], v[1])).join('')}</div>
      <h4 style="margin:14px 0 8px">Populations</h4><div class="var-grid">${pops.map(v => row(v[0], v[1])).join('')}</div>
      <p style="color:var(--ink-dim);font-size:12px;margin-top:12px">Wetland area: <b>${Math.round(s.wetlandArea)} ha</b> · Budget: <b>${Math.round(s.budget)}</b></p>`;
  }

  _modelHtml() {
    return `<div class="model-doc">
      <p>Populations are abundance indices (0–100). Each grows logistically toward a <b>carrying capacity</b> set by habitat, food and water quality, minus predation and competition.</p>
      <h4>Pollution lag</h4>
      <p><code>fertiliser/farming → nutrients → algae → ↓water quality → fish die-offs</code>. Algae lags nutrients by a couple of years — the classic eutrophication delay.</p>
      <h4>Population step</h4>
      <p><code>N ← N + r·N·(1 − N/K)</code> with r = ${CONSTANTS.GROWTH_RATE}, plus gentle top-down predation.</p>
      <h4>Resilience</h4>
      <p><code>0.40·biodiversity + 0.25·water quality + 0.15·water + 0.10·(100−invasive) + 0.10·corridors</code>. This is what the final drought draws down.</p>
      <h4>Events</h4>
      <p>At most one weighted event per year; probabilities depend on your decisions, so choices dominate over luck.</p>
      <p style="opacity:.75;margin-top:10px">Educational model of plausible ecology — not a prediction of any real wetland.</p>
    </div>`;
  }

  /* ---- Canvas line chart -------------------------------------------------- */
  _series(which) {
    const P = (k) => (h) => h.pops[k];
    return {
      populations: [['Reeds', P('reeds'), '#7ec86a'], ['Small fish', P('smallFish'), '#4fbfd1'], ['Large fish', P('largeFish'), '#3a7d8c'],
        ['Frogs', P('frogs'), '#69c06a'], ['Water birds', P('waterBirds'), '#e0b24e'], ['Birds of prey', P('birdsOfPrey'), '#b58ad6'], ['Invasive', P('invasive'), '#e8735b']],
      environment: [['Biodiversity', h => h.biodiversity, '#62d08a'], ['Water quality', h => h.waterQuality, '#4fbfd1'],
        ['Water avail.', h => h.waterAvailability, '#69b8e0'], ['Resilience', h => h.resilience, '#b58ad6'],
        ['Nutrients', h => h.nutrientLevel, '#e0b24e'], ['Algae', h => h.algae, '#8fbf3a']],
      economy: [['Employment', h => h.employment, '#e0a24e'], ['Tourism', h => h.tourismIncome, '#4fbfd1'],
        ['Food', h => h.foodProduction, '#c2a63d'], ['Support', h => h.publicSupport, '#7ec8e3'], ['Budget', h => h.budget, '#62d08a']]
    }[which];
  }

  drawChart(canvasId = 'sciChart', which = this.currentGraph, hist = this.game.history, legendId = 'sciLegend') {
    const canvas = $(canvasId); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, pl = 32, pr = 8, pt = 10, pb = 20;
    ctx.clearRect(0, 0, W, H);
    const series = this._series(which);
    let yMax = 100;
    if (which === 'economy') yMax = Math.max(100, Math.ceil(Math.max(...hist.map(h => h.budget)) / 50) * 50);
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.fillStyle = 'rgba(200,220,210,.5)'; ctx.font = '10px sans-serif'; ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) { const y = pt + (H - pt - pb) * g / 4; ctx.beginPath(); ctx.moveTo(pl, y); ctx.lineTo(W - pr, y); ctx.stroke(); ctx.fillText(Math.round(yMax - yMax * g / 4), 4, y + 3); }
    const n = hist.length;
    const xAt = i => pl + (W - pl - pr) * (n <= 1 ? 0 : i / (n - 1));
    const yAt = v => pt + (H - pt - pb) * (1 - v / yMax);
    for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 10))) ctx.fillText('Y' + hist[i].year, xAt(i) - 5, H - 6);
    series.forEach(s => {
      ctx.strokeStyle = s[2]; ctx.lineWidth = 2; ctx.beginPath();
      hist.forEach((h, i) => { const x = xAt(i), y = yAt(s[1](h)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    });
    const legend = $(legendId);
    if (legend) legend.innerHTML = series.map(s => `<span><i style="background:${s[2]}"></i>${s[0]}</span>`).join('');
  }

  /* ======================================================================
   * FINAL REPORT
   * ==================================================================== */
  showReport() {
    const g = this.game, rep = g.buildReport(), st = rep.stress, e = rep.end;
    const cond = rep.score >= 55 ? 'var(--good)' : rep.score >= 40 ? 'var(--warn)' : 'var(--bad)';
    const aList = ids => ids && ids.length ? ids.map(id => g.actionName(id)).join(', ') : '—';
    const stat = (v, l) => `<div class="rstat"><div class="b">${v}</div><div class="l">${l}</div></div>`;
    $('reportInner').innerHTML = `
      <h1>The Marisma, twenty years on</h1>
      <div class="report-condition" style="color:${cond}">${rep.condition} — ${rep.score}/100</div>
      <div class="report-grid">
        ${stat(Math.round(e.biodiversity), 'Biodiversity')}${stat(Math.round(e.waterQuality), 'Water quality')}
        ${stat(Math.round(e.resilience), 'Resilience')}${stat(Math.round(e.wetlandArea) + 'ha', 'Wetland area')}
        ${stat(Math.round(e.pops.invasive), 'Invasive')}${stat(Math.round(e.employment), 'Employment')}
      </div>
      <div class="stress ${st.survived ? 'pass' : 'fail'}">
        <b>${st.survived ? 'Survived the final five-year drought.' : 'Did not survive the final five-year drought well.'}</b><br>
        Biodiversity through the drought: ${st.startBio} → ${st.endBio} (retained ${st.retained}%).
        ${st.survived ? 'A diverse, well-managed wetland absorbed the shock.' : 'A wetland optimised for short-term gain proved brittle.'}
      </div>
      <div class="report-section"><h3>Twenty years + drought</h3><canvas id="reportChart" width="780" height="240"></canvas></div>
      <div class="report-section"><h3>Strongest decisions</h3><ul>${
        rep.strongest.length ? rep.strongest.map(y => `<li>Year ${y.year}: ${aList(y.actions)} <em>(+${y.delta})</em></li>`).join('') : '<li>No clearly positive years.</li>'
      }</ul><h3>Weakest decisions</h3><ul>${
        rep.weakest.length ? rep.weakest.map(y => `<li>Year ${y.year}: ${aList(y.actions)} <em>(${y.delta})</em></li>`).join('') : '<li>No strongly damaging years.</li>'
      }</ul></div>
      <div class="report-section"><h3>Unintended consequences</h3><ul>${rep.consequences.map(c => `<li>${c}</li>`).join('')}</ul></div>
      <div class="report-section"><h3>Your predictions vs. what happened</h3>${
        rep.predictionReview.map(p => `<div class="pred-item"><span class="y">Year ${p.year}</span> — ${aList(p.actions)}<br>
          <em>Predicted:</em> ${esc(p.text)}<br><em>Result:</em> biodiversity ${p.bioChange >= 0 ? '+' : ''}${p.bioChange}, water quality ${p.wqChange >= 0 ? '+' : ''}${p.wqChange}.</div>`).join('')
      }</div>
      <div class="report-section"><h3>Reflection</h3><ul>
        <li>Which trade-offs were hardest, and how did evidence justify them?</li>
        <li>Where did a decision help now but hurt later (or the reverse)?</li>
        <li>What made your wetland resilient — or brittle — in the drought?</li>
      </ul></div>
      <div class="report-actions"><button class="primary-btn" id="reportAgain">Play again</button></div>`;
    $('report').classList.remove('hidden');
    $('reportAgain').addEventListener('click', () => this.cb.onRestart());
    this._drawReportChart(g, st);
  }

  _drawReportChart(g, st) {
    const canvas = $('reportChart'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, pl = 30, pr = 10, pt = 10, pb = 22;
    const all = g.history.concat(st.series.slice(1));
    const n = all.length, split = g.history.length - 1;
    ctx.clearRect(0, 0, W, H);
    const series = [['Biodiversity', h => h.biodiversity, '#62d08a'], ['Water quality', h => h.waterQuality, '#4fbfd1'],
      ['Resilience', h => h.resilience, '#b58ad6'], ['Invasive', h => h.pops.invasive, '#e8735b'], ['Small fish', h => h.pops.smallFish, '#e0b24e']];
    ctx.strokeStyle = 'rgba(255,255,255,.08)'; ctx.fillStyle = 'rgba(200,220,210,.5)'; ctx.font = '10px sans-serif';
    for (let g2 = 0; g2 <= 4; g2++) { const y = pt + (H - pt - pb) * g2 / 4; ctx.beginPath(); ctx.moveTo(pl, y); ctx.lineTo(W - pr, y); ctx.stroke(); ctx.fillText(100 - g2 * 25, 6, y + 3); }
    const xAt = i => pl + (W - pl - pr) * (i / (n - 1));
    const yAt = v => pt + (H - pt - pb) * (1 - v / 100);
    ctx.fillStyle = 'rgba(232,115,91,.09)'; ctx.fillRect(xAt(split), pt, W - pr - xAt(split), H - pt - pb);
    ctx.fillStyle = '#e8735b'; ctx.fillText('◀ drought test', xAt(split) + 4, pt + 10);
    series.forEach(s => { ctx.strokeStyle = s[2]; ctx.lineWidth = 2; ctx.beginPath(); all.forEach((h, i) => { const x = xAt(i), y = yAt(s[1](h)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke(); });
    ctx.fillStyle = 'rgba(200,220,210,.5)';
    for (let i = 0; i < n; i += 2) ctx.fillText(all[i].year, xAt(i) - 4, H - 7);
  }

  /* ---- helpers ------------------------------------------------------------ */
  _show(id) { $(id).classList.remove('hidden'); }
  hide(id) { $(id).classList.add('hidden'); }

  buildBriefing() {
    $('briefing').innerHTML = `
      <b>Marisma de Veralba</b> — a Mediterranean wetland inspired by Salburúa and the coast near Vera, Spain.
      You are its new manager. Each year you receive a budget and may take <b>up to three actions</b>.
      Balance nature, jobs, farming and tourism through droughts, floods, fires and invasions —
      then face a final <b>five-year drought</b>. Only a resilient wetland comes through it.`;
  }
}
