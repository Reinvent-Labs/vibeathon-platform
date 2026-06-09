import { apiError, apiSuccess, readJson } from "@/lib/api";
import { initializePaiementPro } from "@/lib/paiementpro";
import { findParticipantById } from "@/lib/repository";
import { paymentInitSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const body = await readJson<unknown>(request);
  const parsed = paymentInitSchema.safeParse(body);
  if (!parsed.success) return apiError("Données de paiement invalides.");

  const participant = await findParticipantById(parsed.data.participantId);
  if (!participant) return apiError("Participant introuvable.", 404);
  if (participant.status !== "SELECTED") {
    return apiError("Ce dossier n'est pas éligible au paiement.", 409);
  }

  try {
    const payment = await initializePaiementPro(participant, parsed.data.channel);
    if (!payment.success) {
      return apiError(
        ("message" in payment ? payment.message : undefined) ??
          "PaiementPro a refusé la demande.",
        502,
      );
    }
    return apiSuccess(payment);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Paiement indisponible.", 502);
  }
}
