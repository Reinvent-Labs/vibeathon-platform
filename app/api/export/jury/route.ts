import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return new Response("Non autorisé.", { status: 401 });
  }
  if (!prisma) return new Response("Base de données indisponible.", { status: 503 });

  const [juryMembers, teams] = await Promise.all([
    prisma.adminUser.findMany({
      where: { role: "JURY", active: true },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.team.findMany({
      where: { competition: { slug: "vibeathon-2026" }, isFinalist: true },
      select: {
        id: true,
        name: true,
        rank: true,
        aiEvaluation: { select: { score: true } },
        scores: {
          where: { lockedAt: { not: null } },
          select: { juryId: true, score: true },
        },
      },
    }),
  ]);

  const header = [
    "Équipe",
    "Classement final",
    "Score IA (Phase 1)",
    "Moyenne jury",
    ...juryMembers.map((j) => j.fullName),
  ];

  const rows = teams
    .map((team) => {
      const juryTotals = new Map<string, number>();
      for (const s of team.scores) juryTotals.set(s.juryId, (juryTotals.get(s.juryId) ?? 0) + s.score);
      const average =
        juryTotals.size === 0 ? null : Math.round(([...juryTotals.values()].reduce((a, b) => a + b, 0) / juryTotals.size) * 10) / 10;
      return {
        row: [
          team.name,
          team.rank ?? "",
          team.aiEvaluation?.score ?? "",
          average ?? "",
          ...juryMembers.map((j) => juryTotals.get(j.id) ?? ""),
        ],
        rank: team.rank ?? Number.MAX_SAFE_INTEGER,
        average: average ?? -1,
      };
    })
    .sort((a, b) => a.rank - b.rank || b.average - a.average)
    .map((r) => r.row);

  return csvResponse(toCsv(header, rows), "jury-notes-vibeathon-2026.csv");
}
