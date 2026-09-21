/* ==========================================================================
   COURSE REVISION GUIDE — PDF export.

   This is a static reference page, not a graded activity, so it does not use
   engine/engine.js's evidence-export machinery (no student name, no rubric,
   no marking.json). It still follows the project's standing engineering
   decision — "PDF via jsPDF with a hand-written layout function, never
   window.print()" (CLAUDE.md §10) — using the same vendored library and the
   same hand-laid-page technique as buildPDF()/buildStudentPDF() in
   engine/engine.js, kept local to this guide's own folder per the
   content-vs-engine rule (content lives in its own folder; the shared engine
   is not touched for a content page).
   ========================================================================== */

const VENDOR_URL = new URL("../../../../../engine/vendor/jspdf.umd.min.js", import.meta.url).href;

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

/* jsPDF's core Helvetica is Latin-1 (WinAnsi) only — same fix as engine/engine.js. */
function pdfSafe(s) {
  return String(s == null ? "" : s)
    .replace(/[→➔➤]/g, "->")
    .replace(/[–—]/g, "-")
    .replace(/[‘’′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[•·]/g, "-")
    .replace(/[✓✔]/g, "[ok]")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

/* ------------------------------------------------------------------------
   Content — one compact copy for the PDF, kept separate from the page's own
   prose (jsPDF draws text/lines/shapes, it cannot render arbitrary HTML/CSS
   or the page's inline SVG diagrams, so a full-fidelity re-layout is the only
   way to get a real, generated PDF file rather than a browser print dialog).
   ------------------------------------------------------------------------ */
const CHAPTERS = [
  {
    title: "1. What Is Environmental Science?",
    intro: "A problem-solving science: observe, question, gather evidence, design a solution. Studies air, water, soil, ecosystems, biodiversity, climate, pollution, natural resources, and how humans interact with them.",
    terms: [["Environment", "Air, water, living things, ecosystems and human surroundings that interact with each other — not just \"trees, animals and plants.\""]],
    case: ["Everyday choices, real impact", "Transport, energy and packaging all carry environmental consequences. Single-use plastic is used for minutes but can remain a waste problem for decades. The point is awareness, not guilt."],
    qa: [
      ["What does Environmental Science study?", "The environment: air, water, soils, ecosystems, biodiversity, climate, pollution, resources, and human interaction with these systems."],
      ["Why is a clean-water shortage the real concern, not water 'running out'?", "Water stays in the water cycle — the real issue is whether it is clean, safe and available."],
    ],
  },
  {
    title: "2. Ecosystems & Energy Flow",
    intro: "An ecosystem is a living system where organisms interact with each other and non-living conditions (light, water, temperature, soil). Food-web arrows point from the eaten to the eater — the direction energy travels.",
    terms: [
      ["Biotic factor", "A living part of an ecosystem — a fish, plant, insect, bacterium."],
      ["Abiotic factor", "A non-living part — sunlight, water, temperature, soil."],
      ["The 10% rule", "Only about 10% of the energy at one trophic level transfers to the next, which is why top predators are always rare."],
    ],
    case: ["An Australian pond ecosystem", "Algae -> tadpole -> fish -> heron, with decomposers (fungi, bacteria) recycling waste back into the mud."],
    qa: [
      ["Which way does a food-web arrow point, and why?", "From the eaten to the eater — it shows the direction energy moves."],
      ["What does the 10% rule explain?", "Why top predators are rare: only ~10% of energy passes up each trophic level."],
    ],
  },
  {
    title: "3. Biodiversity I: Levels & Value",
    intro: "Biodiversity operates at three levels: genetic diversity (variation in DNA within a species), species diversity (variety of species in an ecosystem), and ecosystem diversity (variety of habitats across a region).",
    terms: [
      ["Biome", "A broad, major ecological zone — desert, grassland, rainforest."],
      ["Ecoregion", "A more specific region within a biome, defined by its own climate, land and life."],
    ],
    case: ["The New York City watershed", "NYC protects its watershed's forests and wetlands instead of relying only on filtration plants — a supporting/regulating ecosystem service that saves money while protecting nature."],
    qa: [
      ["What are the three levels of biodiversity?", "Genetic, species, and ecosystem diversity."],
      ["Name the four categories of ecosystem services.", "Provisioning, regulating, supporting, and cultural."],
    ],
  },
  {
    title: "4. Biodiversity II: Threats & Conservation",
    intro: "An invasive species is non-native, spreads, AND causes harm — being non-native alone is not enough. IUCN Red List categories (Vulnerable -> Endangered -> Critically Endangered) rank rising extinction risk.",
    terms: [
      ["Key Biodiversity Area (KBA)", "A site identified by evidence as especially important for species, habitats or ecological processes."],
      ["AZE site", "A site that may be the last refuge for one highly threatened species — shown on maps as a mapped polygon."],
    ],
    case: ["Scottsdale Reserve, Australia — six principles of restoration", "Reference ecosystem, matched methods, measurable goals, full recovery, science + practice, and people involved. Restoration is not just planting trees."],
    qa: [
      ["What makes a species invasive rather than just non-native?", "It spreads successfully AND causes harm to the local ecosystem."],
      ["How does extra CO2 harm coral reefs?", "It dissolves into seawater (ocean acidification), making it harder for corals to build their structures."],
    ],
  },
  {
    title: "5. Population Ecology",
    intro: "A population is individuals of one species in a specific, NAMED area. It changes via births, deaths, immigration and emigration. Exponential growth (J-curve) speeds up under ideal conditions; logistic growth (S-curve) slows near carrying capacity.",
    terms: [
      ["Carrying capacity", "The maximum population an environment can support, limited by food, water and space."],
      ["Density-dependent vs. -independent", "Density-dependent factors (food, disease) strengthen as crowding increases; density-independent factors (fire, flood) act regardless of population size."],
    ],
    case: ["Wildfire recovery and resilience", "A single fire: ecosystems usually recover. Repeated frequent fires: seed banks can be destroyed before they replenish, and recovery fails."],
    qa: [
      ["Difference between exponential and logistic growth?", "Exponential rises quickly under ideal conditions; logistic slows and levels off near carrying capacity."],
      ["Give one density-dependent and one density-independent factor.", "Density-dependent: food/disease. Density-independent: wildfire/flood."],
    ],
  },
  {
    title: "6. Earth's Systems",
    intro: "Geosphere (rock/land/soil), hydrosphere (water), atmosphere (gases), biosphere (living things) constantly interact — not four separate topics. A tsunami affects all four: seafloor movement (geosphere), moving ocean water (hydrosphere), harm to life (biosphere), and reduced CO2 uptake from damaged vegetation (atmosphere, more indirectly).",
    terms: [],
    case: ["A tsunami: one event, four systems", "Geosphere: seafloor/coastline change. Hydrosphere: mass water movement. Biosphere: harm to people, animals, habitats. Atmosphere: indirect, via vegetation damage."],
    qa: [
      ["Name Earth's four systems.", "Geosphere, hydrosphere, atmosphere, biosphere."],
      ["Why treat them as one connected model?", "Because effects spread across systems as a chain of consequences, not staying in one system."],
    ],
  },
  {
    title: "7. The Hydrosphere & Soil",
    intro: "97% of Earth's water is salt water; only 3% is fresh, and most of that is underground in aquifers. Osmosis explains why fish cannot cross between fresh and salt water. Water cycle: evaporation -> condensation -> precipitation -> runoff / infiltration -> aquifer.",
    terms: [
      ["Osmosis", "Water moves across a membrane from higher to lower concentration — a freshwater fish in the sea dehydrates; a saltwater fish in fresh water over-absorbs."],
      ["Soil horizons (top to bottom)", "O (organic) -> A (nutrient-rich topsoil) -> subsoil -> broken rock -> bedrock."],
    ],
    case: ["Vocabulary you can write, before you can explain", "Students often write infiltration/transpiration/erosion correctly but cannot yet define them aloud — the exact gap examiners test."],
    qa: [
      ["What is an aquifer?", "An underground layer of rock/soil storing fresh water."],
      ["Trace the water cycle.", "Evaporation -> condensation (clouds) -> precipitation -> runoff or infiltration -> back to the ocean/aquifer."],
    ],
  },
  {
    title: "8. Land Use & Agriculture",
    intro: "Primary forest is NOT automatically 'no human impact' — edge effects, roads and fire still apply. Monoculture (one species) supports far less biodiversity than native forest. Industrial agriculture sells most of its produce as a business; subsistence agriculture feeds the farming family.",
    terms: [
      ["Buffer zone", "A protective strip between a human land use (farm) and a sensitive ecosystem, reducing noise, runoff and invasive spread."],
      ["Arable land", "Land ploughed for seasonal crops (wheat, corn) — distinct from pasture (livestock) or plantation (rows of trees)."],
    ],
    case: ["Agroforestry vs. a single-species plantation", "Mixed planted forest can match a monoculture's economic value while keeping soil healthier, storing more carbon, and resisting fire/pests/drought better."],
    qa: [
      ["Industrial vs. subsistence agriculture?", "Industrial: run as a business, sells most produce. Subsistence: farms mainly to feed the farming family."],
      ["Why can a monoculture support less biodiversity?", "One dominant species provides far less food/shelter variety than a native multi-species forest."],
    ],
  },
  {
    title: "9. Water Resource Management",
    intro: "A reservoir balances recharge (rain/inflow) against extraction (farms, industry, homes). 'Day Zero' is the point a reservoir runs dry. Agriculture is the single largest water user worldwide.",
    terms: [["Conservation measures", "Drip irrigation (cuts farm water use ~35%), rainwater harvesting (collects/stores rain), wetland restoration (helps land retain water)."]],
    case: ["Cape Town's near-miss, 2018", "Came within weeks of Day Zero. Over-extraction, pollution and a drying climate are why cities worldwide now plan for water scarcity as a near-term risk."],
    qa: [
      ["What does 'Day Zero' mean?", "The point a reservoir has no water left for anyone."],
      ["What is the largest human cause of water scarcity?", "Agriculture."],
    ],
  },
  {
    title: "10. Energy & Climate",
    intro: "Renewable energy (solar, geothermal) is replenished on a human timescale; non-renewable (coal, petroleum, uranium) forms over geological time and is used faster than replaced. The natural greenhouse effect keeps Earth warm; EXTRA greenhouse gases from human activity is the actual problem.",
    terms: [["Carbon footprint vs. environmental footprint", "Carbon footprint = mainly greenhouse gas emissions. Environmental footprint = broader: land, water, food, packaging, transport, housing."]],
    case: ["Palm oil", "Unsustainable production links one product choice to deforestation and biodiversity loss."],
    qa: [
      ["Why is solar renewable?", "The Sun keeps providing energy on a human timescale."],
      ["What's the real problem with greenhouse gases?", "Not the natural effect itself, but EXTRA gases from human activity trapping more heat."],
    ],
  },
  {
    title: "11. Pollution",
    intro: "Point source pollution comes from one identifiable location (actionable directly). Non-point source comes from many spread-out locations (needs broad, regional action).",
    terms: [],
    case: [
      "Montara oil spill (2009, point source)",
      "West Atlas drilling-platform blowout, Timor Sea, north of Darwin — 4,500-34,000 m3 of oil over 75 days, ~6,000 km2 of ocean. NOT the Indian Ocean; NOT a cargo ship.",
    ],
    qa: [
      ["Point source vs. non-point source pollution?", "Point: one identifiable place. Non-point: many spread-out places."],
      ["Why is Great Barrier Reef run-off hard to fix?", "It comes from many farms across a whole region — no single source to target."],
    ],
  },
  {
    title: "12. The Ozone Layer",
    intro: "The ozone layer (stratosphere, 15-35 km up) absorbs ultraviolet (UV) light. It does NOT control heat — heat arrives as infrared radiation. Ozone depletion (caused by CFCs) and global warming (caused by greenhouse gases) are two separate problems.",
    terms: [],
    case: ["The Montreal Protocol (1987)", "Banned CFCs internationally after scientists found they were destroying the ozone layer over Antarctica. The ozone layer is now recovering — a genuine environmental success story."],
    qa: [
      ["What does the ozone layer filter?", "Ultraviolet (UV) light, especially UV-B — not heat."],
      ["Why are ozone depletion and global warming separate problems?", "Different causes (CFCs vs. greenhouse gases) and different mechanisms (UV filtering vs. heat trapping)."],
    ],
  },
];

const GLOSSARY = [
  ["Abiotic factor", "A non-living part of an ecosystem."],
  ["Aquifer", "An underground layer of rock/soil that stores water."],
  ["Biodiversity", "The variety of life at genetic, species and ecosystem levels."],
  ["Biotic factor", "A living part of an ecosystem."],
  ["Carrying capacity", "The maximum population an environment can support."],
  ["Day Zero", "The point a reservoir has no water left for anyone."],
  ["Ecosystem services", "Provisioning, regulating, supporting and cultural benefits from nature."],
  ["Invasive species", "A non-native organism that spreads and causes harm."],
  ["IUCN Red List", "A formal system classifying species by extinction risk."],
  ["Monoculture", "A system dominated by a single species."],
  ["Non-point source pollution", "Pollution from many spread-out sources."],
  ["Ocean acidification", "Seawater becoming more acidic from excess CO2."],
  ["Osmosis", "Water moving across a membrane from higher to lower concentration."],
  ["Ozone layer", "A stratospheric layer that absorbs most UV light."],
  ["Point source pollution", "Pollution from one identifiable location."],
  ["Population", "Individuals of one species in a specific, named area."],
  ["Renewable / non-renewable energy", "Naturally replenished quickly vs. used faster than it forms."],
  ["The 10% energy rule", "Only ~10% of energy transfers to the next trophic level."],
];

const EXAM_A = [
  "Define biodiversity.",
  "Name the three levels of biodiversity.",
  "What is the difference between a biotic factor and an abiotic factor?",
  "What is carrying capacity?",
  "Name Earth's four systems.",
  "What is the difference between point source and non-point source pollution?",
  "What is an aquifer?",
  "What is the difference between renewable and non-renewable energy?",
  "What does the ozone layer filter out of sunlight?",
  "What is a monoculture?",
];
const EXAM_B = [
  "Explain the 10% energy rule and use it to explain why top predators are usually rare. [4]",
  "Compare exponential and logistic growth, and explain what causes the shift between them. [5]",
  "Explain how the IUCN Red List, KBAs and AZE sites work together as a priority system. [6]",
  "Describe the water cycle using: evaporation, condensation, precipitation, infiltration, aquifer. [5]",
  "Explain why ozone depletion and global warming are two separate problems. [4]",
  "Explain point vs. non-point source pollution with a real example, and why one is easier to fix. [5]",
];

/* ------------------------------------------------------------------------
   Layout — same hand-written jsPDF technique as engine/engine.js.
   ------------------------------------------------------------------------ */
function buildGuidePDF(jsPDF) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 54, RIGHT = W - M, CW = W - M * 2;
  let y = M;

  const ink = [29, 33, 28], mut = [117, 124, 114], accent = [64, 99, 76], signal = [181, 85, 31], line = [200, 205, 198];
  const setColor = c => doc.setTextColor(c[0], c[1], c[2]);

  function footer() {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); setColor(mut);
    doc.text("Discovery Lab - Course Revision Guide - Environmental Science", M, H - 30);
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, RIGHT, H - 30, { align: "right" });
    setColor(ink);
  }
  function ensure(space) { if (y + space > H - M) { footer(); doc.addPage(); y = M; } }
  function rule() { doc.setDrawColor(...line); doc.setLineWidth(0.75); doc.line(M, y, RIGHT, y); y += 12; }
  function h1(text) {
    ensure(30); doc.setFont("helvetica", "bold"); doc.setFontSize(16); setColor(accent);
    doc.text(pdfSafe(text), M, y); y += 22; setColor(ink);
  }
  function h2(text) {
    ensure(20); doc.setFont("helvetica", "bold"); doc.setFontSize(12.5); setColor(signal);
    doc.text(pdfSafe(text).toUpperCase(), M, y); y += 16; setColor(ink);
  }
  function para(text, { size = 10, style = "normal", color = ink, gap = 6, indent = 0 } = {}) {
    doc.setFont("helvetica", style); doc.setFontSize(size); setColor(color);
    const lines = doc.splitTextToSize(pdfSafe(text), CW - indent);
    ensure(lines.length * (size + 3) + gap);
    doc.text(lines, M + indent, y);
    y += lines.length * (size + 3) + gap;
    setColor(ink);
  }
  function termBox(term, def) {
    ensure(16);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); setColor(accent);
    doc.text(pdfSafe(term) + ":", M, y);
    const label = pdfSafe(term) + ": ";
    const labelW = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); setColor(ink);
    const lines = doc.splitTextToSize(pdfSafe(def), CW - labelW);
    doc.text(lines[0] || "", M + labelW, y);
    y += 13;
    for (let i = 1; i < lines.length; i++) { ensure(13); doc.text(lines[i], M, y); y += 13; }
    y += 4;
  }
  function caseBox(title, text) {
    ensure(14);
    doc.setDrawColor(...signal); doc.setLineWidth(1.4); doc.line(M, y - 9, M, y - 9);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); setColor(signal);
    doc.text("CASE FILE - " + pdfSafe(title), M, y); y += 13;
    para(text, { size: 9.3, color: [70, 76, 68], gap: 8 });
  }

  /* --- Cover --- */
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); setColor(signal);
  doc.text("DISCOVERY LAB - COURSE REVISION GUIDE", M, y); y += 26;
  doc.setFont("helvetica", "bold"); doc.setFontSize(24); setColor(ink);
  doc.text("Environmental Science", M, y); y += 20;
  doc.setFont("helvetica", "normal"); doc.setFontSize(11); setColor(mut);
  doc.text("US Pathway, High School - every topic from the course, start to finish.", M, y); y += 28;
  rule();
  para(
    "This is a compact print edition of the online guide. The live version has interactive diagrams for the " +
    "food web, water cycle, population growth curves, Earth's systems and the ozone layer - open the activity " +
    "link on the course page to see them.",
    { size: 9.5, style: "italic", color: mut, gap: 18 }
  );

  h1("Contents");
  CHAPTERS.forEach(c => para(c.title, { size: 10, gap: 4 }));
  para("Glossary of Key Terms", { size: 10, gap: 4 });
  para("Exam Practice", { size: 10, gap: 4 });

  /* --- Chapters --- */
  CHAPTERS.forEach(chapter => {
    doc.addPage(); y = M;
    h1(chapter.title);
    para(chapter.intro, { size: 10, gap: 10 });
    chapter.terms.forEach(([t, d]) => termBox(t, d));
    if (chapter.case) caseBox(chapter.case[0], chapter.case[1]);
    if (chapter.qa.length) {
      ensure(14);
      doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); setColor(accent);
      doc.text("FIELD TEST", M, y); y += 13; setColor(ink);
      chapter.qa.forEach(([q, a]) => {
        para(q, { size: 9.3, style: "bold", gap: 2 });
        para(a, { size: 9.3, style: "italic", color: mut, gap: 8, indent: 10 });
      });
    }
    footer();
  });

  /* --- Glossary --- */
  doc.addPage(); y = M;
  h1("Glossary of Key Terms");
  GLOSSARY.forEach(([t, d]) => termBox(t, d));
  footer();

  /* --- Exam practice --- */
  doc.addPage(); y = M;
  h1("Exam Practice");
  h2("Section A - Short Answer");
  EXAM_A.forEach((q, i) => para(`${i + 1}. ${q}`, { size: 9.7, gap: 6 }));
  h2("Section B - Extended Response");
  EXAM_B.forEach((q, i) => para(`${i + 1}. ${q}`, { size: 9.7, gap: 8 }));
  para(
    "Answers to every Field Test and Exam Practice question are on the live online guide.",
    { size: 9, style: "italic", color: mut, gap: 4 }
  );
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

async function handleClick(btn, label, statusEl) {
  const original = label.textContent;
  btn.disabled = true;
  label.textContent = "Building PDF...";
  if (statusEl) statusEl.textContent = "";
  try {
    const jsPDF = await loadJsPDF();
    const blob = buildGuidePDF(jsPDF);
    downloadBlob(blob, "Discovery_Lab_Environmental_Science_Revision_Guide.pdf");
    if (statusEl) statusEl.textContent = "Downloaded.";
  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = "Something went wrong building the PDF - try again.";
  } finally {
    btn.disabled = false;
    label.textContent = original;
  }
}

const enBtn = document.getElementById("pdfBtn");
const enLabel = document.getElementById("pdfBtnLabel");
const status = document.getElementById("pdfStatus");
if (enBtn) enBtn.addEventListener("click", () => handleClick(enBtn, enLabel, status));

const esBtn = document.getElementById("pdfBtnEs");
if (esBtn) esBtn.addEventListener("click", () => handleClick(esBtn, esBtn.querySelector("span"), null));
