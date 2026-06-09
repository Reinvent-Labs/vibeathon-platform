import { apiError, apiSuccess, readJson } from "@/lib/api";
import { listParticipants, updateParticipantStatus } from "@/lib/repository";
import type { DemoParticipantStatus } from "@/lib/demo-data";
import { isSameOrigin, requireRole } from "@/lib/auth";

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
  return apiSuccess({ updated: results.filter(Boolean).length });
}
