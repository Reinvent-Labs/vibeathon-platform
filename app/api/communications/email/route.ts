import { apiError, apiSuccess, readJson } from "@/lib/api";
import { emailTemplates } from "@/emails/templates";
import { sendEmail } from "@/lib/notifications";
import { listParticipants } from "@/lib/repository";
import { isSameOrigin, requireRole } from "@/lib/auth";
import {
  appBaseUrl,
  badgeUrlFor,
  CAMPAIGN_AUDIENCES,
  filterCampaignAudience,
  statusUrlFor,
} from "@/lib/campaigns";
import QRCode from "qrcode";
import { z } from "zod";

const emailCampaignSchema = z.object({
  audience: z.enum(CAMPAIGN_AUDIENCES).default("selected"),
  templateKey: z
    .enum([
      "results-available",
      "accepted-payment",
      "payment-reminder",
      "payment-confirmed",
      "bootcamp-info",
      "event-reminder",
      "custom",
    ])
    .default("payment-reminder"),
  subject: z.string().trim().max(140).optional(),
  message: z.string().trim().max(5000).optional(),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  const parsed = emailCampaignSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Campagne invalide.");
  }
  const body = parsed.data;
  if (body.templateKey === "custom" && (!body.subject || !body.message)) {
    return apiError("Objet et message requis pour un email personnalisé.");
  }

  const appUrl = appBaseUrl();
  const participants = await listParticipants();
  const audience = filterCampaignAudience([...participants], body.audience);
  const results = await Promise.all(
    audience.map(async (participant) => {
      const statusUrl = statusUrlFor(participant);
      const badgeUrl = badgeUrlFor(participant);
      const qrAttachment =
        body.templateKey === "payment-confirmed"
          ? [
              {
                filename: "badge-qr-vibeathon.png",
                content: await QRCode.toBuffer(participant.qrCode, {
                  width: 480,
                  margin: 1,
                  color: { dark: "#050807", light: "#ffffff" },
                }),
                contentType: "image/png",
                cid: "vibeathon-qr",
              },
            ]
          : undefined;
      const campaign = (() => {
        if (body.templateKey === "results-available") {
          return {
            subject: "Les résultats VIBEATHON 2026 sont disponibles",
            text: `Bonjour ${participant.fullName}, les résultats VIBEATHON 2026 sont disponibles. Consulte ton statut : ${statusUrl}`,
            html: emailTemplates.resultsAvailable(
              participant.fullName,
              statusUrl,
              appUrl,
            ),
          };
        }
        if (body.templateKey === "accepted-payment") {
          return {
            subject: "Ton dossier VIBEATHON est accepté · paiement en attente",
            text: `Félicitations ${participant.fullName}, ton dossier est accepté. Finalise le paiement pour confirmer ta place : ${statusUrl}`,
            html: emailTemplates.selection(
              participant.fullName,
              statusUrl,
              appUrl,
            ),
          };
        }
        if (body.templateKey === "payment-confirmed") {
          return {
            subject: "Ton badge VIBEATHON 2026 est prêt",
            text: `Bonjour ${participant.fullName}, ton paiement est confirmé. Ton badge QR est disponible ici : ${badgeUrl}`,
            html: emailTemplates.paymentConfirmed({
              name: participant.fullName,
              reference: participant.reference,
              badgeUrl,
              appUrl,
            }),
          };
        }
        if (body.templateKey === "bootcamp-info") {
          return {
            subject: "Infos pratiques VIBEATHON 2026",
            text: `Bonjour ${participant.fullName}, ta participation est confirmée. Prépare ton ordinateur, ton chargeur, une pièce d'identité et ton badge QR : ${badgeUrl}`,
            html: emailTemplates.bootcampInfo(
              participant.fullName,
              badgeUrl,
              appUrl,
            ),
          };
        }
        if (body.templateKey === "event-reminder") {
          return {
            subject: "Rappel VIBEATHON 2026 · ton badge à préparer",
            text: `Bonjour ${participant.fullName}, VIBEATHON approche. Prépare ton badge QR : ${badgeUrl}`,
            html: emailTemplates.reminder(participant.fullName, badgeUrl, appUrl),
          };
        }
        if (body.templateKey === "custom") {
          return {
            subject: body.subject!,
            text: `Bonjour ${participant.fullName},\n\n${body.message!}`,
            html: emailTemplates.custom(participant.fullName, body.message!, appUrl),
          };
        }
        return {
          subject: "Rappel paiement VIBEATHON 2026",
          text: `Bonjour ${participant.fullName}, ton dossier est accepté mais ton paiement reste en attente. Confirme ta place ici : ${statusUrl}`,
          html: emailTemplates.paymentReminder(
            participant.fullName,
            statusUrl,
            appUrl,
          ),
        };
      })();

      return sendEmail({
        participantId: participant.id,
        to: participant.email,
        subject: campaign.subject,
        text: campaign.text,
        html: campaign.html,
        template: body.templateKey,
        attachments: qrAttachment,
      });
    }),
  );
  return apiSuccess({
    recipients: results.length,
    queued: results.filter((result) => result.status === "QUEUED").length,
    sent: results.filter((result) => result.status === "SENT").length,
    failed: results.filter((result) => result.status === "FAILED").length,
  });
}
