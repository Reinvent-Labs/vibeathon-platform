import { apiError, apiSuccess } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/cms-defaults";

export async function GET() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const saved = await prisma.emailTemplate.findMany();
  const savedMap = Object.fromEntries(saved.map((t) => [t.slug, t]));

  const templates = DEFAULT_EMAIL_TEMPLATES.map((def) => ({
    ...def,
    ...(savedMap[def.slug] ?? {}),
    isCustomized: !!savedMap[def.slug],
  }));

  return apiSuccess(templates);
}
