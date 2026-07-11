import { listParticipants } from "@/lib/repository";
import { requireRole } from "@/lib/auth";
import { toCsv, csvResponse } from "@/lib/csv";

const CONFIRMED_STATUSES = new Set(["PAID", "CONFIRMED", "CHECKED_IN"]);

export async function GET(request: Request) {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return new Response("Non autorisé.", { status: 401 });
  }
  const confirmedOnly = new URL(request.url).searchParams.get("confirmedOnly") === "1";
  const all = await listParticipants();
  const participants = confirmedOnly
    ? all.filter((participant) => CONFIRMED_STATUSES.has(participant.status))
    : all;

  const header = ["Référence", "Nom", "Email", "Téléphone", "Ville", "Profil", "Statut"];
  const rows = participants.map((participant) => [
    participant.reference,
    participant.fullName,
    participant.email,
    participant.phone,
    participant.city,
    participant.profile,
    participant.status,
  ]);
  return csvResponse(
    toCsv(header, rows),
    confirmedOnly ? "participants-confirmes-vibeathon-2026.csv" : "candidatures-vibeathon-2026.csv",
  );
}
