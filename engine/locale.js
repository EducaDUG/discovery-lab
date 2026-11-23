/* Discovery Lab: where-the-student-is awareness (units + hemisphere).
   Privacy: nothing is sent anywhere. The region is guessed from the device's IANA time zone
   (Intl.DateTimeFormat().resolvedOptions().timeZone), exactly like engine/weather.js does.
   The student can always override it in the accessibility panel (stored per device, dl-units / dl-hemi).
   Rules for activities: store and compute in SI/metric; convert ONLY when displaying, via fmt*().
   Never hardcode "°C", "km", "kg", "June = summer" in activity text a student reads. */

const US_ZONES = /^(America\/(New_York|Detroit|Chicago|Denver|Phoenix|Los_Angeles|Anchorage|Boise|Juneau|Nome|Sitka|Yakutat|Adak|Menominee|Metlakatla|North_Dakota\/.*|Indiana\/.*|Kentucky\/.*|Puerto_Rico)|Pacific\/(Honolulu|Guam|Saipan|Pago_Pago)|US\/.*)$/;

/* Zones that sit (mostly) south of the equator. Equatorial zones default to north (no strong seasons anyway). */
const SOUTH_ZONES = /^(Australia\/.*|Antarctica\/.*|Pacific\/(Auckland|Fiji|Tongatapu|Apia|Noumea|Port_Moresby|Tahiti|Chatham|Norfolk|Pago_Pago)|Africa\/(Johannesburg|Maputo|Harare|Lusaka|Windhoek|Gaborone|Maseru|Mbabane|Luanda|Lubumbashi|Blantyre)|America\/(Sao_Paulo|Santiago|Argentina\/.*|Buenos_Aires|Montevideo|Asuncion|La_Paz|Lima|Cuiaba|Campo_Grande|Bahia|Fortaleza|Recife|Manaus|Punta_Arenas)|Indian\/(Mauritius|Reunion|Antananarivo|Comoro|Mayotte)|Asia\/Jakarta|Atlantic\/(Stanley|South_Georgia))$/;

function get(key) { try { return localStorage.getItem(key) || "auto"; } catch { return "auto"; } }
function set(key, v) { try { localStorage.setItem(key, v); } catch { /* private mode */ } }
function zone() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; } }

export function unitSystem() {
  const o = get("dl-units");
  if (o === "metric" || o === "us") return o;
  return US_ZONES.test(zone()) ? "us" : "metric";
}
export function hemisphere() {
  const o = get("dl-hemi");
  if (o === "north" || o === "south") return o;
  return SOUTH_ZONES.test(zone()) ? "south" : "north";
}
export function setUnits(v) { set("dl-units", v); document.documentElement.setAttribute("data-units", unitSystem()); }
export function setHemisphere(v) { set("dl-hemi", v); document.documentElement.setAttribute("data-hemisphere", hemisphere()); }
export function overrides() { return { units: get("dl-units"), hemi: get("dl-hemi") }; }

const isUS = () => unitSystem() === "us";
const r = (n, d = 1) => { const p = 10 ** d; return Math.round(n * p) / p; };
const trim = n => String(r(n, 1));

/* ---- display formatters: input is ALWAYS metric/SI. Return a string with unit. ---- */
export const fmtTemp = c => isUS() ? `${trim(c * 9 / 5 + 32)} °F` : `${trim(c)} °C`;
export const fmtTempDelta = c => isUS() ? `${trim(c * 9 / 5)} °F` : `${trim(c)} °C`;
export const fmtLengthM = m => isUS()
  ? (Math.abs(m) >= 1609.344 ? `${trim(m / 1609.344)} mi` : Math.abs(m) >= 0.9144 ? `${trim(m / 0.3048)} ft` : `${trim(m / 0.0254)} in`)
  : (Math.abs(m) >= 1000 ? `${trim(m / 1000)} km` : Math.abs(m) >= 1 ? `${trim(m)} m` : Math.abs(m) >= 0.01 ? `${trim(m * 100)} cm` : `${trim(m * 1000)} mm`);
