import { z } from "zod";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/cms-defaults";

const templateSchema = z.object({
  subject: z.string().trim().min(2).max(200),
  eyebrow: z.string().trim().min(1).max(80),
  title: z.string().trim().min(2).max(120),
  introduction: z.string().trim().min(10).max(600),
  bodyHtml: z.string().max(20_000),
  actionLabel: z.string().max(80),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const { slug } = await params;
  const def = DEFAULT_EMAIL_TEMPLATES.find((t) => t.slug === slug);
  if (!def) return apiError("Template introuvable.", 404);

  const saved = await prisma.emailTemplate.findUnique({ where: { slug } });
  return apiSuccess({ ...def, ...(saved ?? {}), isCustomized: !!saved });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const { slug } = await params;
  const def = DEFAULT_EMAIL_TEMPLATES.find((t) => t.slug === slug);
  if (!def) return apiError("Template introuvable.", 404);

  const body = await readJson<unknown>(request);
  const parsed = templateSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Données invalides.");

  const data = { ...parsed.data, label: def.label };
  const template = await prisma.emailTemplate.upsert({
    where: { slug },
    create: { slug, ...data },
    update: data,
  });

  return apiSuccess(template);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const { slug } = await params;
  await prisma.emailTemplate.deleteMany({ where: { slug } });
  return apiSuccess({ reset: true });
}
