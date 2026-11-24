/* Cell City Command - shared data, local to this activity (CLAUDE.md section 15: L(en, es)). */
import { L } from "./kit.js?v=1";

/* The eight organelles of the Pre-IG Stage 1 cell-structure slides. plant:true = plant cells only. */
export const ORG = {
  nucleus: {
    plant: false, color: "#7f6bff",
    name: () => L("Nucleus", "Núcleo"),
    fn: () => L("Contains the genetic information (chromosomes made of DNA). Genes decide which substances the cell makes, so the nucleus controls the cell's activities.", "Contiene la información genética (cromosomas de ADN). Los genes deciden qué sustancias fabrica la célula, así que el núcleo controla las actividades de la célula."),
    hook: () => L("Nucleus = the control centre (DNA).", "Núcleo = el centro de control (ADN)."),
  },
  membrane: {
    plant: false, color: "#ff9bbf",
    name: () => L("Cell membrane", "Membrana celular"),
    fn: () => L("A thin boundary between the cytoplasm and the outside of the cell. It controls what goes in and out, because it is partially permeable.", "Un límite fino entre el citoplasma y el exterior de la célula. Controla lo que entra y sale, porque es parcialmente permeable."),
    hook: () => L("Membrane = the gatekeeper (partially permeable).", "Membrana = la guardiana de la puerta (parcialmente permeable)."),
  },
  cytoplasm: {
    plant: false, color: "#ffd9a0",
    name: () => L("Cytoplasm", "Citoplasma"),
    fn: () => L("A watery, jelly-like liquid that holds the organelles. Many of the cell's chemical (metabolic) reactions happen here.", "Un líquido acuoso, como gelatina, que contiene los orgánulos. Muchas de las reacciones químicas (metabólicas) de la célula ocurren aquí."),
    hook: () => L("Cytoplasm = the jelly where reactions happen.", "Citoplasma = la gelatina donde ocurren las reacciones."),
  },
  mito: {
    plant: false, color: "#ff7a45",
    name: () => L("Mitochondria", "Mitocondrias"),
    fn: () => L("Carry out the reactions of aerobic respiration, releasing energy for the cell. Cells that need a lot of energy, such as muscle cells, have many of them.", "Realizan las reacciones de la respiración aeróbica y liberan energía para la célula. Las células que necesitan mucha energía, como las musculares, tienen muchas."),
    hook: () => L("Mitochondria = power stations (aerobic respiration).", "Mitocondrias = centrales de energía (respiración aeróbica)."),
  },
  ribosome: {
    plant: false, color: "#38c6c6",
    name: () => L("Ribosomes", "Ribosomas"),
    fn: () => L("Very tiny particles in the cytoplasm. They make proteins (protein synthesis), following instructions from the genes in the nucleus.", "Partículas diminutas en el citoplasma. Fabrican proteínas (síntesis de proteínas) siguiendo las instrucciones de los genes del núcleo."),
    hook: () => L("Ribosomes = the protein makers.", "Ribosomas = las fabricantes de proteínas."),
  },
  chloroplast: {
    plant: true, color: "#42c25a",
    name: () => L("Chloroplasts", "Cloroplastos"),
    fn: () => L("Contain chlorophyll, the green pigment that absorbs light energy so the cell can make food by photosynthesis. Plant cells only.", "Contienen clorofila, el pigmento verde que absorbe la energía de la luz para que la célula fabrique alimento por fotosíntesis. Solo en células vegetales."),
    hook: () => L("Chloroplasts = solar panels (photosynthesis), plants only.", "Cloroplastos = paneles solares (fotosíntesis), solo plantas."),
  },
  wall: {
    plant: true, color: "#9ccf4a",
    name: () => L("Cell wall", "Pared celular"),
    fn: () => L("A stiff layer of non-living cellulose outside the membrane. It protects the cell, keeps its shape and is freely permeable. Plant cells only.", "Una capa rígida de celulosa no viva fuera de la membrana. Protege la célula, mantiene su forma y es totalmente permeable. Solo en células vegetales."),
    hook: () => L("Cell wall = the strong cellulose box, plants only.", "Pared celular = la caja resistente de celulosa, solo plantas."),
  },
  vacuole: {
    plant: true, color: "#5aa9ff",
    name: () => L("Vacuole", "Vacuola"),
    fn: () => L("A space filled with cell sap, a solution of sugars, mineral ions and water. It helps keep the cell firm and its shape. Large and permanent in plant cells.", "Un espacio lleno de savia celular, una disolución de azúcares, iones minerales y agua. Ayuda a mantener la célula firme y con su forma. Grande y permanente en las células vegetales."),
    hook: () => L("Vacuole = the cell-sap tank, big in plants.", "Vacuola = el depósito de savia, grande en las plantas."),
  },
};
export const ANIMAL_KEYS = ["membrane", "cytoplasm", "nucleus", "mito", "ribosome"];
export const PLANT_KEYS = ["wall", "membrane", "cytoplasm", "nucleus", "mito", "ribosome", "chloroplast", "vacuole"];
export const keysOf = kind => (kind === "plant" ? PLANT_KEYS : ANIMAL_KEYS);

