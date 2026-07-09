import { z } from "zod";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { requestIp, writeAuditLog } from "@/lib/audit";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function buildOverview() {
  if (!prisma) return null;
  const [competition, juryMembers, criteriaCount, teams] = await Promise.all([
    prisma.competition.findUnique({
      where: { slug: "vibeathon-2026" },
      select: { phase: true },
    }),
    prisma.adminUser.findMany({
      where: { role: "JURY", active: true },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.judgingCriteria.count({
      where: { competition: { slug: "vibeathon-2026" } },
    }),
    prisma.team.findMany({
      where: {
        competition: { slug: "vibeathon-2026" },
        isFinalist: true,
      },
      select: {
        id: true,
        name: true,
        isFinalist: true,
        rank: true,
        demoUrl: true,
        members: { select: { id: true } },
        scores: {
          where: { lockedAt: { not: null } },
          select: { juryId: true, score: true, criteria: { select: { key: true } } },
        },
        aiEvaluation: {
          select: { score: true, summary: true, updatedAt: true },
        },
      },
    }),
  ]);

  const ranking = teams
    .map((team) => {
      const juryIds = new Set(team.scores.map((s) => s.juryId));
      const total =
        juryIds.size === 0
          ? null
          : Math.round(
              (team.scores.reduce((sum, s) => sum + s.score, 0) / juryIds.size) * 10,
            ) / 10;

      // Per-jury score totals for the matrix
      const juryTotals: Record<string, number> = {};
      for (const s of team.scores) {
        juryTotals[s.juryId] = (juryTotals[s.juryId] ?? 0) + s.score;
      }

      return {
        id: team.id,
        name: team.name,
        memberCount: team.members.length,
        juryCount: juryIds.size,
        averageScore: total,
        isFinalist: team.isFinalist,
        rank: team.rank,
        demoUrl: team.demoUrl ?? null,
        aiScore: team.aiEvaluation?.score ?? null,
        aiSummary: team.aiEvaluation?.summary ?? null,
        aiEvaluatedAt: team.aiEvaluation?.updatedAt ?? null,
        juryTotals, // { juryId → total score }
      };
    })
    .sort(
      (a, b) =>
        (a.rank ?? Number.MAX_SAFE_INTEGER) - (b.rank ?? Number.MAX_SAFE_INTEGER) ||
        (b.averageScore ?? -1) - (a.averageScore ?? -1),
    );

  const allJuryDone =
    juryMembers.length > 0 &&
    teams.length > 0 &&
    ranking.every((t) => t.juryCount >= juryMembers.length);

  return {
    phase: competition?.phase ?? "PHASE1_DONE",
    juryCount: juryMembers.length,
    juryMembers,
    criteriaCount,
    eligibleTeams: teams.length,
    scoredTeams: ranking.filter((t) => t.juryCount > 0).length,
    finalists: ranking.filter((t) => t.isFinalist).length,
    allJuryDone,
    ranking,
  };
}

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  const overview = await buildOverview();
  return overview
    ? apiSuccess(overview)
    : apiError("Base de données indisponible.", 503);
}

const resultSchema = z.object({
  teamId: z.string().min(1),
  isFinalist: z.boolean(),
  rank: z.number().int().min(1).max(3).nullable(),
});

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);
  const parsed = resultSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return apiError("Résultat invalide.");
  if (parsed.data.rank !== null && !parsed.data.isFinalist) {
    return apiError("Une équipe classée doit être finaliste.", 409);
  }
  const team = await prisma.team.findFirst({
    where: {
      id: parsed.data.teamId,
      competition: { slug: "vibeathon-2026" },
    },
    select: { id: true, name: true },
  });
  if (!team) return apiError("Équipe introuvable.", 404);
  if (parsed.data.rank !== null) {
    await prisma.team.updateMany({
      where: {
        competition: { slug: "vibeathon-2026" },
        rank: parsed.data.rank,
        id: { not: team.id },
      },
      data: { rank: null },
    });
  }
  await prisma.team.update({
    where: { id: team.id },
    data: {
      isFinalist: parsed.data.isFinalist,
      rank: parsed.data.isFinalist ? parsed.data.rank : null,
    },
  });
  await writeAuditLog({
    actorId: user.userId,
    action: "TEAM_RESULT_UPDATED",
    entityType: "Team",
    entityId: team.id,
    ipAddress: requestIp(request),
    metadata: {
      name: team.name,
      isFinalist: parsed.data.isFinalist,
      rank: parsed.data.rank,
    },
  });
  return apiSuccess(await buildOverview());
}
