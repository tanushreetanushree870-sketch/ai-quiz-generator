/**
 * Centralized Subject and Chapter Definitions for AI QUIZ MASTER
 */

export const SUBJECTS = {
  physics: {
    id: "physics",
    label: "Physics",
    tagline: "Mechanics, Thermodynamics, Electromagnetism & Modern Physics",
    description: "Explore the fundamental laws governing motion, matter, energy, and the cosmos.",
    icon: "atom",
    chapters: [
      { id: "units-and-measurements", name: "Units and Measurements", description: "SI units, dimensions, significant figures, and measurement errors." },
      { id: "motion-in-a-straight-line", name: "Motion in a Straight Line", description: "Position, displacement, uniform and accelerated 1D kinematics." },
      { id: "motion-in-a-plane", name: "Motion in a Plane", description: "Vectors, projectile motion, and circular kinematics." },
      { id: "laws-of-motion", name: "Laws of Motion", description: "Newton's laws, inertia, momentum, friction, and circular dynamics." },
      { id: "work-energy-and-power", name: "Work, Energy and Power", description: "Kinetic/potential energy, work-energy theorem, and collisions." },
      { id: "gravitation", name: "Gravitation", description: "Universal gravitation, Kepler's laws, gravitational potential, and orbits." },
      { id: "thermodynamics", name: "Thermodynamics", description: "Thermal equilibrium, Zeroth, First & Second laws, Carnot engines." },
      { id: "oscillations", name: "Oscillations", description: "Simple Harmonic Motion (SHM), spring systems, and pendulum dynamics." },
      { id: "waves", name: "Waves", description: "Transverse/longitudinal waves, speed of sound, Doppler effect, and resonance." },
      { id: "electrostatics", name: "Electrostatics", description: "Coulomb's law, electric field, potential, Gauss's law, and capacitance." },
      { id: "current-electricity", name: "Current Electricity", description: "Ohm's law, drift velocity, Kirchhoff's laws, and potentiometers." },
      { id: "magnetism", name: "Magnetism", description: "Magnetic force, Biot-Savart law, Ampere's law, and magnetic materials." },
      { id: "electromagnetic-induction", name: "Electromagnetic Induction", description: "Faraday's law, Lenz's law, inductors, and AC generators." },
      { id: "optics", name: "Optics", description: "Ray optics, reflection, refraction, lenses, wave optics, and diffraction." },
      { id: "modern-physics", name: "Modern Physics", description: "Photoelectric effect, de Broglie wavelength, Bohr model, and radioactivity." }
    ]
  },
  chemistry: {
    id: "chemistry",
    label: "Chemistry",
    tagline: "Atomic Structure, Chemical Bonding, Reactions & Organic Molecules",
    description: "Master atomic architecture, reaction pathways, molecular structures, and chemical equilibria.",
    icon: "flask",
    chapters: [
      { id: "some-basic-concepts-of-chemistry", name: "Some Basic Concepts of Chemistry", description: "Mole concept, molar mass, stoichiometry, and empirical formulas." },
      { id: "atomic-structure", name: "Atomic Structure", description: "Bohr model, quantum numbers, electronic configuration, and orbitals." },
      { id: "periodic-table", name: "Periodic Table", description: "Periodic trends, ionization energy, electron affinity, and electronegativity." },
      { id: "chemical-bonding", name: "Chemical Bonding", description: "VSEPR theory, hybridization, dipole moments, and molecular orbital theory." },
      { id: "thermodynamics", name: "Thermodynamics", description: "Enthalpy, entropy, Gibbs free energy, and Hess's law of summation." },
      { id: "chemical-equilibrium", name: "Chemical Equilibrium", description: "Law of mass action, Le Chatelier's principle, and equilibrium constants." },
      { id: "redox-reactions", name: "Redox Reactions", description: "Oxidation numbers, balancing redox equations, and oxidizing agents." },
      { id: "organic-chemistry-basics", name: "Organic Chemistry Basics", description: "IUPAC nomenclature, inductive/resonance effects, and reaction intermediates." },
      { id: "hydrocarbons", name: "Hydrocarbons", description: "Alkanes, alkenes, alkynes, aromatic compounds, and electrophilic substitution." },
      { id: "solutions", name: "Solutions", description: "Raoult's law, colligative properties, van 't Hoff factor, and molarity." },
      { id: "electrochemistry", name: "Electrochemistry", description: "Nernst equation, Galvanic cells, standard reduction potential, and electrolysis." },
      { id: "chemical-kinetics", name: "Chemical Kinetics", description: "Rate laws, order of reaction, half-life, and Arrhenius activation energy." },
      { id: "coordination-compounds", name: "Coordination Compounds", description: "Ligands, Werner's theory, crystal field theory (CFT), and isomerism." },
      { id: "biomolecules", name: "Biomolecules", description: "Carbohydrates, amino acids, peptide bonds, proteins, and nucleic acids." }
    ]
  },
  mathematics: {
    id: "mathematics",
    label: "Mathematics",
    tagline: "Calculus, Algebra, Geometry, Vectors & Probability",
    description: "Develop sharp analytical reasoning and problem-solving across core mathematical disciplines.",
    icon: "calculator",
    chapters: [
      { id: "sets", name: "Sets", description: "Set operations, Venn diagrams, subsets, and Cartesian products." },
      { id: "relations-and-functions", name: "Relations and Functions", description: "Domain, range, injective, surjective, and bijective functions." },
      { id: "trigonometry", name: "Trigonometry", description: "Trigonometric identities, compound angles, and inverse functions." },
      { id: "complex-numbers", name: "Complex Numbers", description: "Argand plane, modulus, argument, Euler's formula, and roots of unity." },
      { id: "quadratic-equations", name: "Quadratic Equations", description: "Roots of quadratics, discriminant, nature of roots, and factorisation." },
      { id: "sequences-and-series", name: "Sequences and Series", description: "Arithmetic, geometric progressions, harmonic series, and sums to infinity." },
      { id: "permutations-and-combinations", name: "Permutations and Combinations", description: "Fundamental counting principle, combinations nCr, and arrangements nPr." },
      { id: "binomial-theorem", name: "Binomial Theorem", description: "Binomial expansion, general and middle terms, and coefficient properties." },
      { id: "straight-lines", name: "Straight Lines", description: "Slope, intercept forms, perpendicular distance, and angle between lines." },
      { id: "conic-sections", name: "Conic Sections", description: "Circles, parabolas, ellipses, hyperbolas, and standard equations." },
      { id: "limits-and-derivatives", name: "Limits and Derivatives", description: "L'Hopital's rule, chain rule, product rule, and rates of change." },
      { id: "matrices", name: "Matrices", description: "Matrix algebra, inverse, rank, transformations, and transpose." },
      { id: "determinants", name: "Determinants", description: "Cramer's rule, properties of determinants, minors, and cofactors." },
      { id: "probability", name: "Probability", description: "Conditional probability, Bayes' theorem, and independent events." },
      { id: "statistics", name: "Statistics", description: "Mean, median, mode, variance, and standard deviation." },
      { id: "vectors", name: "Vectors", description: "Dot product, cross product, projection, and scalar triple product." },
      { id: "three-dimensional-geometry", name: "Three-Dimensional Geometry", description: "Direction cosines, equations of lines and planes in 3D space." },
      { id: "integral-calculus", name: "Integral Calculus", description: "Definite and indefinite integrals, substitution, integration by parts, and areas." }
    ]
  }
};

export const ALLOWED_SUBJECTS = Object.keys(SUBJECTS);
export const ALLOWED_DIFFICULTIES = ["easy", "medium", "hard"];
export const ALLOWED_QUESTION_COUNTS = [5, 10, 20];

export function getSubjectConfig(subjectKey) {
  if (!subjectKey) return null;
  const key = subjectKey.toLowerCase().trim();
  return SUBJECTS[key] || null;
}

export function isValidSubject(subjectKey) {
  return Boolean(getSubjectConfig(subjectKey));
}

export function getSubjectChapters(subjectKey) {
  const cfg = getSubjectConfig(subjectKey);
  return cfg ? cfg.chapters : [];
}

export function findChapterByNameOrId(subjectKey, chapterQuery) {
  if (!chapterQuery) return null;
  const chapters = getSubjectChapters(subjectKey);
  const q = chapterQuery.toLowerCase().trim();
  return chapters.find(c => c.id === q || c.name.toLowerCase() === q) || null;
}
