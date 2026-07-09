import { apiError, apiSuccess, readJson } from "@/lib/api";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";
import { writeAuditLog, requestIp } from "@/lib/audit";

type Body = { finalistCount?: number };

/** POST — qualifies the top N teams as finalists, closes Phase 1, sends notification emails. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const body = await readJson<Body>(request);
  const finalistCount = Math.max(1, Math.min(body?.finalistCount ?? 10, 20));

  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: { id: true, phase: true },
  });
  if (!competition) return apiError("Compétition introuvable.", 404);
  if (!["PHASE1_RUNNING", "PHASE1_DONE"].includes(competition.phase)) {
    return apiError("La Phase 1 n'est pas active.", 409);
  }

  // Get all teams ranked by AI score
  const teams = await prisma.team.findMany({
    where: { competition: { slug: "vibeathon-2026" } },
    select: { id: true, name: true, aiEvaluation: { select: { score: true } } },
    orderBy: { name: "asc" },
  });

  const ranked = [...teams].sort(
    (a, b) => (b.aiEvaluation?.score ?? -1) - (a.aiEvaluation?.score ?? -1),
  );

  const finalists = ranked.slice(0, finalistCount);
  const others = ranked.slice(finalistCount);

  // Mark finalists and clear previous results
  await Promise.all([
    ...finalists.map((t) =>
      prisma!.team.update({
        where: { id: t.id },
        data: { isFinalist: true, rank: null },
      }),
    ),
    ...others.map((t) =>
      prisma!.team.update({
        where: { id: t.id },
        data: { isFinalist: false, rank: null },
      }),
    ),
    prisma.competition.update({
      where: { id: competition.id },
      data: { phase: "PHASE1_DONE" },
    }),
  ]);

  await writeAuditLog({
    actorId: user.userId,
    action: "PHASE1_QUALIFIED",
    entityType: "Competition",
    entityId: competition.id,
    ipAddress: requestIp(request),
    metadata: { finalistCount },
  });

  // Send notification emails to all jury + admins
  const staff = await prisma.adminUser.findMany({
    where: { active: true, role: { in: ["JURY", "ADMIN", "SUPER_ADMIN"] } },
    select: { email: true, fullName: true, role: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vibethon.reinvent-labs.com";

  await Promise.allSettled(
    staff.map((member) => {
      const isJury = member.role === "JURY";
      const link = isJury ? `${appUrl}/jury` : `${appUrl}/admin/evaluation`;
      return sendEmail({
        to: member.email,
        subject: `VIBEATHON 2026 — Phase 1 terminée · ${finalistCount} équipes qualifiées`,
        template: "phase1-complete",
        html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;padding:40px 20px;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin:0 0 8px;">Phase 1 terminée ✓</h1>
  <p style="color:#a3a3a3;margin:0 0 24px;">Bonjour ${member.fullName},</p>
  <p>L'évaluation IA de la Phase 1 est terminée. <strong>${finalistCount} équipes</strong> ont été qualifiées pour la phase finale.</p>
  ${isJury ? `<p>Vous pouvez désormais accéder au portail jury pour noter les équipes finalistes.</p>` : `<p>Vous pouvez consulter le classement complet et démarrer la Phase 2 dans le tableau de bord.</p>`}
  <a href="${link}" style="display:inline-block;background:#75FF8D;color:#0a0a0a;font-weight:700;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;margin-top:16px;">${isJury ? "Accéder au portail jury →" : "Voir les résultats →"}</a>
  <p style="color:#525252;font-size:12px;margin-top:32px;">VIBEATHON 2026 · Abidjan</p>
</body>
</html>`,
        text: `Bonjour ${member.fullName},\n\nLa Phase 1 est terminée. ${finalistCount} équipes qualifiées.\n\n${link}`,
      });
    }),
  );

  return apiSuccess({
    phase: "PHASE1_DONE",
    finalistCount,
    finalists: finalists.map((t, i) => ({
      id: t.id,
      name: t.name,
      aiScore: t.aiEvaluation?.score ?? null,
      position: i + 1,
    })),
  });
}
