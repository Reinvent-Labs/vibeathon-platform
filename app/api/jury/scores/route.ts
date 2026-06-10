import { apiError, apiSuccess, readJson } from "@/lib/api";
import { JUDGING_CRITERIA } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { scoreSubmissionSchema } from "@/lib/validation";
import { isSameOrigin, requireRole } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const session = await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]);
  if (!session) return apiError("Non autorisé.", 401);
  const body = await readJson<unknown>(request);
  const parsed = scoreSubmissionSchema.safeParse(body);
  if (!parsed.success) return apiError("Scores invalides.");
  for (const criterion of JUDGING_CRITERIA) {
    const value = parsed.data.scores[criterion.id] ?? 0;
    if (value > criterion.weight) return apiError(`Le score ${criterion.name} dépasse ${criterion.weight}.`);
  }

  if (!prisma) return apiError("Base de données indisponible.", 503);
  const database = prisma;
  const team = await database.team.findFirst({
    where: {
      id: parsed.data.teamId,
      competition: { slug: "vibeathon-2026" },
      members: {
        some: {},
        every: {
          status: { in: ["PAID", "CONFIRMED", "CHECKED_IN"] },
        },
      },
    },
    select: { id: true, competitionId: true },
  });
  if (!team) {
    return apiError(
      "Cette équipe n'est pas admissible à l'évaluation.",
      409,
    );
  }

  const criteria = await database.judgingCriteria.findMany({
    where: { competitionId: team.competitionId },
    orderBy: { order: "asc" },
  });
  if (
    criteria.length !== JUDGING_CRITERIA.length ||
    criteria.some((criterion) => !(criterion.key in parsed.data.scores))
  ) {
    return apiError("Tous les critères doivent être renseignés.", 400);
  }
  const previous = await database.juryScore.findFirst({
    where: {
      teamId: team.id,
      juryId: session.userId,
      lockedAt: { not: null },
    },
  });
  if (previous) return apiError("Cette évaluation est déjà verrouillée.", 409);

  const lockedAt = new Date();
  await database.$transaction(
    criteria.map((criterion) =>
      database.juryScore.upsert({
        where: {
          teamId_criteriaId_juryId: {
            teamId: team.id,
            criteriaId: criterion.id,
            juryId: session.userId,
          },
        },
        update: {
          score: parsed.data.scores[criterion.key] ?? 0,
          comment: parsed.data.comment,
          lockedAt,
        },
        create: {
          teamId: team.id,
          criteriaId: criterion.id,
          juryId: session.userId,
          score: parsed.data.scores[criterion.key] ?? 0,
          comment: parsed.data.comment,
          lockedAt,
        },
      }),
    ),
  );
  return apiSuccess({ locked: true });
}
