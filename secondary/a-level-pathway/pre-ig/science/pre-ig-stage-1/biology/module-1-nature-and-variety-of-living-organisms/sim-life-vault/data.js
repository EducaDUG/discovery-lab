/* Life Vault — content data, local to this activity (CLAUDE.md §2: content
   lives in the activity's own folder). Every photo here is vendored in
   photos/ and was licence-checked on its own Wikimedia Commons file page
   (2026-10-14). Credits render on the page via creditLine(). */
import { getLang } from "../../../../../../../../engine/i18n.js?v=9";

export const L = (en, es) => (getLang() === "es" ? es : en);
export const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";

const BYSA3 = "https://creativecommons.org/licenses/by-sa/3.0/";
const BYSA4 = "https://creativecommons.org/licenses/by-sa/4.0/";
const BYSA2 = "https://creativecommons.org/licenses/by-sa/2.0/";
const BY2 = "https://creativecommons.org/licenses/by/2.0/";
const BY4 = "https://creativecommons.org/licenses/by/4.0/";
const CC0 = "https://creativecommons.org/publicdomain/zero/1.0/";

export const CREDITS = {
  jellyfish:      { who: "Alexander Vasenin", lic: "CC BY-SA 3.0", url: BYSA3 },
  yeast:          { who: "Masur", lic: "public domain" },
  "bread-mould":  { who: "WDKeeper", lic: "CC BY-SA 4.0", url: BYSA4 },
  chlorella:      { who: "NEON_ja", lic: "CC BY-SA 3.0", url: BYSA3 },
  lactobacillus:  { who: "Mogana Das Murtey & Patchamuthu Ramasamy", lic: "CC BY-SA 3.0", url: BYSA3 },
  influenza:      { who: "NIH Image Gallery", lic: "public domain" },
  moss:           { who: "Ellyne Geurts", lic: "CC0", url: CC0 },
  maize:          { who: "Ay treasure", lic: "CC BY-SA 4.0", url: BYSA4 },
  mosquito:       { who: "US Department of Agriculture", lic: "public domain" },
  "polar-bear":   { who: "Arturo de Frias Marques", lic: "CC BY-SA 4.0", url: BYSA4 },
  "candle-flame": { who: "domdomegg", lic: "CC BY 4.0", url: BY4 },
  "salt-crystal": { who: "James St. John", lic: "CC BY 2.0", url: BY2 },
  mushroom:       { who: "Mike Pennington", lic: "CC BY-SA 2.0", url: BYSA2 },
  amoeba:         { who: "Cymothoa exigua", lic: "CC BY-SA 3.0", url: BYSA3 },
  fern:           { who: "Sergio Boscaino", lic: "CC BY 2.0", url: BY2 },
  "bacteria-ecoli": { who: "Janice Haney Carr / CDC", lic: "public domain" },
};

export function creditLine(ids) {
  return L("Photos (Wikimedia Commons): ", "Fotos (Wikimedia Commons): ") + ids.map(id => {
    const c = CREDITS[id]; if (!c) return "";
    const lic = c.url ? `<a href="${c.url}" target="_blank" rel="noopener noreferrer">${c.lic}</a>` : c.lic;
    return `${SPEC[id] ? SPEC[id].name() : id} — ${c.who}, ${lic}`;
  }).join(" · ");
}

export const img = id => `photos/${id}.jpg`;

/* ---- the six destinations: five kingdoms + the separate virus group ---- */
export const GROUPS = {
  plant:      { name: () => L("Plants", "Plantas"), color: "#3FAE5A", hex: 0x3fae5a },
  animal:     { name: () => L("Animals", "Animales"), color: "#E0644B", hex: 0xe0644b },
  fungi:      { name: () => L("Fungi", "Hongos"), color: "#C9932E", hex: 0xc9932e },
  protoctist: { name: () => L("Protoctists", "Protoctistas"), color: "#2BA6B8", hex: 0x2ba6b8 },
  bacteria:   { name: () => L("Bacteria", "Bacterias"), color: "#8A63D2", hex: 0x8a63d2 },
  virus:      { name: () => L("Viruses (not living)", "Virus (no vivos)"), color: "#D9475E", hex: 0xd9475e },
};
export const GROUP_ORDER = ["plant", "animal", "fungi", "protoctist", "bacteria", "virus"];

