export const EVENT = {
  name: "VIBEATHON 2026",
  date: "Samedi 11 juillet 2026",
  shortDate: "11 juillet 2026",
  venue: "CSCTICAO, Abidjan",
  fee: 20_000,
  currency: "FCFA",
  capacity: 400,
  competitorCapacity: 100,
} as const;

/**
 * The 2026 edition took place on 11 July 2026 and is over. This flag closes
 * every public sign-up path at once: the pass section on the home page, the
 * /billet form, and both POST endpoints.
 *
 * It is a build-time constant rather than a CMS or database value on purpose.
 * The site content table is editable from the admin UI, and an accidental edit
 * there must not be able to reopen registration for a finished event.
 *
 * Set back to false only if a future edition reuses this codebase, and update
 * EVENT plus the Countdown target date at the same time.
 */
export const REGISTRATIONS_CLOSED = true;

/** Public wording shown wherever a sign-up entry point used to be. */
export const REGISTRATIONS_CLOSED_COPY = {
  heading: "Les inscriptions sont fermées",
  body: "L'édition 2026 du VIBEATHON s'est tenue le 11 juillet 2026. Merci à toutes les personnes qui y ont participé.",
  apiMessage: "Les inscriptions sont fermées. L'édition 2026 est terminée.",
} as const;

/** Criteria used exclusively by the AI for Phase 1 ranking (not the human jury). */
export const AI_EVAL_CRITERIA = [
  {
    id: "problem",
    name: "Problem Importance",
    weight: 20,
    description: "Is this a problem worth solving? How many people are affected? How painful is the problem?",
  },
  {
    id: "execution",
    name: "Execution Quality",
    weight: 30,
    description: "Does the product actually work? Is the demo convincing? Are the key features implemented well?",
  },
  {
    id: "innovation",
    name: "Innovation",
    weight: 10,
    description: "Is there a novel insight, approach, or technology? Does it advance the state of the art or create a new experience?",
  },
  {
    id: "impact",
    name: "Impact Potential",
    weight: 10,
    description: "Could this become a real product, company, or open-source project? Would people use it after the hackathon?",
  },
  {
    id: "technical",
    name: "Technical Excellence",
    weight: 30,
    description: "How difficult was the engineering challenge? Is the architecture thoughtful? Did the team demonstrate strong technical ability?",
  },
] as const;

/** Criteria used by human jury members for Phase 2 scoring. */
export const JUDGING_CRITERIA = [
  {
    id: "relevance",
    name: "Pertinence du problème",
    weight: 20,
    description:
      "Le jury évalue si le problème adressé est réel, important et suffisamment significatif pour justifier le développement d'une solution. Les équipes doivent démontrer une bonne compréhension du besoin, de ses enjeux et de son impact sur les utilisateurs ou le marché.",
  },
  {
    id: "solution",
    name: "Qualité de la solution",
    weight: 25,
    description:
      "Le jury évalue dans quelle mesure la solution proposée répond efficacement au problème identifié. La proposition de valeur doit être claire, cohérente et démontrer un avantage concret par rapport aux alternatives existantes.",
  },
  {
    id: "product",
    name: "Qualité du produit et de la démonstration",
    weight: 20,
    description:
      "Le jury évalue le niveau de maturité du prototype, son bon fonctionnement ainsi que la qualité de l'expérience utilisateur. La démonstration doit permettre de comprendre facilement le produit et de valider que les fonctionnalités présentées sont opérationnelles.",
  },
  {
    id: "innovation",
    name: "Innovation",
    weight: 15,
    description:
      "Le jury évalue l'originalité de l'approche proposée, qu'elle soit technologique, méthodologique ou liée à l'expérience utilisateur. Une attention particulière est portée aux éléments qui différencient le projet des solutions déjà existantes.",
  },
  {
    id: "impact",
    name: "Potentiel d'impact",
    weight: 20,
    description:
      "Le jury évalue la capacité du projet à générer une adoption réelle par ses utilisateurs cibles et à créer de la valeur à long terme. Sont notamment considérés le potentiel de croissance, la viabilité du projet ainsi que sa capacité à devenir un produit, une entreprise ou une initiative à fort impact.",
  },
] as const;

export const EVENT_SESSIONS = [
  "Entrée principale",
  "Keynotes d'ouverture",
  "Ateliers & Studio IA",
  "Compétition vibecoding",
  "Pitch des finalistes",
  "Remise des prix",
] as const;
