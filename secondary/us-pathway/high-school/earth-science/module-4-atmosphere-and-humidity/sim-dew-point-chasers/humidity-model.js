/* ==========================================================================
   Dew Point Chasers — humidity model (pure maths, no DOM).

   The sealed jar: a fixed volume of air with a fixed total amount of water in
   it, W (grams of water per cubic metre). Warm air can hold more water vapour
   than cold air, so what matters is the jar's CAPACITY at its current
   temperature (the same "grams per cubic metre" table students use in class):

     capacity(T)   grams of vapour 1 m3 of air can hold at temperature T
     vapour        min(W, capacity)            - what is actually dissolved in the air
     liquid        W - vapour                  - the excess has to condense (dew / mist / fog)
     RH            vapour / capacity x 100     - relative humidity
     dew point     the temperature where capacity(Td) = vapour
     specific hum. vapour per kg of air (g/kg) - a sealed jar keeps its air mass, so this
                   only changes when water is added or condenses out

   Capacity uses the Magnus approximation to saturation vapour pressure, which
   reproduces the standard school table to within 0.1 g/m3. Deliberately a
   simplified model: pressure changes inside a rigid jar are ignored.
   ========================================================================== */

export const AIR_KG_PER_M3 = 1.2;      // dry-air density used for specific humidity (g/kg)
export const W_MIN = 1, W_MAX = 55;    // grams of water per m3 the jar can be set to
export const T_MIN = 0, T_MAX = 40;

const es = T => 6.112 * Math.exp(17.62 * T / (243.12 + T));        // hPa (Magnus)
export const capacity = T => 216.7 * es(T) / (T + 273.15);          // g/m3

/* inverse of capacity(): the temperature at which `a` g/m3 saturates the air */
export function dewPointOf(a) {
  let lo = -60, hi = 70;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (capacity(mid) < a) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}

/* Everything the HUD, chart, log and 3D scene need, from just T and W. */
export function jarState(T, W) {
  const cap = capacity(T);
  const vapour = Math.min(W, cap);
  const liquid = Math.max(0, W - cap);
  const rh = 100 * vapour / cap;
  const dew = liquid > 0.0001 ? T : Math.min(T, dewPointOf(vapour));
  return {
    T, W, cap, vapour, liquid, rh, dew,
    spec: vapour / AIR_KG_PER_M3,
    saturated: liquid > 0.0001 || rh >= 99.5
  };
}

/* The printed saturation table the student calculates from (rounded to 0.1,
   exactly as a textbook would print it). */
export function capacityTable() {
  const rows = [];
  for (let T = T_MIN; T <= T_MAX; T++) rows.push({ T, g: Math.round(capacity(T) * 10) / 10 });
  return rows;
}
export const tableValue = T => Math.round(capacity(Math.round(T)) * 10) / 10;

/* What a student gets by following the textbook method on printed table values. */
export function rhFromTable(T, Td) { return 100 * tableValue(Td) / tableValue(T); }

/* Heat-index style "feel" bands keyed on DEW POINT (what the slide calls sticky above ~18 C). */
export function feelOf(dew) {
  if (dew >= 21) return "oppressive";
  if (dew >= 18) return "sticky";
  if (dew >= 13) return "comfortable";
  if (dew >= 8)  return "crisp";
  return "dry";
}
