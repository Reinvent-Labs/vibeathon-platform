import { headers } from "next/headers";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { createTicketParticipant } from "@/lib/repository";
import { ticketSchema } from "@/lib/validation";
import { allowRequest } from "@/lib/rate-limit";
import { deliverBadge } from "@/lib/badge-delivery";
import { initializePaiementPro } from "@/lib/paiementpro";
import { badgeUrlFor } from "@/lib/campaigns";
import { CATEGORIES } from "@/lib/categories";
import { REGISTRATIONS_CLOSED, REGISTRATIONS_CLOSED_COPY } from "@/lib/constants";

/**
 * Public registration for visitor / formation passes.
 * Free passes are confirmed instantly and the badge is sent over email +
 * WhatsApp. Paid passes (formations) return a PaiementPro checkout URL; the
 * badge is delivered by the payment webhook once the transaction succeeds.
 */
export async function POST(request: Request) {
  // Checked before anything else so a stale page, a cached form, or a direct
  // POST cannot create a participant for an event that has already happened.
  if (REGISTRATIONS_CLOSED) {
    return apiError(REGISTRATIONS_CLOSED_COPY.apiMessage, 410);
  }

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowRequest(`tickets:${ip}`, 5, 60 * 60 * 1000)) {
    return apiError("Trop d'inscriptions depuis cette connexion. Réessaie dans une heure.", 429);
  }

  const body = await readJson<unknown>(request);
  const parsed = ticketSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  const config = CATEGORIES[parsed.data.category];

  try {
    const participant = await createTicketParticipant(parsed.data);

    // Free pass → confirm and deliver the badge immediately.
    if (config.fee === 0) {
      await deliverBadge(participant);
      return apiSuccess(
        {
          participantId: participant.id,
          reference: participant.reference,
          status: participant.status,
          free: true,
          badgeUrl: badgeUrlFor(participant),
        },
        { status: 201 },
      );
    }

    // Paid pass → start a PaiementPro checkout.
    const payment = await initializePaiementPro(participant, "WAVE", {
      amount: config.fee,
      description: `${config.label} · VIBEATHON 2026`,
    });
    if (!payment.success || !payment.url) {
      return apiError(
        ("message" in payment ? payment.message : undefined) ??
          "Le paiement n'a pas pu être initialisé.",
        502,
      );
    }
    return apiSuccess(
      {
        participantId: participant.id,
        reference: participant.reference,
        status: participant.status,
        free: false,
        paymentUrl: payment.url,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inscription impossible.";
    return apiError(message, message.includes("déjà") ? 409 : 500);
  }
}
