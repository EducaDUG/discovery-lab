/* ============================================================================
 * ui/icons.js — Designed inline SVG icons (line style, no emoji / clip-art)
 * ----------------------------------------------------------------------------
 * Minimal stroked glyphs used on the action bar, HUD and panels. Each returns
 * an <svg> string that inherits `currentColor`, so CSS controls the colour.
 * ========================================================================== */
const wrap = (inner, vb = 24) =>
  `<svg viewBox="0 0 ${vb} ${vb}" fill="none" stroke="currentColor" stroke-width="1.6"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

export const ACTION_ICONS = {
  // conservation
  restore: wrap('<path d="M12 21c0-5 3-8 8-9-1 5-4 8-8 9Z"/><path d="M12 21c0-5-3-8-8-9 1 5 4 8 8 9Z"/><path d="M12 21V10"/>'),
  reduceFert: wrap('<path d="M4 20h16"/><path d="M8 20V9l4-4 4 4v11"/><path d="M6 12l12 6" stroke-dasharray="1 2"/>'),
  corridors: wrap('<path d="M3 12h18"/><path d="M7 12a3 3 0 0 1 3-3M17 12a3 3 0 0 0-3-3"/><circle cx="5" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><path d="M10 9V6M14 9V6"/>'),
  removeInvasive: wrap('<path d="M6 7l12 12M18 7 6 19"/><circle cx="12" cy="12" r="9"/>'),
  fishingLimits: wrap('<path d="M3 12c3-4 7-4 10 0-3 4-7 4-10 0Z"/><path d="M13 12c2 0 5-2 8-5-1 6-3 9-8 9"/><circle cx="6.5" cy="12" r=".6" fill="currentColor"/>'),
  wastewater: wrap('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/><path d="M9 14a3 3 0 0 0 3 3"/>'),
  restrictWater: wrap('<path d="M12 3s5 6 5 10a5 5 0 0 1-10 0c0-4 5-10 5-10Z"/><path d="M5 5l14 14"/>'),
  // development
  housing: wrap('<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-6h4v6"/>'),
  tourism: wrap('<path d="M4 20h16"/><path d="M6 20V9h9l3 3-3 3H6"/><path d="M6 12h6"/>'),
  farming: wrap('<path d="M3 20h18"/><path d="M5 20v-6M9 20v-6M13 20v-6M17 20v-6"/><path d="M4 12c2-3 5-3 7 0M13 12c2-3 5-3 7 0"/>'),
  // social / neutral
  education: wrap('<path d="M3 8l9-4 9 4-9 4-9-4Z"/><path d="M7 10v5c0 1 2 3 5 3s5-2 5-3v-5"/><path d="M21 8v5"/>'),
  nothing: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')
};

export const HUD_ICONS = {
  year: wrap('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/>'),
  budget: wrap('<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10a2.5 2 0 0 1 5 0c0 2-5 1-5 3a2.5 2 0 0 0 5 0"/>'),
  health: wrap('<path d="M12 21C7 17 3 13 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 13 17 17 12 21Z"/>'),
  water: wrap('<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11Z"/>'),
  biodiversity: wrap('<path d="M12 20v-8"/><path d="M12 12c-1-4-4-5-7-5 0 4 3 6 7 6Z"/><path d="M12 12c1-3 4-4 7-4 0 3-3 5-7 5Z"/>'),
  support: wrap('<path d="M20 8.5a3.5 3.5 0 0 0-6-2.5 3.5 3.5 0 0 0-6 2.5c0 3.5 6 7.5 6 7.5s6-4 6-7.5Z"/><path d="M2 20c1.5-3 5-3 6.5 0" />')
};

export const UI_ICONS = {
  mute: wrap('<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 9l4 6M20 9l-4 6"/>'),
  sound: wrap('<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 8a5 5 0 0 1 0 8M18.5 6a8 8 0 0 1 0 12"/>'),
  data: wrap('<path d="M4 20V10M9 20V4M14 20v-8M19 20V7"/>'),
  close: wrap('<path d="M6 6l12 12M18 6 6 18"/>'),
  menu: wrap('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  pause: wrap('<path d="M8 5v14M16 5v14"/>'),
  play: wrap('<path d="M7 5l12 7-12 7V5Z"/>')
};
