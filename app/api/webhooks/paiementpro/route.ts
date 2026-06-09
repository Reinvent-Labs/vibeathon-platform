import { timingSafeEqual } from "node:crypto";
import { apiError, apiSuccess } from "@/lib/api";
import { findParticipantById, updateParticipantStatus } from "@/lib/repository";
import { sendEmail, sendWhatsApp } from "@/lib/notifications";
import { emailTemplates } from "@/emails/templates";

function validWebhookSecret(request: Request) {
  const expected = process.env.PAIEMENTPRO_WEBHOOK_SECRET;
  if (!expected) return process.env.NODE_ENV !== "production";
  const received = request.headers.get("x-paiementpro-secret") ?? "";
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function POST(request: Request) {
  if (!validWebhookSecret(request)) return apiError("Signature invalide.", 401);

  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await request.json()) as Record<string, unknown>)
    : Object.fromEntries(await request.formData());
  const participantId = String(payload.returnContext ?? payload.participantId ?? "");
  const status = String(payload.status ?? payload.responsecode ?? payload.success ?? "").toLowerCase();
  if (!participantId) return apiError("Contexte de paiement manquant.");
  if (!["success", "true", "0", "paid", "completed"].includes(status)) {
    return apiSuccess({ received: true, updated: false });
  }

  const participant = await findParticipantById(participantId);
  if (!participant) return apiError("Participant introuvable.", 404);
  await updateParticipantStatus(participant.id, "CONFIRMED");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await Promise.all([
    sendEmail({
      participantId: participant.id,
      to: participant.email,
      subject: "Ton badge VIBEATHON 2026 est prêt",
      html: emailTemplates.badge(
        participant.fullName,
        `${appUrl}/badge/${participant.qrCode}`,
      ),
      template: "payment-badge",
    }),
    sendWhatsApp({
      participantId: participant.id,
      phone: participant.phone,
      message: `Paiement confirmé. Ton badge VIBEATHON est disponible ici : ${appUrl}/badge/${participant.qrCode}`,
      template: "payment-badge",
    }),
  ]);
  return apiSuccess({ received: true, updated: true });
}
