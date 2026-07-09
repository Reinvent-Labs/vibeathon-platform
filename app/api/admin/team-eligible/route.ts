import { apiError, apiSuccess } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  if (!prisma) return apiError("Base de données indisponible.", 503);
  const participants = await prisma.participant.findMany({
    where: {
      category: "HACKATHON",
      isTest: false,
      status: { in: ["SELECTED", "PAID", "CONFIRMED", "CHECKED_IN"] },
      teamId: null,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      proposedTeamName: true,
      registrationMode: true,
      status: true,
    },
    orderBy: { fullName: "asc" },
  });
  return apiSuccess(participants);
}
