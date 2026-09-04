/* ============================================================================
 * engine/config.js — Data layer (UNCHANGED ecological content, ES module)
 * ----------------------------------------------------------------------------
 * Ported verbatim from the v1 simulation: the same constants, decisions, events
 * and glossary. This is DATA ONLY; the engine reads it. Retuning or extending
 * the simulation means editing this file alone.
 *
 * Population variables are abundance indices 0..100 (100 = healthy reference).
 * Environmental/social variables are 0..100 unless noted. `wetlandArea` is in ha.
 * ========================================================================== */

export const CONSTANTS = {
  TOTAL_YEARS: 20,
  MAX_ACTIONS_PER_YEAR: 3,
  START_AREA: 1000,
  GROWTH_RATE: 0.45,
  EVENT_BASE_CHANCE: 0.55,
  CLIMATE_PER_YEAR: 2.0,
  STRESS_TEST_YEARS: 5
};

export const START_STATE = {
  year: 0,
  pops: {
    aquaticPlants: 60, reeds: 65, insects: 55, smallFish: 50, largeFish: 40,
    frogs: 45, waterBirds: 50, birdsOfPrey: 30, invasive: 20
  },
  waterQuality: 65,
  wetlandArea: 1000,
  waterAvailability: 70,
  nutrientLevel: 35,
  algae: 20,
  climatePressure: 10,
  employment: 55,
  tourismIncome: 30,
  foodProduction: 45,
  publicSupport: 60,
  budget: 100,
  biodiversity: 58,
  resilience: 55,
  levers: {
    farmingIntensity: 40, fertiliserUse: 45, housingLevel: 30, tourismLevel: 30,
    extractionLevel: 40, wastewaterQuality: 45, fishingPressure: 45, corridors: 10,
    educationLevel: 10, restoration: 0, invasiveControl: 0
  }
};

export const SPECIES = [
  { key: 'aquaticPlants', label: 'Aquatic plants', fictional: 'Veralba pondweed', trophic: 'Producer' },
  { key: 'reeds',         label: 'Reed beds',      fictional: 'Salt-marsh reed',   trophic: 'Producer / habitat' },
  { key: 'insects',       label: 'Insects',        fictional: 'Marsh damselfly',   trophic: 'Primary consumer' },
  { key: 'smallFish',     label: 'Small fish',     fictional: 'Veralba minnow',    trophic: 'Secondary consumer' },
  { key: 'largeFish',     label: 'Large fish',     fictional: 'Marbled pike',      trophic: 'Tertiary consumer' },
  { key: 'frogs',         label: 'Frogs',          fictional: 'Iberian marsh frog',trophic: 'Secondary consumer' },
  { key: 'waterBirds',    label: 'Water birds',    fictional: 'Purple gallinule',  trophic: 'Consumer' },
  { key: 'birdsOfPrey',   label: 'Birds of prey',  fictional: 'Marsh harrier',     trophic: 'Apex predator' },
  { key: 'invasive',      label: 'Invasive species', fictional: 'Red swamp crayfish', trophic: 'Invasive omnivore' }
];

function adj(obj, key, delta, min, max) {
  obj[key] = Math.max(min == null ? 0 : min, Math.min(max == null ? 100 : max, obj[key] + delta));
}

