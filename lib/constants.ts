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
  { id: "impact", name: "Impact problème / solution", weight: 30 },
  { id: "feasibility", name: "Faisabilité", weight: 20 },
  { id: "ai", name: "Usage pertinent de l'IA", weight: 20 },
  { id: "innovation", name: "Innovation", weight: 15 },
  { id: "pitch", name: "Qualité du pitch & clarté", weight: 15 },
] as const;

export const EVENT_SESSIONS = [
  "Entrée principale",
  "Keynotes d'ouverture",
  "Ateliers & Studio IA",
  "Compétition vibecoding",
  "Pitch des finalistes",
  "Remise des prix",
] as const;
