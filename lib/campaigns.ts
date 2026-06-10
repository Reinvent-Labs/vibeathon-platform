import type { DemoParticipant, DemoParticipantStatus } from "@/lib/demo-data";

export const CAMPAIGN_AUDIENCES = [
  "all",
  "pending",
  "selected",
  "official",
  "rejected",
] as const;

export type CampaignAudience = (typeof CAMPAIGN_AUDIENCES)[number];

type CampaignParticipant = Pick<
  DemoParticipant,
  "email" | "phone" | "status" | "qrCode"
>;

const OFFICIAL_STATUSES: DemoParticipantStatus[] = [
  "PAID",
  "CONFIRMED",
  "CHECKED_IN",
];

export function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export function statusUrlFor(participant: Pick<DemoParticipant, "email">) {
  return `${appBaseUrl()}/statut?email=${encodeURIComponent(participant.email)}`;
}

export function badgeUrlFor(participant: Pick<DemoParticipant, "qrCode">) {
  return `${appBaseUrl()}/badge/${encodeURIComponent(participant.qrCode)}`;
}

export function filterCampaignAudience<T extends CampaignParticipant>(
  participants: readonly T[],
  audience: CampaignAudience,
) {
  return participants.filter((participant) => {
    if (audience === "pending") return participant.status === "PENDING";
    if (audience === "selected") return participant.status === "SELECTED";
    if (audience === "official") {
      return OFFICIAL_STATUSES.includes(participant.status);
    }
    if (audience === "rejected") return participant.status === "REJECTED";
    return true;
  });
}