export const DECISIONS = [
  {
    id: 'restore', name: 'Restore habitat', cost: 40, category: 'conservation', zone: 'water',
    short: 'More reed & pond habitat and public goodwill; no direct income.',
    long: 'Re-flood and replant degraded margins. Expands wetland area, boosts reeds and aquatic plants, and improves water filtration and biodiversity over time.',
    hint: 'Restoration is slow to pay off but builds long-term resilience.',
    predict: ['Wetland area', 'Biodiversity', 'Water quality', 'Budget'],
    apply: (s) => { s.wetlandArea = Math.min(1200, s.wetlandArea + 60); adj(s.levers, 'restoration', 25, 0, 100); adj(s.levers, 'fertiliserUse', -3); adj(s, 'publicSupport', 4); }
  },
  {
    id: 'housing', name: 'Build housing', cost: 20, category: 'development', zone: 'housing',
    short: '+Jobs, +income, +support now; less wetland and dirtier water later.',
    long: 'Approve new housing on the wetland edge. Brings construction jobs, tax income and short-term public approval, but shrinks the wetland, raises water demand and adds sewage/runoff.',
    hint: 'Development helps the economy immediately but the ecological bill arrives later.',
    predict: ['Employment', 'Budget', 'Wetland area', 'Water quality'],
    apply: (s) => { adj(s.levers, 'housingLevel', 12); adj(s.levers, 'extractionLevel', 8); s.wetlandArea = Math.max(400, s.wetlandArea - 50); adj(s, 'employment', 6); adj(s, 'publicSupport', 4); }
  },
  {
    id: 'tourism', name: 'Expand tourism', cost: 25, category: 'development', zone: 'tourism',
    short: '+Tourism income & jobs; some disturbance to birds and water.',
    long: 'Build boardwalks, hides and a visitor centre. Raises tourism income and jobs and depends on a healthy, attractive wetland — but crowds can disturb nesting birds.',
    hint: 'Tourism income grows when biodiversity and water quality are high, so it can align with conservation.',
    predict: ['Tourism income', 'Employment', 'Water birds', 'Public support'],
    apply: (s) => { adj(s.levers, 'tourismLevel', 12); adj(s.levers, 'extractionLevel', 3); adj(s, 'employment', 4); adj(s, 'publicSupport', 3); }
  },
  {
    id: 'farming', name: 'Increase farming', cost: 15, category: 'development', zone: 'farm',
    short: '+Food, +jobs, +income; nutrient runoff threatens water later.',
    long: 'Expand and intensify surrounding farmland. Raises food production, jobs and income and increases fertiliser use and water extraction — the main driver of nutrient pollution.',
    hint: 'Watch the nutrient/algae chain: gains now, algal blooms and fish deaths later.',
    predict: ['Food production', 'Budget', 'Water quality (later)', 'Invasive species'],
    apply: (s) => { adj(s.levers, 'farmingIntensity', 12); adj(s.levers, 'fertiliserUse', 10); adj(s.levers, 'extractionLevel', 6); adj(s, 'employment', 4); }
  },
  {
    id: 'reduceFert', name: 'Reduce fertiliser', cost: 15, category: 'conservation', zone: 'farm',
    short: 'Cleaner water later; a little less food and some farmer pushback.',
    long: 'Pay farmers to cut fertiliser and plant buffer strips. Lowers nutrient pollution so water quality and fish recover over a few years, at the cost of some food output and support.',
    hint: 'The payoff is delayed — nutrients and algae take years to fall.',
    predict: ['Nutrient level', 'Water quality (later)', 'Food production', 'Public support'],
    apply: (s) => { adj(s.levers, 'fertiliserUse', -14); adj(s.levers, 'farmingIntensity', -3); adj(s, 'publicSupport', -2); }
  },
  {
    id: 'corridors', name: 'Wildlife corridors', cost: 30, category: 'conservation', zone: 'edge',
    short: 'Links habitats: helps mobile species and overall resilience.',
    long: 'Connect the wetland to nearby patches with hedgerows and green strips. Reduces habitat fragmentation, letting birds of prey and amphibians move and recolonise — boosting biodiversity and resilience.',
    hint: 'Corridors fight fragmentation, which is a hidden driver of extinction.',
    predict: ['Biodiversity', 'Birds of prey', 'Ecosystem resilience'],
    apply: (s) => { adj(s.levers, 'corridors', 18); }
  },
  {
    id: 'removeInvasive', name: 'Remove invasive', cost: 35, category: 'conservation', zone: 'water',
    short: 'Big cut to the invasive; native fish and frogs rebound.',
    long: 'Trapping and biosecurity campaign against the red swamp crayfish. Sharply reduces the invasive population, relieving pressure on native fish, frogs and plants — but it creeps back without upkeep.',
    hint: 'One-off removal fades; sustained control or clean water keeps invasives down.',
    predict: ['Invasive species', 'Small fish', 'Frogs', 'Biodiversity'],
    apply: (s) => { adj(s.pops, 'invasive', -28); s.levers.invasiveControl = Math.min(1, s.levers.invasiveControl + 0.6); adj(s, 'employment', 2); }
  },
  {
    id: 'fishingLimits', name: 'Fishing limits', cost: 10, category: 'conservation', zone: 'water',
    short: 'Short-term job loss; large fish and birds recover later.',
    long: 'Cap catches and set closed seasons. Reduces fishing pressure so large fish recover, which supports birds and (later) wildlife tourism. Some anglers lose out short-term.',
    hint: 'Predator fish recovering can rebalance the whole food web.',
    predict: ['Large fish', 'Employment', 'Tourism income (later)', 'Public support'],
    apply: (s) => { adj(s.levers, 'fishingPressure', -16); adj(s, 'employment', -2); adj(s, 'publicSupport', -2); }
  },
  {
    id: 'wastewater', name: 'Wastewater plant', cost: 35, category: 'conservation', zone: 'housing',
    short: 'Less nutrient pollution; cleaner water over time, +goodwill.',
    long: 'Upgrade the treatment plant that discharges near the wetland. Cuts nutrient loading, so water quality and fish improve over several years. Popular with the public.',
    hint: 'Tackles pollution at the source — complements reducing fertiliser.',
    predict: ['Nutrient level', 'Water quality (later)', 'Small fish', 'Public support'],
    apply: (s) => { adj(s.levers, 'wastewaterQuality', 20); adj(s, 'publicSupport', 3); }
  },
  {
    id: 'restrictWater', name: 'Restrict extraction', cost: 20, category: 'conservation', zone: 'water',
    short: 'Less income now; a vital water buffer against drought.',
    long: 'Cap how much water farms, homes and hotels can draw. Keeps water levels up, protecting the wetland in dry years and building drought resilience, at some cost to food and tourism income.',
    hint: 'This is your main defence in the final drought stress test.',
    predict: ['Water availability', 'Ecosystem resilience', 'Food production', 'Public support'],
    apply: (s) => { adj(s.levers, 'extractionLevel', -16); adj(s, 'publicSupport', -2); }
  },
  {
    id: 'education', name: 'Education campaign', cost: 10, category: 'social', zone: 'edge',
    short: 'Builds lasting public support; makes conservation easier.',
    long: 'Run school and community programmes. Grows public support year on year, softens the backlash against limits, and slightly reduces disturbance to wildlife.',
    hint: 'Cheap and compounding — support unlocks tougher choices later.',
    predict: ['Public support', 'Biodiversity', 'Budget'],
    apply: (s) => { adj(s.levers, 'educationLevel', 14); adj(s, 'publicSupport', 5); }
  },
  {
    id: 'nothing', name: 'Save budget', cost: 0, category: 'neutral', zone: null,
    short: 'Keep the money; existing pressures keep acting.',
    long: 'Take no new action this year and carry the budget forward. Useful to save for a big project — but ongoing pressures (pollution, invasives, climate) keep working.',
    hint: 'Doing nothing is still a choice: unmanaged problems tend to grow.',
    predict: ['Budget', 'Whatever is already trending'],
    apply: () => {}
  }
];

