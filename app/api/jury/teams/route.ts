import { apiError, apiSuccess } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Returns the definitive competitor directory for authenticated jury staff.
 * E-mail contacts remain private and must never be reused by public endpoints.
 * Phone numbers stay in the database but are deliberately not exposed here.
 */
export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]))) {
    return apiError("Non autorisé.", 401);
  }
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const teams = await prisma.team.findMany({
    where: {
      competition: { slug: "vibeathon-2026" },
      members: { some: {} },
    },
    select: {
      id: true,
      name: true,
      domain: true,
      problem: true,
      members: {
        select: {
          id: true,
          fullName: true,
          gender: true,
          email: true,
        },
        orderBy: { fullName: "asc" },
      },
    },
    orderBy: [{ domain: "asc" }, { name: "asc" }],
  });

  return apiSuccess(
    teams.map((team) => ({
      id: team.id,
      name: team.name,
      // The fallback keeps the directory available during the additive migration.
      domain: team.domain || team.problem,
      members: team.members,
    })),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
