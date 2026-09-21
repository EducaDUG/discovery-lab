/* ==========================================================================
   Course Revision Guide — "Download Notes (PDF)" button.

   Deliberately plain: this follows the content and section structure of
   Diego's own Google Doc ("Environmental Science: Master Study & Revision
   Guide") exactly as he wrote it — same heading order, same section
   numbers, same tables — with no added visual design (no colour system,
   no diagrams beyond what the doc itself describes). Per his standing
   instruction, Claude does not design pages or PDFs for this project; this
   is a plain, functional conversion using the vendored jsPDF library
   (CLAUDE.md: "PDF via jsPDF... never window.print()").

   Note on content: the Doc's plain-text export drops its inserted
   equation/percentage objects (a Google Docs export issue, not a content
   choice), leaving blanks like "Approximately of energy is lost". Every
   such gap below has been filled back in with the same figures already
   verified and used elsewhere on this site (the 10% trophic rule, 97%
   ocean salinity, 78%/21% N2/O2, etc.) — nothing here is invented.
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
    doc.text("Environmental Science - Master Study & Revision Guide", M, H - 30);
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, RIGHT, H - 30, { align: "right" });
    setText(INK);
  }
  function newPage() { footer(); doc.addPage(); y = M; }
  function ensure(space) { if (y + space > H - M) newPage(); }
  function rule() { setDraw(LINE); doc.setLineWidth(0.6); doc.line(M, y, RIGHT, y); y += 10; }

  function h1(text) {
    ensure(28); doc.setFont("helvetica", "bold"); doc.setFontSize(17); setText(INK);
    doc.text(pdfSafe(text), M, y); y += 8; rule(); y += 6;
  }
  function h2(text) {
    ensure(20); doc.setFont("helvetica", "bold"); doc.setFontSize(13); setText(INK);
    doc.text(pdfSafe(text), M, y); y += 18;
  }
  function h3(text) {
    ensure(16); doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); setText(INK);
    doc.text(pdfSafe(text), M, y); y += 14;
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
  function formulaBox(text) {
    doc.setFont("courier", "normal"); doc.setFontSize(10);
    const lines = doc.splitTextToSize(pdfSafe(text), CW - 20);
    const boxH = lines.length * 14 + 14;
    ensure(boxH + 10);
    setDraw(LINE); doc.setLineWidth(0.7); doc.rect(M, y, CW, boxH);
    setText(INK);
    doc.text(lines, M + 10, y + 16, { lineHeightFactor: 1.4 });
    y += boxH + 12; doc.setFont("helvetica", "normal");
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
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.6); setText(INK);
      row.forEach((cell, i) => { doc.text(cellLines[i], cx + 4, y + 11); cx += cw[i]; });
      y += thisRowH;
      setDraw(LINE); doc.setLineWidth(0.5); doc.line(M, y, RIGHT, y);
    });
    y += 14;
  }

  /* ------------------------------------------------------------------------
     Title
     ------------------------------------------------------------------------ */
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); setText(INK);
  doc.text("Environmental Science: Master Study & Revision Guide", M, y, { maxWidth: CW }); y += 44;
  doc.setFont("helvetica", "italic"); doc.setFontSize(10.5); setText(MUT);
  doc.text("Notes only - Interactive Labs and the Practice Quiz are on the live course page.", M, y); y += 28;
  setText(INK);

  /* ==========================================================================
     LEVEL 1: FOUNDATIONS
     ========================================================================== */
  h1("LEVEL 1: Foundations (Core Concepts & Systems)");

  h2("1. What Is Environmental Science?");
  para(
    "Environmental Science is an interdisciplinary field integrating biology, chemistry, geology, " +
    "hydrology, atmospheric physics, and social sciences to evaluate how natural systems operate and " +
    "how human society interacts with them. It studies Earth's four connected systems: the Atmosphere " +
    "(gases, UV), the Hydrosphere (water, ice), the Geosphere (rock, soil), and the Biosphere (living " +
    "organisms)."
  );
  h3("Key Concepts & Definitions");
  bullets([
    "The Environment: the complete system of air, water, soil, biological organisms, and human-built surroundings that continuously interact.",
    "Environmental Problem-Solving: a systematic method for addressing degradation.",
  ]);
  numbered([
    "Observe: identify degradation (e.g. declining coral reef cover).",
    "Question: formulate testable hypotheses (e.g. ocean warming vs. agricultural runoff).",
    "Gather Evidence: collect empirical field data (e.g. water pH, temperature, species counts).",
    "Design Solutions: implement targeted policies or ecological interventions.",
  ]);
  h3("The Water Shortage Paradox");
  para(
    "Earth's total water volume remains constant as water continuously circulates through a closed " +
    "hydrological loop. The true crisis is the regional scarcity of clean, safe, and accessible fresh " +
    "water fit for human consumption and agriculture."
  );
  h3("Real-World Case Example");
  para(
    "In Manila, Philippines, single-use plastic sachets provide affordable daily commodities to " +
    "low-income households, but take minutes to consume while persisting in urban waterways and " +
    "oceanic gyres for centuries."
  );

  h2("2. Earth's Four Interconnected Spheres");
  para(
    "Earth operates as a single dynamic super-system. Disruptions in one sphere trigger cascading " +
    "reactions across the remaining three."
  );
  table(
    ["Sphere", "Primary Composition", "Core Functions & Elements"],
    [
      ["Geosphere", "Rocks, minerals, soil horizons, tectonic plates.", "Provides physical structure, mineral nutrients, and geological cycling."],
      ["Hydrosphere", "Oceans (97% of Earth's water), ice sheets/glaciers, groundwater, rivers.", "Regulates global climate and drives nutrient transport."],
      ["Atmosphere", "Nitrogen (78%), Oxygen (21%), Argon (0.9%), trace greenhouse gases.", "Filters solar UV radiation and retains surface thermal heat."],
      ["Biosphere", "All living organisms across terrestrial and aquatic biomes.", "Converts solar energy into organic biomass and recycles nutrients."],
    ],
    [82, 220, 240]
  );
  h3("Sphere Interconnection Cascade");
  para(
    "When a subduction earthquake occurs off the coast of Sumatra, Indonesia (Geosphere), it triggers " +
    "a tsunami wave surge across the Indian Ocean (Hydrosphere), destroying coastal mangrove forests " +
    "(Biosphere), which reduces long-term coastal carbon sequestration (Atmosphere)."
  );

  h2("3. Ecosystem Dynamics & Energy Flow");
  para(
    "An ecosystem consists of biological communities (biotic) interacting with non-living physical " +
    "environments (abiotic). Energy flows unidirectionally, whereas nutrients cycle continuously."
  );
  formulaBox("Primary Producer (Algae) -> Primary Consumer (Tadpole)\n  -> Secondary Consumer (Small Fish) -> Tertiary Consumer (Heron)");
  h3("The 10% Trophic Transfer Rule");
  para(
    "Energy efficiency between trophic levels is strictly limited. Approximately 90% of metabolic " +
    "energy is lost as low-grade heat through cellular respiration, movement, and unabsorbed waste at " +
    "each step. Only about 10% is converted into biological tissue (biomass) and passed to the next " +
    "level. Because available energy drops exponentially at higher levels, apex predators require " +
    "extensive territorial ranges and are naturally rare in ecosystems."
  );

  h2("4. Ecosystem Services & Biodiversity");
  para("Biodiversity is structured across three hierarchical levels:");
  numbered([
    "Genetic Diversity: DNA variations within a single population (e.g. disease-resistant wild rice strains in Southeast Asia).",
    "Species Diversity: the variety and relative abundance of species in an ecosystem (e.g. tree species richness in the Amazon Basin).",
    "Ecosystem Diversity: the variety of habitats and biological processes across landscapes (e.g. transition from alpine meadows to valley wetlands).",
  ]);
  h3("Four Categories of Ecosystem Services");
  bullets([
    "Provisioning: direct raw materials extracted from nature (timber, crops, medicinal compounds - over 50% of modern pharmaceuticals originate from natural compounds).",
    "Regulating: natural processes moderated by functional ecosystems (mangrove storm-surge attenuation, water filtration by forests).",
    "Supporting: fundamental processes underlying all life (photosynthesis, soil formation, nitrogen cycling).",
    "Cultural: non-material, aesthetic, and spiritual benefits (ecotourism, sacred natural sites).",
  ]);

  /* ==========================================================================
     LEVEL 2: APPLIED SYSTEMS
     ========================================================================== */
  h1("LEVEL 2: Applied Systems (Processes & Dynamics)");

  h2("5. Population Ecology & Growth Dynamics");
  para(
    "A population is a group of individuals of the same species living in a defined geographical area " +
    "at a specific time."
  );
  h3("Growth Curves");
  bullets([
    "Exponential Growth (J-Curve): unbounded growth under unlimited resources - dN/dt = rN.",
    "Logistic Growth (S-Curve): growth regulated by Carrying Capacity (K) due to environmental resistance (space, food, disease) - dN/dt = rN x (K - N) / K.",
  ]);
  h3("Density-Dependent vs. Density-Independent Factors");
  bullets([
    "Density-Dependent: impact intensifies as population density increases (disease transmission, intraspecific competition for food/nesting sites).",
    "Density-Independent: impact occurs regardless of population density (wildfires, volcanic eruptions, tsunamis).",
  ]);

  h2("6. Soil Horizon Stratigraphy");
  para("Soil formation requires up to 1,000 years per inch of topsoil.");
  bullets([
    "O Horizon: organic layer (humus, leaf litter, decaying biomass).",
    "A Horizon: topsoil (dark, nutrient-rich, high biological activity).",
    "B Horizon: subsoil (accumulated minerals, iron, clay leachates).",
    "C Horizon: weathered parent material (partially broken bedrock).",
    "R Horizon: bedrock (solid, unweathered rock layer).",
  ]);
  h3("Osmotic Mechanics in Aquatic Organisms");
  bullets([
    "Freshwater Fish: hypertonic relative to their environment. Water constantly enters cells passively via osmosis. They excrete large amounts of dilute urine and actively absorb salt ions.",
    "Saltwater Fish: hypotonic relative to seawater. Water continuously leaves body cells via osmosis. They drink seawater and actively pump excess salt ions out through specialised gill cells.",
  ]);

  h2("7. Agriculture, Forest Fragmentation & Conservation Priorities");
  table(
    ["Model", "Structural Characteristics", "Ecological Trade-offs"],
    [
      ["Industrial Monoculture", "Single crop strain over vast acreage using synthetic fertilizers and pesticides.", "High yield per worker, but causes soil depletion, high fossil fuel use, and severe pest vulnerability."],
      ["Agroforestry", "Trees and shrubs cultivated alongside agricultural crops or livestock.", "Stabilises topsoil, enhances habitat biodiversity, increases carbon sequestration, and improves soil water retention."],
    ],
    [110, 220, 212]
  );
  h3("Conservation Frameworks");
  bullets([
    "Key Biodiversity Areas (KBAs): sites contributing significantly to global biodiversity persistence.",
    "Alliance for Zero Extinction (AZE) Sites: KBA sub-sites holding the last remaining wild population of a Critically Endangered or Endangered species.",
  ]);

  /* ==========================================================================
     LEVEL 3: EXPERT ANALYSIS
     ========================================================================== */
  h1("LEVEL 3: Expert Analysis (Global Systems & Pollution)");

  h2("8. Ocean Acidification & Chemical Cascades");
  para(
    "Increased atmospheric carbon dioxide (CO2) dissolves into ocean surface waters, forming carbonic " +
    "acid (H2CO3), which dissociates into hydrogen ions (H+) and bicarbonate (HCO3-). Free H+ ions bind " +
    "with available carbonate ions (CO3^2-), depleting the carbonate required by marine organisms to " +
    "build calcium carbonate (CaCO3) shells and reefs."
  );
  formulaBox("CO2 + H2O -> H2CO3 -> H+ + HCO3-\nH+ + CO3(2-) -> HCO3-   (depletes carbonate needed for CaCO3 shells)");

  h2("9. Atmospheric Criteria Pollutants & Smog Chemistry");
  para(
    "The World Health Organization reports that 99% of humans breathe air exceeding safety threshold " +
    "limits, leading to roughly 7 million premature deaths annually."
  );
  bullets([
    "Carbon Monoxide (CO): odourless, toxic gas from incomplete combustion; binds to hemoglobin, blocking blood oxygen transport.",
    "Nitrogen Oxides (NOx): formed in high-temperature engine combustion; causes brown photochemical smog and nitric acid rain.",
    "Sulfur Dioxide (SO2): released from coal combustion; primary driver of sulfuric acid rain.",
    "Fine Particulate Matter (PM2.5): microscopic soot particles that penetrate deep into lung alveoli and enter bloodstream circulation.",
  ]);

  h2("10. Decoupling Analysis: Ozone Depletion vs. Global Climate Change");
  table(
    ["Parameter", "Stratospheric Ozone Depletion", "Global Climate Change"],
    [
      ["Atmospheric Layer", "Stratosphere (15-35 km).", "Troposphere (0-12 km)."],
      ["Primary Pollutants", "Chlorofluorocarbons (CFCs), Halons.", "CO2, CH4, N2O, fluorinated gases."],
      ["Radiation Mode", "Ultraviolet (UV-B) filtering.", "Infrared (IR) thermal heat trapping."],
      ["Key Global Treaty", "Montreal Protocol (1987).", "Paris Agreement (2015)."],
    ],
    [100, 216, 216]
  );

  /* ==========================================================================
     EXAM PRACTICE BANK & REVISION EXERCISES
     ========================================================================== */
  h1("Exam Practice Bank & Revision Exercises");

  h2("Section A: Diagnostic Short-Answer Questions");
  const sectionA = [
    ["What is the 10% Energy Transfer Rule?",
     "Only approximately 10% of energy stored as biomass at one trophic level is transferred to the next. The remaining 90% is lost through metabolic respiration, heat, and unabsorbed waste."],
    ["Differentiate between Point Source and Non-Point Source pollution.",
     "Point Source pollution originates from a single, discrete, identifiable discharge point (e.g. an industrial pipe). Non-Point Source pollution originates from diffuse, widespread areas across a watershed (e.g. agricultural fertiliser runoff)."],
    ["What equation describes population size changes over time?",
     "Delta N = (Births + Immigration) - (Deaths + Emigration)."],
    ["Why is ocean acidification detrimental to calcifying organisms?",
     "Excess dissolved CO2 produces free H+ ions that react with carbonate ions (CO3^2-), converting them to bicarbonate (HCO3-). This reduces the available carbonate needed for corals and molluscs to synthesise CaCO3 skeletons."],
  ];
  sectionA.forEach((qa, i) => {
    para(`Q${i + 1}: ${qa[0]}`, { style: "bold", gap: 3 });
    para(`Answer: ${qa[1]}`, { style: "italic", gap: 12, indent: 10 });
  });

  h2("Section B: Extended Analytical Essay & Marking Rubric");
  para(
    "Essay Prompt: Compare exponential (J-curve) and logistic (S-curve) population growth models. " +
    "Explain the environmental mechanisms that cause a population to transition between these growth " +
    "modes, and detail why understanding Carrying Capacity (K) is critical for wildlife conservation. [5 Marks]",
    { style: "bold", gap: 12 }
  );
  h3("Model Answer & Scoring Rubric");
  numbered([
    "Exponential Model: defines exponential growth (dN/dt = rN) as accelerating growth under ideal conditions with unlimited resources.",
    "Logistic Model: defines logistic growth (dN/dt = rN(K-N)/K) as growth that decelerates and stabilises around Carrying Capacity (K).",
    "Environmental Resistance: identifies that as population density increases, environmental resistance (resource scarcity, competition, space limitations) slows growth.",
    "Density-Dependent Feedback: explains that density-dependent factors like disease spread and food competition increase death rates or lower birth rates until equilibrium (N = K) is achieved.",
    "Conservation Application: connects Carrying Capacity (K) to wildlife management - exceeding K causes habitat degradation, resource overshoot, and severe population crashes.",
  ]);

  /* ==========================================================================
     RESOURCE HUB
     ========================================================================== */
  h1("Verified Educational Resource Hub");
  bullets([
    "PhET Interactive Earth Science Simulations: https://phet.colorado.edu/en/simulations/category/earth-science",
    "Khan Academy Biology & Ecology Curriculum: https://www.khanacademy.org/science/hs-biology",
    "BBC Bitesize Secondary Science Guides: https://www.bbc.co.uk/bitesize/subjects/z2f3cdm",
    "NASA Climate Kids Educational Portal: https://climatekids.nasa.gov",
    "IUCN Red List Species Assessment Database: https://www.iucnredlist.org",
    "NOAA Education Resource Collections: https://www.noaa.gov/education",
  ]);

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

const btn = document.getElementById("downloadNotesBtn");
if (btn) {
  btn.addEventListener("click", async () => {
    const label = btn.querySelector("span") || btn;
    const original = label.textContent;
    btn.disabled = true;
    label.textContent = "Building PDF...";
    try {
      const jsPDF = await loadJsPDF();
      const blob = buildNotesPDF(jsPDF);
      downloadBlob(blob, "Environmental_Science_Revision_Notes.pdf");
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
