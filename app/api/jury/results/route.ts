import { apiError, apiSuccess } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET — final ranking for jurors, visible only once Phase 2 is fully done.
 * Aggregate scores only (average across all jurors) — never exposes which
 * juror gave which score, keeping individual jury opinions private from
 * each other.
 */
export async function GET() {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]);
  if (!session) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: { phase: true },
  });
  if (!competition) return apiError("Compétition introuvable.", 404);
  if (competition.phase !== "PHASE2_DONE") {
    return apiError("Les résultats ne sont pas encore disponibles.", 409);
  }

  const teams = await prisma.team.findMany({
    where: { competition: { slug: "vibeathon-2026" }, isFinalist: true },
    select: {
      id: true,
      name: true,
      rank: true,
      scores: {
        where: { lockedAt: { not: null } },
        select: { juryId: true, score: true },
      },
    },
  });

  const ranking = teams
    .map((team) => {
      const juryIds = new Set(team.scores.map((s) => s.juryId));
      const averageScore =
        juryIds.size === 0
          ? null
          : Math.round(
              (team.scores.reduce((sum, s) => sum + s.score, 0) / juryIds.size) * 10,
            ) / 10;
      return { id: team.id, name: team.name, rank: team.rank, averageScore };
    })
    .sort((a, b) => (b.averageScore ?? -1) - (a.averageScore ?? -1));

  return apiSuccess({ ranking });
}
