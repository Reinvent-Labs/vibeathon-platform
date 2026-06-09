import { apiError, apiSuccess, readJson } from "@/lib/api";
import { JUDGING_CRITERIA } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { scoreSubmissionSchema } from "@/lib/validation";
import { isSameOrigin, requireRole } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]))) {
    return apiError("Non autorisé.", 401);
  }
  const body = await readJson<unknown>(request);
  const parsed = scoreSubmissionSchema.safeParse(body);
  if (!parsed.success) return apiError("Scores invalides.");
  for (const criterion of JUDGING_CRITERIA) {
    const value = parsed.data.scores[criterion.id] ?? 0;
    if (value > criterion.weight) return apiError(`Le score ${criterion.name} dépasse ${criterion.weight}.`);
  }

  if (!prisma) return apiError("Base de données indisponible.", 503);
  const database = prisma;
  const session = await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]);
  if (!session) return apiError("Non autorisé.", 401);
  const jury =
    session.userId === "development-user"
      ? await database.adminUser.findFirst({
          where: { role: { in: ["SUPER_ADMIN", "ADMIN", "JURY"] }, active: true },
        })
      : await database.adminUser.findUnique({ where: { id: session.userId } });
  if (!jury) return apiError("Compte jury introuvable.", 403);

  const criteria = await database.judgingCriteria.findMany({
    orderBy: { order: "asc" },
  });
  const previous = await database.juryScore.findFirst({
    where: {
      teamId: parsed.data.teamId,
      juryId: jury.id,
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
            teamId: parsed.data.teamId,
            criteriaId: criterion.id,
            juryId: jury.id,
          },
        },
        update: {
          score: parsed.data.scores[criterion.key] ?? 0,
          comment: parsed.data.comment,
          lockedAt,
        },
        create: {
          teamId: parsed.data.teamId,
          criteriaId: criterion.id,
          juryId: jury.id,
          score: parsed.data.scores[criterion.key] ?? 0,
          comment: parsed.data.comment,
          lockedAt,
        },
      }),
    ),
  );
  return apiSuccess({ locked: true });
}