/* ---- specimens. key = answers to the five Kingdom Key questions ---- */
export const SPEC = {
  maize: { group: "plant", name: () => L("Maize plant", "Planta de maíz"),
    key: { cells: 1, nucleus: 1, chitin: 0, multi: 1, chloro: 1 },
    facts: () => [L("Made of millions of cells", "Formada por millones de células"), L("Every cell has a nucleus", "Cada célula tiene núcleo"),
      L("Cell walls made of cellulose (not chitin)", "Paredes celulares de celulosa (no de quitina)"), L("Green leaves packed with chloroplasts", "Hojas verdes llenas de cloroplastos")],
    hints: () => [L("Its cells store sugar as starch.", "Sus células almacenan azúcar como almidón."), L("A flowering plant that makes its own food.", "Una planta con flores que fabrica su propio alimento.")] },
  moss: { group: "plant", name: () => L("Haircap moss", "Musgo"),
    key: { cells: 1, nucleus: 1, chitin: 0, multi: 1, chloro: 1 },
    facts: () => [L("Small, but made of many cells", "Pequeño, pero formado por muchas células"), L("Cells have a nucleus", "Sus células tienen núcleo"),
      L("Cellulose cell walls", "Paredes celulares de celulosa"), L("Photosynthesises with chloroplasts", "Hace la fotosíntesis con cloroplastos")],
    hints: () => [L("A non-flowering plant with cellulose walls.", "Una planta sin flores con paredes de celulosa."), L("Green, multicellular, makes its own food.", "Verde, pluricelular, fabrica su alimento.")] },
  fern: { group: "plant", name: () => L("Fern", "Helecho"),
    key: { cells: 1, nucleus: 1, chitin: 0, multi: 1, chloro: 1 },
    facts: () => [L("Multicellular fronds", "Frondas pluricelulares"), L("Cells have a nucleus", "Sus células tienen núcleo"),
      L("Cellulose cell walls", "Paredes celulares de celulosa"), L("Chloroplasts in every green cell", "Cloroplastos en cada célula verde")],
    hints: () => [L("A non-flowering plant: no flowers, but chloroplasts.", "Una planta sin flores, pero con cloroplastos."), L("Autotrophic: it photosynthesises.", "Autótrofo: hace la fotosíntesis.")] },
  mosquito: { group: "animal", name: () => L("Mosquito", "Mosquito"),
    key: { cells: 1, nucleus: 1, chitin: 0, multi: 1, chloro: 0 },
    facts: () => [L("Multicellular insect", "Insecto pluricelular"), L("Cells have a nucleus", "Sus células tienen núcleo"),
      L("Its cells have NO cell wall", "Sus células NO tienen pared celular"), L("No chloroplasts: feeds on nectar and blood", "Sin cloroplastos: se alimenta de néctar y sangre")],
    hints: () => [L("An invertebrate with nervous coordination.", "Un invertebrado con coordinación nerviosa."), L("Heterotrophic: it feeds on other organisms.", "Heterótrofo: se alimenta de otros organismos.")] },
  "polar-bear": { group: "animal", name: () => L("Polar bear", "Oso polar"),
    key: { cells: 1, nucleus: 1, chitin: 0, multi: 1, chloro: 0 },
    facts: () => [L("Multicellular vertebrate", "Vertebrado pluricelular"), L("Cells have a nucleus", "Sus células tienen núcleo"),
      L("No cell walls", "Sin paredes celulares"), L("No chloroplasts: hunts seals", "Sin cloroplastos: caza focas")],
    hints: () => [L("Stores carbohydrate as glycogen, no cell walls.", "Almacena carbohidratos como glucógeno, sin paredes celulares."), L("A mammal that moves from place to place.", "Un mamífero que se desplaza de un lugar a otro.")] },
  jellyfish: { group: "animal", name: () => L("Moon jellyfish", "Medusa luna"),
    key: { cells: 1, nucleus: 1, chitin: 0, multi: 1, chloro: 0 },
    facts: () => [L("Multicellular, with a nerve net", "Pluricelular, con red nerviosa"), L("Cells have a nucleus", "Sus células tienen núcleo"),
      L("No cell walls", "Sin paredes celulares"), L("No chloroplasts: catches small fish", "Sin cloroplastos: atrapa peces pequeños")],
    hints: () => [L("Swims by pulsing its bell — no cell walls.", "Nada contrayendo su campana; sin paredes celulares."), L("Its nerve net coordinates responses.", "Su red nerviosa coordina las respuestas.")] },
  mushroom: { group: "fungi", name: () => L("Field mushroom", "Champiñón"),
    key: { cells: 1, nucleus: 1, chitin: 1, multi: 1, chloro: 0 },
    facts: () => [L("Multicellular: made of packed threads (hyphae)", "Pluricelular: hecho de hilos apretados (hifas)"), L("Hyphae contain many nuclei", "Las hifas tienen muchos núcleos"),
      L("Cell walls made of chitin", "Paredes celulares de quitina"), L("No chloroplasts: digests food outside its body", "Sin cloroplastos: digiere el alimento fuera de su cuerpo")],
    hints: () => [L("Cell walls of chitin; stores glycogen.", "Paredes de quitina; almacena glucógeno."), L("Feeds by saprophytic nutrition.", "Se alimenta por nutrición saprofítica.")] },
  "bread-mould": { group: "fungi", name: () => L("Bread mould", "Moho del pan"),
    key: { cells: 1, nucleus: 1, chitin: 1, multi: 1, chloro: 0 },
    facts: () => [L("A fuzzy network (mycelium) of hyphae", "Una red algodonosa (micelio) de hifas"), L("Many nuclei in each hypha", "Muchos núcleos en cada hifa"),
      L("Chitin cell walls", "Paredes celulares de quitina"), L("Releases enzymes onto bread, then absorbs it", "Libera enzimas sobre el pan y luego lo absorbe")],
    hints: () => [L("A mycelium of hyphae growing on old bread.", "Un micelio de hifas creciendo en pan viejo."), L("Uses extracellular enzymes to feed.", "Usa enzimas extracelulares para alimentarse.")] },
  yeast: { group: "fungi", name: () => L("Baker's yeast", "Levadura"),
    key: { cells: 1, nucleus: 1, chitin: 1, multi: 0, chloro: 0 },
    facts: () => [L("A single cell (unicellular)", "Una sola célula (unicelular)"), L("Has a nucleus", "Tiene núcleo"),
      L("Cell wall made of chitin", "Pared celular de quitina"), L("No chloroplasts: feeds on sugar", "Sin cloroplastos: se alimenta de azúcar")],
    hints: () => [L("A single-celled organism with a chitin wall.", "Un organismo unicelular con pared de quitina."), L("Makes bread rise — and reproduces by budding.", "Hace subir el pan y se reproduce por gemación.")] },
  amoeba: { group: "protoctist", name: () => L("Amoeba", "Ameba"),
    key: { cells: 1, nucleus: 1, chitin: 0, multi: 0, chloro: 0 },
    facts: () => [L("A single cell", "Una sola célula"), L("Has a nucleus", "Tiene núcleo"),
      L("No cell wall", "Sin pared celular"), L("Engulfs food — animal-like", "Engulle su alimento: parecido a un animal")],
    hints: () => [L("Single-celled and animal-like, from pond water.", "Unicelular y parecido a un animal, del agua de charca."), L("From the 'dustbin' kingdom.", "Del reino 'cajón de sastre'.")] },
  chlorella: { group: "protoctist", name: () => L("Chlorella", "Chlorella"),
    key: { cells: 1, nucleus: 1, chitin: 0, multi: 0, chloro: 0 },
    facts: () => [L("A single cell, about 5 µm wide", "Una sola célula, de unos 5 µm"), L("Has a nucleus", "Tiene núcleo"),
      L("Has a cell wall, but NOT made of chitin", "Tiene pared celular, pero NO de quitina"), L("Has chloroplasts — plant-like, but only ONE cell", "Tiene cloroplastos (como una planta), pero es UNA sola célula")],
    hints: () => [L("Single-celled but plant-like: it has chloroplasts.", "Unicelular pero parecido a una planta: tiene cloroplastos."), L("Turns pond water green.", "Vuelve verde el agua de las charcas.")] },
  lactobacillus: { group: "bacteria", name: () => L("Lactobacillus (yoghurt)", "Lactobacillus (yogur)"),
    key: { cells: 1, nucleus: 0, chitin: 0, multi: 0, chloro: 0 },
    facts: () => [L("A tiny single cell", "Una célula diminuta"), L("NO nucleus: one circular chromosome", "SIN núcleo: un cromosoma circular"),
      L("Cell wall made of peptidoglycan", "Pared celular de peptidoglucano"), L("Turns milk into yoghurt", "Convierte la leche en yogur")],
    hints: () => [L("Prokaryotic: its cells have no nucleus.", "Procariota: sus células no tienen núcleo."), L("Used to make yoghurt from milk.", "Se usa para hacer yogur con leche.")] },
  "bacteria-ecoli": { group: "bacteria", name: () => L("Rod bacteria (E. coli)", "Bacterias bacilo (E. coli)"),
    key: { cells: 1, nucleus: 0, chitin: 0, multi: 0, chloro: 0 },
    facts: () => [L("Rod-shaped single cells", "Células únicas con forma de bastón"), L("No nucleus — DNA loose in the cytoplasm", "Sin núcleo: ADN suelto en el citoplasma"),
      L("Peptidoglycan cell wall; some have plasmids", "Pared de peptidoglucano; algunas tienen plásmidos"), L("Some have flagella to swim", "Algunas tienen flagelos para nadar")],
    hints: () => [L("Cell wall of peptidoglycan; plasmids inside.", "Pared de peptidoglucano; plásmidos dentro."), L("Lives in your gut — a prokaryote.", "Vive en tu intestino: un procariota.")] },
  influenza: { group: "virus", name: () => L("Influenza virus", "Virus de la gripe"),
    key: { cells: 0, nucleus: 0, chitin: 0, multi: 0, chloro: 0 },
    facts: () => [L("NOT made of cells", "NO está formado por células"), L("Just RNA inside a protein coat", "Solo ARN dentro de una cubierta de proteína"),
      L("Much smaller than a bacterium", "Mucho más pequeño que una bacteria"), L("Can only reproduce inside a host cell", "Solo puede reproducirse dentro de una célula huésped")],
    hints: () => [L("Genetic material in a protein coat — no cells.", "Material genético en una cubierta de proteína; sin células."), L("A parasite that causes the flu.", "Un parásito que causa la gripe.")] },
  /* non-living samples: scanned in Station 1 only, never classified */
  "candle-flame": { group: null, name: () => L("Candle flame", "Llama de vela"), hints: () => [] },
  "salt-crystal": { group: null, name: () => L("Salt crystal", "Cristal de sal"), hints: () => [] },
};

