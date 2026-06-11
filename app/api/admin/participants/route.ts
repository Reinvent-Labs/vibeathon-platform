import { apiError, apiSuccess, readJson } from "@/lib/api";
import { listParticipants, updateParticipantStatus } from "@/lib/repository";
import type { DemoParticipantStatus } from "@/lib/demo-data";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { sendEmail, sendWhatsApp } from "@/lib/notifications";
import { emailTemplates } from "@/emails/templates";
import { requestIp, writeAuditLog } from "@/lib/audit";
import { appBaseUrl, statusUrlFor } from "@/lib/campaigns";
import { whatsAppMessages } from "@/lib/whatsapp-templates";

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  return apiSuccess(await listParticipants());
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const staff = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!staff) {
    return apiError("Non autorisé.", 401);
  }
  const body = await readJson<{
    ids?: string[];
    status?: DemoParticipantStatus;
    notify?: boolean;
  }>(request);
  if (!body?.ids?.length || !body.status) return apiError("Sélection ou statut manquant.");
  const allowed: DemoParticipantStatus[] = [
    "PENDING",
    "WAITLIST",
    "SELECTED",
    "REJECTED",
    "PAID",
    "CONFIRMED",
    "CHECKED_IN",
  ];
  if (!allowed.includes(body.status)) return apiError("Statut invalide.");
  const nextStatus = body.status;
  const participants = await listParticipants();
  const targets = participants.filter((participant) =>
    body.ids!.includes(participant.id),
  );
  if (targets.length !== new Set(body.ids).size) {
    return apiError("Une ou plusieurs candidatures sont introuvables.", 404);
  }
  // Statuses that occupy one of the 100 competition slots.
  const ACTIVE: DemoParticipantStatus[] = [
    "SELECTED",
    "PAID",
    "CONFIRMED",
    "CHECKED_IN",
  ];
  const transitions: Record<DemoParticipantStatus, DemoParticipantStatus[]> = {
    PENDING: ["PENDING", "WAITLIST", "SELECTED", "REJECTED"],
    WAITLIST: ["WAITLIST", "SELECTED", "REJECTED", "PENDING"],
    SELECTED: ["SELECTED", "WAITLIST", "PENDING", "REJECTED"],
    REJECTED: ["REJECTED", "WAITLIST", "PENDING", "SELECTED"],
    PAID: ["PAID", "CONFIRMED"],
    CONFIRMED: ["CONFIRMED", "CHECKED_IN"],
    CHECKED_IN: ["CHECKED_IN"],
  };
  const invalidTransition = targets.find(
    (participant) => !transitions[participant.status].includes(nextStatus),
  );
  if (invalidTransition) {
    return apiError(
      `Le dossier ${invalidTransition.reference} ne peut pas passer de ${invalidTransition.status} à ${nextStatus}.`,
      409,
    );
  }
  // Enforce the 100-slot cap when selecting / promoting from the waitlist.
  if (nextStatus === "SELECTED") {
    const alreadyActive = participants.filter(
      (participant) =>
        participant.category === "HACKATHON" &&
        !participant.isTest &&
        ACTIVE.includes(participant.status),
    ).length;
    const newlyActive = targets.filter(
      (participant) =>
        participant.category === "HACKATHON" &&
        !participant.isTest &&
        !ACTIVE.includes(participant.status),
    ).length;
    if (alreadyActive + newlyActive > 100) {
      return apiError(
        `La sélection est limitée à 100 personnes. Il reste ${Math.max(0, 100 - alreadyActive)} place(s). Libère une place (non-payeur → liste d'attente/refusé) avant de promouvoir.`,
        409,
      );
    }
  }
  const results = await Promise.all(
    body.ids.map((id) => updateParticipantStatus(id, nextStatus)),
  );
  await Promise.all(
    targets.map((participant) =>
      writeAuditLog({
        actorId: staff.userId,
        action: "PARTICIPANT_STATUS_CHANGED",
        entityType: "Participant",
        entityId: participant.id,
        ipAddress: requestIp(request),
        metadata: {
          reference: participant.reference,
          from: participant.status,
          to: nextStatus,
        },
      }),
    ),
  );

  // Notify candidates when a competition decision is taken. The admin can
  // suppress this (e.g. when statuses are set ahead of a scheduled broadcast)
  // by passing notify=false.
  const decisionStatuses: DemoParticipantStatus[] = [
    "SELECTED",
    "WAITLIST",
    "REJECTED",
  ];
  if (body.notify !== false && decisionStatuses.includes(nextStatus)) {
    const appUrl = appBaseUrl();
    await Promise.all(
      targets.map(async (participant) => {
        const statusUrl = statusUrlFor(participant);
        const name = participant.fullName;

        const email =
          nextStatus === "SELECTED"
            ? {
                subject:
                  "Félicitations ! Vous êtes sélectionné(e) pour la compétition de Vibe Coding du VIBEATHON Côte d'Ivoire",
                html: emailTemplates.competitionSelected(name, statusUrl, appUrl),
                text: `Bonjour ${name}, votre candidature est retenue pour la compétition de Vibe Coding du VIBEATHON Côte d'Ivoire 2026. Réglez vos frais de 20 000 FCFA avant le mardi 16 juin 2026 : ${statusUrl}`,
              }
            : nextStatus === "WAITLIST"
              ? {
                  subject:
                    "Votre candidature pour la compétition de vibe coding est actuellement sur liste d'attente",
                  html: emailTemplates.competitionWaitlist(name, statusUrl, appUrl),
                  text: `Bonjour ${name}, votre candidature a été placée sur liste d'attente. Si une place se libère, nous vous contacterons. ${statusUrl}`,
                }
              : {
                  subject: "Résultat de votre candidature à la compétition de Vibe Coding",
                  html: emailTemplates.competitionRejected(name, statusUrl, appUrl),
                  text: `Bonjour ${name}, votre candidature n'a pas été retenue pour la compétition cette édition. Rejoignez-nous pour les keynotes, panels et ateliers : ${appUrl}`,
                };

        await sendEmail({
          participantId: participant.id,
          to: participant.email,
          subject: email.subject,
          text: email.text,
          html: email.html,
          template: `competition-${nextStatus.toLowerCase()}`,
        });

        const wa =
          nextStatus === "SELECTED"
            ? whatsAppMessages.competitionSelected(name, statusUrl)
            : nextStatus === "WAITLIST"
              ? whatsAppMessages.competitionWaitlist(name, statusUrl)
              : whatsAppMessages.competitionRejected(name, statusUrl, appUrl);

        await sendWhatsApp({
          participantId: participant.id,
          phone: participant.phone,
          message: wa.message,
          template: `competition-${nextStatus.toLowerCase()}`,
          waTemplate: wa.waTemplate,
        });
      }),
    );
  }

  return apiSuccess({ updated: results.filter(Boolean).length });
}
