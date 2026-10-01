/* Edexcel IGCSE Biology (4BI1) command-word data - imported from the supplied command-words master pack. */
export const COMMAND_WORDS = [
  {
    id: 'add-label',
    word: 'Add / Label',
    category: 'practical',
    officialDefinition: 'Requires the addition or labelling of a stimulus material given in the question, for example labelling a diagram or adding units to a table.',
    paraphrasedDefinitions: [
      'Annotate or insert designated names, arrow lines, or units directly onto an provided stimulus diagram or table.',
      'Mark specific features on an existing biological illustration or insert headers/units into experimental data charts.',
      'Place pointer lines and names onto stimulus material or fill missing units into a results grid.'
    ],
    examinerRule: 'Draw neat, straight label lines with a ruler that touch the exact organelle or tissue. Never leave arrows floating in empty space.',
    commonTrap: 'Drawing label lines that cross each other or stop short of the membrane/organelle (e.g. pointing into cytoplasm when asked to label the cell wall).',
    typicalMarks: '1–2 marks',
    biologyExample: {
      context: 'Structure of a flowering plant leaf',
      questionStem: 'Label the palisade mesophyll layer and the spongy mesophyll layer on the leaf cross-section diagram.',
      whatExaminerWants: 'Precise lines terminating on the column-shaped palisade cells and loosely packed lower cells.'
    }
  },
  {
    id: 'calculate',
    word: 'Calculate',
    category: 'data-math',
    officialDefinition: 'Obtain a numerical answer, showing relevant working.',
    paraphrasedDefinitions: [
      'Work out a final numerical quantity by applying mathematical operations and explicitly detailing each intermediate step.',
      'Determine a quantitative figure using equations or raw data, making sure your full calculation steps and units are presented.',
      'Perform arithmetic operations (e.g. magnification, percentage change, surface area to volume) and show working.'
    ],
    examinerRule: 'Always write the formula, substitute values, state units, and round to the specified number of decimal places or significant figures.',
    commonTrap: 'Writing only the final number without working; if the final digit is wrong, you lose all 2-3 marks without working marks.',
    typicalMarks: '2–3 marks',
    biologyExample: {
      context: 'Osmosis in potato cylinders',
      questionStem: 'Calculate the percentage change in mass of the potato cylinder in 0.4 mol/dm³ sucrose solution. Initial mass = 4.20 g, final mass = 4.62 g.',
      whatExaminerWants: '((4.62 - 4.20) / 4.20) * 100 = +10.0% with working shown.'
    }
  },
  {
    id: 'comment-on',
    word: 'Comment on',
    category: 'evaluation',
    officialDefinition: 'Requires the synthesis of a number of variables from data/information to form a judgement.',
    paraphrasedDefinitions: [
      'Synthesize information across multiple variables or datasets to reach a reasoned conclusion or judgement.',
      'Bring together different variables presented in tables or graphs to formulate an evidence-based biological verdict.',
      'Analyze multiple factors (e.g. temperature, oxygen levels, yield) together to make an informed assessment.'
    ],
    examinerRule: 'Do not just describe one variable in isolation. You must integrate at least two variables to draw your conclusion.',
    commonTrap: 'Simply quoting numbers from the graph without connecting how variable X influences variable Y to form an overall judgement.',
    typicalMarks: '2–4 marks',
    biologyExample: {
      context: 'Fish farming water quality & stocking density',
      questionStem: 'Comment on how oxygen concentration and water temperature affect the growth rate of farmed salmon shown in Table 2.',
      whatExaminerWants: 'Synthesizing higher temperature decreasing dissolved oxygen with reduced metabolic aerobic growth.'
    }
  },
  {
    id: 'complete',
    word: 'Complete',
    category: 'recall',
    officialDefinition: 'Requires the completion of a table/diagram.',
    paraphrasedDefinitions: [
      'Fill in missing entries, blank spaces, values, or structural features in a supplied table or diagram.',
      'Finish an unfinished biological chart, flow diagram, or table by entering the missing biological terms or figures.',
      'Supply the missing parts of a genetic cross diagram, reflex pathway, or food test comparison matrix.'
    ],
    examinerRule: 'Ensure terminology and units match the existing table format. Check both rows and column headers.',
    commonTrap: 'Writing contradictory information or leaving single cells empty when multiple parts must be filled.',
    typicalMarks: '1–3 marks',
    biologyExample: {
      context: 'Food test reagents and positive colours',
      questionStem: 'Complete the table by writing the reagent used and the positive colour result for starch and reducing sugars.',
      whatExaminerWants: 'Starch: Iodine (blue-black); Glucose: Benedict\'s heated in water bath (brick red).'
    }
  },
  {
    id: 'deduce',
    word: 'Deduce',
    category: 'application',
    officialDefinition: 'Draw/reach conclusion(s) from the information provided.',
    paraphrasedDefinitions: [
      'Derive a logical conclusion based exclusively on the provided biological evidence, trends, or stimulus.',
      'Infer a valid scientific finding or takeaway strictly by interpreting the data presented in the question.',
      'Reach an evidence-grounded deduction using only the supplied facts, pedigree charts, or experimental results.'
    ],
    examinerRule: 'The answer is directly supported by the stimulus. You must reference specific evidence from the text or chart.',
    commonTrap: 'Writing general textbook theory that does not directly link to or answer what the specific experiment demonstrated.',
    typicalMarks: '2–3 marks',
    biologyExample: {
      context: 'Pedigree chart for Huntington\'s disease',
      questionStem: 'Deduce whether Huntington\'s disease is caused by a dominant or a recessive allele, using evidence from the pedigree chart.',
      whatExaminerWants: 'Dominant, because every affected child has at least one affected parent (persons 3 and 4 have affected child 7).'
    }
  },
  {
    id: 'describe',
    word: 'Describe',
    category: 'application',
    officialDefinition: 'To give an account of something. Statements in the response need to be developed, as they are often linked but do not need to include a justification or reason.',
    paraphrasedDefinitions: [
      'State what happens or recount a pattern/sequence without having to justify why or explain the biological mechanism.',
      'Give a detailed, step-by-step recall of a biological process or trend without explaining the underlying molecular causes.',
      'Detail the physical characteristics, observable trends on a graph, or stages of a reflex arc without explaining why.'
    ],
    examinerRule: 'Focus on "WHAT happened", not "WHY". For graphs: state initial trend, peak/inflection point with numbers, and subsequent trend.',
    commonTrap: 'CRITICAL PITFALL: Writing lengthy explanations ("because the enzymes denatured") when the examiner only awarded marks for the graph trends ("increases from 10 to 40°C, peaks at 40°C, then decreases to 0 at 60°C").',
    typicalMarks: '2–4 marks',
    biologyExample: {
      context: 'Enzyme temperature graph',
      questionStem: 'Describe the effect of temperature on the rate of amylase activity shown in the graph.',
      whatExaminerWants: 'Rate increases up to 40°C; reaches optimum of 32 arbitrary units at 40°C; then sharply decreases to zero at 60°C.'
    }
  },
  {
    id: 'determine',
    word: 'Determine',
    category: 'data-math',
    officialDefinition: 'The answer must have an element that is quantitative from the stimulus provided, or must show how the answer can be reached quantitatively. To gain maximum marks, there must be a quantitative element to the answer.',
    paraphrasedDefinitions: [
      'Extract or calculate a quantitative metric directly from the provided stimulus or graph to arrive at the answer.',
      'Establish a numerical answer by reading values from a graph or using quantitative data from the resource.',
      'Derive an exact quantitative outcome supported by figures taken from the provided biology stimulus.'
    ],
    examinerRule: 'To get full marks, your answer MUST quote numbers with appropriate units directly from the provided stimulus.',
    commonTrap: 'Giving a purely qualitative answer (e.g. "it gets higher") without citing the exact numerical values or calculating differences.',
    typicalMarks: '2–3 marks',
    biologyExample: {
      context: 'Breathing rate after exercise',
      questionStem: 'Determine how long it takes for the person\'s breathing rate to return to resting rate after exercise.',
      whatExaminerWants: 'Locate resting rate (14 breaths/min), find post-exercise recovery point on x-axis: 6.5 minutes.'
    }
  },
  {
    id: 'design',
    word: 'Design',
    category: 'practical',
    officialDefinition: 'Plan or invent a procedure from existing principles/ideas.',
    paraphrasedDefinitions: [
      'Formulate a comprehensive experimental method or procedure applying scientific principles (Edexcel 6-mark CORMMSS).',
      'Devise an original, step-by-step scientific investigation method from known biological principles.',
      'Construct a valid, reliable laboratory protocol specifying independent, dependent, and controlled variables.'
    ],
    examinerRule: 'Use the Edexcel CORMMSS framework: Change (IV), Organism (standardize species/mass), Repeat (for reliability/mean), Measure 1 (DV), Measure 2 (timeframe), Same 1 & Same 2 (CVs).',
    commonTrap: 'Forgetting repeats for reliability or failing to state two named control variables with concrete values (e.g. "keep temperature constant at 25°C").',
    typicalMarks: '6 marks',
    biologyExample: {
      context: 'Yeast anaerobic respiration investigation',
      questionStem: 'Design an investigation to find the effect of glucose concentration on the rate of anaerobic respiration in yeast.',
      whatExaminerWants: 'C: at least 5 glucose concs; O: same yeast species/volume; R: 3 repeats per conc; M1: volume CO2 or bubbles; M2: in 5 minutes; S1: constant temp in water bath; S2: layer of oil to prevent oxygen entering.'
    }
  },
  {
    id: 'discuss',
    word: 'Discuss',
    category: 'evaluation',
    officialDefinition: 'Identify the issue/situation/problem/argument that is being assessed within the question. Explore all aspects of an issue/situation/problem/argument. Investigate the issue/situation etc. by reasoning or argument.',
    paraphrasedDefinitions: [
      'Explore multiple sides of an argument or biological problem by identifying issues and reasoning through strengths and limitations.',
      'Examine all facets of a controversial or multifaceted biological topic using structured reasoning.',
      'Present arguments for and against a biological issue (e.g. genetically modified crops, stem cell therapies).'
    ],
    examinerRule: 'Must give balanced arguments covering both sides (pros and cons / benefits and risks) before summing up.',
    commonTrap: 'Only listing positive benefits and completely omitting counter-arguments, hazards, ethical concerns, or drawbacks.',
    typicalMarks: '4–6 marks',
    biologyExample: {
      context: 'Use of embryonic stem cells in medicine',
      questionStem: 'Discuss the potential benefits and ethical concerns of using embryonic stem cells to treat human diseases.',
      whatExaminerWants: 'Benefits: can differentiate into any cell type, potential cure for Parkinson\'s/diabetes; Concerns: destruction of viable human embryos, risk of tumor formation.'
    }
  },
  {
    id: 'draw',
    word: 'Draw',
    category: 'practical',
    officialDefinition: 'Produce a diagram either using a ruler or freehand.',
    paraphrasedDefinitions: [
      'Create a biological representation, diagram, food web, or apparatus setup using clean lines or a ruler.',
      'Produce an anatomical sketch, Punnett square, or pyramid of biomass/number.',
      'Generate a schematic diagram illustrating biological organs, reflex pathways, or experimental apparatus.'
    ],
    examinerRule: 'Use single, continuous, unshaded pencil lines. No artistic shading or fuzzy sketching. Include labels where requested.',
    commonTrap: 'Sketchy feathered lines, 3D shading, or drawing unclosed cell membranes in biological line diagrams.',
    typicalMarks: '2–3 marks',
    biologyExample: {
      context: 'Pyramids of numbers and biomass',
      questionStem: 'Draw a pyramid of biomass for a food chain consisting of oak tree -> caterpillars -> blue tits -> sparrowhawk.',
      whatExaminerWants: 'A true stepped pyramid with a wide base for the single oak tree (biomass is large), progressively narrowing at each trophic level.'
    }
  },
  {
    id: 'estimate',
    word: 'Estimate',
    category: 'data-math',
    officialDefinition: 'Find an approximate value, number or quantity from a diagram/given data or through a calculation.',
    paraphrasedDefinitions: [
      'Determine an approximate numerical value or order of magnitude using visual data, diagrams, or sampling calculations.',
      'Calculate a reasonable approximation of a population count or measurement from incomplete or sampled data.',
      'Gauge an approximate quantity from quadrat counts, micrographs, or graphical interpolation.'
    ],
    examinerRule: 'State the calculation method clearly. E.g. (Total area / Quadrat area) * mean organisms per quadrat.',
    commonTrap: 'Giving an exact number without stating the sampling multiplier or rounding unreasonably.',
    typicalMarks: '2 marks',
    biologyExample: {
      context: 'Quadrat sampling in a field',
      questionStem: 'Estimate the total dandelion population in a 200 m² field using 10 random 0.25 m² quadrat samples where the mean count was 6 dandelions per quadrat.',
      whatExaminerWants: 'Total quadrats in field = 200 / 0.25 = 800; Estimated population = 800 * 6 = 4,800 dandelions.'
    }
  },
  {
    id: 'evaluate',
    word: 'Evaluate',
    category: 'evaluation',
    officialDefinition: 'Review information (e.g. data, methods) then bring it together to form a conclusion, drawing on evidence including strengths, weaknesses, alternative actions, relevant data or information. Come to a supported judgement of a subject\'s quality and relate it to its context.',
    paraphrasedDefinitions: [
      'Appraise evidence, methodology, and data by weighing up strengths, weaknesses, and validity before making a supported verdict.',
      'Scrutinize experimental validity, sample size, and confounding factors to judge whether a claim is justified.',
      'Critique a student\'s investigation or conclusion by identifying experimental flaws, supporting data, and opposing data.'
    ],
    examinerRule: 'Structure your answer: Points supporting the conclusion + Points opposing/limitations (sample size, lack of controls, age/gender bias) + Overall judgement.',
    commonTrap: 'Failing to give both "For" and "Against" points. You cannot achieve maximum marks without examining both perspectives.',
    typicalMarks: '4–6 marks',
    biologyExample: {
      context: 'Claim that Vitamin C prevents the common cold',
      questionStem: 'A student claims that taking 1000 mg of Vitamin C daily prevents colds. Evaluate this claim based on the clinical trial results in Table 1.',
      whatExaminerWants: 'Support: slightly fewer sick days in test group; Oppose: small sample size (only 12 people), all male teenagers, no placebo control; Final judgement: claim is not fully supported.'
    }
  },
  {
    id: 'explain',
    word: 'Explain',
    category: 'application',
    officialDefinition: 'An explanation requires a justification/exemplification of a point. The answer must contain some element of reasoning/justification – this can include mathematical explanations.',
    paraphrasedDefinitions: [
      'Provide scientific reasons, biological causes, or mechanistic justifications for why or how an event takes place.',
      'Give the biological reasoning behind an observation, linking cause to cellular or physiological effect.',
      'Clarify why a biological phenomenon occurs using key scientific mechanisms and rationale.'
    ],
    examinerRule: 'CRITICAL: Must contain "BECAUSE" or a causal mechanism. E.g. "Active site denatures SO substrate cannot bind to form enzyme-substrate complexes".',
    commonTrap: 'Just stating what happened without explaining the mechanism (which gets 0 marks on an "Explain" question!).',
    typicalMarks: '2–4 marks',
    biologyExample: {
      context: 'Enzyme denaturation at 60°C',
      questionStem: 'Explain why the rate of reaction drops to zero when amylase is heated to 60°C.',
      whatExaminerWants: 'High kinetic energy breaks hydrogen bonds holding the tertiary structure; active site changes shape/denatures; substrate (starch) can no longer fit to form enzyme-substrate complexes.'
    }
  },
  {
    id: 'give-state-name',
    word: 'Give / State / Name',
    category: 'recall',
    officialDefinition: 'All of these command words are really synonyms. They generally all require recall of one or more pieces of information.',
    paraphrasedDefinitions: [
      'Provide a direct, concise factual answer, term, or value without any extended explanation.',
      'Recall and write down a single biological term, organ, chemical test, or definition directly from memory.',
      'Name an organelle, hormone, pathogen, or enzyme with a concise one-phrase response.'
    ],
    examinerRule: 'Keep it brief and exact. No sentences or explanations are needed—just the exact scientific noun.',
    commonTrap: 'Wasting exam time writing paragraphs or rambling answers when only a single word (e.g. "ribosome") is required.',
    typicalMarks: '1 mark',
    biologyExample: {
      context: 'Hormones in homeostasis',
      questionStem: 'Name the hormone that lowers blood glucose concentration.',
      whatExaminerWants: 'Insulin (1 word only).'
    }
  },
  {
    id: 'give-a-reason',
    word: 'Give a reason / reasons',
    category: 'application',
    officialDefinition: 'When a statement has been made and the requirement is only to give the reason(s) why.',
    paraphrasedDefinitions: [
      'State the underlying rationale or cause for a premise that has already been provided in the question.',
      'Supply the biological purpose or justification for a specific step or observation stated by the examiner.',
      'Identify the biological "why" for an already asserted experimental condition or anatomical feature.'
    ],
    examinerRule: 'Only provide the biological justification for the stated fact. Do not repeat the question premise.',
    commonTrap: 'Re-stating the prompt statement in different words instead of identifying the underlying scientific mechanism.',
    typicalMarks: '1–2 marks',
    biologyExample: {
      context: 'Water bath in ethanol test for leaf chlorophyll',
      questionStem: 'The student placed the boiling tube of ethanol into a beaker of hot water rather than directly over a Bunsen flame. Give a reason why.',
      whatExaminerWants: 'Ethanol is highly flammable (so removing the naked flame prevents fire hazards).'
    }
  },
  {
    id: 'identify',
    word: 'Identify',
    category: 'recall',
    officialDefinition: 'Usually requires some key information to be selected from a given stimulus/resource.',
    paraphrasedDefinitions: [
      'Select and extract a specific piece of data, label, or fact directly from a supplied resource or diagram.',
      'Pick out a distinctive feature, variable, or data point from a graph, diagram, or table.',
      'Locate and state the key item or structure pointed to within the provided stimulus.'
    ],
    examinerRule: 'The answer is directly visible in the diagram, table, or graph. Locate and transcribe it accurately.',
    commonTrap: 'Guessing an external fact when the answer was explicitly pointed to or labelled in the stimulus material.',
    typicalMarks: '1 mark',
    biologyExample: {
      context: 'Food web trophic levels',
      questionStem: 'Identify the secondary consumer in this food web.',
      whatExaminerWants: 'Ladybird (or organism directly feeding on the primary consumer from the provided diagram).'
    }
  },
  {
    id: 'justify',
    word: 'Justify',
    category: 'evaluation',
    officialDefinition: 'Give evidence to support (either the statement given in the question or an earlier answer).',
    paraphrasedDefinitions: [
      'Provide empirical evidence, quantitative data, or logical proof to validate a chosen answer or statement.',
      'Back up a selected claim with data points and biological facts proving why it is correct.',
      'Defend a scientific deduction using specific numerical values and theoretical backing.'
    ],
    examinerRule: 'Must provide concrete evidence. If you give a claim without data/evidence, zero marks are awarded.',
    commonTrap: 'Simply re-affirming belief ("I think this is true") without citing actual numerical data or biological evidence.',
    typicalMarks: '2 marks',
    biologyExample: {
      context: 'Antibiotic resistance in bacteria',
      questionStem: 'A doctor decided not to prescribe antibiotics for this patient. Justify this decision.',
      whatExaminerWants: 'The patient has influenza which is caused by a virus; antibiotics only kill bacteria and are ineffective against viral infections.'
    }
  },
  {
    id: 'plot',
    word: 'Plot',
    category: 'practical',
    officialDefinition: 'Produce a graph by marking points accurately on a grid from data that is provided and then draw a line of best fit through these points. A suitable scale and appropriately labelled axes must be included if these are not provided in the question.',
    paraphrasedDefinitions: [
      'Draw axes with linear scales and units, plot coordinate points accurately, and add a smooth curve or line of best fit.',
      'Transfer experimental data points onto a grid accurately with crosses (x) and draw the line of best fit.',
      'Construct a complete scientific graph: Scale, Labels with units, Points accurately plotted, and Line of best fit (SLAP).'
    ],
    examinerRule: 'Remember SLAP: Scale (linear, filling >50% of grid), Label axes with units, Accurate points (within half a square using small x), Line of best fit (smooth curve or ruler).',
    commonTrap: 'Using awkward non-linear scales (e.g. intervals of 3 or 7), connecting points dot-to-dot with hairy lines, or failing to add units to axes.',
    typicalMarks: '4–6 marks',
    biologyExample: {
      context: 'Rate of transpiration vs wind speed',
      questionStem: 'Plot a line graph on the grid provided to show the relationship between wind speed and the rate of transpiration.',
      whatExaminerWants: 'Linear scale covering >50% of grid; axes labelled "Wind speed (m/s)" and "Rate of transpiration (mm/min)"; points plotted within 1mm; neat line of best fit.'
    }
  },
  {
    id: 'predict',
    word: 'Predict',
    category: 'application',
    officialDefinition: 'Give an expected result.',
    paraphrasedDefinitions: [
      'State what expected biological outcome or observation should occur under newly specified conditions.',
      'Forecast the likely scientific result based on established biological trends and principles.',
      'State an anticipated outcome for an experiment if an independent variable is altered.'
    ],
    examinerRule: 'Keep it precise and directional (e.g. "Rate will double", "Mass will decrease"). No explanation needed unless combined with "explain".',
    commonTrap: 'Vague predictions like "something will change" or "it will react differently" without indicating increase, decrease, or specific phenotype.',
    typicalMarks: '1–2 marks',
    biologyExample: {
      context: 'Plant phototropism',
      questionStem: 'Predict what would happen to the growth of a coleoptile if the tip is covered with an opaque foil cap and illuminated from one side.',
      whatExaminerWants: 'The coleoptile will grow straight upwards (will not bend towards the light).'
    }
  },
  {
    id: 'show-that',
    word: 'Show that',
    category: 'data-math',
    officialDefinition: 'Verify the statement given in the question.',
    paraphrasedDefinitions: [
      'Mathematically prove or verify a provided value or biological statement by demonstrating all calculation steps.',
      'Confirm a stated conclusion or numerical value using given data to demonstrate how it is derived.',
      'Perform calculation steps that arrive precisely at a number already mentioned in the question prompt.'
    ],
    examinerRule: 'Show every mathematical operation step-by-step to arrive at the target value given in the question.',
    commonTrap: 'Starting from the final answer or skipping steps because you assumed the examiner already knows the intermediate values.',
    typicalMarks: '2 marks',
    biologyExample: {
      context: 'Energy transfer efficiency',
      questionStem: 'Show that only approximately 10% of the energy in the grass is transferred to the primary consumer (rabbit). Energy in grass = 85,000 kJ, energy in rabbits = 8,600 kJ.',
      whatExaminerWants: '(8,600 / 85,000) * 100 = 10.12%, which is approximately 10%.'
    }
  },
  {
    id: 'sketch',
    word: 'Sketch',
    category: 'practical',
    officialDefinition: 'Produce a freehand drawing. For a graph, this would need a line and labelled axes with important features indicated. The axes are not scaled.',
    paraphrasedDefinitions: [
      'Draw an unscaled curve or freehand diagram showing key shapes, intercepts, and trends with labelled axes.',
      'Produce a conceptual graph curve indicating key features (optimum, plateau) on labelled axes without grid numbers.',
      'Draw an illustrative trend line demonstrating the general biological shape without plotting exact coordinates.'
    ],
    examinerRule: 'Axes must have labels with variables. The curve must illustrate the correct shape (e.g. bell shape for enzymes, plateau for light intensity). No numbers required.',
    commonTrap: 'Forgetting to label the X and Y axes with names of the variables, or drawing a straight line when a plateau curve is expected.',
    typicalMarks: '2 marks',
    biologyExample: {
      context: 'Limiting factors in photosynthesis',
      questionStem: 'Sketch a graph on the axes provided to show how carbon dioxide concentration affects the rate of photosynthesis when light intensity is high.',
      whatExaminerWants: 'Axes labelled "CO2 concentration" (x) and "Rate of photosynthesis" (y); curve rises linearly then levels off (plateaus) due to another factor becoming limiting.'
    }
  },
  {
    id: 'state-what-is-meant-by',
    word: 'State what is meant by',
    category: 'recall',
    officialDefinition: 'When the meaning of a term is expected but there are different ways for how these can be described.',
    paraphrasedDefinitions: [
      'Define a biological term or concept clearly in words using accurate scientific terminology.',
      'Give a precise definition or explanation of what a specific biological phrase means.',
      'Express the meaning of a key syllabus term (e.g. pathogen, ecosystem, transpiration, homeostasis).'
    ],
    examinerRule: 'Use key syllabus vocabulary. Mention both components if the term involves a dual concept (e.g. "pathogen" = a disease-causing organism).',
    commonTrap: 'Giving an example (e.g. "like COVID or flu") instead of defining what the term actually means.',
    typicalMarks: '1–2 marks',
    biologyExample: {
      context: 'Definition of a pathogen',
      questionStem: 'State what is meant by the term pathogen.',
      whatExaminerWants: 'A micro-organism / organism that causes disease.'
    }
  },
  {
    id: 'suggest',
    word: 'Suggest',
    category: 'application',
    officialDefinition: 'Use your knowledge to propose a solution to a problem in a novel context.',
    paraphrasedDefinitions: [
      'Apply biological principles to an unfamiliar scenario or novel context to propose a plausible explanation or solution.',
      'Hypothesize a feasible biological explanation or method for a scenario not explicitly covered in textbooks.',
      'Propose a reasoned scientific explanation for an unusual experimental result or adapted organism.'
    ],
    examinerRule: 'There is often more than one acceptable mark scheme answer. Apply core biological logic to the novel scenario.',
    commonTrap: 'Panicking because "we never studied this specific deep sea fish or rare plant species in class" instead of applying general biology rules (surface area, enzymes, diffusion).',
    typicalMarks: '2–3 marks',
    biologyExample: {
      context: 'Adaptation of xerophytic desert plant',
      questionStem: 'Suggest why this desert plant has sunken stomata surrounded by hairs.',
      whatExaminerWants: 'Traps humid air / water vapour; reduces diffusion / water potential gradient between leaf and air; reduces rate of transpiration / water loss.'
    }
  },
  {
    id: 'analyse-data-to-explain',
    word: 'Analyse the data/graph to explain',
    category: 'evaluation',
    officialDefinition: 'Examine the data/graph in detail to provide an explanation.',
    paraphrasedDefinitions: [
      'Break down data trends with exact figures and link them directly to underlying biological reasons or mechanisms.',
      'Scrutinize specific coordinates or changes in a chart and explain the biological mechanisms driving each stage.',
      'Interrogate graph inflection points or statistical tables and pair each data observation with its scientific cause.'
    ],
    examinerRule: 'Combines both "Describe data with numbers" AND "Explain biological mechanism". Both parts are required for full marks.',
    commonTrap: 'Only describing the numbers without explaining the biology, or only explaining biology without quoting data from the graph.',
    typicalMarks: '4–5 marks',
    biologyExample: {
      context: 'Enzyme substrate concentration curve',
      questionStem: 'Analyse the graph to explain the change in reaction rate as substrate concentration increases.',
      whatExaminerWants: 'At low conc: rate increases from 0 to 45 a.u. because substrate is limiting and more collisions occur; at high conc (>80 mM): rate plateaus at 60 a.u. because all enzyme active sites are occupied / enzyme concentration is limiting.'
    }
  },
  {
    id: 'what-why-mcq',
    word: 'What / Why',
    category: 'recall',
    officialDefinition: 'Direct command words used for multiple-choice questions.',
    paraphrasedDefinitions: [
      'Direct interrogative prompt used to test distinct factual recall or cause in multiple-choice questions.',
      'Direct question starter querying a specific component, outcome, or reasoning option.',
      'Concise MCQ prompt pointing to one of four multiple-choice options (A, B, C, or D).'
    ],
    examinerRule: 'Read all four options carefully before deciding. Eliminate obvious distractors first.',
    commonTrap: 'Rushing to select option A before reading all choices, missing negative keywords like "NOT".',
    typicalMarks: '1 mark',
    biologyExample: {
      context: 'Digestive enzyme site of production',
      questionStem: 'What is the organ that produces bile?',
      whatExaminerWants: 'Liver (Option C in multiple choice selection).'
    }
  }
];
