/* ==========================================================================
   OCEANCURRENTS — DATA  (technologies, field guide, quiz, missions)
   Ported from the supplied "OceanCurrents: Marine Renewable Energy Simulator"
   (React/TypeScript) to plain ES modules. All numbers (rated power, capex,
   opex, LCOE, lifespan, unlock costs, mission funds/objectives) are kept exactly
   as in the source; text is bilingual (English / Spanish) via L().
   ========================================================================== */
import { getLang } from "../../../../../../engine/i18n.js?v=9";
export const L = (en, es) => (getLang() === "es" ? es : en);

export const ZONES = {
  shallow: { name: () => L("Shallow coast", "Costa somera"), range: [0.12, 0.35], depth: "0–50 m" },
  continental_shelf: { name: () => L("Continental shelf", "Plataforma continental"), range: [0.35, 0.70], depth: "50–100 m" },
  deep_ocean: { name: () => L("Deep ocean", "Océano profundo"), range: [0.70, 0.94], depth: "100 m+" },
};
export const CATEGORY = {
  wind: { label: () => L("Offshore Wind", "Eólica marina"), color: "#38bdf8" },
  wave: { label: () => L("Wave Converters", "Convertidores de olas"), color: "#22d3ee" },
  tidal: { label: () => L("Tidal & Kites", "Mareas y cometas"), color: "#818cf8" },
  baseload: { label: () => L("OTEC & Osmotic", "OTEC y osmótica"), color: "#fbbf24" },
  solar: { label: () => L("Floating Solar", "Solar flotante"), color: "#fcd34d" },
  storage: { label: () => L("Battery & H2", "Baterías e H2"), color: "#34d399" },
};

/* numeric specs, exactly as in the source */
const SPEC = {
  offshore_wind_fixed: { category: "wind", depthZone: ["shallow", "continental_shelf"], ratedPowerKW: 8000, capex: 180000, dailyOpex: 420, lcoeEstimate: 0.085, lifespanDays: 90, unlockedByDefault: true, visualDepth: "surface", worksInClouds: true, needsWaves: false, isConstantBaseload: false, photo: "wind-barrow.jpg" },
  offshore_wind_floating: { category: "wind", depthZone: ["deep_ocean"], ratedPowerKW: 14000, capex: 320000, dailyOpex: 780, lcoeEstimate: 0.115, lifespanDays: 90, unlockedByDefault: false, unlockCost: 75000, visualDepth: "surface", worksInClouds: true, needsWaves: false, isConstantBaseload: false, photo: "wind-floating-hywind.jpg" },
  point_absorber: { category: "wave", depthZone: ["shallow", "continental_shelf"], ratedPowerKW: 450, capex: 28000, dailyOpex: 85, lcoeEstimate: 0.165, lifespanDays: 75, unlockedByDefault: true, visualDepth: "surface", worksInClouds: true, needsWaves: true, isConstantBaseload: false, photo: "wave-wavegem.jpg" },
  oscillating_water_column: { category: "wave", depthZone: ["shallow", "continental_shelf"], ratedPowerKW: 850, capex: 52000, dailyOpex: 130, lcoeEstimate: 0.145, lifespanDays: 80, unlockedByDefault: true, visualDepth: "surface", worksInClouds: true, needsWaves: true, isConstantBaseload: false, photo: null, diagram: "owc" },
  wave_attenuator: { category: "wave", depthZone: ["continental_shelf", "deep_ocean"], ratedPowerKW: 1200, capex: 74000, dailyOpex: 195, lcoeEstimate: 0.155, lifespanDays: 75, unlockedByDefault: false, unlockCost: 40000, visualDepth: "surface", worksInClouds: true, needsWaves: true, isConstantBaseload: false, photo: "wave-pelamis.jpg" },
  wave_surge_converter: { category: "wave", depthZone: ["shallow"], ratedPowerKW: 600, capex: 38000, dailyOpex: 95, lcoeEstimate: 0.170, lifespanDays: 70, unlockedByDefault: true, visualDepth: "seabed", worksInClouds: true, needsWaves: true, isConstantBaseload: false, photo: null, diagram: "flap" },
  tidal_stream_turbine: { category: "tidal", depthZone: ["shallow", "continental_shelf"], ratedPowerKW: 2000, capex: 95000, dailyOpex: 240, lcoeEstimate: 0.125, lifespanDays: 85, unlockedByDefault: true, visualDepth: "midwater", worksInClouds: true, needsWaves: false, isConstantBaseload: false, photo: "tidal-seaflow.jpg" },
  tidal_kite: { category: "tidal", depthZone: ["continental_shelf", "deep_ocean"], ratedPowerKW: 1200, capex: 78000, dailyOpex: 190, lcoeEstimate: 0.118, lifespanDays: 80, unlockedByDefault: false, unlockCost: 45000, visualDepth: "midwater", worksInClouds: true, needsWaves: false, isConstantBaseload: true, photo: null, diagram: "kite" },
  salinity_gradient: { category: "baseload", depthZone: ["shallow"], ratedPowerKW: 4000, capex: 155000, dailyOpex: 360, lcoeEstimate: 0.128, lifespanDays: 95, unlockedByDefault: false, unlockCost: 60000, visualDepth: "surface", worksInClouds: true, needsWaves: false, isConstantBaseload: true, photo: "osmotic-statkraft.jpg" },
  floating_marine_solar: { category: "solar", depthZone: ["shallow", "continental_shelf"], ratedPowerKW: 5000, capex: 125000, dailyOpex: 220, lcoeEstimate: 0.092, lifespanDays: 85, unlockedByDefault: true, visualDepth: "surface", worksInClouds: false, needsWaves: false, isConstantBaseload: false, photo: "solar-floating.jpg" },
  otec_platform: { category: "baseload", depthZone: ["deep_ocean"], ratedPowerKW: 18000, capex: 480000, dailyOpex: 1100, lcoeEstimate: 0.135, lifespanDays: 100, unlockedByDefault: false, unlockCost: 120000, visualDepth: "surface", worksInClouds: true, needsWaves: false, isConstantBaseload: true, photo: "otec-hawaii.jpg" },
  subsea_battery: { category: "storage", depthZone: ["shallow", "continental_shelf", "deep_ocean"], ratedPowerKW: 5000, capex: 65000, dailyOpex: 120, lcoeEstimate: 0.050, lifespanDays: 90, unlockedByDefault: true, visualDepth: "seabed", worksInClouds: true, needsWaves: false, isConstantBaseload: true, photo: "battery-bess.jpg" },
  subsea_hydrogen_hub: { category: "storage", depthZone: ["continental_shelf", "deep_ocean"], ratedPowerKW: 8000, capex: 115000, dailyOpex: 240, lcoeEstimate: 0.048, lifespanDays: 90, unlockedByDefault: false, unlockCost: 55000, visualDepth: "seabed", worksInClouds: true, needsWaves: false, isConstantBaseload: true, photo: null, diagram: "h2" },
};

