import { apiError, apiSuccess } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const [sessions, recentScans] = await Promise.all([
    prisma.session.findMany({
      where: {
        competition: { slug: "vibeathon-2026" },
        archivedAt: null,
      },
      orderBy: [{ startsAt: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        location: true,
        active: true,
        startsAt: true,
        _count: {
          select: {
            scans: { where: { result: "ACCEPTED" } },
          },
        },
      },
    }),
    prisma.scanRecord.findMany({
      where: {
        result: "ACCEPTED",
        session: { competition: { slug: "vibeathon-2026" } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        participant: {
          select: { fullName: true, reference: true, category: true },
        },
        session: { select: { name: true } },
      },
    }),
  ]);

  const uniquePresent = await prisma.scanRecord.findMany({
    where: {
      result: "ACCEPTED",
      participantId: { not: null },
      session: { competition: { slug: "vibeathon-2026" } },
    },
    distinct: ["participantId"],
    select: { participantId: true },
  });

  return apiSuccess({
    uniquePresent: uniquePresent.length,
    sessions: sessions.map((session) => ({
      id: session.id,
      name: session.name,
      location: session.location,
      active: session.active,
      startsAt: session.startsAt,
      scanCount: session._count.scans,
    })),
    recentScans,
  });
}
