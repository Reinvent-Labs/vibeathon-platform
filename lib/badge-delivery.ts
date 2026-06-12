import QRCode from "qrcode";
import { sendEmail, sendWhatsApp } from "@/lib/notifications";
import { appBaseUrl, badgeUrlFor } from "@/lib/campaigns";
import { renderCmsEmail } from "@/lib/cms-email";
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
  const email = await renderCmsEmail("badgeReady", {
    name: participant.fullName,
    reference: participant.reference,
    badgeUrl,
    categoryLabel: category.label,
    appUrl,
  });

  return Promise.all([
    sendEmail({
      participantId: participant.id,
      to: participant.email,
      subject: email.subject,
      text: `${email.text}\n\n${badgeUrl}`,
      html: email.html,
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
