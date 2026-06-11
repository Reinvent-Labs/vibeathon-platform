import { apiError, apiSuccess, readJson } from "@/lib/api";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { findParticipantById } from "@/lib/repository";
import { deliverBadge } from "@/lib/badge-delivery";
import { requestIp, writeAuditLog } from "@/lib/audit";

/** Resend a participant's badge (email + WhatsApp) from the dashboard. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const staff = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!staff) return apiError("Non autorisé.", 401);

  const body = await readJson<{ id?: string }>(request);
  if (!body?.id) return apiError("Identifiant manquant.");

  const participant = await findParticipantById(body.id);
  if (!participant) return apiError("Participant introuvable.", 404);
  if (!["PAID", "CONFIRMED", "CHECKED_IN"].includes(participant.status)) {
    return apiError(
      "Le badge n'est disponible qu'après confirmation (paiement ou pass gratuit).",
      409,
    );
  }

  await deliverBadge(participant);
  await writeAuditLog({
    actorId: staff.userId,
    action: "BADGE_RESENT",
    entityType: "Participant",
    entityId: participant.id,
    ipAddress: requestIp(request),
    metadata: { reference: participant.reference },
  });

  return apiSuccess({ sent: true });
}
