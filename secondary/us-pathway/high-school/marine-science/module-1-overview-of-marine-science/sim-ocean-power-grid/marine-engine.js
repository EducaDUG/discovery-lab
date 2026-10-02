/* ==========================================================================
   OCEANCURRENTS — SIMULATION ENGINE (pure functions, no DOM)
   Direct port of simulationEngine.ts. Constants and formulas are unchanged:
   - Wind: cut-in 3.5 kts, rated 24 kts, cut-out 52 kts, power ~ (v-vin)/(vr-vin)^2.5
   - Wave energy flux P = 0.49 * Hs^2 * Te  (kW per metre of crest), reference 2 m / 7.5 s
   - Tidal: |sin| over a 12.42 h cycle, spring/neap multiplier, kts
   - OTEC: delta-T of warm surface vs 4.2 C deep water against a 22 C reference
   - Grid: 30-minute ticks, storage with 88% round trip, blackout when > 15% unmet
   - Economics: tariff x kWh delivered, daily opex / 48 per tick, approval model
   Source inconsistencies fixed (all found by bot-testing the three missions): solar now follows
   daylight; the Cloudy preset removes solar from the grid itself (not just the display); the
   land-spared metric is rescaled so Mission 3's 350-acre target is reachable; Mission 1's starting
   funds are $550k (the source's $350k could not reach zero blackouts by any build).
   ========================================================================== */
import { MARINE_TECHNOLOGIES, techOf } from "./marine-data.js?v=3";

export const SIMULATION_TICK_HOURS = 0.5;
export const KTS_TO_MS = 0.514444;

export function calculateOceanEnvironment(day, hour, stormActive) {
  const totalHours = day * 24 + hour, tidalPeriod = 12.42;
  const tideCycleProgress = (totalHours % tidalPeriod) / tidalPeriod;
  const springNeapCycle = (day % 14) / 14;
  const isSpringTide = springNeapCycle < 0.25 || (springNeapCycle > 0.5 && springNeapCycle < 0.75);
  const tideType = isSpringTide ? "spring" : (springNeapCycle > 0.35 && springNeapCycle < 0.45 ? "neap" : "normal");
  const springMultiplier = isSpringTide ? 1.45 : (tideType === "neap" ? 0.65 : 1.0);
  const tideAngle = tideCycleProgress * Math.PI * 2, sinTide = Math.sin(tideAngle), cosTide = Math.cos(tideAngle);
  let tideStage = "flood_flow";
  if (cosTide > 0.7) tideStage = "high_stand"; else if (sinTide < -0.3) tideStage = "ebb_flow"; else if (cosTide < -0.7) tideStage = "low_stand";
  const tidalCurrentSpeedKts = Math.max(0.2, Number((Math.abs(Math.sin(tideAngle)) * 4.2 * springMultiplier).toFixed(1)));
  const afternoonBreeze = Math.sin(((hour - 8) / 24) * Math.PI * 2) * 4;
  let baseWind = 14 + afternoonBreeze;
  if (stormActive) baseWind = 32 + Math.sin(totalHours * 0.3) * 10;
  const windSpeedKts = Math.max(1.5, Number(baseWind.toFixed(1)));
  let sig = 1.2 + (windSpeedKts / 20) * 1.8;
  if (stormActive) sig = 4.2 + Math.sin(totalHours * 0.2) * 1.2;
  const significantWaveHeightM = Number(sig.toFixed(2));
  const wavePeriodSec = Number((5.5 + Math.sqrt(significantWaveHeightM) * 3.2).toFixed(1));
  const waveEnergyFluxKWM = Number((0.49 * significantWaveHeightM ** 2 * wavePeriodSec).toFixed(1));
  const surfaceWaterTempC = Number((25.5 + Math.sin((totalHours / 24) * Math.PI * 2) * 1.2).toFixed(1));
  let weatherCondition = "breeze";
  if (stormActive) weatherCondition = "storm"; else if (windSpeedKts > 22) weatherCondition = "gale"; else if (windSpeedKts < 5) weatherCondition = "doldrums";
  return { windSpeedKts, windDirectionDeg: 280, gustFactor: stormActive ? 1.4 : 1.15, significantWaveHeightM, wavePeriodSec, waveEnergyFluxKWM,
    tidalCurrentSpeedKts, tideStage, tideType, tideCycleProgress, surfaceWaterTempC, deepWaterTempC: 4.2, weatherCondition, stormWarning: !!stormActive,
    hourOfDay: hour % 24, cloudy: false };
}

/* "Test Weather" presets — same overrides as the source, plus a Storm switch (the source's engine already
   supported stormActive but no control triggered it). */
