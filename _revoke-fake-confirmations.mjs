/**
 * Revoke fake confirmations: participants marked CONFIRMED but who never paid.
 * 1. Revert status CONFIRMED → SELECTED, clear confirmedAt
 * 2. Send correction email (badge invalid, payment required)
 *
 * Usage:
 *   node /app/_revoke-fake-confirmations.mjs [--dry-run]
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
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /**/ }
}
loadEnv();

const APP_URL   = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vibeathonci.com").replace(/\/$/, "");
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASSWORD;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const EMAIL_FROM = process.env.EMAIL_FROM ?? "VIBEATHON CI <contact@vibeathonci.com>";
const BCC_EMAIL  = process.env.NOTIFICATION_BCC_EMAIL;
const DB_URL     = process.env.DATABASE_URL;

// Test accounts to never touch
const SKIP_EMAILS = new Set(["test@example.com", "salomondiei08@gmail.com"]);

// ── 1. Fetch & revert ─────────────────────────────────────────────────────────
async function getAndRevertFakeConfirmed(client) {
  // Fetch first
  const { rows } = await client.query(`
    SELECT id, reference, "fullName", email, phone, "qrCode"
    FROM "Participant"
    WHERE status = 'CONFIRMED'
      AND "paidAt" IS NULL
    ORDER BY "confirmedAt"
  `);

  const targets = rows.filter(r => !SKIP_EMAILS.has(r.email));

  console.log(`\n   Found ${rows.length} CONFIRMED without paidAt`);
  console.log(`   Skipping ${rows.length - targets.length} test accounts`);
  console.log(`   Will revert ${targets.length} to SELECTED\n`);

  if (targets.length === 0) return targets;

  if (!DRY_RUN) {
    const ids = targets.map((_, i) => `$${i + 1}`).join(",");
    await client.query(`
      UPDATE "Participant"
      SET status = 'SELECTED', "confirmedAt" = NULL
      WHERE id IN (${ids})
        AND status = 'CONFIRMED'
        AND "paidAt" IS NULL
    `, targets.map(t => t.id));
    console.log(`   ✅ DB reverted: ${targets.length} rows → SELECTED\n`);
  } else {
    console.log(`   [DRY] Would revert ${targets.length} rows → SELECTED\n`);
  }

  return targets;
}

// ── 2. Send correction email ──────────────────────────────────────────────────
async function sendCorrectionEmail(transport, p) {
  const statusUrl = `${APP_URL}/statut?email=${encodeURIComponent(p.email)}`;

  const subject = `⚠️ Correction importante — Ton badge VIBEATHON 2026`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050807;font-family:Inter,Arial,sans-serif;color:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050807">
    <tr><td align="center" style="padding:32px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#101410;border-radius:16px;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:3px">
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#101410;border-radius:14px;padding:32px">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#f59e0b">VIBEATHON 2026 — ACTION REQUISE</p>
            <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#f5f5f5">Correction importante ⚠️</h1>

            <p style="margin:0 0 16px;font-size:16px;color:#b0b0b0">Bonjour <strong style="color:#f5f5f5">${p.fullName}</strong>,</p>

            <p style="margin:0 0 20px;font-size:16px;color:#b0b0b0">
              Suite à une erreur technique de notre plateforme, tu as reçu un e-mail de confirmation et un badge QR alors que ton paiement n'avait pas encore été enregistré.
            </p>

            <div style="background:#1a0a00;border:1px solid #f59e0b;border-radius:8px;padding:16px 20px;margin:0 0 24px">
              <p style="margin:0;font-size:15px;color:#fbbf24;font-weight:700">⚠️ Ton ancien badge est désormais invalide.</p>
              <p style="margin:8px 0 0;font-size:14px;color:#b0b0b0">
                Le code QR envoyé précédemment ne permettra pas l'accès à l'événement.
              </p>
            </div>

            <p style="margin:0 0 16px;font-size:16px;color:#b0b0b0">
              <strong style="color:#f5f5f5">Bonne nouvelle :</strong> ta candidature est toujours sélectionnée 🎉
              Tu fais partie des candidats retenus pour participer au VIBEATHON 2026.
            </p>

            <p style="margin:0 0 24px;font-size:16px;color:#b0b0b0">
              Pour valider ta place et recevoir ton vrai badge d'entrée, il te suffit de régler les frais de participation via ton espace candidat :
            </p>

            <div style="text-align:center;margin:0 0 32px">
              <a href="${statusUrl}"
                 style="display:inline-block;background:linear-gradient(135deg,#1ed760,#7c3aed);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px">
                Accéder à mon espace & payer →
              </a>
            </div>

            <div style="background:#0a120a;border:1px solid #1ed760;border-radius:8px;padding:16px 20px;margin:0 0 24px">
              <p style="margin:0 0 4px;font-size:13px;color:#1ed760;font-weight:700">TA RÉFÉRENCE</p>
              <p style="margin:0;font-size:18px;font-weight:900;color:#f5f5f5;letter-spacing:1px">${p.reference}</p>
            </div>

            <p style="margin:0 0 16px;font-size:14px;color:#808080">
              Nous nous excusons sincèrement pour cette confusion. C'est une erreur de notre part et nous avons corrigé le problème.
            </p>
            <p style="margin:0 0 32px;font-size:14px;color:#808080">
              Pour toute question, réponds directement à cet e-mail.<br>
              <strong style="color:#f5f5f5">L'équipe VIBEATHON CI</strong>
            </p>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Bonjour ${p.fullName},

Suite à une erreur technique, tu as reçu un badge QR VIBEATHON 2026 alors que ton paiement n'avait pas encore été enregistré.

⚠️ Ton ancien badge est désormais INVALIDE. Il ne permettra pas l'accès à l'événement.

Bonne nouvelle : ta candidature est toujours sélectionnée !

Pour valider ta place et recevoir ton vrai badge, règle les frais de participation ici :
${statusUrl}

Ta référence : ${p.reference}

Nous nous excusons pour cette confusion.
L'équipe VIBEATHON CI`;

  if (DRY_RUN) {
    console.log(`   [DRY EMAIL] → ${p.email}`);
    return;
  }

  const bcc = BCC_EMAIL ? [BCC_EMAIL] : undefined;
  await transport.sendMail({ from: EMAIL_FROM, to: p.email, bcc, subject, text, html });
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔒  VIBEATHON — Revoking fake confirmations`);
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
  console.log(`   App URL: ${APP_URL}`);

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();

  const targets = await getAndRevertFakeConfirmed(client);
  await client.end();

  if (targets.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  let sent = 0, failed = 0;

  for (const p of targets) {
    process.stdout.write(`── ${p.reference}  ${p.fullName} (${p.email})\n   📧 … `);
    try {
      await sendCorrectionEmail(transport, p);
      console.log("✅");
      sent++;
    } catch (e) {
      console.log(`❌ ${e.message}`);
      failed++;
    }
  }

  console.log(`\n════════════════════════════════`);
  if (DRY_RUN) console.log(`DRY RUN — ${targets.length} would be processed.`);
  else console.log(`Done. ✅ ${sent} emails envoyés  ❌ ${failed} échoués`);
}

main().catch(err => { console.error(err); process.exit(1); });
