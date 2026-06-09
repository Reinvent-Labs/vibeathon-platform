import { apiError, apiSuccess } from "@/lib/api";
import { findParticipantByEmail } from "@/lib/repository";
import { statusLookupSchema } from "@/lib/validation";
import { allowRequest } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function GET(request: Request) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowRequest(`status:${ip}`, 30, 15 * 60 * 1000)) {
    return apiError("Trop de recherches. Réessaie dans quelques minutes.", 429);
  }
  const email = new URL(request.url).searchParams.get("email");
  const parsed = statusLookupSchema.safeParse({ email });
  if (!parsed.success) return apiError("Adresse email invalide.");

  const participant = await findParticipantByEmail(parsed.data.email);
  if (!participant) return apiError("Aucune candidature trouvée pour cet email.", 404);

  return apiSuccess({
    id: participant.id,
    reference: participant.reference,
    fullName: participant.fullName,
    email: participant.email,
    city: participant.city,
    profile: participant.profile,
    status: participant.status,
    qrCode: participant.qrCode,
    teamName: participant.teamName,
  });
}
