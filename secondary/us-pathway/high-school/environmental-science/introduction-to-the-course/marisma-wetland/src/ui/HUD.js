/* ============================================================================
 * ui/HUD.js — Compact translucent top HUD + feedback toasts
 * ----------------------------------------------------------------------------
 * Shows only the six headline numbers the brief asks for. Values animate (count
 * up/down + flash) when they change; everything else lives in Scientist View.
 * ========================================================================== */
import { HUD_ICONS } from './icons.js';
import { CONSTANTS } from '../engine/gameState.js';

const STATS = [
  { key: 'year',    label: 'Year',           icon: HUD_ICONS.year,        max: CONSTANTS.TOTAL_YEARS, kind: 'year' },
  { key: 'budget',  label: 'Budget',         icon: HUD_ICONS.budget,      kind: 'money' },
  { key: 'health',  label: 'Ecosystem',      icon: HUD_ICONS.health,      max: 100, kind: 'pct' },
  { key: 'water',   label: 'Water level',    icon: HUD_ICONS.water,       max: 100, kind: 'pct' },
  { key: 'bio',     label: 'Biodiversity',   icon: HUD_ICONS.biodiversity,max: 100, kind: 'pct' },
  { key: 'support', label: 'Public support', icon: HUD_ICONS.support,     max: 100, kind: 'pct' }
];

function healthScore(s) { return Math.round(0.5 * s.biodiversity + 0.3 * s.resilience + 0.2 * s.waterQuality); }
function barColor(v) { return v >= 60 ? 'var(--good)' : v >= 35 ? 'var(--warn)' : 'var(--bad)'; }

export class HUD {
  constructor(root, feedbackEl) {
    this.root = root; this.feedback = feedbackEl;
    this.prev = {};
    root.innerHTML = STATS.map(st => `
      <div class="hud-stat" data-key="${st.key}">
        <span class="hud-ic">${st.icon}</span>
        <span class="hud-meta">
          <span class="hud-label">${st.label}</span>
          <span class="hud-value" data-v="${st.key}">–</span>
        </span>
        ${st.max === 100 ? `<span class="mini-bar"><i data-bar="${st.key}"></i></span>` : ''}
      </div>`).join('');
  }

  values(state) {
    return {
      year: state.year + ' / ' + CONSTANTS.TOTAL_YEARS,
      budget: Math.round(state.budget),
      health: healthScore(state),
      water: Math.round(state.waterAvailability),
      bio: Math.round(state.biodiversity),
      support: Math.round(state.publicSupport)
    };
  }

  update(state, animate = true) {
    const v = this.values(state);
    STATS.forEach(st => {
      const el = this.root.querySelector(`[data-v="${st.key}"]`);
      const raw = v[st.key];
      const num = typeof raw === 'number' ? raw : parseFloat(raw);
      const prev = this.prev[st.key];
      el.textContent = raw;
      if (animate && prev != null && st.kind !== 'year') {
        const p = typeof prev === 'number' ? prev : parseFloat(prev);
        if (num > p + 0.5) { el.classList.remove('down'); el.classList.add('up', 'flash'); }
        else if (num < p - 0.5) { el.classList.remove('up'); el.classList.add('down', 'flash'); }
        setTimeout(() => el.classList.remove('flash', 'up', 'down'), 700);
      }
      const bar = this.root.querySelector(`[data-bar="${st.key}"]`);
      if (bar && st.max === 100) { bar.style.width = Math.max(0, Math.min(100, num)) + '%'; bar.style.background = barColor(num); }
      this.prev[st.key] = raw;
    });
  }

  toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind; t.textContent = msg;
    this.feedback.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }
}
