import QRCode from "qrcode";
import { sendEmail, sendWhatsApp } from "@/lib/notifications";
import { emailTemplates } from "@/emails/templates";
import { appBaseUrl, badgeUrlFor } from "@/lib/campaigns";
import { whatsAppMessages } from "@/lib/whatsapp-templates";
import { CATEGORIES, type ParticipantCategory } from "@/lib/categories";

type BadgeParticipant = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  reference: string;
  qrCode: string;
  category?: ParticipantCategory | null;
};

/**
 * Send the participant their badge over both channels (email with embedded QR
 * + WhatsApp link). Shared by the free visitor flow, the paid-formation
 * webhook, and the admin "renvoyer le badge" action so the message is
 * identical everywhere. Failures are swallowed per-channel and recorded in
 * EmailLog by the underlying senders.
 */
export async function deliverBadge(participant: BadgeParticipant) {
  const appUrl = appBaseUrl();
  const badgeUrl = badgeUrlFor(participant);
  const category = CATEGORIES[participant.category ?? "HACKATHON"];

  const qrBuffer = await QRCode.toBuffer(participant.qrCode, {
    width: 480,
    margin: 1,
    color: { dark: "#050807", light: "#ffffff" },
  });

  const whatsapp = whatsAppMessages.badgeReady(
    participant.fullName,
    badgeUrl,
    category.label,
  );

  return Promise.all([
    sendEmail({
      participantId: participant.id,
      to: participant.email,
      subject: `Ton badge VIBEATHON 2026 · ${category.label}`,
      text: `Bonjour ${participant.fullName}, ton inscription VIBEATHON 2026 (${category.label}) est confirmée. Ton badge : ${badgeUrl}`,
      html: emailTemplates.badgeReady({
        name: participant.fullName,
        reference: participant.reference,
        badgeUrl,
        appUrl,
        categoryLabel: category.label,
      }),
      template: "badge",
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
      message: whatsapp.message,
      template: "badge",
      waTemplate: whatsapp.waTemplate,
    }),
  ]);
}
