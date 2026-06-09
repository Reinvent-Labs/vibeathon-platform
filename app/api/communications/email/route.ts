import { apiError, apiSuccess, readJson } from "@/lib/api";
import { emailTemplates } from "@/emails/templates";
import { sendEmail } from "@/lib/notifications";
import { listParticipants } from "@/lib/repository";
import { isSameOrigin, requireRole } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  const body = await readJson<{ audience?: string; subject?: string; message?: string }>(request);
  if (!body?.subject || !body.message) return apiError("Objet et message requis.");
  const participants = await listParticipants();
  const audience = participants.filter((participant) =>
    body.audience === "confirmed"
      ? ["PAID", "CONFIRMED"].includes(participant.status)
      : body.audience === "selected"
        ? participant.status === "SELECTED"
        : true,
  );
  const results = await Promise.all(
    audience.map((participant) =>
      sendEmail({
        participantId: participant.id,
        to: participant.email,
        subject: body.subject!,
        html: emailTemplates.registration(participant.fullName, body.message!),
        template: "custom-campaign",
      }),
    ),
  );
  return apiSuccess({
    recipients: results.length,
    queued: results.filter((result) => result.status === "QUEUED").length,
    sent: results.filter((result) => result.status === "SENT").length,
    failed: results.filter((result) => result.status === "FAILED").length,
  });
}