/* bilingual text: [name, shortDesc, physicsFormula, physicsExplanation, keyChallenge, ecoBenefit, realWorldExample, friendlyStudentSummary] */
const TXT = {
  offshore_wind_fixed: [
    L("Fixed-Bottom Offshore Wind", "Eólica marina de cimentación fija"),
    L("Steel monopile tower anchored in shallow shelf waters up to 50m deep.", "Torre de acero (monopilote) anclada en aguas someras de la plataforma, hasta 50 m de profundidad."),
    "P = 0.5 · ρ_air · A · v³ · Cp",
    L("Wind kinetic energy scales with the CUBE of wind speed (v³). Ocean winds are smoother, stronger, and more consistent than terrestrial winds due to absence of surface land friction (hills, trees, buildings).", "La energía cinética del viento crece con el CUBO de su velocidad (v³). Los vientos marinos son más suaves, fuertes y constantes que los de tierra porque no hay fricción del terreno (colinas, árboles, edificios)."),
    L("Limited to shallow shelf waters (<50m depth). Construction noise can disturb marine mammals.", "Limitada a aguas someras de la plataforma (<50 m). El ruido de construcción puede perturbar a los mamíferos marinos."),
    L("Zero land footprint. Subsea steel foundations act as artificial reefs, giving cod and mussels a nursery habitat.", "Cero huella en tierra. Las cimentaciones de acero submarinas actúan como arrecifes artificiales y dan guardería a bacalaos y mejillones."),
    "Vineyard Wind 1 (Massachusetts, USA)",
    L("💨 Strong & steady sea breeze. Works day & night and on cloudy days!", "💨 Brisa marina fuerte y constante. ¡Funciona de día, de noche y con nubes!")],
  offshore_wind_floating: [
    L("Deep Floating Offshore Wind", "Eólica marina flotante de aguas profundas"),
    L("Giant 14MW floating turbine tethered by deep-sea mooring cables in open waters.", "Turbina flotante gigante de 14 MW sujeta por cables de fondeo en mar abierto."),
    "P = 0.5 · ρ_air · A · v³ · Cp",
    L("Accesses persistent high-velocity oceanic winds 30+ miles offshore where wind power density can exceed 1,000 W/m².", "Accede a vientos oceánicos persistentes y veloces a más de 30 millas de la costa, donde la densidad de potencia eólica puede superar 1.000 W/m²."),
    L("Mooring line tension in extreme storm waves; high deep-sea towing and vessel costs.", "Tensión de las líneas de fondeo en olas de tormenta extremas; altos costes de remolque y buques en alta mar."),
    L("Far beyond visual coastline horizon; zero competition with terrestrial farming or forestry.", "Muy más allá del horizonte visible de la costa; cero competencia con la agricultura o la silvicultura terrestres."),
    "Hywind Tampen (Norway)",
    L("🚀 Massive 14 MW powerhouse 30 miles offshore where winds almost never stop!", "🚀 ¡Una central de 14 MW a 30 millas de la costa donde el viento casi nunca se detiene!")],
  point_absorber: [
    L("Point Absorber Wave Buoy", "Boya de olas de absorción puntual"),
    L("Floating surface buoy that bobs up and down with ocean swell to pump clean electricity.", "Boya flotante que sube y baja con el oleaje oceánico para generar electricidad limpia."),
    "P_wave = (ρ · g² / 64π) · Hs² · Te",
    L("Wave power is proportional to the square of significant wave height (Hs²) multiplied by wave energy period (Te). Ocean swell carries stored momentum across thousands of miles.", "La potencia del oleaje es proporcional al cuadrado de la altura significativa de ola (Hs²) multiplicada por el periodo de energía (Te). El oleaje oceánico transporta energía almacenada a través de miles de millas."),
    L("Barnacles and sea algae cling to sliding shafts, slowing down heaving motion.", "Percebes y algas marinas se adhieren a los ejes deslizantes y frenan el movimiento vertical."),
    L("Protects the seabed; cables prevent commercial bottom-trawling nets from scraping sea life.", "Protege el fondo marino; los cables impiden que las redes de arrastre rasquen la vida marina."),
    "Ocean Power Technologies PB3 PowerBuoy",
    L("🌊 Bobs on waves like a fishing cork. Loves big ocean swells, rain or shine!", "🌊 Sube y baja con las olas como un corcho de pesca. ¡Le encanta el oleaje fuerte, llueva o haga sol!")],
  oscillating_water_column: [
    L("Oscillating Water Column (OWC)", "Columna de agua oscilante (OWC)"),
    L("Hollow chamber open to the sea. Rising waves push air through a bi-directional air turbine.", "Cámara hueca abierta al mar. Las olas que suben empujan el aire a través de una turbina de aire bidireccional."),
    "P_air = ΔP · Q",
    L("The Wells turbine spins in the EXACT same direction whether wave crests push air out or wave troughs suck air back in!", "¡La turbina Wells gira en EXACTAMENTE el mismo sentido tanto si las crestas empujan el aire hacia fuera como si los senos lo succionan de vuelta!"),
    L("Corrosive salty ocean mist passing through high-speed turbine bearings.", "La niebla salina corrosiva pasa por los cojinetes de la turbina a alta velocidad."),
    L("All moving parts stay above seawater, eliminating oil leak risks in the water column.", "Todas las piezas móviles quedan sobre el agua, eliminando el riesgo de fugas de aceite en la columna de agua."),
    "Mutriku Wave Power Plant (Spain)",
    L("💨 Wave piston: Sea waves squeeze air like a lung to spin a turbine above water!", "💨 Pistón de olas: ¡las olas comprimen el aire como un pulmón para girar una turbina sobre el agua!")],
  wave_attenuator: [
    L("Wave Attenuator (Pelamis Snake)", "Atenuador de olas (serpiente Pelamis)"),
    L("Multi-jointed floating cylinder that bends along wave crests to drive hydraulic generators.", "Cilindro flotante articulado que se dobla a lo largo de las crestas para mover generadores hidráulicos."),
    "P = τ · ω",
    L("Extracts energy across the length of the wave crest as adjacent segments flex over ocean swells.", "Extrae energía a lo largo de la cresta de la ola cuando los segmentos contiguos se flexionan sobre el oleaje."),
    L("Hydraulic seals under high cyclic pressure during rogue storm waves.", "Sellos hidráulicos sometidos a alta presión cíclica durante olas gigantes de tormenta."),
    L("Softens waves before reaching shore, protecting barrier beaches from erosion.", "Suaviza las olas antes de llegar a la costa y protege las playas de barrera de la erosión."),
    "Pelamis Wave Converter (Scotland & Portugal)",
    L("🐍 Giant floating sea snake: flexes across waves and pumps hydraulic power!", "🐍 Serpiente marina flotante gigante: ¡se flexiona sobre las olas y bombea potencia hidráulica!")],
  wave_surge_converter: [
    L("Oscillating Wave Surge Flap", "Aleta oscilante de oleaje (surge)"),
    L("Bottom-mounted flap hinged to the seabed that sways back and forth with nearshore wave surges.", "Aleta articulada al fondo marino que se balancea de un lado a otro con el vaivén del oleaje cercano a la costa."),
    "F_surge = 0.5 · Cd · ρ · A · u|u|",
    L("In shallow water, circular wave orbits flatten into intense horizontal back-and-forth surges harvested by the bottom flap.", "En aguas someras, las órbitas circulares de las olas se aplanan en intensos vaivenes horizontales que aprovecha la aleta del fondo."),
    L("Seabed sand scour and abrasive sediments grinding against bottom hinge bearings.", "La erosión de la arena del fondo y los sedimentos abrasivos desgastan los cojinetes de la bisagra."),
    L("Completely submerged underwater; zero visual impact and safe for boats to pass above.", "Totalmente sumergida; cero impacto visual y segura para que pasen barcos por encima."),
    "Oyster Wave Device (Orkney, Scotland)",
    L("🦪 Underwater swinging door: sways with shallow ocean surge along the seabed!", "🦪 Puerta submarina oscilante: ¡se balancea con el vaivén del mar somero sobre el fondo!")],
  tidal_stream_turbine: [
    L("Subsea Tidal Stream Turbine", "Turbina submarina de corriente de marea"),
    L("Seabed-mounted rotor driven by underwater tidal currents like an underwater windmill.", "Rotor anclado al fondo, movido por las corrientes de marea como un molino de viento submarino."),
    "P = 0.5 · ρ_water · A · v³ · Cp",
    L("Seawater is ~832 times denser than air! A 5-knot tidal current has the energy density of a 200+ mph hurricane, generating huge power with small blades.", "¡El agua de mar es unas 832 veces más densa que el aire! Una corriente de marea de 5 nudos tiene la densidad de energía de un huracán de más de 320 km/h y genera mucha potencia con palas pequeñas."),
    L("Underwater maintenance requires specialized support vessels and slack-tide diver windows.", "El mantenimiento submarino requiere buques especializados y ventanas de buceo en aguas muertas."),
    L("100% predictable by the Moon! Rotates slowly (10-15 RPM), allowing fish and seals to swim safely past.", "¡100% predecible por la Luna! Gira despacio (10–15 rpm), así que peces y focas pasan sin peligro."),
    "MeyGen Tidal Array (Scotland)",
    L("🌙 Powered by the Moon! 100% predictable tides, water is 830× denser than air.", "🌙 ¡Impulsada por la Luna! Mareas 100% predecibles; el agua es 830× más densa que el aire.")],
  tidal_kite: [
    L("Subsea Tethered Tidal Kite", "Cometa de marea submarina amarrada"),
    L("Underwater wing flying figure-8 paths, multiplying water speed over its turbine by 10×!", "Ala submarina que vuela en trayectorias en forma de 8 y multiplica por 10 la velocidad del agua sobre su turbina."),
    "v_relative = v_current · (Lift/Drag)",
    L("By steering in figure-8 loops across current flow, relative water velocity is multiplied 10-fold, creating 1000× more power in low-speed deep currents.", "Al girar en bucles en 8 a través de la corriente, la velocidad relativa del agua se multiplica por 10, creando 1000× más potencia en corrientes profundas lentas."),
    L("Autonomous subsea flight computer and tether cable fatigue.", "Ordenador de vuelo submarino autónomo y fatiga del cable de amarre."),
    L("Captures slow-moving deep ocean currents where stationary turbines cannot generate.", "Aprovecha corrientes oceánicas profundas lentas donde las turbinas fijas no pueden generar."),
    "Minesto Deep Green (Faroe Islands)",
    L("🪁 Flying underwater kite: speeds through deep currents in figure-8 loops!", "🪁 Cometa submarina voladora: ¡acelera por corrientes profundas en bucles en 8!")],
  salinity_gradient: [
    L("Osmotic Salinity Gradient Plant (PRO)", "Planta osmótica de gradiente salino (PRO)"),
    L("Estuary plant using osmotic pressure where freshwater rivers meet the salty ocean.", "Planta de estuario que usa la presión osmótica donde los ríos de agua dulce se encuentran con el océano salado."),
    "ΔΠ = ΔC · R · T (26 atm pressure)",
    L("Freshwater naturally diffuses across a semi-permeable membrane into saltwater, creating 26 atmospheres of natural pressure (equal to a 260m high waterfall!).", "El agua dulce se difunde de forma natural a través de una membrana semipermeable hacia el agua salada y crea 26 atmósferas de presión natural (¡como una cascada de 260 m!)."),
    L("Membrane clogging from river silt requiring microscopic pre-filtering.", "Obstrucción de las membranas por limo del río, que exige un prefiltrado microscópico."),
    L("Runs 24/7/365 with zero emissions. Only discharge is natural brackish water.", "Funciona 24/7/365 sin emisiones. Lo único que descarga es agua salobre natural."),
    "Statkraft Osmotic Power (Norway)",
    L("⚓ 24/7 Constant Baseload: Pure salt-vs-freshwater osmosis at the river mouth!", "⚓ Base constante 24/7: ¡ósmosis pura entre agua salada y dulce en la desembocadura del río!")],
  floating_marine_solar: [
    L("Offshore Floating Marine Solar Island", "Isla solar marina flotante"),
    L("Floating platforms with solar panels cooled by seawater, boosting electrical yield by 15%.", "Plataformas flotantes con paneles solares refrigerados por agua de mar, que aumentan el rendimiento eléctrico un 15%."),
    "η_PV = η_ref · [1 - β · ΔT]",
    L("Seawater evaporative cooling keeps solar cells 15°C cooler than land solar, preventing heat degradation and boosting generation.", "El enfriamiento por agua de mar mantiene las células 15 °C más frías que en tierra, evitando la degradación por calor y aumentando la generación."),
    L("Salt crust encrustation and heavy wave flex fatigue on panel frames.", "Incrustación de sal y fatiga por la flexión del oleaje en los marcos de los paneles."),
    L("Clears 0 trees or farm fields on land; provides shade that controls toxic coastal algae blooms.", "No despeja ningún árbol ni campo de cultivo; da sombra que controla las floraciones de algas tóxicas costeras."),
    "Oceans of Energy North Sea",
    L("☀️ Ocean solar island! Cooled by water for +15% power, but goes to sleep at night.", "☀️ ¡Isla solar oceánica! Enfriada por el agua para +15% de potencia, pero se duerme de noche.")],
  otec_platform: [
    L("Ocean Thermal Energy Conversion (OTEC)", "Conversión de energía térmica oceánica (OTEC)"),
    L("Deep-ocean floating facility using the 20°C temperature difference between warm surface and 4°C abyss.", "Instalación flotante de alta mar que usa la diferencia de 20 °C entre la superficie cálida y el abismo a 4 °C."),
    "η_Carnot = 1 - (T_cold / T_warm)",
    L("Warm surface water (26°C) evaporates ammonia into high-pressure gas to spin a turbine. 4°C deep water pumped from 1,000 meters condenses it back to liquid 24/7/365!", "El agua cálida de superficie (26 °C) evapora amoníaco en gas a alta presión que mueve una turbina. ¡El agua de 4 °C bombeada desde 1.000 m lo condensa de nuevo 24/7/365!"),
    L("High capital cost for a 1,000-meter deep cold water intake pipe.", "Alto coste de capital de una tubería de toma de agua fría de 1.000 m de profundidad."),
    L("100% reliable 24/7 clean baseload; cold deep water can produce desalinated fresh drinking water.", "Base limpia 100% fiable 24/7; el agua fría profunda puede producir agua potable desalinizada."),
    "NELHA OTEC Facility (Hawaii, USA)",
    L("⚓ Ultimate 24/7 Constant King: Uses freezing 4°C deep water. Runs 365 days a year!", "⚓ El rey constante 24/7: ¡usa agua profunda helada a 4 °C. Funciona 365 días al año!")],
  subsea_battery: [
    L("Subsea Flow Battery Hub", "Centro submarino de baterías de flujo"),
    L("Seabed-anchored battery bank that stores excess ocean electricity and discharges when demand peaks.", "Banco de baterías anclado al fondo que almacena el exceso de electricidad oceánica y la descarga en las horas punta."),
    "E_stored = V · I · t · η_roundtrip",
    L("Naturally cold deep ocean water (4-10°C) cools the battery cells for free, preventing overheating and thermal runaway.", "El agua profunda fría (4–10 °C) enfría las celdas gratis, evitando el sobrecalentamiento y la fuga térmica."),
    L("High-pressure watertight containment and subsea cable connections.", "Contención estanca a alta presión y conexiones de cable submarinas."),
    L("Zero toxic land footprint; eliminates terrestrial lithium mine competition; acts as an anchor reef cluster.", "Cero huella tóxica en tierra; evita competir con las minas de litio terrestres; actúa como grupo de arrecifes de anclaje."),
    "Ocean Battery seabed storage",
    L("🔋 Giant seabed battery! Soaks up extra power and keeps the city lit when wind drops.", "🔋 ¡Batería gigante del fondo marino! Absorbe el exceso de energía y mantiene la ciudad iluminada cuando cae el viento.")],
  subsea_hydrogen_hub: [
    L("Subsea Green Hydrogen Hub", "Centro submarino de hidrógeno verde"),
    L("Deep seabed electrolyzer and pressurized gas dome converting ocean power into green hydrogen fuel.", "Electrolizador del fondo marino y cúpula de gas a presión que convierten la energía oceánica en hidrógeno verde."),
    "2 H2O + Electricity → 2 H2 + O2",
    L("At 100m+ depth, natural water pressure compresses hydrogen gas naturally without needing noisy, power-hungry compressors on land!", "A más de 100 m de profundidad la presión del agua comprime el hidrógeno de forma natural, ¡sin compresores ruidosos y hambrientos de energía en tierra!"),
    L("Hydrogen embrittlement of subsea welds and underwater refueling access.", "Fragilización por hidrógeno de las soldaduras submarinas y acceso submarino para el reabastecimiento."),
    L("Stores multi-gigawatt-hours of clean fuel for weeks with zero toxic battery chemicals.", "Almacena gigavatios-hora de combustible limpio durante semanas sin químicos tóxicos de baterías."),
    "Lhyfe Sealhyfe Offshore Hydrogen (France)",
    L("⚡ Green Hydrogen dome: stores ocean power as clean fuel for weeks on the seabed!", "⚡ Cúpula de hidrógeno verde: ¡guarda energía oceánica como combustible limpio durante semanas en el fondo!")],
};

