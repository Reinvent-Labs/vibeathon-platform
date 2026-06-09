import { apiError, apiSuccess, readJson } from "@/lib/api";
import { findParticipantById, updateParticipantStatus } from "@/lib/repository";

export async function POST(request: Request) {
  if (process.env.PAIEMENTPRO_DEMO_MODE === "false") {
    return apiError("Mode démonstration désactivé.", 403);
  }
  const body = await readJson<{ participantId?: string }>(request);
  if (!body?.participantId) return apiError("Participant manquant.");
  const participant = await findParticipantById(body.participantId);
  if (!participant) return apiError("Participant introuvable.", 404);
  await updateParticipantStatus(participant.id, "CONFIRMED");
  const updated = await findParticipantById(participant.id);
  return apiSuccess(updated);
}
