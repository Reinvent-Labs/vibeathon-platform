/**
 * One-shot: send badge email + WhatsApp to the 4 confirmed payers
 * who never received their badge due to the webhook timeout bug.
 *
 * Usage (run inside the app Docker container):
 *   node /app/_send-badges-4.mjs [--dry-run]
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

// ── Load .env ──────────────────────────────────────────────────────────────────
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
  } catch {
    console.warn("No .env file found — relying on environment variables.");
  }
}
loadEnv();

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vibeathonci.com").replace(/\/$/, "");
const WA_TOKEN    = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_VERSION  = process.env.WHATSAPP_API_VERSION ?? "v21.0";
const WA_TEMPLATE = process.env.WHATSAPP_TEMPLATE_PAYMENT ?? "vibeathon_paiement_confirme";
const DB_URL      = process.env.DATABASE_URL;
const SMTP_HOST   = process.env.SMTP_HOST;
const SMTP_USER   = process.env.SMTP_USER;
const SMTP_PASS   = process.env.SMTP_PASSWORD;
const SMTP_PORT   = Number(process.env.SMTP_PORT ?? 587);
const EMAIL_FROM  = process.env.EMAIL_FROM ?? "VIBEATHON CI <contact@vibeathonci.com>";
const BCC_EMAIL   = process.env.NOTIFICATION_BCC_EMAIL;

// ── Target participants ────────────────────────────────────────────────────────
const REFERENCES = ["VBT-2026-0300", "VBT-2026-0083", "VBT-2026-0090", "VBT-2026-0395"];

// ── Phone normalize ────────────────────────────────────────────────────────────
function normalize(phone) {
  let d = phone.replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("0")) d = `225${d}`;
  return d;
}

// ── Fetch participants ─────────────────────────────────────────────────────────
async function getParticipants() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const refs = REFERENCES.map((r, i) => `$${i + 1}`).join(",");
  const { rows } = await client.query(
    `SELECT id, "fullName", email, phone, reference, "qrCode", status
     FROM "Participant"
     WHERE reference IN (${refs})`,
    REFERENCES,
  );
  await client.end();
  return rows;
}

// ── QR code → buffer ───────────────────────────────────────────────────────────
async function qrBuffer(data) {
  const { default: QRCode } = await import("qrcode");
  return QRCode.toBuffer(data, { width: 480, margin: 1, color: { dark: "#050807", light: "#ffffff" } });
}

// ── Send email ─────────────────────────────────────────────────────────────────
async function sendEmail(participant, badgeUrl, qr) {
  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const subject = `🎉 Ton badge VIBEATHON 2026 est prêt — ${participant.reference}`;
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050807;font-family:Inter,Arial,sans-serif;color:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050807">
    <tr><td align="center" style="padding:32px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#101410;border-radius:16px;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#1ed760,#7c3aed,#ec4899);padding:3px">
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#101410;border-radius:14px;padding:32px 32px 0">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#1ed760">VIBEATHON 2026</p>
            <h1 style="margin:0 0 24px;font-size:28px;font-weight:900;color:#f5f5f5">Ton badge est prêt ! 🎉</h1>
            <p style="margin:0 0 16px;font-size:16px;color:#b0b0b0">Bonjour <strong style="color:#f5f5f5">${participant.fullName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:16px;color:#b0b0b0">
              Ton paiement a bien été confirmé. Voici ton badge QR pour accéder à l'événement le <strong style="color:#f5f5f5">samedi 11 juillet 2026</strong> au CSCTICAO, Abidjan.
            </p>
            <p style="margin:0 0 8px;font-size:13px;color:#b0b0b0">Référence : <strong style="color:#f5f5f5">${participant.reference}</strong></p>
            <div style="text-align:center;margin:24px 0">
              <img src="cid:vibeathon-qr" width="220" height="220" alt="QR code badge ${participant.reference}" style="border-radius:12px">
            </div>
            <div style="text-align:center;margin:0 0 32px">
              <a href="${badgeUrl}" style="display:inline-block;background:linear-gradient(135deg,#1ed760,#7c3aed);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px">
                Voir mon badge →
              </a>
            </div>
            <p style="margin:0 0 24px;font-size:14px;color:#808080;border-top:1px solid #1a1a1a;padding-top:16px">
              Tu peux aussi retrouver ton badge à tout moment sur <a href="${APP_URL}/statut?email=${encodeURIComponent(participant.email)}" style="color:#1ed760">${APP_URL}/statut</a>
            </p>
            <p style="margin:0 0 32px;font-size:14px;color:#808080">
              À samedi ! 🚀<br><strong style="color:#f5f5f5">L'équipe VIBEATHON CI</strong>
            </p>
          </td></tr></table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Bonjour ${participant.fullName},\n\nTon paiement a bien été confirmé. Ton badge VIBEATHON 2026 est prêt.\nRéférence : ${participant.reference}\n\nVoir le badge : ${badgeUrl}\n\nÀ samedi !\nL'équipe VIBEATHON CI`;

  if (DRY_RUN) {
    console.log(`  [DRY EMAIL] → ${participant.email}`);
    return;
  }

  const bcc = BCC_EMAIL ? [BCC_EMAIL] : undefined;
  await transport.sendMail({
    from: EMAIL_FROM,
    to: participant.email,
    bcc,
    subject,
    text,
    html,
    attachments: [{ filename: "badge-qr-vibeathon.png", content: qr, contentType: "image/png", cid: "vibeathon-qr" }],
  });
}

// ── Send WhatsApp ──────────────────────────────────────────────────────────────
async function sendWhatsApp(participant, badgeUrl) {
  const phone = normalize(participant.phone);
  const urlToken = badgeUrl.split("/").pop() ?? "";

  const body = {
    to: phone,
    messaging_product: "whatsapp",
    type: "template",
    template: {
      name: WA_TEMPLATE,
      language: { code: "fr" },
      components: [
        { type: "body", parameters: [{ type: "text", text: participant.fullName }, { type: "text", text: urlToken }] },
      ],
    },
  };

  if (DRY_RUN) {
    console.log(`  [DRY WA]    → ${phone}  template=${WA_TEMPLATE}  token=${urlToken}`);
    return { status: "DRY" };
  }

  const res = await fetch(`https://graph.facebook.com/${WA_VERSION}/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? String(res.status));
  return json?.messages?.[0]?.id;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏅  VIBEATHON — Sending badges to 4 confirmed payers`);
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

  const participants = await getParticipants();
  console.log(`   Found ${participants.length} participant(s) in DB\n`);

  for (const p of participants) {
    console.log(`── ${p.reference}  ${p.fullName}  (${p.status})`);

    if (!["PAID", "CONFIRMED", "CHECKED_IN"].includes(p.status)) {
      console.log(`   ⚠️  Status ${p.status} — skipping`);
      continue;
    }

    const badgeUrl = `${APP_URL}/badge/${encodeURIComponent(p.qrCode)}`;
    const qr = await qrBuffer(p.qrCode);

    // Email
    process.stdout.write(`   📧 Email → ${p.email} … `);
    try {
      await sendEmail(p, badgeUrl, qr);
      console.log("✅");
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }

    // WhatsApp
    process.stdout.write(`   💬 WhatsApp → ${normalize(p.phone)} … `);
    try {
      const id = await sendWhatsApp(p, badgeUrl);
      console.log(DRY_RUN ? "DRY" : `✅  ${id ?? ""}`);
    } catch (e) {
      console.log(`❌ ${e.message}`);
    }

    console.log();
  }

  console.log("════════════════════════════════");
  console.log("Done.");
}

main().catch(err => { console.error(err); process.exit(1); });