export const MARINE_TECHNOLOGIES = {};
Object.keys(SPEC).forEach(id => {
  const t = TXT[id];
  Object.defineProperty(MARINE_TECHNOLOGIES, id, {
    enumerable: true,
    get() { return { id, ...SPEC[id], name: t[0], shortDesc: t[1], physicsFormula: t[2], physicsExplanation: t[3], keyChallenge: t[4], ecoBenefit: t[5], realWorldExample: t[6], friendlyStudentSummary: t[7] }; },
  });
});
export const techOf = id => MARINE_TECHNOLOGIES[id];
export const TECH_IDS = Object.keys(SPEC);
export const WAVE_IDS = ["point_absorber", "oscillating_water_column", "wave_attenuator", "wave_surge_converter"];

/* ---------- Field Guide (Codex) ---------- */
export const codexTopics = () => [
  { id: "water_density_superpower", unitNumber: 1, emoji: "💧",
    title: L("The Water Superpower: 830× Denser Than Air!", "El superpoder del agua: ¡830× más densa que el aire!"),
    tagline: L("Why moving water packs an unbelievable punch compared to wind.", "Por qué el agua en movimiento golpea mucho más fuerte que el viento."),
    bigIdea: L("A gentle 5-knot ocean tidal stream has the same raw kinetic energy density as a 200+ mph hurricane in the air!", "¡Una suave corriente de marea de 5 nudos tiene la misma densidad de energía cinética que un huracán de más de 320 km/h en el aire!"),
    quickTakeaways: [
      L("Seawater weighs ~1,025 kg per cubic meter. Air weighs only ~1.2 kg.", "El agua de mar pesa ~1.025 kg por metro cúbico. El aire solo ~1,2 kg."),
      L("Because water is ~832 times heavier, underwater blades can be small and compact while generating massive Megawatts.", "Como el agua es ~832 veces más pesada, las palas submarinas pueden ser pequeñas y compactas y aun así generar muchos megavatios."),
      L("Tides are pulled by the Moon and Sun, making them 100% predictable decades ahead.", "Las mareas las mueven la Luna y el Sol, por lo que son 100% predecibles con décadas de antelación.")],
    weatherCheck: { cloudyDay: L("Works 100% — Tides do not care about clouds!", "Funciona al 100% — ¡a las mareas no les importan las nubes!"), bigWaveDay: L("Works underwater smoothly beneath the waves.", "Funciona sin problema bajo el agua, debajo de las olas."), constant24_7: L("Semi-constant: Peaks 4 times every 24 hours with the lunar cycle.", "Semiconstante: alcanza picos 4 veces cada 24 horas con el ciclo lunar.") },
    highSchoolAnalogy: L("Imagine being hit by a pillow (air) moving at 10 mph vs being hit by a heavy water balloon (seawater) moving at 10 mph. That is fluid density in action!", "Imagina que te da una almohada (aire) a 16 km/h frente a un globo de agua pesado (agua de mar) a 16 km/h. ¡Eso es la densidad de un fluido en acción!") },
  { id: "weather_matching", unitNumber: 2, emoji: "🌊",
    title: L("Which Energy Works When? (Clouds vs Waves vs Baseload)", "¿Qué energía funciona cuándo? (Nubes, olas y base constante)"),
    tagline: L("The secret to never having blackouts is mixing different ocean sources.", "El secreto para no tener apagones es mezclar distintas fuentes oceánicas."),
    bigIdea: L("No single energy source does everything. By combining wind, waves, tides, and deep OTEC, your city never runs out of power.", "Ninguna fuente lo hace todo. Combinando viento, olas, mareas y OTEC profunda, tu ciudad nunca se queda sin energía."),
    quickTakeaways: [
      L("☁️ On a Cloudy Day: Floating solar drops to 0, but ocean wind, wave buoys, and subsea tidal turbines keep pumping electricity!", "☁️ En un día nublado: la solar flotante cae a 0, ¡pero el viento marino, las boyas de olas y las turbinas de marea siguen generando!"),
      L("🌊 On a Big Wave Day: Wave buoys and attenuator snakes surge to peak power, soaking up stored storm energy.", "🌊 En un día de olas grandes: las boyas y las serpientes atenuadoras suben a máxima potencia, aprovechando la energía de la tormenta."),
      L("⚓ The 24/7 Constant Kings: OTEC (using deep 4°C water) and Deep Current Kites run non-stop all day and all night, giving steady baseload power!", "⚓ Los reyes constantes 24/7: OTEC (con agua profunda a 4 °C) y las cometas de corriente profunda funcionan sin parar día y noche, ¡dando potencia base estable!")],
    weatherCheck: { cloudyDay: L("Floating solar stops. Wind, waves, tides, and OTEC keep running strong!", "La solar flotante se detiene. ¡Viento, olas, mareas y OTEC siguen fuertes!"), bigWaveDay: L("Wave converters hit 100% peak output!", "¡Los convertidores de olas llegan al 100% de su salida máxima!"), constant24_7: L("OTEC and Deep Currents produce steady, uninterrupted power 365 days a year.", "OTEC y las corrientes profundas producen potencia estable e ininterrumpida los 365 días del año.") },
    highSchoolAnalogy: L("Think of it like a balanced diet: Solar is a quick snack, waves and wind are energy bars, and deep ocean OTEC is your steady 3-meals-a-day baseline.", "Piensa en una dieta equilibrada: la solar es un tentempié, las olas y el viento son barritas energéticas y la OTEC profunda son tus 3 comidas fijas al día.") },
  { id: "kwh_and_electric_bills", unitNumber: 3, emoji: "⚡",
    title: L("What is a Kilowatt-Hour (kWh) & Your Electric Bill?", "¿Qué es un kilovatio-hora (kWh) y tu factura de luz?"),
    tagline: L("The challenge: Keeping power bills fair while paying for ocean tech.", "El reto: mantener las facturas justas mientras se paga la tecnología oceánica."),
    bigIdea: L("A kilowatt-hour (kWh) is the unit of electricity you buy. A typical family uses about 30 kWh per day (~900 kWh per month).", "Un kilovatio-hora (kWh) es la unidad de electricidad que compras. Una familia típica usa unos 30 kWh al día (~900 kWh al mes)."),
    quickTakeaways: [
      L("At $0.15/kWh, a household bill is $135/month. Affordable and fair!", "A $0,15/kWh, la factura de un hogar es de $135 al mes. ¡Asequible y justa!"),
      L("If you jack the price up to $0.28/kWh, bills jump to $250+/month — citizens get furious and approval plummets!", "Si subes el precio a $0,28/kWh, las facturas saltan a más de $250 al mes — ¡los ciudadanos se enfurecen y la aprobación se desploma!"),
      L("If you drop the price to $0.05/kWh, citizens are happy, but the city goes broke and cannot afford to repair damaged ocean turbines!", "Si bajas el precio a $0,05/kWh, los ciudadanos están contentos, ¡pero la ciudad quiebra y no puede reparar las turbinas dañadas!")],
    weatherCheck: { cloudyDay: L("Surplus energy stored in seabed batteries prevents expensive peak spikes.", "El excedente guardado en baterías del fondo evita picos de precio costosos."), bigWaveDay: L("Free wave energy creates cheap electricity!", "¡La energía gratuita de las olas crea electricidad barata!"), constant24_7: L("Baseload OTEC protects against price spikes when the wind stops.", "La OTEC de base protege contra picos de precio cuando se detiene el viento.") },
    highSchoolAnalogy: L("It is like running a pizza shop: If you sell pizza for $1, you run out of money to fix the oven. If you charge $50 a slice, nobody buys and people protest outside!", "Es como una pizzería: si vendes la pizza a $1, te quedas sin dinero para arreglar el horno. Si cobras $50 la porción, ¡nadie compra y la gente protesta afuera!") },
  { id: "technician_boat_and_maintenance", unitNumber: 4, emoji: "🚤",
    title: L("Technician Boats, Barnacles & The Budget", "Barcos de técnicos, percebes y el presupuesto"),
    tagline: L("Saltwater rusts metal and barnacles stick to blades. Keep your fleet maintained!", "El agua salada oxida el metal y los percebes se pegan a las palas. ¡Mantén tu flota!"),
    bigIdea: L("The ocean is wild: Barnacles and kelp (biofouling) cling to turbines, stealing 30% of their power until you send a service boat to scrub them clean.", "El océano es salvaje: percebes y algas (bioincrustación) se adhieren a las turbinas y les roban un 30% de potencia hasta que envías un barco de servicio a limpiarlas."),
    quickTakeaways: [
      L("Diver & ROV boat scrubs cost $3,500: Cleans barnacles and restores 100% speed.", "La limpieza con buzos y ROV cuesta $3.500: quita los percebes y restaura el 100% de la velocidad."),
      L("Full mechanical overhauls cost $12,000: Replaces sacrificial zinc anodes to stop rust.", "Las revisiones mecánicas completas cuestan $12.000: cambian los ánodos de zinc de sacrificio para frenar el óxido."),
      L("Golden Rule: Always keep emergency savings in the city treasury so you can send boats after big ocean storms!", "Regla de oro: ¡guarda siempre ahorros de emergencia en la tesorería para enviar barcos tras las grandes tormentas!")],
    weatherCheck: { cloudyDay: L("Service boats can still deploy safely in calm seas.", "Los barcos de servicio pueden salir con seguridad en mares en calma."), bigWaveDay: L("High waves stress equipment faster — inspect after storms!", "Las olas altas fatigan el equipo más rápido — ¡inspecciona tras las tormentas!"), constant24_7: L("Regular maintenance keeps constant baseload generators running for decades.", "El mantenimiento regular mantiene los generadores de base funcionando durante décadas.") },
    highSchoolAnalogy: L("Just like changing the oil on your car or scraping mud off your bike chain: If you ignore maintenance, the machine eventually breaks and costs 3× more to replace!", "Como cambiar el aceite del coche o limpiar el barro de la cadena de la bici: ¡si ignoras el mantenimiento, la máquina se rompe y cuesta 3× más reemplazarla!") },
  { id: "saving_the_land", unitNumber: 5, emoji: "🐠",
    title: L("Saving the Land: Zero Clearcutting & Artificial Reefs", "Salvar la tierra: cero talas rasas y arrecifes artificiales"),
    tagline: L("Why building in the sea protects forests, farms, and animals on land.", "Por qué construir en el mar protege bosques, granjas y animales en tierra."),
    bigIdea: L("To make 500 MW of solar or coal on land, you must clearcut 3,000 acres of trees or desert. In the ocean, 0 acres of land are destroyed!", "Para producir 500 MW de solar o carbón en tierra hay que talar 3.000 acres de árboles o desierto. ¡En el océano no se destruye ningún acre de tierra!"),
    quickTakeaways: [
      L("Zero land sprawl: Leaves coastal redwood forests, farms, and wildlife habitats completely wild.", "Cero expansión sobre la tierra: deja intactos bosques costeros, granjas y hábitats de fauna."),
      L("The Artificial Reef Bonus: Underwater turbine bases become homes for mussels, kelp, and baby cod fish!", "El bono del arrecife artificial: ¡las bases submarinas de las turbinas se vuelven hogar de mejillones, algas y bacalaos jóvenes!"),
      L("Safety Zones: Fishing nets that scrape the seabed are banned near power cables, creating safe nurseries for sea life.", "Zonas de seguridad: se prohíben las redes que rascan el fondo cerca de los cables, creando guarderías seguras para la vida marina.")],
    weatherCheck: { cloudyDay: L("Clean ocean energy produces 0 smoke, 0 smog, and 0 acid rain.", "La energía oceánica limpia produce 0 humo, 0 smog y 0 lluvia ácida."), bigWaveDay: L("Waves naturally clean water around the artificial reef structures.", "Las olas limpian de forma natural el agua alrededor de los arrecifes artificiales."), constant24_7: L("Replaces dirty coal and gas plants with 100% pure blue ocean power.", "Sustituye centrales sucias de carbón y gas por energía azul oceánica 100% pura.") },
    highSchoolAnalogy: L("Building on land is like putting a factory in your bedroom. Building offshore is like using the endless backyard of the ocean where fish can live on the foundations!", "Construir en tierra es como poner una fábrica en tu dormitorio. Construir en el mar es usar el patio infinito del océano, ¡donde los peces pueden vivir en las cimentaciones!") },
];