export function applyPreset(env, preset) {
  if (preset === "cloudy") return { ...env, weatherCondition: "doldrums", cloudy: true };
  if (preset === "big_waves") return { ...env, significantWaveHeightM: 3.8, wavePeriodSec: 9.0, waveEnergyFluxKWM: 65.0, weatherCondition: "storm" };
  if (preset === "calm_wind") return { ...env, windSpeedKts: 1.5, weatherCondition: "doldrums" };
  if (preset === "spring_tide") return { ...env, tidalCurrentSpeedKts: 4.8, tideType: "spring", tideStage: "flood_flow" };
  return env;
}

export function calculateCityDemand(population, hour) {
  const totalBaseKW = population * 0.35, h = hour % 24;
  let m = 0.88;
  if (h >= 1 && h < 6) m = 0.68; else if (h >= 6 && h < 9) m = 1.15; else if (h >= 9 && h < 17) m = 1.05; else if (h >= 17 && h < 22) m = 1.38;
  return Math.round(totalBaseKW * m);
}

export function solarFactor(hour) { const x = (hour - 6) / 12; return x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x); }

export function calculateDeviceOutput(device, env) {
  if (!device.active || device.integrity <= 0) return 0;
  const tech = techOf(device.techId); if (!tech) return 0;
  const conditionMultiplier = Math.max(0.1, (device.integrity / 100) * (1 - (device.biofouling / 100) * 0.30));
  let kw = 0;
  switch (tech.category) {
    case "wind": {
      const w = env.windSpeedKts;
      if (w < 3.5 || w > 52) kw = 0; else if (w >= 24) kw = tech.ratedPowerKW; else kw = tech.ratedPowerKW * Math.pow((w - 3.5) / (24 - 3.5), 2.5);
      break;
    }
    case "wave": {
      const ref = 0.49 * 2.0 ** 2 * 7.5, ratio = env.waveEnergyFluxKWM / ref;
      kw = tech.ratedPowerKW * Math.min(1.2, Math.max(0.1, Math.pow(ratio, 0.85)));
      break;
    }
    case "tidal": {
      const c = env.tidalCurrentSpeedKts;
      if (device.techId === "tidal_kite") { if (c < 0.3) kw = tech.ratedPowerKW * 0.05; else if (c >= 3.0) kw = tech.ratedPowerKW; else kw = tech.ratedPowerKW * Math.pow(c / 3.0, 2.2); }
      else { if (c < 0.6) kw = tech.ratedPowerKW * 0.05; else if (c >= 4.2) kw = tech.ratedPowerKW; else kw = tech.ratedPowerKW * Math.pow(c / 4.2, 2.7); }
      break;
    }
    case "solar": kw = env.cloudy ? 0 : tech.ratedPowerKW * 0.85 * solarFactor(env.hourOfDay); break;   // daylight bell; 0 when overcast
    case "baseload": {
      if (device.techId === "salinity_gradient") kw = tech.ratedPowerKW * 0.95;
      else { const dT = env.surfaceWaterTempC - env.deepWaterTempC; kw = tech.ratedPowerKW * Math.max(0.7, Math.min(1.2, dT / 22.0)); }
      break;
    }
    default: kw = 0;
  }
  return Math.round(kw * conditionMultiplier);
}