/* small drawn icons (microscopic structures cannot be photographed on their own, so SVG is right here) */
export function icon(key, s = 54) {
  const c = ORG[key].color;
  const body = {
    nucleus: `<circle cx="32" cy="32" r="21" fill="${c}" opacity=".9"/><circle cx="32" cy="32" r="21" fill="none" stroke="#d9d2ff" stroke-width="3" stroke-dasharray="3 4"/><circle cx="27" cy="29" r="7" fill="#3d2fa8"/><path d="M38 38q6 2 8-3" stroke="#d9d2ff" stroke-width="2" fill="none"/>`,
    membrane: `<circle cx="32" cy="32" r="22" fill="#ffe4ee" opacity=".5"/><circle cx="32" cy="32" r="22" fill="none" stroke="${c}" stroke-width="5"/><circle cx="32" cy="32" r="17" fill="none" stroke="#ffd1e1" stroke-width="2"/>`,
    cytoplasm: `<rect x="8" y="12" width="48" height="40" rx="14" fill="${c}" opacity=".55"/><circle cx="22" cy="28" r="3" fill="#fff" opacity=".7"/><circle cx="38" cy="38" r="4" fill="#fff" opacity=".6"/><circle cx="44" cy="24" r="2.5" fill="#fff" opacity=".7"/>`,
    mito: `<ellipse cx="32" cy="32" rx="25" ry="15" fill="${c}"/><path d="M14 32q4-9 8 0t8 0 8 0 8 0" stroke="#7c2a0c" stroke-width="3" fill="none"/>`,
    ribosome: `<g fill="${c}"><circle cx="20" cy="22" r="6"/><circle cx="36" cy="18" r="5"/><circle cx="44" cy="34" r="6"/><circle cx="26" cy="40" r="5"/><circle cx="14" cy="38" r="4"/><circle cx="38" cy="48" r="4"/></g>`,
    chloroplast: `<ellipse cx="32" cy="32" rx="25" ry="17" fill="${c}"/><g fill="#1e7a30"><rect x="16" y="26" width="12" height="4" rx="2"/><rect x="16" y="33" width="12" height="4" rx="2"/><rect x="34" y="26" width="12" height="4" rx="2"/><rect x="34" y="33" width="12" height="4" rx="2"/></g>`,
    wall: `<rect x="9" y="12" width="46" height="40" rx="5" fill="none" stroke="${c}" stroke-width="7"/><rect x="15" y="18" width="34" height="28" rx="3" fill="#e7f6c7" opacity=".5"/>`,
    vacuole: `<ellipse cx="32" cy="32" rx="22" ry="18" fill="${c}" opacity=".85"/><ellipse cx="25" cy="25" rx="6" ry="4" fill="#fff" opacity=".6"/>`,
  }[key];
  return `<svg viewBox="0 0 64 64" width="${s}" height="${s}" aria-hidden="true">${body}</svg>`;
}

