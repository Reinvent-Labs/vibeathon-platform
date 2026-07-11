import { apiError, apiSuccess, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";
import { appBaseUrl } from "@/lib/campaigns";
import { emailTemplates } from "@/emails/templates";

type SubmitBody = {
  teamId?: string;
  demoUrl?: string;
  repositoryUrl?: string;
  description?: string;
  testCredentials?: string;
};

export async function POST(request: Request) {
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const body = await readJson<SubmitBody>(request);
  if (!body?.teamId?.trim()) return apiError("Équipe manquante.");
  if (!body.description?.trim()) return apiError("Description du projet manquante.");
  if (!body.demoUrl?.trim()) return apiError("URL de démo manquante.");

  try { new URL(body.demoUrl); } catch { return apiError("URL de démo invalide."); }
  if (body.repositoryUrl?.trim()) {
    try { new URL(body.repositoryUrl); } catch { return apiError("URL du dépôt invalide."); }
  }

  const team = await prisma.team.findFirst({
    where: { id: body.teamId, competition: { slug: "vibeathon-2026" } },
    include: {
      competition: { select: { phase: true } },
      members: { select: { email: true } },
    },
  });
  if (!team) return apiError("Équipe introuvable.", 404);
  if (team.competition.phase !== "SUBMISSIONS_OPEN") {
    return apiError("Les soumissions sont fermées. La Phase 1 a déjà démarré.", 409);
  }

  await prisma.team.update({
    where: { id: team.id },
    data: {
      description: body.description?.trim() || null,
      demoUrl: body.demoUrl.trim(),
      repositoryUrl: body.repositoryUrl?.trim() || null,
      testCredentials: body.testCredentials?.trim().slice(0, 500) || null,
    },
  });

  // AI evaluation happens only during Phase 1 (admin-controlled) — candidates
  // never see a score at submission time.
  const appUrl = appBaseUrl();
  await Promise.allSettled(
    team.members.map((member) =>
      sendEmail({
        to: member.email,
        subject: "Dossier reçu — VIBEATHON 2026",
        template: "submission-confirmed",
        html: emailTemplates.submissionConfirmed({ teamName: team.name, appUrl }),
        text: `Bonjour, le dossier de l'équipe ${team.name} a bien été soumis. Tu recevras un e-mail dès que les résultats de la première phase seront disponibles.`,
      }),
    ),
  );

  return apiSuccess({ teamName: team.name, submitted: true });
}
