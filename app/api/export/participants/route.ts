import { listParticipants } from "@/lib/repository";
import { requireRole } from "@/lib/auth";

function escapeCsv(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return new Response("Non autorisé.", { status: 401 });
  }
  const participants = await listParticipants();
  const header = ["Référence", "Nom", "Email", "Téléphone", "Ville", "Profil", "Statut"];
  const rows = participants.map((participant) =>
    [
      participant.reference,
      participant.fullName,
      participant.email,
      participant.phone,
      participant.city,
      participant.profile,
      participant.status,
    ]
      .map(escapeCsv)
      .join(","),
  );
  const csv = [header.map(escapeCsv).join(","), ...rows].join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="participants-vibeathon-2026.csv"',
    },
  });
}
