import { apiError, apiSuccess, readJson } from "@/lib/api";
import { listParticipants, updateParticipantStatus } from "@/lib/repository";
import type { DemoParticipantStatus } from "@/lib/demo-data";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { sendEmail } from "@/lib/notifications";
import { emailTemplates } from "@/emails/templates";
import { requestIp, writeAuditLog } from "@/lib/audit";

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
  const body = await readJson<{ ids?: string[]; status?: DemoParticipantStatus }>(request);
  if (!body?.ids?.length || !body.status) return apiError("Sélection ou statut manquant.");
  const allowed: DemoParticipantStatus[] = [
    "PENDING",
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
  const transitions: Record<DemoParticipantStatus, DemoParticipantStatus[]> = {
    PENDING: ["PENDING", "SELECTED", "REJECTED"],
    SELECTED: ["SELECTED", "PENDING", "REJECTED"],
    REJECTED: ["REJECTED", "PENDING", "SELECTED"],
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
  if (nextStatus === "SELECTED") {
    const alreadySelected = participants.filter((participant) =>
      ["SELECTED", "PAID", "CONFIRMED", "CHECKED_IN"].includes(
        participant.status,
      ),
    ).length;
    const newlySelected = body.ids.filter((id) => {
      const participant = participants.find((item) => item.id === id);
      return participant && participant.status === "PENDING";
    }).length;
    if (alreadySelected + newlySelected > 100) {
      return apiError(
        `La sélection est limitée à 100 personnes. Il reste ${Math.max(0, 100 - alreadySelected)} place(s).`,
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

  // Notify candidates when a decision is taken.
  if (nextStatus === "SELECTED" || nextStatus === "REJECTED") {
    await Promise.all(
      targets.map((participant) =>
        sendEmail({
          participantId: participant.id,
          to: participant.email,
          subject:
            nextStatus === "SELECTED"
              ? "Ton dossier VIBEATHON est accepté · paiement en attente"
              : "Résultat de ta candidature VIBEATHON 2026",
          html:
            nextStatus === "SELECTED"
              ? emailTemplates.selection(participant.fullName)
              : emailTemplates.rejection(participant.fullName),
          template: nextStatus === "SELECTED" ? "selection" : "rejection",
        }),
      ),
    );
  }

  return apiSuccess({ updated: results.filter(Boolean).length });
}
