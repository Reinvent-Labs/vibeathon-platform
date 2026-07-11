import { apiError, apiSuccess, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { scoreSubmissionSchema } from "@/lib/validation";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { sendEmail } from "@/lib/notifications";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const session = await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]);
  if (!session) return apiError("Non autorisé.", 401);
  const body = await readJson<unknown>(request);
  const parsed = scoreSubmissionSchema.safeParse(body);
  if (!parsed.success) return apiError("Scores invalides.");

  if (!prisma) return apiError("Base de données indisponible.", 503);
  const database = prisma;
  const team = await database.team.findFirst({
    where: {
      id: parsed.data.teamId,
      competition: { slug: "vibeathon-2026" },
      isFinalist: true,
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
    criteria.length === 0 ||
    criteria.some((criterion) => !(criterion.key in parsed.data.scores)) ||
    Object.keys(parsed.data.scores).some(
      (key) => !criteria.some((criterion) => criterion.key === key),
    )
  ) {
    return apiError("Tous les critères doivent être renseignés.", 400);
  }
  for (const criterion of criteria) {
    const value = parsed.data.scores[criterion.key] ?? 0;
    if (value > criterion.weight) {
      return apiError(
        `Le score ${criterion.name} dépasse ${criterion.weight}.`,
      );
    }
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

  // Detect Phase 2 completion (non-blocking)
  void checkPhase2Complete(prisma).catch(console.error);

  return apiSuccess({ locked: true });
}

async function checkPhase2Complete(db: NonNullable<typeof prisma>) {
  const competition = await db.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: { id: true, phase: true },
  });
  if (!competition || competition.phase === "PHASE2_DONE") return;

  const [juryCount, finalistCount, lockedScoreCount] = await Promise.all([
    db.adminUser.count({ where: { role: "JURY", active: true } }),
    db.team.count({ where: { competition: { slug: "vibeathon-2026" }, isFinalist: true } }),
    db.juryScore.count({
      where: {
        team: { competition: { slug: "vibeathon-2026" }, isFinalist: true },
        lockedAt: { not: null },
      },
    }),
  ]);

  if (juryCount === 0 || finalistCount === 0) return;

  // Each jury member × each finalist team × each criterion = one JuryScore row
  const criteriaCount = await db.judgingCriteria.count({
    where: { competition: { slug: "vibeathon-2026" } },
  });
  const required = juryCount * finalistCount * criteriaCount;
  if (lockedScoreCount < required) return;

  // Mark Phase 2 done
  await db.competition.update({
    where: { id: competition.id },
    data: { phase: "PHASE2_DONE" },
  });

  // Send completion emails
  const staff = await db.adminUser.findMany({
    where: { active: true, role: { in: ["JURY", "ADMIN", "SUPER_ADMIN"] } },
    select: { email: true, fullName: true, role: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vibethon.reinvent-labs.com";

  await Promise.allSettled(
    staff.map((member) => {
      const link = member.role === "JURY" ? `${appUrl}/jury` : `${appUrl}/admin/jury`;
      return sendEmail({
        to: member.email,
        subject: "VIBEATHON 2026 — Phase 2 terminée · Résultats finaux disponibles",
        template: "phase2-complete",
        html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;padding:40px 20px;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin:0 0 8px;">Phase 2 terminée ✓</h1>
  <p style="color:#a3a3a3;margin:0 0 24px;">Bonjour ${member.fullName},</p>
  <p>Tous les membres du jury ont soumis leurs notes. Le classement final est maintenant disponible.</p>
  <a href="${link}" style="display:inline-block;background:#75FF8D;color:#0a0a0a;font-weight:700;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;margin-top:16px;">Voir le classement final →</a>
  <p style="color:#525252;font-size:12px;margin-top:32px;">VIBEATHON 2026 · Abidjan</p>
</body>
</html>`,
        text: `Bonjour ${member.fullName},\n\nTous les jurés ont soumis leurs notes. Classement final disponible :\n\n${link}`,
      });
    }),
  );
}
