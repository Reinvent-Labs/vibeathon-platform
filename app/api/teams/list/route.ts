import { apiError, apiSuccess } from "@/lib/api";
import { prisma } from "@/lib/prisma";

// Public endpoint — returns team names for the submission dropdown.
// Called during the hackathon from the /soumettre page.
export async function GET() {
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const teams = await prisma.team.findMany({
    where: {
      competition: { slug: "vibeathon-2026" },
      members: { some: {} },
    },
    select: {
      id: true,
      name: true,
      tableNumber: true,
    },
    orderBy: { name: "asc" },
  });

  return apiSuccess(
    teams.map((t) => ({
      id: t.id,
      name: t.name,
      label: t.tableNumber ? `${t.name} (Table ${t.tableNumber})` : t.name,
    })),
  );
}