/* ---- Kingdom Key: five yes/no questions, a real dichotomous key ---- */
export const KEY_Q = {
  cells:   { s: () => L("Cells", "Células"), q: () => L("Is it made of cells?", "¿Está formado por células?"), yes: "nucleus", no: "@virus" },
  nucleus: { s: () => L("Nucleus", "Núcleo"), q: () => L("Do its cells have a nucleus?", "¿Sus células tienen núcleo?"), yes: "chitin", no: "@bacteria" },
  chitin:  { s: () => L("Chitin walls", "Paredes de quitina"), q: () => L("Are its cell walls made of chitin?", "¿Sus paredes celulares son de quitina?"), yes: "@fungi", no: "multi" },
  multi:   { s: () => L("Many cells", "Pluricelular"), q: () => L("Is it multicellular (made of many cells)?", "¿Es pluricelular (muchas células)?"), yes: "chloro", no: "@protoctist" },
  chloro:  { s: () => L("Chloroplasts + cellulose", "Cloroplastos + celulosa"), q: () => L("Does it have chloroplasts AND cellulose cell walls?", "¿Tiene cloroplastos Y paredes de celulosa?"), yes: "@plant", no: "@animal" },
};
export const KEY_ORDER = ["maize", "yeast", "influenza", "mosquito", "chlorella", "lactobacillus", "bread-mould", "amoeba", "polar-bear", "moss", "mushroom", "bacteria-ecoli", "jellyfish", "fern"];

