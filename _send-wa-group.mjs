/**
 * Send WhatsApp group invite link to all accepted participants (SELECTED/CONFIRMED/CHECKED_IN)
 * Usage: node /app/_send-wa-group.mjs [--dry-run]
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

function loadEnv() {
  try {
    const raw = readFileSync(join(__dir, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 1) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {}
}
loadEnv();

const SMTP_HOST  = process.env.SMTP_HOST;
const SMTP_USER  = process.env.SMTP_USER;
const SMTP_PASS  = process.env.SMTP_PASSWORD;
const SMTP_PORT  = Number(process.env.SMTP_PORT ?? 587);
const EMAIL_FROM = process.env.EMAIL_FROM ?? "VIBEATHON CI <contact@vibeathonci.com>";
const DB_URL     = process.env.DATABASE_URL;
const ADMIN_EMAIL = process.env.NOTIFICATION_BCC_EMAIL ?? "salomondiei08@gmail.com";

const WA_GROUP = "https://chat.whatsapp.com/GLjzbwijGTl9ZmgGKzyVcN";

function buildHtml(name) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#111;border-radius:16px;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#1ed760,#7c3aed,#ff4d8d);padding:2px">
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#111;border-radius:14px;padding:36px 40px">

            <div style="text-align:center;margin-bottom:28px">
              <span style="font-size:28px;font-weight:900;background:linear-gradient(90deg,#1ed760,#7c3aed);-webkit-background-clip:text;-webkit-text-fill-color:transparent">VIBEATHON</span>
              <span style="font-size:28px;font-weight:900;color:#fff"> 2026</span>
            </div>

            <p style="margin:0 0 16px;font-size:17px;color:#f5f5f5">Bonjour <strong>${name}</strong>,</p>

            <p style="margin:0 0 20px;font-size:15px;color:#b0b0b0;line-height:1.7">
              Tu fais partie des participants officiellement acceptés au <strong style="color:#f5f5f5">VIBEATHON 2026</strong> 🎉
            </p>

            <p style="margin:0 0 20px;font-size:15px;color:#b0b0b0;line-height:1.7">
              Rejoins le groupe WhatsApp officiel des participants pour recevoir toutes les informations en temps réel — programme, équipes, rappels et annonces importantes.
            </p>

            <div style="text-align:center;margin:32px 0">
              <a href="${WA_GROUP}"
                 style="display:inline-block;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;text-decoration:none;padding:16px 40px;border-radius:10px;font-weight:700;font-size:16px">
                💬 Rejoindre le groupe WhatsApp →
              </a>
            </div>

            <p style="margin:0 0 8px;font-size:13px;color:#666;text-align:center">
              Lien : <a href="${WA_GROUP}" style="color:#1ed760;word-break:break-all">${WA_GROUP}</a>
            </p>

            <p style="margin:28px 0 0;font-size:14px;color:#808080">
              À très vite,<br>
              <strong style="color:#f5f5f5">L'équipe VIBEATHON Côte d'Ivoire</strong>
            </p>

          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildText(name) {
  return `Bonjour ${name},

Tu fais partie des participants officiellement acceptés au VIBEATHON 2026 !

Rejoins le groupe WhatsApp officiel des participants pour recevoir toutes les informations en temps réel :

${WA_GROUP}

À très vite,
L'équipe VIBEATHON Côte d'Ivoire`;
}

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`\n💬  VIBEATHON — Envoi lien groupe WhatsApp aux acceptés`);
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const { rows } = await client.query(`
    SELECT id, "fullName", email, reference, status
    FROM "Participant"
    WHERE status IN ('SELECTED','CONFIRMED','CHECKED_IN')
      AND (category IS NULL OR category != 'VISITEUR')
    ORDER BY "fullName"
  `);
  await client.end();

  console.log(`   ${rows.length} participants acceptés trouvés\n`);

  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: false, requireTLS: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  let ok = 0, fail = 0;

  for (const p of rows) {
    process.stdout.write(`── ${p.reference}  ${p.fullName} <${p.email}> … `);
    if (DRY_RUN) { console.log("DRY"); ok++; continue; }

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await transport.sendMail({
          from: EMAIL_FROM,
          to: p.email,
          subject: "💬 Rejoins le groupe WhatsApp VIBEATHON 2026",
          text: buildText(p.fullName),
          html: buildHtml(p.fullName),
        });
        console.log("✅");
        ok++;
        await delay(3000);
        break;
      } catch (e) {
        if (e.message?.includes("atelimit") && attempt === 1) {
          process.stdout.write(`⏳ rate-limit — pause 65s … `);
          await delay(65000);
        } else {
          console.log(`❌ ${e.message}`);
          fail++;
          break;
        }
      }
    }
  }

  console.log(`\n════════════════════════════════════════`);
  console.log(`✅ ${ok}  ❌ ${fail}`);

  if (!DRY_RUN && ADMIN_EMAIL) {
    await transport.sendMail({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `[VIBEATHON] Lien groupe WA envoyé — ${ok} emails`,
      text: `Envoi terminé.\n✅ ${ok}  ❌ ${fail}\nTotal: ${rows.length} participants`,
    });
  }

  console.log("Done.");
}

main().catch(e => { console.error(e); process.exit(1); });
