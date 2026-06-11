import { timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import { apiError, apiSuccess } from "@/lib/api";
import { findParticipantById, updateParticipantStatus } from "@/lib/repository";
import { sendEmail, sendWhatsApp } from "@/lib/notifications";
import { emailTemplates } from "@/emails/templates";
import { appBaseUrl, badgeUrlFor } from "@/lib/campaigns";
import { whatsAppMessages } from "@/lib/whatsapp-templates";

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
  const appUrl = appBaseUrl();
  const badgeUrl = badgeUrlFor(participant);
  const qrBuffer = await QRCode.toBuffer(participant.qrCode, {
    width: 480,
    margin: 1,
    color: {
      dark: "#050807",
      light: "#ffffff",
    },
  });
  const paymentWhatsapp = whatsAppMessages.paymentConfirmed(
    participant.fullName,
    badgeUrl,
  );
  await Promise.all([
    sendEmail({
      participantId: participant.id,
      to: participant.email,
      subject: "Ton badge VIBEATHON 2026 est prêt",
      text: `Bonjour ${participant.fullName}, ton paiement est confirmé. Ton badge QR VIBEATHON est disponible ici : ${badgeUrl}`,
      html: emailTemplates.paymentConfirmed({
        name: participant.fullName,
        reference: participant.reference,
        badgeUrl,
        appUrl,
      }),
      template: "payment-badge",
      attachments: [
        {
          filename: "badge-qr-vibeathon.png",
          content: qrBuffer,
          contentType: "image/png",
          cid: "vibeathon-qr",
        },
      ],
    }),
    sendWhatsApp({
      participantId: participant.id,
      phone: participant.phone,
      message: paymentWhatsapp.message,
      template: "payment-badge",
      waTemplate: paymentWhatsapp.waTemplate,
    }),
  ]);
  return apiSuccess({ received: true, updated: true });
}