/* ---- Life-Signs Scanner: MRS C GREN ---- */
export const PROCESSES = [
  { id: "movement",     letter: "M", name: () => L("Movement", "Movimiento"),        icon: "M" },
  { id: "reproduction", letter: "R", name: () => L("Reproduction", "Reproducción"),  icon: "R" },
  { id: "sensitivity",  letter: "S", name: () => L("Sensitivity", "Sensibilidad"),   icon: "S" },
  { id: "control",      letter: "C", name: () => L("Control", "Control"),            icon: "C" },
  { id: "growth",       letter: "G", name: () => L("Growth", "Crecimiento"),         icon: "G" },
  { id: "respiration",  letter: "R", name: () => L("Respiration", "Respiración"),    icon: "R" },
  { id: "excretion",    letter: "E", name: () => L("Excretion", "Excreción"),        icon: "E" },
  { id: "nutrition",    letter: "N", name: () => L("Nutrition", "Nutrición"),        icon: "N" },
];
export const PROCESS_DEF = {
  movement: () => L("A change in position by an organism, or part of one.", "Un cambio de posición de un organismo, o de una parte de él."),
  reproduction: () => L("Producing offspring.", "Producir descendencia."),
  sensitivity: () => L("Detecting changes in the surroundings (stimuli) and responding.", "Detectar cambios en el entorno (estímulos) y responder."),
  control: () => L("Keeping internal conditions steady.", "Mantener estables las condiciones internas."),
  growth: () => L("A permanent increase in size.", "Un aumento permanente de tamaño."),
  respiration: () => L("A chemical reaction in cells that releases energy from food.", "Una reacción química en las células que libera energía del alimento."),
  excretion: () => L("Removing toxic or waste products.", "Eliminar productos tóxicos o de desecho."),
  nutrition: () => L("Making food or taking it in from other organisms.", "Fabricar alimento o tomarlo de otros organismos."),
};

