import { apiError, apiSuccess, readJson } from "@/lib/api";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  content: z.string().max(200_000).optional(),
  published: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const { id } = await params;
  const page = await (prisma as any).sitePage.findUnique({ where: { id } });
  if (!page) return apiError("Page introuvable.", 404);
  return apiSuccess(page);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const { id } = await params;
  const body = await readJson(request);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError("Données invalides.");

  const page = await (prisma as any).sitePage.update({ where: { id }, data: parsed.data });
  return apiSuccess(page);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(_req)) return apiError("Origine invalide.", 403);
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const { id } = await params;
  await (prisma as any).sitePage.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
