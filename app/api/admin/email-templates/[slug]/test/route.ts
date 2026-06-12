import { z } from "zod";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";
import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/cms-defaults";
import { renderEmailTemplate } from "@/lib/cms-renderer";

const testSchema = z.object({
  to: z.string().email(),
});

export async function POST(
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
  const parsed = testSchema.safeParse(body);
  if (!parsed.success) return apiError("Adresse email invalide.");

  const saved = await prisma.emailTemplate.findUnique({ where: { slug } });
  const tpl = { ...def, ...(saved ?? {}) };

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const html = renderEmailTemplate(tpl, {
    name: user.fullName,
    appUrl,
    statusUrl: `${appUrl}/statut`,
    badgeUrl: `${appUrl}/badge/exemple`,
    reference: "VBT-TEST-2026",
    categoryLabel: "Pass Visiteur",
  });

  const result = await sendEmail({
    to: parsed.data.to,
    subject: `[TEST] ${tpl.subject}`,
    html,
    text: tpl.introduction.replace(/{{name}}/g, user.fullName),
    template: `cms_test_${slug}`,
  });

  if (result.status === "FAILED") {
    return apiError(`Envoi échoué : ${result.error}`, 502);
  }

  return apiSuccess({ sent: true, to: parsed.data.to, status: result.status });
}