const Y = (en, es) => ({ s: "yes", n: () => L(en, es) });
const K = (en, es) => ({ s: "look", n: () => L(en, es) });
const N = (en, es) => ({ s: "no", n: () => L(en, es) });

export const SCAN = {
  jellyfish: { verdict: "living", r: {
    movement: Y("Swims by rhythmic pulses of its bell.", "Nada con pulsaciones rítmicas de su campana."),
    reproduction: Y("Releases eggs and sperm into the water — some can even clone themselves.", "Libera óvulos y espermatozoides al agua; algunas incluso se clonan."),
    sensitivity: Y("Its nerve net detects touch and coordinates a response.", "Su red nerviosa detecta el tacto y coordina una respuesta."),
    control: Y("Keeps the water and salt balance inside its cells steady.", "Mantiene estable el equilibrio de agua y sales en sus células."),
    growth: Y("Grows from a tiny larva into an adult bell.", "Crece desde una larva diminuta hasta una campana adulta."),
    respiration: Y("Takes oxygen straight from the water into its cells to release energy.", "Toma oxígeno directamente del agua hacia sus células para liberar energía."),
    excretion: Y("Releases carbon dioxide into the water by diffusion.", "Libera dióxido de carbono al agua por difusión."),
    nutrition: Y("Catches small fish with its stinging tentacles.", "Atrapa peces pequeños con sus tentáculos urticantes."),
  } },
  maize: { verdict: "living", r: {
    movement: Y("Leaves and shoots slowly turn towards light — movement of part of an organism.", "Hojas y tallos giran despacio hacia la luz: movimiento de una parte del organismo."),
    reproduction: Y("Makes seeds in its cobs.", "Produce semillas en sus mazorcas."),
    sensitivity: Y("Shoots grow towards light; roots grow down with gravity.", "Los tallos crecen hacia la luz; las raíces hacia abajo con la gravedad."),
    control: Y("Closes its stomata to control water loss.", "Cierra sus estomas para controlar la pérdida de agua."),
    growth: Y("Grows from one seed into a plant 2 m tall.", "Crece de una semilla a una planta de 2 m."),
    respiration: Y("Every cell respires to release energy, day and night.", "Cada célula respira para liberar energía, de día y de noche."),
    excretion: Y("Gets rid of waste oxygen and carbon dioxide through its leaves.", "Elimina oxígeno y dióxido de carbono de desecho por sus hojas."),
    nutrition: Y("Makes its own food by photosynthesis.", "Fabrica su propio alimento por fotosíntesis."),
  } },
  "candle-flame": { verdict: "nonliving", r: {
    movement: K("Flickers — but only because hot gas rises. It cannot move itself.", "Parpadea, pero solo porque el gas caliente sube. No se mueve por sí misma."),
    reproduction: N("Cannot make offspring. A new flame needs fuel, oxygen and heat brought to it.", "No produce descendencia. Una llama nueva necesita que le traigan combustible, oxígeno y calor."),
    sensitivity: N("Does not detect or respond to anything — a draught simply pushes it.", "No detecta ni responde a nada: una corriente simplemente la empuja."),
    control: N("Cannot keep any internal conditions steady.", "No puede mantener estables condiciones internas."),
    growth: K("Gets bigger with more fuel — but it makes no new cells.", "Se agranda con más combustible, pero no forma células nuevas."),
    respiration: K("Uses oxygen and releases energy — but that is burning, not a reaction inside cells.", "Usa oxígeno y libera energía, pero es combustión, no una reacción dentro de células."),
    excretion: K("Gives off carbon dioxide and water — but there are no cells making waste.", "Desprende dióxido de carbono y agua, pero no hay células que produzcan desechos."),
    nutrition: K("'Uses up' wax as fuel — but never takes in food to build cells.", "'Consume' cera como combustible, pero nunca toma alimento para formar células."),
  } },
  "salt-crystal": { verdict: "nonliving", r: {
    movement: N("Never moves on its own.", "Nunca se mueve por sí mismo."),
    reproduction: N("Cannot produce offspring.", "No puede producir descendencia."),
    sensitivity: N("Does not respond to light, touch or heat.", "No responde a la luz, el tacto ni el calor."),
    control: N("Has no internal conditions to control.", "No tiene condiciones internas que controlar."),
    growth: K("Grows — but only by salt sticking to its outside from salty water, not by cells dividing.", "Crece, pero solo porque la sal del agua salada se pega por fuera, no porque se dividan células."),
    respiration: N("No cells, so no respiration.", "Sin células, no hay respiración."),
    excretion: N("Produces no waste.", "No produce desechos."),
    nutrition: N("Takes in no food.", "No toma alimento."),
  } },
  influenza: { verdict: "virus", r: {
    movement: N("Cannot move itself — it drifts in droplets of air and mucus.", "No se mueve por sí mismo: viaja en gotitas de aire y mucosidad."),
    reproduction: K("Copies itself ONLY inside a host cell, using the cell's machinery — never on its own.", "Se copia SOLO dentro de una célula huésped, usando su maquinaria; nunca por sí mismo."),
    sensitivity: N("Does not detect or respond to its surroundings.", "No detecta ni responde a su entorno."),
    control: N("Has no internal conditions to control.", "No tiene condiciones internas que controlar."),
    growth: N("Does not grow — new viruses are assembled at full size.", "No crece: los virus nuevos se ensamblan ya a tamaño completo."),
    respiration: N("No cells, so no respiration.", "Sin células, no hay respiración."),
    excretion: N("Produces no waste of its own.", "No produce desechos propios."),
    nutrition: N("Does not feed.", "No se alimenta."),
  } },
};
export const SCAN_ORDER = ["jellyfish", "candle-flame", "maize", "influenza", "salt-crystal"];
export const VERDICTS = {
  living: () => L("Living organism", "Organismo vivo"),
  nonliving: () => L("Non-living", "No vivo"),
  virus: () => L("Virus — not a living organism", "Virus: no es un organismo vivo"),
};

