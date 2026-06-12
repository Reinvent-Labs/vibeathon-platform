import { apiError, apiSuccess, readJson } from "@/lib/api";
import { initializePaiementPro } from "@/lib/paiementpro";
import { findParticipantByReference } from "@/lib/repository";
import { paymentInitSchema } from "@/lib/validation";
import { CATEGORIES } from "@/lib/categories";
import { isSameOrigin } from "@/lib/auth";
import { allowRequest } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const body = await readJson<unknown>(request);
  const parsed = paymentInitSchema.safeParse(body);
  if (!parsed.success) return apiError("Données de paiement invalides.");
  if (
    !allowRequest(
      `payment:${parsed.data.reference}`,
      5,
      10 * 60 * 1000,
    )
  ) {
    return apiError(
      "Trop de tentatives de paiement. Réessaie dans quelques minutes.",
      429,
    );
  }

  const participant = await findParticipantByReference(parsed.data.reference);
  if (!participant) return apiError("Participant introuvable.", 404);
  if (participant.status !== "SELECTED") {
    return apiError("Ce dossier n'est pas éligible au paiement.", 409);
  }

  const category = participant.category ?? "HACKATHON";
  const config = CATEGORIES[category];
  const competition =
    category === "HACKATHON" && prisma
      ? await prisma.competition.findUnique({
          where: { slug: "vibeathon-2026" },
          select: { participationFee: true },
        })
      : null;
  const amount = competition?.participationFee ?? config.fee;
  if (amount === 0) {
    return apiError("Ce pass est gratuit, aucun paiement n'est requis.", 409);
  }

  try {
    const payment = await initializePaiementPro(participant, parsed.data.channel, {
      amount,
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
