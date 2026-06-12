import { apiError, apiSuccess } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]))) {
    return apiError("Non autorisé.", 401);
  }
  if (!prisma) return apiError("Base de données indisponible.", 503);
  const criteria = await prisma.judgingCriteria.findMany({
    where: { competition: { slug: "vibeathon-2026" } },
    orderBy: { order: "asc" },
    select: { id: true, key: true, name: true, weight: true, order: true },
  });
  return apiSuccess(criteria);
}
