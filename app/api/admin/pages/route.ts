import { apiError, apiSuccess, readJson } from "@/lib/api";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const pageSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug: lettres minuscules, chiffres et tirets uniquement."),
  title: z.string().min(1).max(200),
  description: z.string().max(500).default(""),
  content: z.string().max(200_000).default(""),
  published: z.boolean().default(false),
});

export async function GET() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const pages = await (prisma as any).sitePage.findMany({ orderBy: { updatedAt: "desc" } });
  return apiSuccess(pages);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const body = await readJson(request);
  const parsed = pageSchema.safeParse(body);
  if (!parsed.success) return apiError("Données invalides.");

  const existing = await (prisma as any).sitePage.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) return apiError("Ce slug est déjà utilisé.", 409);

  const page = await (prisma as any).sitePage.create({ data: parsed.data });
  return apiSuccess(page);
}