/* ---- Cell Builder (Bio-Printer) ---- */
export const BUILD_ORDERS = [
  { id: "plant", spec: "maize", shape: "box", name: () => L("a plant cell (maize leaf)", "una célula vegetal (hoja de maíz)"),
    want: { membrane: 1, nucleus: 1, wall: "cellulose", chloro: 1, store: "starch", plasmid: 0, capsid: 0 } },
  { id: "fungi", spec: "yeast", shape: "oval", name: () => L("a fungus cell (yeast)", "una célula de hongo (levadura)"),
    want: { membrane: 1, nucleus: 1, wall: "chitin", chloro: 0, store: "glycogen", plasmid: 0, capsid: 0 } },
  { id: "bacteria", spec: "lactobacillus", shape: "rod", name: () => L("a bacterium carrying plasmids (Lactobacillus)", "una bacteria con plásmidos (Lactobacillus)"),
    want: { membrane: 1, nucleus: 0, wall: "peptidoglycan", chloro: 0, store: null, plasmid: 1, capsid: 0 } },
  { id: "animal", spec: "polar-bear", shape: "blob", name: () => L("an animal cell (polar bear muscle)", "una célula animal (músculo de oso polar)"),
    want: { membrane: 1, nucleus: 1, wall: "none", chloro: 0, store: "glycogen", plasmid: 0, capsid: 0 } },
  { id: "virus", spec: "influenza", shape: "virus", name: () => L("a virus particle (influenza)", "una partícula de virus (gripe)"),
    want: { membrane: 0, nucleus: 0, wall: "none", chloro: 0, store: "none", plasmid: 0, capsid: 1 } },
];
export const PART_HOOK = {
  membrane: (w) => w ? L("Every cell is wrapped in a cell membrane.", "Toda célula está rodeada por una membrana celular.")
                     : L("A virus is NOT a cell — no membrane, no cytoplasm.", "Un virus NO es una célula: sin membrana ni citoplasma."),
  nucleus: (w) => w ? L("Plants, animals, fungi and protoctists are eukaryotes: their cells have a nucleus.", "Plantas, animales, hongos y protoctistas son eucariotas: sus células tienen núcleo.")
                    : L("Bacteria (prokaryotes) and viruses have NO nucleus.", "Las bacterias (procariotas) y los virus NO tienen núcleo."),
  wall: (w) => ({ cellulose: L("Plant walls are cellulose.", "Las paredes vegetales son de celulosa."), chitin: L("Fungal walls are chitin — the same tough stuff as an insect's shell.", "Las paredes de los hongos son de quitina, lo mismo que el caparazón de un insecto."),
    peptidoglycan: L("Bacterial walls are peptidoglycan.", "Las paredes bacterianas son de peptidoglucano."), none: L("Animal cells and viruses have no cell wall.", "Las células animales y los virus no tienen pared celular.") })[w],
  chloro: (w) => w ? L("Plant cells have chloroplasts for photosynthesis.", "Las células vegetales tienen cloroplastos para la fotosíntesis.")
                   : L("Only photosynthesisers have chloroplasts — not fungi, animals, these bacteria or viruses.", "Solo los organismos fotosintéticos tienen cloroplastos; no los hongos, animales, estas bacterias ni los virus."),
  store: (w) => ({ starch: L("Plants store carbohydrate as starch (or sucrose).", "Las plantas almacenan carbohidratos como almidón (o sacarosa)."),
    glycogen: L("Animals AND fungi store carbohydrate as glycogen.", "Los animales Y los hongos almacenan carbohidratos como glucógeno."), none: L("A virus stores nothing — it has no metabolism.", "Un virus no almacena nada: no tiene metabolismo.") })[w],
  plasmid: (w) => w ? L("This bacterium carries plasmids — small extra loops of DNA.", "Esta bacteria lleva plásmidos: pequeños anillos extra de ADN.")
                    : L("Plasmids are found in bacteria, not in this one.", "Los plásmidos aparecen en bacterias, no en este caso."),
  capsid: (w) => w ? L("A virus is genetic material (DNA or RNA) inside a protein coat.", "Un virus es material genético (ADN o ARN) dentro de una cubierta de proteína.")
                   : L("Only viruses have a protein coat instead of a cell.", "Solo los virus tienen una cubierta de proteína en lugar de una célula."),
};
