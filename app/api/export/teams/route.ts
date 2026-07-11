import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return new Response("Non autorisé.", { status: 401 });
  }
  if (!prisma) return new Response("Base de données indisponible.", { status: 503 });

  const teams = await prisma.team.findMany({
    where: { competition: { slug: "vibeathon-2026" } },
    include: {
      members: { select: { fullName: true, email: true } },
      aiEvaluation: { select: { score: true } },
    },
    orderBy: { name: "asc" },
  });

  const header = ["Équipe", "Domaine", "Membres", "Démo", "Dépôt", "Vidéo", "Score IA", "Finaliste"];
  const rows = teams.map((team) => [
    team.name,
    team.domain,
    team.members.map((m) => `${m.fullName} <${m.email}>`).join(" | "),
    team.demoUrl ?? "",
    team.repositoryUrl ?? "",
    team.videoUrl ?? "",
    team.aiEvaluation?.score ?? "",
    team.isFinalist ? "Oui" : "Non",
  ]);
  return csvResponse(toCsv(header, rows), "equipes-vibeathon-2026.csv");
}