export function stepSimulation(devices, grid, env, simDay, simHour) {
  const demand = calculateCityDemand(grid.population, simHour);
  let totalGenerationKW = 0;
  const updatedDevices = devices.map(device => {
    const outputKW = calculateDeviceOutput(device, env), tech = techOf(device.techId);
    const stormStress = env.stormWarning ? 0.08 : 0.02;
    if (tech.category !== "storage") totalGenerationKW += outputKW;
    return { ...device, currentOutputKW: outputKW, totalKWhGenerated: device.totalKWhGenerated + outputKW * SIMULATION_TICK_HOURS,
      integrity: Number(Math.max(0, device.integrity - stormStress).toFixed(2)), biofouling: Number(Math.min(100, device.biofouling + 0.035).toFixed(2)) };
  });
  let stored = grid.storedEnergyKWh;
  const storageDevs = devices.filter(d => (d.techId === "subsea_battery" || d.techId === "subsea_hydrogen_hub") && d.active);
  const maxStorage = storageDevs.reduce((a, d) => a + (d.techId === "subsea_hydrogen_hub" ? 40000 : 20000), 0);
  const maxRate = storageDevs.reduce((a, d) => a + (d.techId === "subsea_hydrogen_hub" ? 8000 : 5000), 0);
  const net = totalGenerationKW - demand;
  let isBlackout = false, delivered = demand;
  if (net > 0) {
    if (maxStorage > 0) stored = Math.min(maxStorage, stored + Math.min(net, maxRate) * SIMULATION_TICK_HOURS * 0.88);
  } else {
    const deficit = Math.abs(net), dis = Math.min(deficit, maxRate, stored / SIMULATION_TICK_HOURS);
    if (dis > 0) stored = Math.max(0, stored - dis * SIMULATION_TICK_HOURS);
    if (deficit - dis > demand * 0.15) { isBlackout = true; delivered = totalGenerationKW + dis; }
  }
  const tickKWh = delivered * SIMULATION_TICK_HOURS, tickRevenue = tickKWh * grid.tariffPerKWh;
  let tickOpex = 0; devices.forEach(d => { const t = techOf(d.techId); if (t) tickOpex += t.dailyOpex / 48; });
  const funds = grid.funds + tickRevenue - tickOpex;
  let ad = 0, tf = grid.tariffPerKWh;
  if (tf <= 0.12) ad += 0.08; else if (tf <= 0.16) ad += 0.02; else if (tf <= 0.22) ad -= 0.06; else ad -= 0.25;
  if (isBlackout) ad -= 1.8; else ad += 0.05;
  const approval = Math.max(5, Math.min(100, grid.citizenApproval + ad));
  const co2 = (tickKWh * 0.85) / 2000, land = (tickKWh / 1000) * 0.1;      // game-scaled: ~0.1 acre of land spared per MWh delivered by ocean power (the source's 0.00015 made the 350-acre mission target unreachable)
  return { updatedDevices, updatedGrid: { ...grid, currentDemandKW: demand, funds: Math.round(funds), dailyRevenue: Math.round(tickRevenue * 48), dailyExpenses: Math.round(tickOpex * 48),
    citizenApproval: Number(approval.toFixed(1)), storedEnergyKWh: Math.round(stored), maxStorageCapacityKWh: maxStorage, isBlackout,
    blackoutHours: grid.blackoutHours + (isBlackout ? SIMULATION_TICK_HOURS : 0), totalKWhConsumed: grid.totalKWhConsumed + tickKWh,
    totalKWhGenerated: grid.totalKWhGenerated + totalGenerationKW * SIMULATION_TICK_HOURS, landSavedAcres: Number((grid.landSavedAcres + land).toFixed(1)),
    co2PreventedTons: Number((grid.co2PreventedTons + co2).toFixed(1)) } };
}

/* ---------- state factories ---------- */
export function newGrid(startingFunds) {
  return { cityName: "Pacifica Bay", population: 28000, baseDemandKW: 9800, currentDemandKW: 10200, tariffPerKWh: 0.150, funds: startingFunds, dailyRevenue: 0, dailyExpenses: 0,
    citizenApproval: 82.5, storedEnergyKWh: 0, maxStorageCapacityKWh: 0, blackoutHours: 0, isBlackout: false, totalKWhConsumed: 0, totalKWhGenerated: 0,
    landSavedAcres: 0, co2PreventedTons: 0, marineEcosystemHealth: 94 };
}
let _id = 1;
export function makeDevice(techId, xRatio, day, biofouling = 5) {
  return { instanceId: `dev-${_id++}-${Math.floor(Math.random() * 1000)}`, techId, xRatio, builtOnDay: day, integrity: 100, biofouling, active: true, currentOutputKW: 0, totalKWhGenerated: 0, lastMaintainedDay: day };
}
export function zoneAt(xRatio) { return xRatio < 0.35 ? "shallow" : xRatio < 0.70 ? "continental_shelf" : "deep_ocean"; }
export function isEligible(techId, xRatio) { return techOf(techId).depthZone.includes(zoneAt(xRatio)); }

/* Average household monthly bill, from the source: 900 kWh per month */
export const householdBill = tariff => Math.round(900 * tariff);

/* Land vs Ocean comparison (formulas from the source's ComparisonTool) */
export function compareLandOcean(pop) {
  const annualMWh = Math.round((pop * 10500) / 1000), solarLand = Math.round(annualMWh * 0.008);
  return { annualMWh, annualGWh: (annualMWh / 1000).toFixed(1), perDayMWh: Math.round(annualMWh / 365),
    coalLand: Math.round(annualMWh * 0.0035), fossilCO2: Math.round(annualMWh * 0.92), fossilWater: Math.round(annualMWh * 480),
    solarLand, forest: Math.round(solarLand * 0.65), reefKg: Math.round(pop * 18), desal: Math.round(annualMWh * 120) };
}
