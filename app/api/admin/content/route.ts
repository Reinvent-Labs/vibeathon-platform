import { z } from "zod";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { requestIp, writeAuditLog } from "@/lib/audit";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { DEFAULT_SITE_CONTENT } from "@/lib/cms-defaults";
import { invalidateSiteContentCache } from "@/lib/site-content";
import { prisma } from "@/lib/prisma";

const allowedKeys = new Set([
  ...Object.keys(DEFAULT_SITE_CONTENT),
  "image.hero",
  "image.about",
  "image.organizer",
  // Allow extra numbered schedule/activity slots beyond defaults
  ...[...Array(9)].flatMap((_, i) => [
    `schedule.${i + 1}.time`,
    `schedule.${i + 1}.title`,
    `schedule.${i + 1}.desc`,
  ]),
]);
const contentSchema = z
  .record(z.string().min(1).max(80), z.string().max(10_000))
  .refine(
    (content) => Object.keys(content).every((key) => allowedKeys.has(key)),
    "Clé de contenu inconnue.",
  );

export async function GET() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const rows = await prisma.siteContent.findMany();
  const content = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return apiSuccess(content);
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
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
  await writeAuditLog({
    actorId: user.userId,
    action: "SITE_CONTENT_UPDATED",
    entityType: "SiteContent",
    ipAddress: requestIp(request),
    metadata: { fields: Object.keys(parsed.data).length },
  });

  invalidateSiteContentCache();
  return apiSuccess({ updated: Object.keys(parsed.data).length });
}
