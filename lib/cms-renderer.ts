import { EVENT } from "@/lib/constants";
import { sanitizeEmailBody } from "@/lib/cms-security";

type TemplateVars = {
  name: string;
  appUrl: string;
  statusUrl?: string;
  badgeUrl?: string;
  reference?: string;
  categoryLabel?: string;
};

type TemplateLike = {
  eyebrow: string;
  title: string;
  introduction: string;
  bodyHtml: string;
  actionLabel: string;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[c]!,
  );
}

function interpolate(text: string, vars: TemplateVars) {
  return text
    .replace(/\{\{name\}\}/g, vars.name)
    .replace(/\{\{appUrl\}\}/g, vars.appUrl)
    .replace(/\{\{statusUrl\}\}/g, vars.statusUrl ?? vars.appUrl)
    .replace(/\{\{badgeUrl\}\}/g, vars.badgeUrl ?? vars.appUrl)
    .replace(/\{\{reference\}\}/g, vars.reference ?? "")
    .replace(/\{\{categoryLabel\}\}/g, vars.categoryLabel ?? "");
}

export function renderEmailTemplate(tpl: TemplateLike, vars: TemplateVars): string {
  const safeAppUrl = escapeHtml(vars.appUrl.replace(/\/$/, ""));
  const eyebrow = escapeHtml(interpolate(tpl.eyebrow, vars));
  const title = escapeHtml(interpolate(tpl.title, vars));
  const introduction = escapeHtml(interpolate(tpl.introduction, vars));
  const bodyHtml = sanitizeEmailBody(interpolate(tpl.bodyHtml, vars));
  const hasAction = tpl.actionLabel.trim().length > 0;
  const actionUrl = vars.statusUrl ?? vars.badgeUrl ?? vars.appUrl;

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${title}</title>
  </head>
  <body style="margin:0;background:#050807;color:#f4f7f5;font-family:Inter,Arial,sans-serif">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${introduction}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050807;padding:28px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border:1px solid #25302c;border-radius:24px;overflow:hidden;background:#0d1512">
            <tr>
              <td style="padding:30px 34px 22px;border-bottom:1px solid #25302c">
                <img src="${safeAppUrl}/logo-white.png" width="190" alt="VIBEATHON 2026" style="display:block;width:190px;max-width:65%;height:auto">
              </td>
            </tr>
            <tr>
              <td style="padding:38px 34px 16px">
                <p style="margin:0 0 14px;color:#ba77ff;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase">${eyebrow}</p>
                <h1 style="margin:0;font-family:'Arial Narrow',Arial,sans-serif;font-size:42px;line-height:1.02;letter-spacing:-1px;text-transform:uppercase;color:#ffffff">${title}</h1>
                <div style="width:100%;height:6px;margin:24px 0;background:linear-gradient(90deg,#07851d,#ba77ff,#ef53d9);border-radius:99px"></div>
                <p style="margin:0;color:#c9d1ce;font-size:17px;line-height:1.65">${introduction}</p>
              </td>
            </tr>
            ${bodyHtml ? `<tr><td style="padding:12px 34px 6px;color:#c9d1ce;font-size:15px;line-height:1.7">${bodyHtml}</td></tr>` : ""}
            ${
              hasAction
                ? `<tr>
                    <td style="padding:28px 34px 40px">
                      <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:15px 24px;border-radius:999px;background:linear-gradient(90deg,#07851d,#832edc,#ef53d9);color:#ffffff;text-decoration:none;font-size:15px;font-weight:800">${escapeHtml(tpl.actionLabel)} →</a>
                    </td>
                  </tr>`
                : ""
            }
            <tr>
              <td style="padding:24px 34px;border-top:1px solid #25302c;background:#09100d;color:#8d9a95;font-size:13px;line-height:1.6">
                <strong style="color:#f4f7f5">${EVENT.date}</strong><br>
                ${EVENT.venue}<br>
                <a href="mailto:contact@vibeathonci.com" style="color:#ba77ff;text-decoration:none">contact@vibeathonci.com</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
