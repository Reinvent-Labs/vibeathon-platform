import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET() {
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return new Response("Non autorisé.", { status: 401 });
  }
  if (!prisma) return new Response("Base de données indisponible.", { status: 503 });

  const scans = await prisma.scanRecord.findMany({
    where: { result: "ACCEPTED", session: { competition: { slug: "vibeathon-2026" } } },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      participant: { select: { fullName: true, reference: true, category: true } },
      session: { select: { name: true } },
    },
  });

  const header = ["Date/Heure", "Session", "Participant", "Référence", "Catégorie"];
  const rows = scans.map((scan) => [
    scan.createdAt.toISOString(),
    scan.session.name,
    scan.participant?.fullName ?? "",
    scan.participant?.reference ?? "",
    scan.participant?.category ?? "",
  ]);
  return csvResponse(toCsv(header, rows), "presence-vibeathon-2026.csv");
}