export const EVENTS = [
  {
    id: 'drought', name: 'Drought', tone: 'bad',
    text: 'A dry winter and hot spring leave water levels low.',
    weight: (s) => 0.6 + (70 - s.waterAvailability) * 0.03 + s.climatePressure * 0.02 + s.levers.extractionLevel * 0.01,
    apply: (s, log) => { adj(s, 'waterAvailability', -18); adj(s.pops, 'aquaticPlants', -8); adj(s.pops, 'smallFish', -6); adj(s.pops, 'frogs', -8); log.push('The drought cut water availability and hit plants, fish and frogs.'); }
  },
  {
    id: 'heatwave', name: 'Heatwave', tone: 'bad',
    text: 'Weeks of extreme heat warm the water and cut its oxygen.',
    weight: (s) => 0.4 + s.climatePressure * 0.03,
    apply: (s, log) => { adj(s, 'waterQuality', -8); adj(s, 'algae', 10); adj(s.pops, 'largeFish', -6); adj(s.pops, 'invasive', 5); log.push('Heat lowered oxygen and boosted algae and the heat-tolerant invasive.'); }
  },
  {
    id: 'wildfire', name: 'Wildfire', tone: 'bad',
    text: 'A wildfire sweeps through the dry reed beds.',
    weight: (s) => 0.15 + Math.max(0, 60 - s.waterAvailability) * 0.02 + s.climatePressure * 0.015 + Math.max(0, s.pops.reeds - 50) * 0.005,
    apply: (s, log) => { adj(s.pops, 'reeds', -18); adj(s.pops, 'waterBirds', -8); s.wetlandArea = Math.max(400, s.wetlandArea - 25); log.push('Fire destroyed reed beds and bird habitat; reeds recover slowly.'); }
  },
  {
    id: 'flood', name: 'Flood', tone: 'mixed',
    text: 'Heavy autumn rains flood the marsh.',
    weight: (s) => 0.3 + s.climatePressure * 0.01,
    apply: (s, log) => { adj(s, 'waterAvailability', 14); adj(s, 'nutrientLevel', 6); adj(s.pops, 'smallFish', -4); log.push('Floods raised water levels but washed extra nutrients into the marsh.'); }
  },
  {
    id: 'invasiveOutbreak', name: 'Invasive outbreak', tone: 'bad',
    text: 'The invasive crayfish population explodes.',
    weight: (s) => 0.2 + s.pops.invasive * 0.02 + Math.max(0, 60 - s.waterQuality) * 0.015 - s.levers.invasiveControl * 0.4,
    apply: (s, log) => { adj(s.pops, 'invasive', 18); adj(s.pops, 'smallFish', -8); adj(s.pops, 'frogs', -8); adj(s.pops, 'aquaticPlants', -6); log.push('The invasive outbreak preyed on native fish, frogs and plants.'); }
  },
  {
    id: 'fishDisease', name: 'Fish disease', tone: 'bad',
    text: 'A disease spreads through crowded, low-quality water.',
    weight: (s) => 0.15 + Math.max(0, 60 - s.waterQuality) * 0.02 + Math.max(0, 60 - s.biodiversity) * 0.015,
    apply: (s, log) => { adj(s.pops, 'smallFish', -12); adj(s.pops, 'largeFish', -10); log.push('Disease spread easily in poor water with low biodiversity, killing fish.'); }
  },
  {
    id: 'tourismBoom', name: 'Tourism boom', tone: 'good',
    text: 'The wetland gains fame; visitor numbers surge.',
    weight: (s) => 0.1 + Math.max(0, s.biodiversity - 55) * 0.02 + s.levers.tourismLevel * 0.01,
    apply: (s, log) => { adj(s, 'tourismIncome', 12); adj(s, 'publicSupport', 5); s.budget += 15; log.push('A healthy, scenic wetland drew crowds, lifting tourism income.'); }
  },
  {
    id: 'grant', name: 'Conservation grant', tone: 'good',
    text: 'A regional fund rewards your conservation record.',
    weight: (s) => 0.1 + Math.max(0, s.publicSupport - 55) * 0.015 + s.levers.restoration * 0.005 + s.levers.corridors * 0.004,
    apply: (s, log) => { s.budget += 35; adj(s, 'publicSupport', 3); log.push('Your conservation work attracted a grant, boosting the budget.'); }
  },
  {
    id: 'protest', name: 'Public protest', tone: 'bad',
    text: 'Residents protest over the wetland’s management.',
    weight: (s) => 0.15 + Math.max(0, 50 - s.publicSupport) * 0.03 + Math.max(0, s.levers.housingLevel - 55) * 0.01,
    apply: (s, log) => { adj(s, 'publicSupport', -10); s.budget = Math.max(0, s.budget - 8); log.push('Low public support boiled over into protest, costing goodwill and budget.'); }
  }
];

