import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";

/** Public endpoint — returns current competition phase so the submission form can lock itself. */
export async function GET() {
  if (!prisma) return apiError("Base de données indisponible.", 503);
  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: { phase: true, registrationOpen: true },
  });
  if (!competition) return apiError("Compétition introuvable.", 404);
  return apiSuccess({
    phase: competition.phase,
    submissionsOpen: competition.phase === "SUBMISSIONS_OPEN",
    registrationOpen: competition.registrationOpen,
  });
}