/* ---- Job Centre: job adverts for the eight organelles (Station 1) ---- */
export const JOBS = [
  { key: "nucleus", cell: "animal", ad: () => L("WANTED: the manager. Holds the DNA instructions and controls everything the cell does.", "SE BUSCA: el director. Guarda las instrucciones de ADN y controla todo lo que hace la célula.") },
  { key: "mito", cell: "animal", ad: () => L("WANTED: a power station. Releases energy from sugar by aerobic respiration.", "SE BUSCA: una central de energía. Libera energía del azúcar por respiración aeróbica.") },
  { key: "ribosome", cell: "animal", ad: () => L("WANTED: tiny workers who build proteins, following the nucleus's genes.", "SE BUSCAN: obreras diminutas que construyen proteínas, siguiendo los genes del núcleo.") },
  { key: "membrane", cell: "animal", ad: () => L("WANTED: a gatekeeper. Forms the boundary and controls what goes in and out.", "SE BUSCA: un portero. Forma el límite y controla lo que entra y sale.") },
  { key: "cytoplasm", cell: "animal", ad: () => L("WANTED: the jelly where many chemical reactions happen and the organelles float.", "SE BUSCA: la gelatina donde ocurren muchas reacciones químicas y flotan los orgánulos.") },
  { key: "chloroplast", cell: "plant", ad: () => L("WANTED: a solar panel. Contains chlorophyll and traps light to make food. Plant cells only.", "SE BUSCA: un panel solar. Contiene clorofila y capta la luz para fabricar alimento. Solo células vegetales.") },
  { key: "wall", cell: "plant", ad: () => L("WANTED: a strong box of cellulose that protects the cell and keeps its shape.", "SE BUSCA: una caja resistente de celulosa que protege la célula y mantiene su forma.") },
  { key: "vacuole", cell: "plant", ad: () => L("WANTED: a storage tank filled with cell sap (sugars, ions and water) that keeps the cell firm.", "SE BUSCA: un depósito lleno de savia celular (azúcares, iones y agua) que mantiene la célula firme.") },
];

/* ---- Build-a-Cell queue (Station 3) ---- */
export const BUILDS = [
  { id: "animal", cell: "animal", need: ["membrane", "cytoplasm", "nucleus", "mito", "ribosome"],
    title: () => L("Build an ANIMAL cell", "Construye una célula ANIMAL"),
    brief: () => L("A cheek cell. Install every part an animal cell has, and nothing it does not.", "Una célula de la mejilla. Instala todas las partes de una célula animal y ninguna que no tenga."),
    why: { chloroplast: () => L("Animal cells cannot photosynthesise, so they have no chloroplasts.", "Las células animales no hacen fotosíntesis, así que no tienen cloroplastos."),
           wall: () => L("Animal cells have no cell wall, which is why they are soft and can change shape.", "Las células animales no tienen pared celular, por eso son blandas y pueden cambiar de forma."),
           vacuole: () => L("Animal cells have no large permanent vacuole (only tiny temporary ones).", "Las células animales no tienen una vacuola grande y permanente (solo diminutas y temporales).") } },
  { id: "leaf", cell: "plant", need: ["wall", "membrane", "cytoplasm", "nucleus", "mito", "ribosome", "chloroplast", "vacuole"],
    title: () => L("Build a LEAF cell", "Construye una célula de HOJA"),
    brief: () => L("A leaf cell in full sunlight. Plant cells have everything an animal cell has, plus three extras.", "Una célula de hoja a pleno sol. Las células vegetales tienen todo lo de una animal, más tres extras."),
    why: {} },
  { id: "root", cell: "plant", need: ["wall", "membrane", "cytoplasm", "nucleus", "mito", "ribosome", "vacuole"],
    title: () => L("Build a ROOT cell (challenge)", "Construye una célula de RAÍZ (reto)"),
    brief: () => L("A root cell, deep underground in the dark. It is a plant cell, but think about which part it can do without.", "Una célula de raíz, bajo tierra y a oscuras. Es una célula vegetal, pero piensa qué parte no necesita."),
    why: { chloroplast: () => L("Roots are underground where there is no light, so they cannot photosynthesise and have no chloroplasts.", "Las raíces están bajo tierra, sin luz, así que no hacen fotosíntesis y no tienen cloroplastos.") } },
];

