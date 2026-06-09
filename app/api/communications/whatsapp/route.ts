import { apiError, apiSuccess, readJson } from "@/lib/api";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { sendWhatsApp } from "@/lib/notifications";
import { listParticipants } from "@/lib/repository";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  const body = await readJson<{ audience?: string; message?: string }>(request);
  if (!body?.message) return apiError("Message requis.");
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
      sendWhatsApp({
        participantId: participant.id,
        phone: participant.phone,
        message: body.message!,
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
