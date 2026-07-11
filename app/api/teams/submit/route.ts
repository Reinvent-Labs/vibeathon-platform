import { apiError, apiSuccess, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";
import { appBaseUrl } from "@/lib/campaigns";
import { emailTemplates } from "@/emails/templates";

type SubmitBody = {
  teamId?: string;
  demoUrl?: string;
  repositoryUrl?: string;
  videoUrl?: string;
  description?: string;
  testCredentials?: string;
};

export async function POST(request: Request) {
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const body = await readJson<SubmitBody>(request);
  if (!body?.teamId?.trim()) return apiError("Équipe manquante.");
  if (!body.description?.trim()) return apiError("Description du projet manquante.");
  // A web demo URL and a demo video are alternative forms of evidence — a
  // mobile-only team may have no testable web build at all, so we require
  // at least one rather than mandating demoUrl specifically.
  if (!body.demoUrl?.trim() && !body.videoUrl?.trim()) {
    return apiError("Fournis une URL de démo ou une vidéo de démonstration.");
  }

  if (body.demoUrl?.trim()) {
    try { new URL(body.demoUrl); } catch { return apiError("URL de démo invalide."); }
  }
  if (body.repositoryUrl?.trim()) {
    try { new URL(body.repositoryUrl); } catch { return apiError("URL du dépôt invalide."); }
  }
  if (body.videoUrl?.trim()) {
    try { new URL(body.videoUrl); } catch { return apiError("URL de la vidéo invalide."); }
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
  if (team.demoUrl || team.videoUrl) {
    return apiError("Cette équipe a déjà soumis son projet. Une seule soumission par équipe est autorisée.", 409);
  }

  // Guard against a double-submit race (two rapid requests for the same
  // team): only update rows that are still unsubmitted, so the second
  // concurrent request finds nothing to update and fails cleanly instead of
  // overwriting the first submission.
  const updated = await prisma.team.updateMany({
    where: { id: team.id, demoUrl: null, videoUrl: null },
    data: {
      description: body.description?.trim() || null,
      demoUrl: body.demoUrl?.trim() || null,
      repositoryUrl: body.repositoryUrl?.trim() || null,
      videoUrl: body.videoUrl?.trim() || null,
      testCredentials: body.testCredentials?.trim().slice(0, 500) || null,
    },
  });
  if (updated.count === 0) {
    return apiError("Cette équipe a déjà soumis son projet. Une seule soumission par équipe est autorisée.", 409);
  }

  // AI evaluation happens only during Phase 1 (admin-controlled) — candidates
  // never see a score at submission time. Confirmation emails are sent in the
  // background (SMTP round-trips are slow) so the candidate isn't stuck
  // waiting on the submission response.
  const appUrl = appBaseUrl();
  void Promise.allSettled(
    team.members.map((member) =>
      sendEmail({
        to: member.email,
        subject: "Dossier reçu — VIBEATHON 2026",
        template: "submission-confirmed",
        html: emailTemplates.submissionConfirmed({ teamName: team.name, appUrl }),
        text: `Bonjour, le dossier de l'équipe ${team.name} a bien été soumis. Tu recevras un e-mail dès que les résultats de la première phase seront disponibles.`,
      }),
    ),
  ).catch((err) => console.error("[submit] confirmation email failed:", err));

  return apiSuccess({ teamName: team.name, submitted: true });
}
