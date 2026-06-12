import { z } from "zod";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { requestIp, writeAuditLog } from "@/lib/audit";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function buildOverview() {
  if (!prisma) return null;
  const [juryCount, criteriaCount, teams] = await Promise.all([
    prisma.adminUser.count({ where: { role: "JURY", active: true } }),
    prisma.judgingCriteria.count({
      where: { competition: { slug: "vibeathon-2026" } },
    }),
    prisma.team.findMany({
      where: {
        competition: { slug: "vibeathon-2026" },
        members: {
          some: {},
          every: {
            status: { in: ["PAID", "CONFIRMED", "CHECKED_IN"] },
            isTest: false,
          },
        },
      },
      select: {
        id: true,
        name: true,
        isFinalist: true,
        rank: true,
        members: { select: { id: true } },
        scores: {
          where: { lockedAt: { not: null } },
          select: { juryId: true, score: true },
        },
      },
    }),
  ]);

  const ranking = teams
    .map((team) => {
      const juryIds = new Set(team.scores.map((score) => score.juryId));
      const total =
        juryIds.size === 0
          ? null
          : Math.round(
              (team.scores.reduce((sum, score) => sum + score.score, 0) /
                juryIds.size) *
                10,
            ) / 10;
      return {
        id: team.id,
        name: team.name,
        memberCount: team.members.length,
        juryCount: juryIds.size,
        averageScore: total,
        isFinalist: team.isFinalist,
        rank: team.rank,
      };
    })
    .sort(
      (left, right) =>
        (left.rank ?? Number.MAX_SAFE_INTEGER) -
          (right.rank ?? Number.MAX_SAFE_INTEGER) ||
        (right.averageScore ?? -1) - (left.averageScore ?? -1),
    );

  return {
    juryCount,
    criteriaCount,
    eligibleTeams: teams.length,
    scoredTeams: ranking.filter((team) => team.juryCount > 0).length,
    finalists: ranking.filter((team) => team.isFinalist).length,
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