export const quizQuestions = () => [
  { id: "sq1", unit: L("Water Density", "Densidad del agua"), standard: "NGSS HS-PS3-1", correctIndex: 1,
    question: L("Why does moving ocean water produce way more energy than wind moving at the same speed?", "¿Por qué el agua oceánica en movimiento produce mucha más energía que el viento a la misma velocidad?"),
    options: [L("Seawater contains electricity naturally.", "El agua de mar contiene electricidad de forma natural."), L("Seawater is about 830 times heavier (denser) than air, packing huge kinetic force.", "El agua de mar es unas 830 veces más pesada (densa) que el aire, y concentra una enorme fuerza cinética."), L("Water is warmer than clouds.", "El agua es más cálida que las nubes."), L("Fish push the turbine blades to make them spin faster.", "Los peces empujan las palas para que giren más rápido.")],
    explanation: L("Bingo! Water is ~830× denser than air. A slow 5-knot tidal current has the energy punch of a 200+ mph hurricane!", "¡Exacto! El agua es ~830× más densa que el aire. ¡Una lenta corriente de 5 nudos tiene el golpe de energía de un huracán de más de 320 km/h!") },
  { id: "sq2", unit: L("Weather Matching", "Qué funciona con qué clima"), standard: "NGSS HS-ESS3-2", correctIndex: 2,
    question: L("It is a super cloudy and overcast day in Pacifica Bay. Which ocean energy source will drop to near zero output?", "Es un día muy nublado y cubierto en Pacifica Bay. ¿Qué fuente de energía oceánica caerá casi a cero?"),
    options: [L("Subsea Tidal Stream Turbine", "Turbina submarina de marea"), L("Point Absorber Wave Buoy", "Boya de olas de absorción puntual"), L("Offshore Floating Solar (FPV)", "Solar flotante marina (FPV)"), L("Ocean Thermal Energy Conversion (OTEC)", "Conversión de energía térmica oceánica (OTEC)")],
    explanation: L("Exactly! Floating solar needs direct sunlight. But wave buoys, tidal turbines, and OTEC keep pumping power right through the clouds!", "¡Exacto! La solar flotante necesita luz solar directa. ¡Pero las boyas, las turbinas de marea y la OTEC siguen generando con nubes!") },
  { id: "sq3", unit: L("Constant Baseload", "Base constante"), standard: "NGSS HS-PS3-3", correctIndex: 0,
    question: L("Which ocean energy technology runs CONSTANTLY 24 hours a day, 365 days a year, with zero weather drop-off?", "¿Qué tecnología de energía oceánica funciona de forma CONSTANTE 24 horas al día, 365 días al año, sin caída por el clima?"),
    options: [L("Ocean Thermal Energy Conversion (OTEC)", "Conversión de energía térmica oceánica (OTEC)"), L("Floating Solar Island", "Isla solar flotante"), L("Kite flying in the air", "Una cometa volando en el aire"), L("Surface Wave Buoy on a calm lake", "Boya de olas en un lago en calma")],
    explanation: L("Spot on! OTEC uses the permanent 20°C temperature difference between warm surface water and 4°C deep ocean water to generate steady 24/7 baseload power!", "¡Justo! La OTEC usa la diferencia permanente de 20 °C entre el agua cálida de la superficie y el agua profunda a 4 °C para generar potencia base estable 24/7.") },
  { id: "sq4", unit: L("Electric Bills (kWh)", "Facturas de luz (kWh)"), standard: "NGSS HS-ETS1-3", correctIndex: 1,
    question: L("If the city sets its electricity price to $0.35 per kWh, what will happen?", "Si la ciudad fija el precio de la electricidad en $0,35 por kWh, ¿qué pasará?"),
    options: [L("Citizens celebrate because high numbers are good.", "Los ciudadanos celebran porque los números altos son buenos."), L("Family monthly bills double to over $300, citizen happiness collapses, and protests start!", "Las facturas mensuales se duplican a más de $300, la felicidad ciudadana se derrumba y empiezan las protestas."), L("The turbines spin twice as fast.", "Las turbinas giran el doble de rápido."), L("The clouds disappear automatically.", "Las nubes desaparecen automáticamente.")],
    explanation: L("Correct! Keeping power prices fair ($0.12 - $0.16/kWh) keeps citizens happy while giving the city enough money to maintain the fleet.", "¡Correcto! Mantener precios justos ($0,12 – $0,16/kWh) mantiene contentos a los ciudadanos y da a la ciudad dinero para mantener la flota.") },
  { id: "sq5", unit: L("Maintenance Boat", "Barco de mantenimiento"), standard: "NGSS HS-LS2-7", correctIndex: 1,
    question: L("Why do technicians need to take a service boat out to scrub ocean turbines?", "¿Por qué los técnicos deben salir en un barco de servicio a limpiar las turbinas oceánicas?"),
    options: [L("To repaint the logo every Friday.", "Para repintar el logotipo cada viernes."), L("To remove barnacles and seaweed (biofouling) that slow down the blades and steal 30% of their power.", "Para quitar percebes y algas (bioincrustación) que frenan las palas y les roban un 30% de potencia."), L("To feed the dolphins living inside the tower.", "Para dar de comer a los delfines que viven dentro de la torre."), L("To install video game consoles inside the nacelle.", "Para instalar consolas de videojuegos dentro de la góndola.")],
    explanation: L("Right on! Barnacles and sea kelp cling to moving parts in saltwater. Regular boat maintenance keeps the gear running at 100% efficiency!", "¡Así es! Percebes y algas se pegan a las piezas móviles en agua salada. ¡El mantenimiento regular mantiene el equipo al 100% de eficiencia!") },
];

