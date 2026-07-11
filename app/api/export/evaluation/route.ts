import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";
import { orderByPhase1Preselection } from "@/lib/phase1-ranking";
import { hasTestableProject } from "@/lib/project-submission";

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return new Response("Non autorisé.", { status: 401 });
  }
  if (!prisma) return new Response("Base de données indisponible.", { status: 503 });

  const teams = await prisma.team.findMany({
    where: { competition: { slug: "vibeathon-2026" } },
    select: {
      id: true,
      name: true,
      demoUrl: true,
      repositoryUrl: true,
      videoUrl: true,
      isFinalist: true,
      phase1Rank: true,
      aiEvaluation: { select: { score: true, summary: true } },
    },
  });
  const ranked = orderByPhase1Preselection(teams);

  const header = ["#", "Équipe", "Score IA", "Soumission", "Finaliste", "Résumé"];
  const rows = ranked.map((team, i) => [
    i + 1,
    team.name,
    team.aiEvaluation?.score ?? "",
    hasTestableProject(team) ? "Oui" : "Non",
    team.isFinalist ? "Oui" : "Non",
    team.aiEvaluation?.summary ?? "",
  ]);
  return csvResponse(toCsv(header, rows), "evaluation-phase1-vibeathon-2026.csv");
}
