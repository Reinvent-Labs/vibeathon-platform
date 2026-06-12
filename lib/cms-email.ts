import { DEFAULT_EMAIL_TEMPLATES } from "@/lib/cms-defaults";
import {
  interpolateTemplate,
  renderEmailTemplate,
  type TemplateVars,
} from "@/lib/cms-renderer";
import { prisma } from "@/lib/prisma";

export type CmsEmailSlug =
  | "competitionSelected"
  | "competitionWaitlist"
  | "competitionRejected"
  | "paymentConfirmed"
  | "badgeReady"
  | "paymentReminder";

/**
 * Render the customized database template when present, with the committed
 * template as a reliable fallback for bootstrap and database outages.
 */
export async function renderCmsEmail(slug: CmsEmailSlug, vars: TemplateVars) {
  const fallback = DEFAULT_EMAIL_TEMPLATES.find(
    (template) => template.slug === slug,
  );
  if (!fallback) throw new Error(`Unknown email template: ${slug}`);

  const saved = prisma
    ? await prisma.emailTemplate
        .findUnique({ where: { slug } })
        .catch(() => null)
    : null;
  const template = { ...fallback, ...(saved ?? {}) };
  const subject = interpolateTemplate(template.subject, vars);
  const introduction = interpolateTemplate(template.introduction, vars);
  const bodyText = interpolateTemplate(template.bodyHtml, vars)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    subject,
    html: renderEmailTemplate(template, vars),
    text: [introduction, bodyText].filter(Boolean).join("\n\n"),
  };
}
