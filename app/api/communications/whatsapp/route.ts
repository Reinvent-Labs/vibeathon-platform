import { apiError, apiSuccess, readJson } from "@/lib/api";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/notifications";
import { listParticipants } from "@/lib/repository";
import {
  badgeUrlFor,
  CAMPAIGN_AUDIENCES,
  filterCampaignAudience,
  statusUrlFor,
} from "@/lib/campaigns";
import { whatsAppMessages } from "@/lib/whatsapp-templates";
import { z } from "zod";

const whatsappCampaignSchema = z.object({
  audience: z.enum(CAMPAIGN_AUDIENCES).default("selected"),
  templateKey: z
    .enum([
      "results-available",
      "accepted-payment",
      "payment-reminder",
      "payment-confirmed",
      "bootcamp-info",
      "event-reminder",
      "team-assignment",
      "custom",
    ])
    .default("payment-reminder"),
  message: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  const parsed = whatsappCampaignSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Campagne invalide.");
  }
  const body = parsed.data;
  if (body.templateKey === "custom" && !body.message) {
    return apiError("Message requis pour un WhatsApp personnalisé.");
  }

  const participants = await listParticipants();
  const audience = filterCampaignAudience([...participants], body.audience);
  const results = await Promise.all(
    audience.map((participant) => {
      const statusUrl = statusUrlFor(participant);
      const badgeUrl = badgeUrlFor(participant);
      const payload = (() => {
        if (body.templateKey === "results-available") {
          return whatsAppMessages.resultsAvailable(participant.fullName, statusUrl);
        }
        if (body.templateKey === "accepted-payment") {
          return whatsAppMessages.accepted(participant.fullName, statusUrl);
        }
        if (body.templateKey === "payment-confirmed") {
          return whatsAppMessages.paymentConfirmed(participant.fullName, badgeUrl);
        }
        if (body.templateKey === "bootcamp-info") {
          return whatsAppMessages.bootcampInfo(participant.fullName, badgeUrl);
        }
        if (body.templateKey === "event-reminder") {
          return whatsAppMessages.eventReminder(participant.fullName, badgeUrl);
        }
        if (body.templateKey === "team-assignment") {
          const teamName =
            "team" in participant
              ? participant.team?.name
              : participant.teamName;
          return whatsAppMessages.teamAssignment(
            participant.fullName,
            teamName ?? "ton équipe",
            statusUrl,
          );
        }
        if (body.templateKey === "custom") {
          return { message: body.message!, waTemplate: undefined };
        }
        return whatsAppMessages.paymentReminder(participant.fullName, statusUrl);
      })();
      return (
      sendWhatsApp({
        participantId: participant.id,
        phone: participant.phone,
        message: payload.message,
        template: body.templateKey,
        waTemplate: payload.waTemplate,
      })
      );
    }),
  );
  return apiSuccess({
    recipients: results.length,
    queued: results.filter((result) => result.status === "QUEUED").length,
    sent: results.filter((result) => result.status === "SENT").length,
    failed: results.filter((result) => result.status === "FAILED").length,
  });
}
