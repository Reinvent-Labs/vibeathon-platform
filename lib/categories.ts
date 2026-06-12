/**
 * Participant categories — single source of truth for the four pass types.
 *
 * Each category drives: the public ticket card (price + perks), the badge
 * accent colour + role label, the QR reference letter, and the registration
 * flow (free → instant badge, paid → PaiementPro then badge).
 */

export type ParticipantCategory =
  | "HACKATHON"
  | "VISITEUR"
  | "FORMATION_ADULTE"
  | "FORMATION_KIDS";

/** Categories the public can self-register for (hackathon registration is closed). */
export const OPEN_CATEGORIES = [
  "VISITEUR",
] as const satisfies readonly ParticipantCategory[];

export type OpenCategory = (typeof OPEN_CATEGORIES)[number];

export type CategoryConfig = {
  /** Stable enum value stored in the database. */
  value: ParticipantCategory;
  /** URL slug used on the public ticket pages (`/billet?type=`). */
  slug: string;
  /** Short human label (badge, dashboard, cards). */
  label: string;
  /** Accent colour used for the badge title + dashboard chip. */
  color: string;
  /** Price in FCFA. 0 = free (instant badge, no payment step). */
  fee: number;
  /** Reference letter baked into the QR code, e.g. VBT-2026-V-1234. */
  qrLetter: string;
  /** One-line pitch shown under the card title. */
  tagline: string;
  /** Bullet perks shown on the ticket card. */
  perks: string[];
};

export const CATEGORIES: Record<ParticipantCategory, CategoryConfig> = {
  HACKATHON: {
    value: "HACKATHON",
    slug: "hackathon",
    label: "Compétiteur",
    color: "#75FF8D",
    fee: 20_000,
    qrLetter: "C",
    tagline: "Compétiteur officiel du vibecoding",
    perks: [
      "Accès complet au bootcamp et à la compétition",
      "Accompagnement et mentorat",
      "Éligible aux prix",
    ],
  },
  VISITEUR: {
    value: "VISITEUR",
    slug: "visiteur",
    label: "Visiteur",
    color: "#43D9FF",
    fee: 0,
    qrLetter: "V",
    tagline: "Vivez l'événement en spectateur",
    perks: [
      "Accès aux Keynotes",
      "Accès aux Panels et conférences",
      "Accès au Pitch Final des compétiteurs",
    ],
  },
  FORMATION_ADULTE: {
    value: "FORMATION_ADULTE",
    slug: "formation-adulte",
    label: "Formation Adulte",
    color: "#BA77FF",
    fee: 10_000,
    qrLetter: "A",
    tagline: "Pour les adultes qui veulent suivre le bootcamp de formation",
    perks: [
      "Accès au bootcamp de formation",
      "Accès à toutes les formations de la journée",
      "Un atelier au choix",
      "Certificat de participation (optionnel)",
    ],
  },
  FORMATION_KIDS: {
    value: "FORMATION_KIDS",
    slug: "formation-kids",
    label: "Formation Kids",
    color: "#FF57E3",
    fee: 5_000,
    qrLetter: "K",
    tagline: "Le bootcamp de formation pensé pour les enfants",
    perks: [
      "Accès au bootcamp de formation pour enfants",
      "Un atelier adapté aux enfants",
      "Goûter inclus",
      "Encadrés par des formateurs",
    ],
  },
};

/** Lookup a category config by its public slug (returns null if unknown). */
export function categoryBySlug(slug: string): CategoryConfig | null {
  return (
    Object.values(CATEGORIES).find((category) => category.slug === slug) ?? null
  );
}

/** Format a fee for display: "Gratuit" or "10 000 FCFA". */
export function formatFee(fee: number): string {
  return fee === 0 ? "Gratuit" : `${fee.toLocaleString("fr-FR")} FCFA`;
}