export const fmtLengthCm = cm => isUS() ? `${trim(cm / 2.54)} in` : `${trim(cm)} cm`;
export const fmtDistanceKm = km => isUS() ? `${trim(km / 1.609344)} mi` : `${trim(km)} km`;
export const fmtMassKg = kg => isUS()
  ? (Math.abs(kg) >= 0.45 ? `${trim(kg * 2.20462)} lb` : `${trim(kg * 35.274)} oz`)
  : (Math.abs(kg) >= 1 ? `${trim(kg)} kg` : `${trim(kg * 1000)} g`);
export const fmtMassG = g => fmtMassKg(g / 1000);
export const fmtVolumeL = l => isUS()
  ? (Math.abs(l) >= 3.785 ? `${trim(l / 3.78541)} gal` : `${trim(l * 33.814)} fl oz`)
  : (Math.abs(l) >= 1 ? `${trim(l)} L` : `${trim(l * 1000)} mL`);
export const fmtSpeedKmh = kmh => isUS() ? `${trim(kmh / 1.609344)} mph` : `${trim(kmh)} km/h`;
export const fmtAreaM2 = m2 => isUS() ? `${trim(m2 * 10.7639)} ft²` : `${trim(m2)} m²`;
export const fmtPressureKPa = k => isUS() ? `${trim(k * 0.145038)} psi` : `${trim(k)} kPa`;
/* Units that stay SI everywhere in science (N, J, W, mol, s, V, A) are deliberately NOT converted. */

/* ---- hemisphere-aware calendar helpers ---- */
const SEASONS = { en: ["winter", "spring", "summer", "autumn"], es: ["invierno", "primavera", "verano", "otoño"] };
/* Meteorological season for a 0-based month in the student's hemisphere. */
export function seasonOfMonth(month, lang = "en") {
  const north = [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0][month % 12];
  const idx = hemisphere() === "south" ? (north + 2) % 4 : north;
  return SEASONS[lang === "es" ? "es" : "en"][idx];
}
/* The month names a student's "summer"/"winter" fall in: ["Dec","Jan","Feb"] in the south. */
export function seasonMonths(season) {
  const northM = { winter: [11, 0, 1], spring: [2, 3, 4], summer: [5, 6, 7], autumn: [8, 9, 10] }[season];
  return hemisphere() === "south" ? northM.map(m => (m + 6) % 12) : northM;
}
/* Which solstice is "summer" for this student: northern → June, southern → December. */
export const summerSolsticeMonth = () => hemisphere() === "south" ? 11 : 5;
export const winterSolsticeMonth = () => hemisphere() === "south" ? 5 : 11;
/* Sun's path: at local noon the Sun is in the south of the sky in the north, in the north of the sky in the south. */
export const noonSunDirection = () => hemisphere() === "south" ? "north" : "south";

/* Self-wire: expose the choice as attributes so CSS/other scripts can react. */
document.documentElement.setAttribute("data-units", unitSystem());
document.documentElement.setAttribute("data-hemisphere", hemisphere());

export default { autoConvert, unitSystem, hemisphere, setUnits, setHemisphere, overrides, fmtTemp, fmtTempDelta, fmtLengthM, fmtLengthCm,
  fmtDistanceKm, fmtMassKg, fmtMassG, fmtVolumeL, fmtSpeedKmh, fmtAreaM2, fmtPressureKPa, seasonOfMonth, seasonMonths,
  summerSolsticeMonth, winterSolsticeMonth, noonSunDirection };

/* ---------- Automatic display conversion for US students (opt-in per activity) ----------
   An activity opts in with <html data-unit-convert>. For a US student, metric quantities in the page text
   ("20 °C", "5 km", "2 kg", "3 L", "10 m²", ranges like "18 and 26 °C") are shown as "68 °F (20 °C)":
   the US value first, the original metric value kept in brackets so answers, marking and the curriculum
   still line up. Skipped: changes/differences ("rises by 6 °C"), text already converted, inputs, scripts,
   canvases, and anything inside [data-unit-lock]. Canvas/WebGL text is not touched; use fmt*() there. */