export const GLOSSARY = {
  'Biodiversity': 'The variety of living species in an ecosystem. Higher biodiversity usually means a more stable, resilient system.',
  'Carrying capacity': 'The maximum population an environment can support long-term, given food, space and other resources.',
  'Limiting factor': 'A resource or condition (e.g. water, food, nesting sites) that caps how large a population can grow.',
  'Trophic level': 'A step in a food chain: producers, then primary, secondary and tertiary consumers, up to apex predators.',
  'Food web': 'The network of who-eats-whom in an ecosystem; connected food chains.',
  'Producer': 'An organism (usually a plant or alga) that makes its own food by photosynthesis — the base of the food web.',
  'Apex predator': 'A predator at the top of the food web with no natural predators of its own.',
  'Invasive species': 'A non-native species that spreads and harms the local ecosystem, often out-competing natives.',
  'Eutrophication': 'Nutrient pollution (e.g. from fertiliser) causing algal blooms that lower oxygen and kill fish.',
  'Algal bloom': 'A rapid overgrowth of algae, often from excess nutrients, which blocks light and depletes oxygen.',
  'Nutrient pollution': 'Excess nitrogen and phosphorus (from fertiliser or sewage) entering water and fuelling algae.',
  'Water quality': 'How clean and oxygen-rich the water is. Low quality stresses or kills aquatic life.',
  'Habitat fragmentation': 'Breaking continuous habitat into isolated patches, which harms species that need to move.',
  'Wildlife corridor': 'A strip of habitat connecting patches so animals can move, feed and breed between them.',
  'Ecosystem resilience': 'The ability of an ecosystem to absorb shocks (like drought) and recover its functions.',
  'Ecosystem services': 'Benefits people get from nature, e.g. clean water, flood control, food and recreation.',
  'Delayed effect': 'A consequence that appears years after its cause, e.g. fertiliser now, fish deaths later.',
  'Trade-off': 'A choice where gaining one thing means giving up another, e.g. income vs. water quality.',
  'Population': 'All the individuals of one species living in an area.',
  'Predation': 'One organism (predator) killing and eating another (prey).',
  'Competition': 'Two organisms using the same limited resource, so each does worse in the other’s presence.'
};
