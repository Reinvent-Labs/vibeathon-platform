import { apiError, apiSuccess, readJson } from "@/lib/api";
import { initializePaiementPro } from "@/lib/paiementpro";
import { findParticipantById } from "@/lib/repository";
import { paymentInitSchema } from "@/lib/validation";
import { CATEGORIES } from "@/lib/categories";
import { isSameOrigin } from "@/lib/auth";
import { allowRequest } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const body = await readJson<unknown>(request);
  const parsed = paymentInitSchema.safeParse(body);
  if (!parsed.success) return apiError("Données de paiement invalides.");
  if (
    !allowRequest(
      `payment:${parsed.data.participantId}`,
      5,
      10 * 60 * 1000,
    )
  ) {
    return apiError(
      "Trop de tentatives de paiement. Réessaie dans quelques minutes.",
      429,
    );
  }

  const participant = await findParticipantById(parsed.data.participantId);
  if (!participant) return apiError("Participant introuvable.", 404);
  if (participant.status !== "SELECTED") {
    return apiError("Ce dossier n'est pas éligible au paiement.", 409);
  }

  const config = CATEGORIES[participant.category ?? "HACKATHON"];
  if (config.fee === 0) {
    return apiError("Ce pass est gratuit, aucun paiement n'est requis.", 409);
  }

  try {
    const payment = await initializePaiementPro(participant, parsed.data.channel, {
      amount: config.fee,
      description: `${config.label} · ${"VIBEATHON 2026"}`,
    });
    if (!payment.success) {
      return apiError(
        ("message" in payment ? payment.message : undefined) ??
          "PaiementPro a refusé la demande. Réessaie dans quelques instants.",
        502,
      );
    }
    return apiSuccess(payment);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Paiement indisponible.", 502);
  }
}