const NUM = String.raw`[-\u2212]?(?:\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)`;
const UNIT = String.raw`(?:\u00b0C|km/h|km|kg|cm|mL|L|m\u00b2|m2|m)`;
const SEP = String.raw`\s?(?:-|\u2013|to|and|y|a)\s?`;
const RE = new RegExp(String.raw`(${NUM})((?:${SEP}${NUM})?)\s?(${UNIT})(?![\p{L}\d\u00b2\u00b3/])`, "gu");
const SKIP_BEFORE = /(\bby|\bper|\bevery|\beach|\banother|\bextra|\b(?:rise|rises|fall|falls|drop|drops|change|difference|increase|decrease|gain|loss)(?: of| in)?|\bmás de|\bcada|\bpor|\bde)\s*$/i;

function parseNum(s) {
  let x = s.replace("−", "-");
  const m = x.match(/^(-?\d{1,3})([.,])(\d{3})$/);
  if (m && m[1].replace("-", "") !== "0") return parseFloat(m[1] + m[3]);       // 1.000 / 1,000 = thousand
  if (/^-?\d{1,3}(?:[.,]\d{3})+$/.test(x)) return parseFloat(x.replace(/[.,]/g, ""));
  return parseFloat(x.replace(",", "."));
}
function show(n, es) {
  const a = Math.abs(n), d = a >= 100 ? 0 : a >= 10 ? 1 : 2;
  const v = Math.round(n * 10 ** d) / 10 ** d;
  return v.toLocaleString(es ? "es-ES" : "en-US", { maximumFractionDigits: d, useGrouping: Math.abs(v) >= 10000 });
}
const CONV = {
  "°C": [c => c * 9 / 5 + 32, "°F"], "km": [v => v / 1.609344, "mi"], "km/h": [v => v / 1.609344, "mph"],
  "kg": [v => v * 2.20462, "lb"], "cm": [v => v / 2.54, "in"], "m": [v => v * 3.28084, "ft"],
  "m²": [v => v * 10.7639, "ft²"], "m2": [v => v * 10.7639, "ft²"],
  "L": [v => v / 3.78541, "gal"], "mL": [v => v / 29.5735, "fl oz"],
};
function convertText(str, es) {
  if (!/\d/.test(str)) return str;
  return str.replace(RE, (whole, n1, rest, unit, off) => {
    const before = str.slice(Math.max(0, off - 22), off);
    if (/\($/.test(before) || SKIP_BEFORE.test(before)) return whole;
    let [f, us] = CONV[unit];
    if (unit === "L") { const v = parseNum(n1); if (v < 3.785) { f = x => x * 33.814; us = "fl oz"; } }
    const first = show(f(parseNum(n1)), es);
    let out = first;
    if (rest) {
      const sm = rest.match(new RegExp(String.raw`^(${SEP})(${NUM})$`));
      out += sm[1] + show(f(parseNum(sm[2])), es);
    }
    return `${out} ${us} (${whole.trim()})`;
  });
}
export function autoConvert(root) {
  const es = (document.documentElement.lang || (() => { try { return localStorage.getItem("dl-lang"); } catch { return ""; } })() || "en").slice(0, 2) === "es";
  const bad = ["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "CANVAS", "NOSCRIPT", "OPTION"];
  const walk = node => {
    if (node.nodeType === 3) {
      const p = node.parentElement;
      if (!p || p.closest("script,style,textarea,input,canvas,noscript,option,[data-unit-lock]")) return;
      const nv = convertText(node.nodeValue, es);
      if (nv !== node.nodeValue) node.nodeValue = nv;
    } else if (node.nodeType === 1 && !bad.includes(node.tagName)) node.childNodes.forEach(walk);
  };
  walk(root || document.body);
}
if (isUS() && document.documentElement.hasAttribute("data-unit-convert")) {
  const start = () => {
    autoConvert(document.body);
    let queued = false; const pending = new Set();
    new MutationObserver(recs => {
      recs.forEach(r => { if (r.type === "characterData") pending.add(r.target); else r.addedNodes.forEach(n => pending.add(n)); });
      if (queued) return; queued = true;
      queueMicrotask(() => { queued = false; const items = [...pending]; pending.clear(); items.forEach(n => n.isConnected && autoConvert(n)); });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
}
