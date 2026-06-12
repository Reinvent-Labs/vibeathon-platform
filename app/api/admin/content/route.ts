import { z } from "zod";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const contentSchema = z.record(z.string(), z.string());

export async function GET() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const rows = await prisma.siteContent.findMany();
  const content = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return apiSuccess(content);
}

export async function PUT(request: Request) {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const body = await readJson<unknown>(request);
  const parsed = contentSchema.safeParse(body);
  if (!parsed.success) return apiError("Données invalides.");

  await Promise.all(
    Object.entries(parsed.data).map(([key, value]) =>
      prisma!.siteContent.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      }),
    ),
  );

  return apiSuccess({ updated: Object.keys(parsed.data).length });
}
