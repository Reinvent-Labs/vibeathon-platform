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
