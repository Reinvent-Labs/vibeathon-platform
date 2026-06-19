import QRCode from "qrcode";
import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api";
import { findParticipantByEmail, confirmParticipationAtomic } from "@/lib/repository";
import { sendEmail, sendWhatsApp } from "@/lib/notifications";
import { appBaseUrl, badgeUrlFor } from "@/lib/campaigns";
import { renderCmsEmail } from "@/lib/cms-email";
import { whatsAppMessages } from "@/lib/whatsapp-templates";
import { allowRequest } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowRequest(`confirm:${ip}`, 10, 15 * 60 * 1000)) {
    return apiError("Trop de tentatives. Réessaie dans quelques minutes.", 429);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Adresse email invalide.");

  const participant = await findParticipantByEmail(parsed.data.email);
  if (!participant) return apiError("Aucune candidature trouvée pour cet email.", 404);

  if (["CONFIRMED", "PAID", "CHECKED_IN"].includes(participant.status)) {
    // Already confirmed — just return the badge URL.
    return apiSuccess({ badgeUrl: `/badge/${participant.qrCode}`, alreadyConfirmed: true });
  }

  if (participant.status !== "SELECTED") {
    return apiError("Ta candidature n'est pas encore sélectionnée.", 409);
  }

  // Ensure qrCode exists before confirming.
  if (prisma && !participant.qrCode) {
    await prisma.participant.update({
      where: { id: participant.id },
      data: { qrCode: participant.reference.replace("-2026-", "-2026-C-") },
    });
    participant.qrCode = participant.reference.replace("-2026-", "-2026-C-");
  }

  const confirmed = await confirmParticipationAtomic(participant.id);
  if (!confirmed) {
    return apiError("Impossible de confirmer la participation. Contacte l'équipe VIBEATHON.", 500);
  }

  const appUrl = appBaseUrl();
  const badgeUrl = badgeUrlFor(participant);

  const qrBuffer = await QRCode.toBuffer(participant.qrCode, {
    width: 480,
    margin: 1,
    color: { dark: "#050807", light: "#ffffff" },
  }).catch(() => null);

  const badgeEmail = await renderCmsEmail("paymentConfirmed", {
    name: participant.fullName,
    reference: participant.reference,
    badgeUrl,
    appUrl,
  }).catch(() => null);

  const waMsg = whatsAppMessages.paymentConfirmed(participant.fullName, badgeUrl);

  void Promise.all([
    badgeEmail
      ? sendEmail({
          participantId: participant.id,
          to: participant.email,
          subject: badgeEmail.subject,
          text: `${badgeEmail.text}\n\n${badgeUrl}`,
          html: badgeEmail.html,
          template: "confirm-badge",
          attachments: qrBuffer
            ? [{ filename: "badge-qr-vibeathon.png", content: qrBuffer, contentType: "image/png", cid: "vibeathon-qr" }]
            : [],
        })
      : Promise.resolve(),
    sendWhatsApp({
      participantId: participant.id,
      phone: participant.phone,
      message: waMsg.message,
      template: "confirm-badge",
      waTemplate: waMsg.waTemplate,
    }),
  ]).catch((err) => console.error("[confirm] Notification error:", err));

  return apiSuccess({ badgeUrl: `/badge/${participant.qrCode}`, alreadyConfirmed: false });
}