/* ---- Energy & Light Lab orders (Station 4). supply = mito x 10 (energy units); sugar = chloro x light% x 0.12 ---- */
export const ORDERS = [
  { id: "skin", cell: "animal", mito: true, chl: false, demand: 20, sugar: 0, light: 100, label: () => L("SKIN CELL", "CÉLULA DE LA PIEL"), brief: () => L("A skin cell does gentle work and needs about 20 energy units. Set its mitochondria.", "Una célula de la piel hace un trabajo suave y necesita unas 20 unidades de energía. Ajusta sus mitocondrias.") },
  { id: "muscle", cell: "animal", mito: true, chl: false, demand: 80, sugar: 0, light: 100, label: () => L("MUSCLE CELL", "CÉLULA MUSCULAR"), brief: () => L("A muscle cell is always contracting and needs about 80 energy units. Set its mitochondria.", "Una célula muscular se contrae sin parar y necesita unas 80 unidades de energía. Ajusta sus mitocondrias.") },
  { id: "sprint", cell: "animal", mito: true, chl: false, demand: 110, sugar: 0, light: 100, label: () => L("SPRINTER'S MUSCLE", "MÚSCULO DE VELOCISTA"), brief: () => L("A sprinter's muscle cell needs about 110 energy units. Set its mitochondria.", "Una célula muscular de velocista necesita unas 110 unidades de energía. Ajusta sus mitocondrias.") },
  { id: "leaf", cell: "plant", mito: true, chl: true, demand: 40, sugar: 60, light: 100, label: () => L("LEAF CELL, SUNNY", "CÉLULA DE HOJA, SOLEADO"), brief: () => L("A leaf cell in full sun needs 40 energy units AND must make 60 sugar units. Set mitochondria and chloroplasts.", "Una célula de hoja a pleno sol necesita 40 unidades de energía Y debe fabricar 60 de azúcar. Ajusta mitocondrias y cloroplastos.") },
  { id: "cloud", cell: "plant", mito: true, chl: true, demand: 40, sugar: 60, light: 50, label: () => L("LEAF CELL, CLOUDY", "CÉLULA DE HOJA, NUBLADO"), brief: () => L("A cloud halves the light. The same leaf cell still needs 40 energy and 60 sugar. What changes?", "Una nube reduce la luz a la mitad. La misma célula de hoja aún necesita 40 de energía y 60 de azúcar. ¿Qué cambia?") },
  { id: "root", cell: "plant", mito: true, chl: true, demand: 30, sugar: 0, light: 0, label: () => L("ROOT CELL, DARK", "CÉLULA DE RAÍZ, OSCURIDAD"), brief: () => L("A root cell underground needs 30 energy units and gets sugar from the leaves. Which organelle should it have?", "Una célula de raíz bajo tierra necesita 30 unidades de energía y recibe azúcar de las hojas. ¿Qué orgánulo debe tener?") },
];
export const MITO_E = 10, CHL_S = 0.12, MAXN = 12;
export const energyOf = n => n * MITO_E;
export const sugarOf = (n, light) => Math.round(n * (light / 100) * CHL_S * 100 * 10) / 10;

export const photoCredits = ids => L("Photos (Wikimedia Commons): ", "Fotos (Wikimedia Commons): ") + ids.map(id => {
  const c = { elodea: ["Elodea leaf cells", "Juan Carlos Fonseca Mata", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"], cheek: ["Human cheek cells (methylene blue)", "Fritzmann2002", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"] }[id];
  return `${c[0]} — ${c[1]}, <a href="${c[3]}" target="_blank" rel="noopener noreferrer">${c[2]}</a>`;
}).join(" · ");