/* ---------- Missions ---------- */
const WAVE_SET = WAVE_IDS;
export const scenarios = () => [
  { id: "scenario_tutorial", badge: L("Beginner Cadet", "Cadete principiante"),
    title: L("Mission 1: The Blue Energy Frontier", "Misión 1: La frontera de la energía azul"),
    description: L("Welcome to Pacifica Bay! The coastal city currently uses ~10 MW. Build your first ocean array, keep power bills under $150/month ($0.16/kWh), and dispatch your first service boat to clean barnacles!", "¡Bienvenido a Pacifica Bay! La ciudad costera usa ~10 MW. Construye tu primer parque oceánico, mantén las facturas bajo $150 al mes ($0,16/kWh) y envía tu primer barco de servicio a limpiar percebes."),
    targetDurationDays: 14, startingFunds: 550000,
    startingTech: ["offshore_wind_fixed", "offshore_wind_floating", "point_absorber", "oscillating_water_column", "wave_surge_converter", "tidal_stream_turbine", "subsea_battery"],
    startingDevices: [{ techId: "point_absorber", xRatio: 0.22 }, { techId: "offshore_wind_fixed", xRatio: 0.36 }, { techId: "tidal_stream_turbine", xRatio: 0.54 }, { techId: "offshore_wind_floating", xRatio: 0.78 }],
    objectives: [
      { text: L("Deploy at least 1 Subsea Tidal Stream Turbine and 1 Wave Converter", "Despliega al menos 1 turbina submarina de marea y 1 convertidor de olas"), completed: (g, d) => d.some(x => x.techId === "tidal_stream_turbine") && d.some(x => WAVE_SET.includes(x.techId)) },
      { text: L("Keep citizen electricity rate between $0.12 and $0.17/kWh with citizen happiness > 75%", "Mantén la tarifa entre $0,12 y $0,17/kWh con felicidad ciudadana > 75%"), completed: g => g.tariffPerKWh >= 0.12 && g.tariffPerKWh <= 0.17 && g.citizenApproval >= 75 },
      { text: L("Avoid city blackouts and maintain a treasury reserve > $150,000", "Evita apagones en la ciudad y mantén una reserva en tesorería > $150.000"), completed: g => g.blackoutHours === 0 && g.funds >= 150000 },
    ],
    learningPrompt: L("Observe how tidal turbines keep spinning steadily even if the wind slows down, and test how changing your kWh price affects citizen happiness!", "Observa cómo las turbinas de marea siguen girando aunque el viento afloje, ¡y prueba cómo cambiar tu precio por kWh afecta la felicidad ciudadana!") },
  { id: "scenario_doldrums", badge: L("Weather Challenge", "Reto climático"),
    title: L("Mission 2: Cloudy Skies & Wind Doldrums", "Misión 2: Cielos nublados y calmas de viento"),
    description: L("A heavy overcast cloud bank and calm wind ridge have parked over the bay! Floating solar and wind drop. Rely on ocean swell wave buoys, subsea tidal turbines, and 24/7 constant baseload to keep the lights on!", "¡Un banco de nubes espeso y una cresta de calma de viento se han instalado sobre la bahía! La solar flotante y el viento caen. ¡Confía en las boyas de oleaje, las turbinas de marea y la base constante 24/7 para mantener las luces encendidas!"),
    targetDurationDays: 10, startingFunds: 420000,
    startingTech: ["offshore_wind_fixed", "point_absorber", "oscillating_water_column", "wave_surge_converter", "tidal_stream_turbine", "tidal_kite", "subsea_battery", "wave_attenuator"],
    startingDevices: [{ techId: "point_absorber", xRatio: 0.22 }, { techId: "offshore_wind_fixed", xRatio: 0.38 }, { techId: "subsea_battery", xRatio: 0.50 }, { techId: "tidal_kite", xRatio: 0.72 }, { techId: "wave_attenuator", xRatio: 0.86 }],
    objectives: [
      { text: L("Build a diversified mix with at least 2 Subsea Tidal Turbines or Tidal Kites", "Construye una mezcla diversificada con al menos 2 turbinas de marea o cometas de marea"), completed: (g, d) => d.filter(x => ["tidal_stream_turbine", "tidal_kite"].includes(x.techId)).length >= 2 },
      { text: L("Survive with fewer than 2 hours of blackout during calm weather", "Sobrevive con menos de 2 horas de apagón durante el tiempo en calma"), completed: g => g.blackoutHours <= 2 },
      { text: L("Accumulate at least 120,000 kWh of total ocean energy delivered", "Acumula al menos 120.000 kWh de energía oceánica entregada"), completed: g => g.totalKWhGenerated >= 120000 },
    ],
    specialEventDescription: L("Winds are weak and clouds block solar. Harness dense moving ocean water!", "Los vientos son débiles y las nubes bloquean la solar. ¡Aprovecha el agua oceánica densa en movimiento!"),
    presetOnStart: "cloudy",
    learningPrompt: L("Why is energy diversification essential? Relying on only one source causes blackouts when weather changes.", "¿Por qué es esencial diversificar la energía? Depender de una sola fuente causa apagones cuando cambia el clima.") },
  { id: "scenario_metropolis", badge: L("Master Director", "Director maestro"),
    title: L("Mission 3: Zero-Land Metropolis 2030", "Misión 3: Metrópolis sin tierra 2030"),
    description: L("Pacifica Bay has outlawed all land power plants to save redwood forests! Build deep floating wind, 24/7 constant OTEC baseload, and an offshore grid to achieve total energy independence.", "¡Pacifica Bay ha prohibido todas las centrales en tierra para salvar los bosques de secuoyas! Construye eólica flotante profunda, base constante OTEC 24/7 y una red marina para lograr la independencia energética total."),
    targetDurationDays: 20, startingFunds: 750000,
    startingTech: ["offshore_wind_fixed", "offshore_wind_floating", "point_absorber", "oscillating_water_column", "wave_surge_converter", "wave_attenuator", "tidal_stream_turbine", "tidal_kite", "salinity_gradient", "floating_marine_solar", "otec_platform", "subsea_battery", "subsea_hydrogen_hub"],
    startingDevices: [{ techId: "offshore_wind_fixed", xRatio: 0.30 }, { techId: "tidal_stream_turbine", xRatio: 0.44 }, { techId: "subsea_battery", xRatio: 0.54 }, { techId: "otec_platform", xRatio: 0.76 }, { techId: "offshore_wind_floating", xRatio: 0.88 }],
    objectives: [
      { text: L("Deploy a 24/7 Constant Baseload facility (OTEC or Salinity Gradient Plant)", "Despliega una instalación de base constante 24/7 (OTEC o planta de gradiente salino)"), completed: (g, d) => d.some(x => x.techId === "otec_platform" || x.techId === "salinity_gradient") },
      { text: L("Spare at least 350 acres of land from deforestation & avoid 2,000 tons of CO2", "Ahorra al menos 350 acres de tierra de la deforestación y evita 2.000 toneladas de CO2"), completed: g => g.landSavedAcres >= 350 && g.co2PreventedTons >= 2000 },
      { text: L("Keep tariff under $0.16/kWh with citizen happiness > 80% and treasury > $200,000", "Mantén la tarifa bajo $0,16/kWh con felicidad ciudadana > 80% y tesorería > $200.000"), completed: g => g.tariffPerKWh <= 0.16 && g.citizenApproval >= 80 && g.funds >= 200000 },
    ],
    learningPrompt: L("Deep ocean currents and OTEC provide steady 24/7 baseload electricity without burning a single piece of coal or clearing a single acre of forest on land.", "Las corrientes profundas y la OTEC dan electricidad base estable 24/7 sin quemar ni un trozo de carbón ni talar un acre de bosque en tierra.") },
];

export const WEATHER_PRESETS = () => [
  { id: "normal", label: L("☀️ Clear Normal", "☀️ Despejado normal"), title: L("Standard sunny ocean conditions", "Condiciones oceánicas soleadas normales") },
  { id: "cloudy", label: L("☁️ Cloudy Day", "☁️ Día nublado"), title: L("Cloudy overcast: Solar drops to 0, wave & tide shine!", "Cubierto: ¡la solar cae a 0, las olas y mareas brillan!") },
  { id: "big_waves", label: L("🌊 Big Wave Swell", "🌊 Gran oleaje"), title: L("Big waves: Wave buoys hit peak generation!", "Olas grandes: ¡las boyas llegan a su generación máxima!") },
  { id: "calm_wind", label: L("🌬️ Slack Wind", "🌬️ Viento en calma"), title: L("Calm doldrums: Wind drops, tests 24/7 constant baseload!", "Calmas: ¡el viento cae y se prueba la base constante 24/7!") },
  { id: "spring_tide", label: L("🌙 Spring Tide", "🌙 Marea viva"), title: L("Full Moon: Maximum tidal stream current!", "Luna llena: ¡máxima corriente de marea!") },
];
