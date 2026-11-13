/* Solar System Command - pure science model (no DOM, no Three). Simplified, teaching-scale, but real relationships. */
export const V_EARTH = 29.78; // km/s, Earth's mean orbital speed at 1 AU

/* Kepler: eccentric anomaly from mean anomaly (Newton iteration) */
export function solveKepler(M, e) {
  M = ((M % 6.283185) + 6.283185) % 6.283185;
  let E = e < 0.8 ? M : Math.PI;
  for (let i = 0; i < 12; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}
/* Orbit with semi-major axis a = 1 AU. Returns position (focus at origin), distance r (AU), speed v (km/s). */
export function orbitAt(M, e) {
  const E = solveKepler(M, e), a = 1, b = Math.sqrt(1 - e * e);
  const x = a * (Math.cos(E) - e), z = b * Math.sin(E), r = a * (1 - e * Math.cos(E));
  return { x, z, r, v: speedAt(r) };
}
export const speedAt = r => V_EARTH * Math.sqrt(Math.max(0.0001, 2 / r - 1)); // vis-viva, a = 1 AU
export const perihelion = e => 1 - e;
export const aphelion = e => 1 + e;

/* Eclipse geometry in a teaching-scale model: Earth radius RE, Moon orbit radius R, Sun far along +x. */
export const EC = { RE: 0.7, R: 4, RM: 0.22, PEN_SOL: 0.75, RU_MOON: 0.5, RP_MOON: 0.95, H: 1.2 };
export function eclipseState(thetaDeg, tiltOn, season, moonNear) {
  const th = thetaDeg * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
  const y = tiltOn ? EC.H * season * c : 0;
  const z = EC.R * s;
  const d = Math.hypot(y, z);
  let type = "none";
  if (c > 0) {
    if (d < EC.RE) type = moonNear ? "solar-total" : "solar-annular";
    else if (d < EC.RE + EC.PEN_SOL) type = "solar-partial";
  } else {
    if (d <= EC.RU_MOON - EC.RM) type = "lunar-total";
    else if (d < EC.RU_MOON + EC.RM) type = "lunar-partial";
    else if (d < EC.RP_MOON + EC.RM) type = "lunar-penumbral";
  }
  return { type, d, y, z, x: EC.R * c };
}
export const ECLIPSE_LABEL = {
  "solar-total": ["Total solar eclipse", "Eclipse solar total"],
  "solar-annular": ["Annular solar eclipse", "Eclipse solar anular"],
  "solar-partial": ["Partial solar eclipse", "Eclipse solar parcial"],
  "lunar-total": ["Total lunar eclipse", "Eclipse lunar total"],
  "lunar-partial": ["Partial lunar eclipse", "Eclipse lunar parcial"],
  "lunar-penumbral": ["Penumbral lunar eclipse", "Eclipse lunar penumbral"],
  none: ["No eclipse", "Sin eclipse"]
};

/* The Sun's six layers. r0..r1 = fraction of the Sun's radius; temp in degrees C (rounded, order-of-magnitude). */
export const SUN_LAYERS = [
  { id: "core", r0: 0, r1: 0.25, color: 0xfff2c4, temp: 15000000, en: "Core", es: "Núcleo",
    fEn: "Hydrogen is fused into helium here, releasing the Sun's energy.", fEs: "Aquí el hidrógeno se fusiona en helio y libera la energía del Sol.",
    clueEn: "Find the layer where hydrogen nuclei fuse into helium.", clueEs: "Encuentra la capa donde los núcleos de hidrógeno se fusionan en helio." },
  { id: "radiative", r0: 0.25, r1: 0.70, color: 0xffc766, temp: 4000000, en: "Radiative zone", es: "Zona radiativa",
    fEn: "Energy crawls outward as radiation; a photon can take thousands of years to get through.", fEs: "La energía avanza como radiación; un fotón puede tardar miles de años en atravesarla.",
    clueEn: "Find the thick layer where energy moves outward as radiation, very slowly.", clueEs: "Encuentra la gruesa capa donde la energía avanza como radiación, muy despacio." },
  { id: "convective", r0: 0.70, r1: 0.985, color: 0xff8a2a, temp: 1500000, en: "Convective zone", es: "Zona convectiva",
    fEn: "Hot plasma rises, cools and sinks again in giant churning loops.", fEs: "El plasma caliente sube, se enfría y vuelve a bajar en enormes bucles.",
    clueEn: "Find the layer where hot plasma rises and cool plasma sinks in loops (convection).", clueEs: "Encuentra la capa donde el plasma caliente sube y el frío baja en bucles (convección)." },
  { id: "photosphere", r0: 0.985, r1: 1.0, color: 0xff6a1a, temp: 5500, en: "Photosphere", es: "Fotosfera",
    fEn: "The visible 'surface' that gives off the sunlight we see. Sunspots form here.", fEs: "La 'superficie' visible que emite la luz solar que vemos. Aquí se forman las manchas solares.",
    clueEn: "Find the visible 'surface' that gives off the light we see (sunspots live here).", clueEs: "Encuentra la 'superficie' visible que emite la luz que vemos (aquí viven las manchas solares)." },
  { id: "chromosphere", r0: 1.0, r1: 1.07, color: 0xff3b5c, temp: 10000, en: "Chromosphere", es: "Cromosfera",
    fEn: "A thin, reddish layer above the surface where prominences and spicules rise.", fEs: "Una capa fina y rojiza sobre la superficie donde se elevan las prominencias y espículas.",
    clueEn: "Find the thin, red-pink layer just above the visible surface.", clueEs: "Encuentra la capa fina rosada-rojiza justo encima de la superficie visible." },
  { id: "corona", r0: 1.07, r1: 2.2, color: 0xcfe0ff, temp: 2000000, en: "Corona", es: "Corona",
    fEn: "The outermost atmosphere — strangely hotter than the surface. It streams away as the solar wind.", fEs: "La atmósfera más externa — extrañamente más caliente que la superficie. Se escapa como viento solar.",
    clueEn: "Find the outermost layer — millions of degrees, the source of the solar wind.", clueEs: "Encuentra la capa más externa — millones de grados, origen del viento solar." }
];
export function layerAtRadius(rho) { // rho = fraction of solar radius
  for (const L of SUN_LAYERS) if (rho >= L.r0 && rho < L.r1) return L;
  return rho < 0 ? SUN_LAYERS[0] : SUN_LAYERS[SUN_LAYERS.length - 1];
}

/* Planets for the formation scene and the bonus round (stylised radii, real order and character). */
export const PLANETS = [
  { id: "mercury", en: "Mercury", es: "Mercurio", type: "terrestrial", a: 3.0, size: 0.16, per: 4.0, col: [150, 140, 130], col2: [80, 75, 70] },
  { id: "venus", en: "Venus", es: "Venus", type: "terrestrial", a: 4.2, size: 0.28, per: 6.5, col: [230, 195, 120], col2: [170, 120, 60] },
  { id: "earth", en: "Earth", es: "Tierra", type: "terrestrial", a: 5.6, size: 0.30, per: 9, col: [40, 92, 150], col2: [30, 120, 50] },
  { id: "mars", en: "Mars", es: "Marte", type: "terrestrial", a: 7.0, size: 0.22, per: 13, col: [200, 100, 60], col2: [120, 55, 35] },
  { id: "jupiter", en: "Jupiter", es: "Júpiter", type: "gas", a: 10.2, size: 0.85, per: 24, col: [215, 180, 140], col2: [150, 105, 75] },
  { id: "saturn", en: "Saturn", es: "Saturno", type: "gas", a: 13.2, size: 0.72, per: 36, col: [225, 205, 150], col2: [170, 150, 100] },
  { id: "uranus", en: "Uranus", es: "Urano", type: "gas", a: 16.0, size: 0.46, per: 50, col: [160, 225, 230], col2: [110, 190, 200] },
  { id: "neptune", en: "Neptune", es: "Neptuno", type: "gas", a: 18.6, size: 0.45, per: 66, col: [60, 100, 220], col2: [40, 70, 170] }
];
