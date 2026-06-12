import { apiError, apiSuccess } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const filtersSchema = z.object({
  sessionId: z.string().min(1).optional(),
  category: z
    .enum(["HACKATHON", "VISITEUR", "FORMATION_ADULTE", "FORMATION_KIDS"])
    .optional(),
});

export async function GET(request: Request) {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  if (!prisma) return apiError("Base de données indisponible.", 503);
  const url = new URL(request.url);
  const parsed = filtersSchema.safeParse({
    sessionId: url.searchParams.get("sessionId") || undefined,
    category: url.searchParams.get("category") || undefined,
  });
  if (!parsed.success) return apiError("Filtres de présence invalides.");
  const scanFilters = {
    result: "ACCEPTED" as const,
    session: {
      competition: { slug: "vibeathon-2026" },
      ...(parsed.data.sessionId ? { id: parsed.data.sessionId } : {}),
    },
    ...(parsed.data.category
      ? { participant: { category: parsed.data.category } }
      : {}),
  };

  const [sessions, presenceRows] = await Promise.all([
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
        allowedCategories: true,
        _count: {
          select: {
            scans: { where: { result: "ACCEPTED" } },
          },
        },
      },
    }),
    prisma.scanRecord.findMany({
      where: scanFilters,
      orderBy: { createdAt: "desc" },
      take: 1_000,
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
      ...scanFilters,
      participantId: { not: null },
    },
    distinct: ["participantId"],
    select: { participantId: true },
  });

  return apiSuccess({
    uniquePresent: uniquePresent.length,
    totalRecords: presenceRows.length,
    categoryCounts: presenceRows.reduce<Record<string, number>>((counts, scan) => {
      const category = scan.participant?.category;
      if (category) counts[category] = (counts[category] ?? 0) + 1;
      return counts;
    }, {}),
    sessions: sessions.map((session) => ({
      id: session.id,
      name: session.name,
      location: session.location,
      active: session.active,
      startsAt: session.startsAt,
      scanCount: session._count.scans,
      allowedCategories: session.allowedCategories,
    })),
    presenceRows,
  });
}
