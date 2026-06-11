import { headers } from "next/headers";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { createParticipant } from "@/lib/repository";
import { registrationSchema } from "@/lib/validation";
import { allowRequest } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/notifications";
import { emailTemplates } from "@/emails/templates";
import { appBaseUrl } from "@/lib/campaigns";

export async function POST(request: Request) {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowRequest(`register:${ip}`, 3, 60 * 60 * 1000)) {
    return apiError("Trop de candidatures depuis cette connexion. Réessaie dans une heure.", 429);
  }

  const body = await readJson<unknown>(request);
  const parsed = registrationSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Données invalides.");
  }

  try {
    const participant = await createParticipant(parsed.data);
    await sendEmail({
      participantId: participant.id,
      to: participant.email,
      subject: "Candidature VIBEATHON 2026 reçue",
      text: `Bonjour ${participant.fullName}, ta candidature VIBEATHON a bien été enregistrée. Référence : ${participant.reference}. Suivi : ${appBaseUrl()}/statut`,
      html: emailTemplates.registration(
        participant.fullName,
        participant.reference,
        appBaseUrl(),
      ),
      template: "registration",
    });
    return apiSuccess(
      {
        id: participant.id,
        reference: participant.reference,
        status: participant.status,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Enregistrement impossible.";
    return apiError(message, message.includes("déjà") ? 409 : 500);
  }
}
