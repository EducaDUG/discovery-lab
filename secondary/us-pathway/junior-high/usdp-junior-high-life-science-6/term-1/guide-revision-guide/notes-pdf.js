/* ==========================================================================
   Term 1 Master Revision Hub — "Download Revision Guide (PDF)" button.

   Deliberately plain: this follows the content and section structure of
   Diego's own Google Doc ("Junior High Life Science 6: Term 1 Master Exam
   Revision Guide") exactly as he wrote it — same module order, same tier
   structure, same 35-question answer key — with no added visual design.
   Per his standing instruction, Claude does not design pages or PDFs for
   this project; this is a plain, functional conversion using the vendored
   jsPDF library (CLAUDE.md: "PDF via jsPDF... never window.print()").
   ========================================================================== */

const VENDOR_URL = new URL("../../../../../../engine/vendor/jspdf.umd.min.js", import.meta.url).href;

function loadJsPDF() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = VENDOR_URL;
    s.onload = () => (window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error("jsPDF missing")));
    s.onerror = () => reject(new Error("jsPDF failed to load"));
    document.head.appendChild(s);
  });
}

function pdfSafe(s) {
  return String(s == null ? "" : s)
    .replace(/[→➔➤]/g, "->")
    .replace(/[–—]/g, "-")
    .replace(/[‘’′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[•·]/g, "-")
    .replace(/[×]/g, "x")
    .replace(/[₂₃]/g, m => ({ "₂": "2", "₃": "3" }[m]))
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function buildNotesPDF(jsPDF) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 56, RIGHT = W - M, CW = W - M * 2;
  let y = M;

  const INK = [20, 20, 20], MUT = [90, 90, 90], LINE = [190, 190, 190];
  const setText = c => doc.setTextColor(c[0], c[1], c[2]);
  const setDraw = c => doc.setDrawColor(c[0], c[1], c[2]);

  function footer() {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); setText(MUT);
    doc.text("Junior High Life Science 6 - Term 1 Master Exam Revision Guide", M, H - 30);
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, RIGHT, H - 30, { align: "right" });
    setText(INK);
  }
  function newPage() { footer(); doc.addPage(); y = M; }
  function ensure(space) { if (y + space > H - M) newPage(); }
  function rule() { setDraw(LINE); doc.setLineWidth(0.6); doc.line(M, y, RIGHT, y); y += 10; }

  function h1(text) {
    ensure(28); doc.setFont("helvetica", "bold"); doc.setFontSize(17); setText(INK);
    doc.text(pdfSafe(text), M, y, { maxWidth: CW }); y += 8; rule(); y += 6;
  }
  function h2(text) {
    ensure(20); doc.setFont("helvetica", "bold"); doc.setFontSize(13); setText(INK);
    doc.text(pdfSafe(text), M, y, { maxWidth: CW }); y += 18;
  }
  function h3(text) {
    ensure(16); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); setText(INK);
    doc.text(pdfSafe(text), M, y, { maxWidth: CW }); y += 14;
  }
  function para(text, { size = 10, style = "normal", gap = 10, indent = 0 } = {}) {
    doc.setFont("helvetica", style); doc.setFontSize(size); setText(INK);
    const lines = doc.splitTextToSize(pdfSafe(text), CW - indent);
    ensure(lines.length * (size + 3) + gap);
    doc.text(lines, M + indent, y);
    y += lines.length * (size + 3) + gap;
  }
  function bullets(items, { size = 10, gap = 6 } = {}) {
    items.forEach(t => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(size); setText(INK);
      const lines = doc.splitTextToSize(pdfSafe(t), CW - 14);
      ensure(lines.length * (size + 3) + gap);
      doc.text("-", M, y);
      doc.text(lines, M + 12, y);
      y += lines.length * (size + 3) + gap;
    });
  }
  function numbered(items, { size = 10, gap = 6 } = {}) {
    items.forEach((t, i) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(size); setText(INK);
      const label = `${i + 1}.`;
      const lines = doc.splitTextToSize(pdfSafe(t), CW - 18);
      ensure(lines.length * (size + 3) + gap);
      doc.text(label, M, y);
      doc.text(lines, M + 18, y);
      y += lines.length * (size + 3) + gap;
    });
  }
  function table(headers, rows, colWidths) {
    const cw = colWidths || headers.map(() => CW / headers.length);
    const rowH = 16;
    ensure(rowH * (rows.length + 1) + 10);
    let cx = M;
    setDraw(INK); doc.setLineWidth(0.8);
    doc.line(M, y, RIGHT, y);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); setText(INK);
    headers.forEach((htext, i) => { doc.text(pdfSafe(htext), cx + 4, y + 12); cx += cw[i]; });
    y += rowH;
    doc.line(M, y, RIGHT, y);
    rows.forEach(row => {
      const cellLines = row.map((cell, i) => doc.splitTextToSize(pdfSafe(cell), cw[i] - 8));
      const lineCount = Math.max(...cellLines.map(l => l.length));
      const thisRowH = Math.max(rowH, lineCount * 10 + 8);
      ensure(thisRowH);
      cx = M;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.4); setText(INK);
      row.forEach((cell, i) => { doc.text(cellLines[i], cx + 4, y + 11); cx += cw[i]; });
      y += thisRowH;
      setDraw(LINE); doc.setLineWidth(0.5); doc.line(M, y, RIGHT, y);
    });
    y += 14;
  }

  /* ------------------------------------------------------------------------
     Title
     ------------------------------------------------------------------------ */
  doc.setFont("helvetica", "bold"); doc.setFontSize(19); setText(INK);
  doc.text("Junior High Life Science 6: Term 1 Master Exam Revision Guide", M, y, { maxWidth: CW }); y += 44;
  doc.setFont("helvetica", "italic"); doc.setFontSize(10.5); setText(MUT);
  doc.text("Notes only - the Interactive Labs and the 35-question Exam Mastery Quiz are on the live course page.", M, y, { maxWidth: CW }); y += 28;
  setText(INK);

  /* ==========================================================================
     MODULE 1
     ========================================================================== */
  h1("Module 1: The Basics of Life, Science, & Ecology");

  h2("Tier 1: Foundation - Science, Life, & Evidence");
  bullets([
    "Etymology of Science: from the Latin scientia, meaning \"knowledge.\" Science is an active, empirical pursuit of understanding the physical and natural world.",
    "Why Science is Important: science enables humanity to understand natural phenomena, solve real-world problems (disease prevention, clean energy, agriculture), develop new technologies, and build testable knowledge that improves life.",
    "Empirical Evidence: information gathered directly through the five senses or scientific instruments (microscopes, sensors, scales) that can be measured, tested, and independently verified.",
  ]);
  h3("Life Science vs. Physical Science");
  bullets([
    "Life Science (Biology): the study of living organisms, their processes, and interactions with environments. Examples: Marine Biology (studying black spiny sea urchins), Botany, Zoology, Human Anatomy.",
    "Physical Science: the study of non-living matter, energy, and forces. Examples: Physics (gravity/motion), Chemistry (chemical reactions), Astronomy.",
  ]);
  h3("Observations vs. Inferences");
  bullets([
    "Observation: direct measurement or description using senses/tools (e.g. \"The liquid turned red and rose to 38C\").",
    "Inference: logical conclusion based on observations (e.g. \"A chemical reaction released heat\").",
  ]);
  h3("Characteristics of Living Organisms (MRS C GREN)");
  numbered([
    "M - Movement: changing position or orientation.",
    "R - Respiration: releasing energy (ATP) from nutrients inside cells.",
    "S - Sensitivity: sensing and responding to environmental stimuli.",
    "C - Control (Homeostasis): maintaining stable internal balance (e.g. body temperature, water levels).",
    "G - Growth: permanent increase in size and cell count.",
    "R - Reproduction: producing offspring to ensure species survival.",
    "E - Excretion: removing metabolic waste products.",
    "N - Nutrition: obtaining or making nutrients for energy.",
  ]);
  h3("Real Science vs. Pseudoscience");
  table(
    ["Feature", "Real Science", "Pseudoscience (\"False Science\")"],
    [
      ["Evidence Basis", "Empirical data, repeated controlled experiments.", "Anecdotes, unverified personal testimonials."],
      ["Testability", "Hypotheses can be tested and proven false (falsifiable).", "Claims are vague, mystical, and untestable."],
      ["Response to New Data", "Adapts, updates, or discards hypotheses when proven wrong.", "Ignores or rejects contradictory scientific evidence."],
      ["Example", "Astronomy (studying star composition with light spectra).", "Astrology (claiming star positions dictate personal luck)."],
    ],
    [90, 220, 234]
  );

  h2("Tier 2: Deepening Understanding - Scientific Method & Ecology");
  para("Drawing Conclusions in the Scientific Method: the conclusion evaluates the empirical data collected during the experiment to state whether the original hypothesis is supported or refuted. It summarizes key trends and addresses experimental errors.");
  para("What Makes Ecology Unique? Unlike specialized disciplines that study organisms in isolation (e.g. cell biology), Ecology focuses explicitly on the interactions between living organisms AND their non-living physical environment.");
  h3("Biotic vs. Abiotic Ecosystem Factors");
  bullets([
    "Biotic Factors: all living or once-living organisms (plants, animals, fungi, bacteria).",
    "Abiotic Factors: non-living physical and chemical components (sunlight, water availability, temperature, soil pH, air currents).",
    "Desert Cactus Example (Abiotic Factors): extremely low annual rainfall/water availability, high daytime temperatures, intense solar radiation, sandy low-nutrient soil.",
    "Rainforest Example - Living (Biotic): canopy trees, jaguars, toucans, orchids, leafcutter ants.",
    "Rainforest Example - Nonliving (Abiotic): high humidity/rainwater, warm ambient temperature, river silt, sunlight filtering through leaves.",
  ]);

  h2("Tier 3: Exam Mastery Focus");
  para("Marine Biology Specialization: a scientist studying black spiny sea urchins in ocean reef ecosystems is a Marine Biologist or Marine Ecologist. Sea urchins are echinoderms that control algae growth on coral reefs.");

  /* ==========================================================================
     MODULE 2
     ========================================================================== */
  h1("Module 2: Classification of Living Things (Taxonomy)");

  h2("Tier 1: Foundation - Linnaean Taxonomy");
  bullets([
    "Taxonomy: the science of naming and grouping organisms based on shared physical and genetic characteristics.",
    "How Living Things Are Classified: organisms are grouped into a hierarchical system based on shared structural traits, cell type, genetic DNA similarity, and evolutionary relationships.",
    "Broadest Classification Category: Domain is the largest, most inclusive category (Eukarya, Bacteria, Archaea).",
  ]);
  h3("The 8 Taxonomic Levels");
  para("Domain -> Kingdom -> Phylum -> Class -> Order -> Family -> Genus -> Species", { style: "bold" });
  para("Memory Trick: Dear King Philip Came Over For Good Soup!", { style: "italic", gap: 14 });

  h2("Tier 2: Kingdom Breakdown & Microorganisms");
  table(
    ["Kingdom / Group", "Primary Traits", "Ecological Benefits & Examples"],
    [
      ["Animalia", "Multicellular, eukaryotic, heterotrophic by ingestion, lack cell walls, motile at some stage.", "Maintain ecological balance through food webs (herbivores, predators, decomposers)."],
      ["Protista", "Eukaryotic, mostly unicellular (except algae/kelp). The \"Junk Drawer\" kingdom.", "Photosynthetic algae/phytoplankton produce over 50% of Earth's oxygen and form the base of aquatic food chains. Examples: Amoeba, Paramecium, Euglena, Algae."],
      ["Bacteria", "Unicellular, prokaryotic (no nucleus), microscopic, possess cell walls, reproduce via binary fission.", "Helpful examples: Lactobacillus digests lactose, synthesizes gut vitamins, ferments yogurt/cheese. Rhizobium fixes atmospheric nitrogen into nitrates in legume roots."],
      ["Fungi (Molds & Yeasts)", "Eukaryotic, heterotrophic (absorptive), cell walls made of chitin, lack chloroplasts.", "Penicillium mold produces the antibiotic Penicillin; used in blue cheese/soy sauce production; essential decomposers of dead forest biomass."],
      ["Viruses", "Acellular particles of genetic material (DNA/RNA) in a protein coat. Non-living.", "Lack cells, cannot carry out metabolism/respiration, cannot reproduce without hijacking a host cell. Mutations alter surface proteins, allowing immune evasion, faster spread, new host species, or drug resistance."],
    ],
    [95, 220, 219]
  );
  h3("Comparing Fungi vs. Plants");
  bullets([
    "Similarities: both are eukaryotic, possess cell walls, and are non-motile (anchored in place).",
    "Plants: autotrophic (photosynthetic), contain chloroplasts, cell walls made of cellulose.",
    "Fungi: heterotrophic (absorb digested organic matter), lack chloroplasts, cell walls made of chitin.",
  ]);

  h2("Tier 3: Exam Mastery - Seed Plants vs. Seedless Plants");
  para("Seed Plants: Gymnosperms (conifers/pines) and Angiosperms (flowering plants/oak trees).");
  para("Advantage of Seed Plants Over Seedless Plants: seedless plants (mosses/ferns) rely on standing environmental water for sperm to swim to eggs. Seed plants do not require standing water for fertilization, and their seeds protect the embryo with a tough coat while supplying stored nutrients (endosperm) allowing survival through harsh dry periods.");

  /* ==========================================================================
     MODULE 3
     ========================================================================== */
  h1("Module 3: Invertebrates (Animals Without a Backbone)");
  para("Over 97% of all animal species on Earth are invertebrates!", { style: "bold" });

  h2("1. Phylum Porifera (Sponges)");
  bullets([
    "Asymmetrical, porous body (ostia pores), filter feed water through an osculum. Lack true tissues/organs.",
    "Similarities Between Sponges and Plants: adult sponges are sessile (permanently attached/anchored to underwater surfaces) and lack active locomotion, growing attached to substrate like plants.",
  ]);

  h2("2. Phylum Cnidaria (Jellyfish, Sea Anemones, Corals)");
  bullets([
    "Radial symmetry, soft sac-like body with a central digestive cavity.",
    "Possess specialized stinging cells called cnidocytes containing coiled, harpoon-like nematocysts to capture prey and defend against predators.",
  ]);

  h2("3. Worms vs. Porifera & Cnidaria");
  bullets([
    "Key Differences: worms (Annelids, Nematodes, Platyhelminthes) possess bilateral symmetry, three germ tissue layers, true internal organs, and a distinct head/tail orientation (cephalization), unlike asymmetrical sponges or radially symmetric cnidarians.",
  ]);
  h3("Importance of Earthworms");
  numbered([
    "Dig burrows that aerate the soil, allowing oxygen and water to reach plant roots.",
    "Decompose organic leaf litter, excreting nutrient-rich castings (natural fertilizer).",
    "Improve soil drainage and root penetration.",
  ]);

  h2("4. Phylum Mollusca (Soft-Bodied Animals)");
  bullets([
    "Squid Tentacles Function: used to capture and grasp swimming prey, draw food into the sharp parrot-like beak, and aid in defense.",
    "Gastropods (Snails, Slugs): \"Stomach-foot\"; single protective spiral shell or no shell, slow crawling ventral foot.",
    "Cephalopods (Octopus, Squid): \"Head-foot\"; internal reduced shell or no shell, advanced brain/eyes, arms/tentacles with suckers, siphon jet propulsion.",
  ]);

  h2("5. Phylum Arthropoda (Insects, Arachnids, Crustaceans)");
  bullets([
    "Jointed appendages, segmented body, chitin exoskeleton requiring molting to grow.",
    "Lobster & Cricket Common Traits: both are arthropods featuring jointed legs, chitin exoskeletons, segmented bodies, and bilateral symmetry.",
    "Arachnids: spiders, scorpions, ticks, mites (8 walking legs, 2 body regions: cephalothorax & abdomen, no antennae).",
    "Insects vs. Other Arthropods: insects uniquely possess 3 body regions (head, thorax, abdomen), 6 legs attached to the thorax, 1 pair of antennae, and often wings.",
  ]);

  h2("6. Phylum Echinodermata (Starfish, Sea Urchins, Sea Cucumbers)");
  bullets([
    "Uniqueness Among Invertebrates: possess an internal calcium plate skeleton (endoskeleton) under spiny skin and a hydraulic water vascular system.",
    "Unique Features of Starfish: 5-part radial symmetry, hydraulic tube feet for locomotion/opening bivalve shells, and the ability to evert their stomach outside their body to digest prey externally!",
  ]);

  /* ==========================================================================
     MODULE 4
     ========================================================================== */
  h1("Module 4: Vertebrates (Phylum Chordata)");

  h2("Tier 1: Core Chordate Traits");
  para("All chordates possess four traits at some point in development:");
  numbered([
    "Notochord: flexible supporting rod (becomes backbone in vertebrates).",
    "Dorsal Hollow Nerve Cord: becomes brain and spinal cord.",
    "Pharyngeal Slits: become gills or throat structures.",
    "Post-anal Tail: tail extending past anus.",
  ]);
  para("Invertebrate Jellyfish vs. Vertebrate Seahorse: jellyfish are Cnidarians (no backbone, radial symmetry, stinging cells). Seahorses are bony fish (Chordates with a true internal backbone, gills, and fins).");

  h2("Tier 2: The 5 Vertebrate Classes");
  table(
    ["Class", "Thermal / Respiration", "Unique Characteristics & Exam Focus"],
    [
      ["Fish", "Ectothermic; gills.", "3 distinct characteristics: aquatic vertebrates, breathe with gills, possess fins and scales. Prey-catching adaptations: powerful fins/tail, flexible body, sharp teeth/jaws, swim bladder for buoyancy, lateral line detecting vibrations."],
      ["Amphibians", "Ectothermic; gills (larvae), lungs & moist skin (adults).", "Life cycle: aquatic jelly egg -> swimming tadpole with gills -> metamorphosis -> terrestrial adult with legs and lungs. Smooth moist permeable skin allows gas exchange; requires water for reproduction."],
      ["Reptiles", "Ectothermic; lungs.", "Dry scaly keratin skin (prevents water loss), lungs from hatching, and lay hard/leathery amniotic eggs on land - unlike moist-skinned, jelly-egg-laying amphibians. (Dinosaurs were ancient extinct reptiles!)"],
      ["Birds", "Endothermic; lungs + air sacs.", "2 unique features: feathers and hollow/pneumatized bones. Gizzard: a muscular organ with swallowed stones that grinds tough food, substituting for teeth. Hollow bones reduce body weight for flight."],
      ["Mammals", "Endothermic; lungs.", "Hair/fur and mammary glands producing milk. Marsupials (kangaroos, opossums) give birth to tiny underdeveloped embryos that finish development in a pouch. Human advantages: developed cerebral brain, opposable thumbs, bipedal stance, symbolic communication."],
    ],
    [72, 118, 354]
  );

  /* ==========================================================================
     MODULE 5
     ========================================================================== */
  h1("Module 5: Green Plants (Primary Producers)");

  h2("Tier 1: Seed Parts, Germination, & Dispersal");
  h3("Parts of a Seed");
  numbered([
    "Embryo: the baby plant (includes shoot and radicle).",
    "Endosperm / Cotyledon: the stored food pantry supplying starch and nutrients to nourish the embryo during germination before leaves can photosynthesize.",
    "Seed Coat: tough protective outer shell.",
  ]);
  para("First Part to Emerge From Seed: the radicle (primary root) emerges first to anchor the seedling in dirt and absorb soil water.");
  h3("Animal Seed Dispersal");
  numbered([
    "Animals eat fleshy fruits and excrete intact seeds in new locations.",
    "Sticky or hooked seed burrs cling to animal fur or bird feathers.",
    "Animals (squirrels) bury nuts/acorns underground and forget them.",
  ]);

  h2("Tier 2: Roots, Soil, Vascular System, & Leaves");
  h3("Comparing Root Systems");
  bullets([
    "Taproot: one thick primary root growing deep vertically (carrots, dandelions) - great for deep water access.",
    "Fibrous Root: dense network of thin, equal shallow roots (grass, wheat) - great for preventing soil erosion.",
    "Water/Adventitious Roots: specialized roots growing from stems into water, lacking root caps/hairs, adapted to absorb dissolved aquatic nutrients.",
  ]);
  h3("Soil vs. Dirt & Soil Bacteria");
  bullets([
    "Soil: a complex, living ecosystem composed of weathered rock minerals, organic humus, water, air pockets, and living organisms (bacteria, earthworms).",
    "Dirt: dead, displaced soil lacking organic nutrients, structured air space, or active living organisms.",
    "Soil Bacteria Function: decompose dead plant matter and fix atmospheric nitrogen into usable nitrates that plants absorb through root hairs.",
  ]);
  h3("Vascular Transport Systems");
  bullets([
    "Xylem: transport tissue bringing water and dissolved minerals UPWARD from roots to leaves (Xy to the Sky!).",
    "Phloem: transport tissue carrying manufactured glucose sugars DOWNWARD AND ALL AROUND the plant to roots and stems (Phloem = Food!).",
  ]);
  h3("Leaf Functions & Photosynthesis");
  bullets([
    "3 Main Functions of Leaves: photosynthesis (food production), gas exchange (CO2 in, O2 out), and transpiration control.",
    "Energy Source for Photosynthesis: sunlight/light energy absorbed by chlorophyll pigments inside chloroplasts.",
    "Importance of Photosynthesis: forms the foundational organic food energy at the base of virtually all Earth food chains and generates oxygen gas needed for aerobic respiration!",
  ]);
  h3("Stomata & Factors Affecting Transpiration");
  para("Stomata: microscopic pores on leaf undersides flanked by guard cells that control gas exchange and water evaporation (transpiration).");
  numbered([
    "High Temperature: increases water molecule kinetic evaporation.",
    "Wind / Air Currents: sweeps water vapor away from leaf surfaces.",
    "Bright Sunlight: triggers guard cells to open stomata wide. (High humidity DECREASES transpiration.)",
  ]);

  h2("Tier 3: Flower Structure & Reproduction");
  h3("4 Main Parts of a Flower");
  numbered([
    "Sepals: green leaf-like structures that protect the unopened flower bud.",
    "Petals: brightly colored, scented structures that attract insect pollinators.",
    "Stamen (Male): composed of the Anther (produces sticky pollen grains) and Filament (supporting stalk).",
    "Pistil / Carpel (Female): composed of the Stigma (sticky surface receiving pollen), Style (tube), and Ovary containing Ovules (eggs).",
  ]);
  para("Pollinator Contact: when an insect feeds on nectar inside a flower, sticky pollen grains from the Anther stick to its body and are transferred to the sticky Stigma of the next flower.");

  /* ==========================================================================
     MODULE 6
     ========================================================================== */
  h1("Module 6: Cell Biology, Organelles, & Mitosis");

  h2("Tier 1: Cell Theory & Levels of Organization");
  bullets([
    "Single-Celled vs. Multicellular Organisms: single-celled organisms (bacteria, amoeba) perform all life processes within 1 cell. Multicellular organisms contain specialized cells organized into a complex hierarchy.",
  ]);
  para("Levels of Organization (Most Complex to Least Complex): Organism -> Organ System -> Organ -> Tissue -> Cell.", { style: "bold" });
  para("Red Blood Cells (CO2 Removal): red blood cells (erythrocytes) carry carbon dioxide waste away from body tissues back to the lungs, where alveolar cells exhale it.");

  h2("Tier 2: Cell Architecture & Organelle Functions");
  bullets([
    "Plant Cells vs. Animal Cells: plant cells possess a rigid cellulose cell wall, chloroplasts for photosynthesis, and a large central vacuole. Animal cells lack cell walls and chloroplasts.",
    "Centrosomes / Centrioles: specialized organelles in animal cells that produce microtubules and spindle fibers used to pull chromosomes apart during mitosis.",
    "Why Cells Need Proteins: proteins build cellular structural components, repair damaged tissues, transport molecules across cell membranes, and function as enzymes that drive chemical metabolic reactions.",
  ]);

  h2("Tier 3: Cell Division (Mitosis) & Reproduction Strategies");
  h3("Mitosis Nuclear Division Stages (PMAT)");
  numbered([
    "Prophase: chromosomes condense; nuclear envelope breaks down.",
    "Metaphase: chromosomes line up along the Middle (equator).",
    "Anaphase: sister chromatids are pulled apart by spindle fibers toward opposite cell poles.",
    "Telophase: two new nuclear membranes form around separated chromosomes.",
  ]);
  h3("Negative Consequences of Mitotic Reproduction");
  numbered([
    "Lack of Genetic Diversity: mitosis produces identical clones. If environmental conditions change or a pathogen strikes, all identical cells are equally vulnerable.",
    "Uncontrolled Division: uncontrolled rapid mitosis caused by genetic mutations leads to cancerous tumors.",
  ]);
  h3("Asexual vs. Sexual Reproduction Comparison");
  table(
    ["Feature", "Asexual (Binary Fission & Budding)", "Sexual Reproduction"],
    [
      ["Parents & Gametes", "1 parent, no gametes/fertilization.", "2 parents, sperm + egg gametes."],
      ["Genetic Outcome", "Offspring are genetically identical clones.", "Offspring are genetically unique."],
      ["Binary Fission vs. Budding", "Binary Fission: equal split of parent cell into 2 equal daughters (bacteria, amoeba). Budding: outgrowth/bud forms on parent and pinches off (yeast, hydra). Both produce identical clones from 1 parent.", "Internal Fertilization: sperm meets egg inside body (mammals, birds, reptiles). External Fertilization: sperm meets egg in water (fish, amphibians)."],
      ["Disadvantages of External Fertilization", "-", "Gametes washed away by currents; high risk of egg/embryo predation; requires an aquatic environment; low embryo survival percentage requiring huge egg production. (High energy cost searching for mates; fewer total offspring for internal fertilization.)"],
    ],
    [110, 200, 234]
  );

  /* ==========================================================================
     ANSWER KEY
     ========================================================================== */
  h1("Complete 35-Question Master Review Answer Key");
  const answerKey = [
    "Empirical Evidence: information gathered directly through sensory observation or scientific tools that can be measured, tested, and verified.",
    "Why Science is Important: it allows us to understand the natural world, solve medical/environmental problems, and develop technologies based on falsifiable evidence.",
    "Scientific Conclusion: evaluates experimental data to state whether the hypothesis is supported or refuted and summarizes findings.",
    "Pseudoscience: claims presented as scientific that lack empirical evidence, cannot be tested/falsified, and reject contradictory data (e.g. Astrology).",
    "Sea Urchin Scientist: Marine Biologist or Marine Ecologist.",
    "Life vs. Physical Science: life science studies living organisms (e.g. Zoology/Botany); physical science studies non-living matter/energy (e.g. Physics/Chemistry).",
    "Ecology Uniqueness: it specifically studies the interactions between living organisms AND their non-living physical environment.",
    "Cactus Abiotic Factors: low water availability/precipitation and high solar radiation/temperature.",
    "Rainforest Aspects: Living = canopy trees, jaguars; Nonliving = rainwater, sunlight.",
    "Broadest Rank: Domain.",
    "Classification Method: based on shared physical/genetic characteristics, evolutionary relationships, cell type, and binomial nomenclature.",
    "Lobster & Cricket Similarities: both are arthropods with chitin exoskeletons, jointed appendages, segmented bodies, and bilateral symmetry.",
    "Animal Kingdom Traits: multicellular, eukaryotic, heterotrophic by ingestion, lack cell walls, motile at some life stage.",
    "Protists Benefits & Examples: algae and phytoplankton produce >50% of Earth's oxygen and form aquatic food web bases. Examples: Amoeba, Paramecium, Algae.",
    "Helpful Bacteria Examples: Lactobacillus (aids digestion/yogurt); Rhizobium (fixes soil nitrogen in plant roots).",
    "Mold Benefits: source of Penicillin antibiotic, used in cheese production (blue cheese), and decomposes dead biomass.",
    "Fungi vs. Plants: similar - eukaryotic, cell walls, non-motile. Different - plants are autotrophic with cellulose walls; fungi are heterotrophic with chitin walls.",
    "Seed Plant Advantage: do not require standing water for fertilization; seeds protect embryo with seed coat and endosperm food supply.",
    "Viral Mutations: allow viruses to evade host immunity, spread faster, resist drugs, or infect new host species.",
    "Viruses vs. Living Things: viruses are acellular, lack metabolism/respiration, and cannot reproduce without a host cell.",
    "Sponge & Plant Similarities: both are sessile (anchored in place) as adults and lack active locomotion.",
    "Sea Anemone & Jellyfish Similarities: both are Cnidarians with radial symmetry, soft sac bodies, and stinging cnidocytes with nematocysts.",
    "Earthworm Importance: aerate soil with burrows and excrete nutrient-rich castings that fertilize plant roots.",
    "Worms vs. Cnidaria/Porifera: worms have bilateral symmetry, 3 tissue layers, true organs, and head/tail orientation.",
    "Squid Tentacles Function: grasping prey and drawing food into the mouth/beak.",
    "Gastropods vs. Cephalopods: gastropods have single/no shells and crawl on a foot (snails); cephalopods have tentacles, high intelligence, and jet propulsion (octopus).",
    "Insects Uniqueness: 3 body regions (head, thorax, abdomen), 6 legs on thorax, 1 pair antennae, often wings.",
    "Starfish Unique Traits: 5-part radial symmetry, hydraulic water vascular system with tube feet, and external stomach eversion.",
    "Fish Characteristics: ectothermic aquatic vertebrates, breathe with gills, possess fins and scales.",
    "Amphibian Life Cycle: aquatic jelly egg -> swimming tadpole with gills -> metamorphosis -> terrestrial adult with legs and lungs.",
    "Reptiles vs. Amphibians: reptiles have dry scaly skin and lay shelled amniotic eggs on land; amphibians have moist permeable skin and jelly eggs in water.",
    "Birds Gizzard & Hollow Bones: gizzard grinds tough food with swallowed pebbles (no teeth); hollow bones reduce body weight for flight.",
    "Marsupials: pouched mammals whose tiny immature young crawl into a pouch to complete development.",
    "Endosperm & Radicle: endosperm provides stored food for embryo during germination; radicle (primary root) emerges first.",
    "Soil vs. Dirt & Transport: soil is a living ecosystem with minerals, humus, air, water, and organisms; dirt is dead displaced soil. Phloem transports food sugars down/around; xylem transports water up.",
  ];
  answerKey.forEach((t, i) => {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); setText(INK);
    const label = `${i + 1}. `;
    const lines = doc.splitTextToSize(pdfSafe(t), CW - 20);
    ensure(lines.length * 13 + 8);
    doc.text(label, M, y);
    doc.setFont("helvetica", "normal");
    doc.text(lines, M + 20, y);
    y += lines.length * 13 + 8;
  });

  footer();
  return doc.output("blob");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.style.display = "none";
  document.body.append(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
}

const btn = document.getElementById("downloadGuideBtn");
if (btn) {
  btn.addEventListener("click", async () => {
    const label = btn.querySelector("span") || btn;
    const original = label.textContent;
    btn.disabled = true;
    label.textContent = "Building PDF...";
    try {
      const jsPDF = await loadJsPDF();
      const blob = buildNotesPDF(jsPDF);
      downloadBlob(blob, "Life_Science_6_Term_1_Revision_Guide.pdf");
    } catch (err) {
      console.error(err);
      label.textContent = "Failed - try again";
      setTimeout(() => { label.textContent = original; }, 2000);
      btn.disabled = false;
      return;
    }
    label.textContent = original;
    btn.disabled = false;
  });
}
