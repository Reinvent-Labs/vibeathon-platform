export type DemoParticipantStatus =
  | "PENDING"
  | "SELECTED"
  | "PAID"
  | "CONFIRMED"
  | "REJECTED";

export type DemoParticipant = {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  profile: string;
  motivation: string;
  source: string;
  status: DemoParticipantStatus;
  qrCode: string;
  teamName?: string;
  createdAt: string;
};

export const demoParticipants: DemoParticipant[] = [
  {
    id: "p-fatou",
    reference: "VBT-2026-0427",
    fullName: "Fatou Bamba",
    email: "fatou@demo.ci",
    phone: "+225 07 07 07 07 07",
    city: "Abidjan",
    profile: "Étudiante",
    motivation: "Créer une solution concrète pour améliorer le tri des déchets.",
    source: "Instagram",
    status: "CONFIRMED",
    qrCode: "VBT-2026-C-0427",
    teamName: "EcoVibe",
    createdAt: "2026-06-06T09:20:00.000Z",
  },
  {
    id: "p-yann",
    reference: "VBT-2026-0428",
    fullName: "Yann Kouassi",
    email: "yann@demo.ci",
    phone: "+225 05 05 05 05 05",
    city: "Bouaké",
    profile: "Entrepreneur",
    motivation: "Prototyper un outil d'optimisation énergétique pour les PME.",
    source: "LinkedIn",
    status: "SELECTED",
    qrCode: "VBT-2026-C-0428",
    createdAt: "2026-06-07T11:10:00.000Z",
  },
  {
    id: "p-aicha",
    reference: "VBT-2026-0429",
    fullName: "Aïcha Koné",
    email: "aicha@demo.ci",
    phone: "+225 01 01 01 01 01",
    city: "Abidjan",
    profile: "Jeune diplômée",
    motivation: "Apprendre à transformer rapidement une idée environnementale en produit.",
    source: "École / université",
    status: "PENDING",
    qrCode: "VBT-2026-C-0429",
    createdAt: "2026-06-08T15:42:00.000Z",
  },
  {
    id: "p-marc",
    reference: "VBT-2026-0430",
    fullName: "Marc Traoré",
    email: "marc@demo.ci",
    phone: "+225 07 12 34 56 78",
    city: "Abidjan",
    profile: "Professionnel",
    motivation: "Partager mon expérience et explorer les nouveaux outils IA.",
    source: "Bouche-à-oreille",
    status: "PAID",
    qrCode: "VBT-2026-C-0430",
    teamName: "GreenPulse",
    createdAt: "2026-06-08T18:05:00.000Z",
  },
];

export const demoTeams = [
  {
    id: "team-ecovibe",
    name: "EcoVibe",
    tableNumber: "Table 04",
    problem:
      "Réduire les déchets ménagers non triés grâce à un assistant visuel alimenté par l'IA.",
    demoUrl: "ecovibe.demo",
    repositoryUrl: "github.com/vibeathon/ecovibe",
    members: ["Fatou Bamba", "Ibrahim Diallo", "Sarah N'Guessan", "Loïc Yao"],
  },
  {
    id: "team-greenpulse",
    name: "GreenPulse",
    tableNumber: "Table 08",
    problem:
      "Aider les petites entreprises à comprendre et réduire leur consommation énergétique.",
    demoUrl: "greenpulse.demo",
    repositoryUrl: "github.com/vibeathon/greenpulse",
    members: ["Marc Traoré", "Awa Touré", "Nadia Koffi"],
  },
  {
    id: "team-aqua",
    name: "AquaSentinel",
    tableNumber: "Table 11",
    problem:
      "Détecter plus tôt les anomalies de qualité de l'eau dans les zones rurales.",
    demoUrl: "aquasentinel.demo",
    repositoryUrl: "github.com/vibeathon/aqua",
    members: ["Yann Kouassi", "Mariam Fofana", "Eric Kadio"],
  },
  {
    id: "team-cocoa",
    name: "CocoaLoop",
    tableNumber: "Table 15",
    problem:
      "Valoriser les résidus de cacao en orientant les producteurs vers des filières locales.",
    demoUrl: "cocoaloop.demo",
    repositoryUrl: "github.com/vibeathon/cocoa",
    members: ["Aïcha Koné", "Joël N'Dri", "Christelle Boka"],
  },
] as const;
