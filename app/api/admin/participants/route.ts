import { apiError, apiSuccess, readJson } from "@/lib/api";
import { listParticipants, updateParticipantStatus } from "@/lib/repository";
import type { DemoParticipantStatus } from "@/lib/demo-data";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { sendEmail } from "@/lib/notifications";
import { emailTemplates } from "@/emails/templates";

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  return apiSuccess(await listParticipants());
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  const body = await readJson<{ ids?: string[]; status?: DemoParticipantStatus }>(request);
  if (!body?.ids?.length || !body.status) return apiError("Sélection ou statut manquant.");
  const allowed: DemoParticipantStatus[] = ["PENDING", "SELECTED", "REJECTED", "PAID", "CONFIRMED"];
  if (!allowed.includes(body.status)) return apiError("Statut invalide.");
  if (body.status === "SELECTED") {
    const participants = await listParticipants();
    const alreadySelected = participants.filter((participant) =>
      ["SELECTED", "PAID", "CONFIRMED"].includes(participant.status),
    ).length;
    const newlySelected = body.ids.filter((id) => {
      const participant = participants.find((item) => item.id === id);
      return participant && participant.status === "PENDING";
    }).length;
    if (alreadySelected + newlySelected > 100) {
      return apiError(
        `La sélection est limitée à 100 personnes. Il reste ${Math.max(0, 100 - alreadySelected)} place(s).`,
        409,
      );
    }
  }
  const results = await Promise.all(body.ids.map((id) => updateParticipantStatus(id, body.status!)));

  // Notify candidates when a decision is taken.
  if (body.status === "SELECTED" || body.status === "REJECTED") {
    const all = await listParticipants();
    const targets = all.filter((participant) => body.ids!.includes(participant.id));
    await Promise.all(
      targets.map((participant) =>
        sendEmail({
          participantId: participant.id,
          to: participant.email,
          subject:
            body.status === "SELECTED"
              ? "🎉 Tu es sélectionné·e pour le VIBEATHON 2026"
              : "Résultat de ta candidature VIBEATHON 2026",
          html:
            body.status === "SELECTED"
              ? emailTemplates.selection(participant.fullName)
              : emailTemplates.rejection(participant.fullName),
          template: body.status === "SELECTED" ? "selection" : "rejection",
        }),
      ),
    );
  }

  return apiSuccess({ updated: results.filter(Boolean).length });
}
