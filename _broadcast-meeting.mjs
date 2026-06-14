/**
 * Broadcast the Monday 16 June Zoom meeting invitation to all
 * SELECTED + WAITLIST candidates (non-VISITEUR categories).
 *
 * Usage:
 *   node /app/_broadcast-meeting.mjs --dry-run        # preview, no send
 *   node /app/_broadcast-meeting.mjs --test           # send only to test recipients
 *   node /app/_broadcast-meeting.mjs                  # send to all (live)
 *
 * Run inside the Docker container:
 *   docker exec vibeathon-platform-app-1 node /app/_broadcast-meeting.mjs --test
 *   docker exec vibeathon-platform-app-1 node /app/_broadcast-meeting.mjs
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");
const TEST_ONLY = process.argv.includes("--test");

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

const APP_URL    = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.vibeathonci.com").replace(/\/$/, "");
const SMTP_HOST  = process.env.SMTP_HOST;
const SMTP_USER  = process.env.SMTP_USER;
const SMTP_PASS  = process.env.SMTP_PASSWORD;
const SMTP_PORT  = Number(process.env.SMTP_PORT ?? 587);
const EMAIL_FROM = process.env.EMAIL_FROM ?? "VIBEATHON CI <contact@vibeathonci.com>";
const BCC_EMAIL  = process.env.NOTIFICATION_BCC_EMAIL;
const DB_URL     = process.env.DATABASE_URL;
const WA_TOKEN    = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_VERSION  = process.env.WHATSAPP_API_VERSION ?? "v21.0";

// ── Test recipients (--test mode) ─────────────────────────────────────────────
const TEST_EMAIL_RECIPIENTS = ["salomondiei08@gmail.com"];
const TEST_WA_RECIPIENTS    = ["2250788138332", "2250787668486"];

// ── Meeting details ────────────────────────────────────────────────────────────
const ZOOM_URL  = "https://us06web.zoom.us/j/81833019045?pwd=oCwOxonqbMGnb9fhjyJl0ue3KoAoqG.1";
const MEETING   = { date: "Lundi 16 juin 2026", time: "De 19h00 à 21h00" };

// ── Phone normalize ────────────────────────────────────────────────────────────
function normalize(phone) {
  let d = phone.replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("0")) d = `225${d.slice(1)}`;
  if (d.length === 13 && d.startsWith("2250")) d = `225${d.slice(4)}`;
  return d;
}

// ── Fetch candidates ──────────────────────────────────────────────────────────
async function getCandidates() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const { rows } = await client.query(`
    SELECT id, "fullName", email, phone, reference, status, category
    FROM "Participant"
    WHERE status IN ('SELECTED', 'WAITLIST')
      AND category != 'VISITEUR'
    ORDER BY status, "fullName"
  `);
  await client.end();
  return rows;
}

// ── Email HTML ─────────────────────────────────────────────────────────────────
function buildEmailHtml(name, statusLabel) {
  const statusUrl = `${APP_URL}/statut`;
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050807;font-family:Inter,Arial,sans-serif;color:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050807">
    <tr><td align="center" style="padding:32px 16px">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0d150d;border-radius:16px;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#1ed760,#7c3aed,#ec4899);padding:3px">
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#0d150d;border-radius:14px;padding:32px">

            <p style="margin:0 0 8px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#1ed760">VIBEATHON 2026 — INFORMATION IMPORTANTE</p>
            <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#f5f5f5">Réunion d'information en ligne 📡</h1>

            <p style="margin:0 0 20px;font-size:16px;color:#b0b0b0">Bonjour <strong style="color:#f5f5f5">${name}</strong>,</p>

            <p style="margin:0 0 20px;font-size:16px;color:#b0b0b0">
              Que vous soyez actuellement <strong style="color:#f5f5f5">${statusLabel}</strong>, nous vous invitons à participer à une réunion d'information en ligne afin de vous présenter les prochaines étapes du programme et de répondre à toutes vos questions.
            </p>

            <div style="background:#0a1a0a;border:1px solid #1ed76055;border-radius:12px;padding:20px 24px;margin:0 0 28px">
              <p style="margin:0 0 4px;font-size:13px;color:#1ed760;font-weight:700;letter-spacing:1px">AU PROGRAMME</p>
              <ul style="margin:12px 0 0;padding-left:20px;color:#b0b0b0;font-size:15px;line-height:1.8">
                <li>Le processus de confirmation des candidatures</li>
                <li>Les modalités de paiement des frais de participation</li>
                <li>La constitution des équipes pour les candidats inscrits individuellement</li>
                <li>Le déroulement du bootcamp de préparation</li>
                <li>L'organisation de la compétition de Vibe Coding</li>
                <li>Les opportunités offertes aux participants</li>
                <li>Une séance de questions-réponses ouverte à tous</li>
              </ul>
            </div>

            <div style="background:#13001a;border:1px solid #7c3aed55;border-radius:12px;padding:20px 24px;margin:0 0 32px">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0">
                    <span style="font-size:20px">📅</span>
                    <span style="font-size:16px;color:#b0b0b0;margin-left:10px"><strong style="color:#f5f5f5">${MEETING.date}</strong></span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0">
                    <span style="font-size:20px">🕖</span>
                    <span style="font-size:16px;color:#b0b0b0;margin-left:10px"><strong style="color:#f5f5f5">${MEETING.time}</strong></span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0">
                    <span style="font-size:20px">🔗</span>
                    <span style="font-size:16px;color:#b0b0b0;margin-left:10px">Lien Zoom :</span>
                    <br>
                    <a href="${ZOOM_URL}" style="color:#7c3aed;font-size:14px;word-break:break-all">${ZOOM_URL}</a>
                  </td>
                </tr>
              </table>
            </div>

            <div style="text-align:center;margin:0 0 32px">
              <a href="${ZOOM_URL}"
                 style="display:inline-block;background:linear-gradient(135deg,#1ed760,#7c3aed);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px">
                Rejoindre la réunion Zoom →
              </a>
            </div>

            <p style="margin:0 0 16px;font-size:15px;color:#b0b0b0">
              Cette rencontre est importante et vous permettra d'obtenir toutes les informations nécessaires pour la suite du processus.
            </p>

            <p style="margin:0 0 8px;font-size:14px;color:#808080">
              Tu peux consulter ton statut à tout moment sur <a href="${statusUrl}" style="color:#1ed760">${statusUrl}</a>
            </p>

            <p style="margin:24px 0 0;font-size:14px;color:#808080">
              Au plaisir de vous retrouver en ligne.<br>
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

function buildEmailText(name, statusLabel) {
  return `Bonjour ${name},

Que vous soyez actuellement ${statusLabel}, nous vous invitons à une réunion d'information en ligne sur les prochaines étapes du VIBEATHON 2026.

Au programme :
- Le processus de confirmation des candidatures
- Les modalités de paiement des frais de participation
- La constitution des équipes
- Le déroulement du bootcamp de préparation
- L'organisation de la compétition de Vibe Coding
- Les opportunités offertes aux participants
- Séance de questions-réponses

📅 ${MEETING.date}
🕖 ${MEETING.time}
🔗 ${ZOOM_URL}

Au plaisir de vous retrouver en ligne.
L'équipe VIBEATHON Côte d'Ivoire`;
}

// ── WhatsApp message ───────────────────────────────────────────────────────────
function buildWAMessage(name) {
  return `Bonjour ${name} 👋

Tu es invité(e) à notre réunion d'information VIBEATHON 2026 en ligne !

📅 *${MEETING.date}*
🕖 *${MEETING.time}*

Au programme : confirmation des candidatures, modalités de paiement, constitution des équipes, bootcamp, compétition Vibe Coding & Q/R.

🔗 Zoom : ${ZOOM_URL}

On t'attend ! 💚
L'équipe VIBEATHON CI`;
}

// ── Send email ─────────────────────────────────────────────────────────────────
async function sendEmail(transport, p) {
  const statusLabel = p.status === "SELECTED"
    ? "sélectionné(e) en attente de paiement"
    : "sur liste d'attente";
  const subject = `📡 Réunion d'information VIBEATHON 2026 — ${MEETING.date}`;
  const html  = buildEmailHtml(p.fullName, statusLabel);
  const text  = buildEmailText(p.fullName, statusLabel);
  if (DRY_RUN) { console.log(`   [DRY EMAIL] → ${p.email}`); return; }
  const bcc = BCC_EMAIL ? [BCC_EMAIL] : undefined;
  await transport.sendMail({ from: EMAIL_FROM, to: p.email, bcc, subject, text, html });
}

// ── Send WhatsApp ──────────────────────────────────────────────────────────────
async function sendWhatsApp(phone, name) {
  const to = normalize(phone);
  const message = buildWAMessage(name);
  if (DRY_RUN) { console.log(`   [DRY WA] → ${to}`); return; }
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message, preview_url: false },
  };
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
  console.log(`\n📡  VIBEATHON — Broadcast: réunion d'information`);
  console.log(`   Mode: ${DRY_RUN ? "DRY RUN" : TEST_ONLY ? "TEST ONLY" : "LIVE"}\n`);

  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: false, requireTLS: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  let targets;

  if (TEST_ONLY) {
    // Send to test recipients only — use a fake participant record
    targets = TEST_EMAIL_RECIPIENTS.map((email, i) => ({
      id: `test-${i}`,
      fullName: "Test Candidat",
      email,
      phone: TEST_WA_RECIPIENTS[i] ?? TEST_WA_RECIPIENTS[0],
      reference: "VBT-2026-TEST",
      status: "SELECTED",
      category: "HACKATHON",
    }));
    console.log(`   Test recipients: ${TEST_EMAIL_RECIPIENTS.join(", ")}`);
    console.log(`   Test WA numbers: ${TEST_WA_RECIPIENTS.join(", ")}\n`);
  } else {
    targets = await getCandidates();
    const byStatus = targets.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] ?? 0) + 1;
      return acc;
    }, {});
    console.log(`   Found ${targets.length} candidates:`);
    Object.entries(byStatus).forEach(([s, n]) => console.log(`     ${s}: ${n}`));
    console.log();
  }

  let emailOk = 0, emailFail = 0, waOk = 0, waFail = 0;

  for (const p of targets) {
    console.log(`── ${p.status.padEnd(8)} ${p.reference ?? ""}  ${p.fullName} <${p.email}>`);

    // Email
    process.stdout.write(`   📧 Email … `);
    try {
      await sendEmail(transport, p);
      console.log("✅");
      emailOk++;
    } catch (e) {
      console.log(`❌ ${e.message}`);
      emailFail++;
    }

    // WhatsApp (to participant's number)
    process.stdout.write(`   💬 WhatsApp ${normalize(p.phone)} … `);
    try {
      const id = await sendWhatsApp(p.phone, p.fullName);
      console.log(DRY_RUN ? "DRY" : `✅ ${id ?? ""}`);
      waOk++;
    } catch (e) {
      console.log(`❌ ${e.message}`);
      waFail++;
    }

    // Extra WhatsApp to additional test numbers (test mode only)
    if (TEST_ONLY) {
      for (const testPhone of TEST_WA_RECIPIENTS) {
        const norm = normalize(testPhone);
        if (norm === normalize(p.phone)) continue; // skip if same
        process.stdout.write(`   💬 WhatsApp ${norm} (extra test) … `);
        try {
          const id = await sendWhatsApp(testPhone, p.fullName);
          console.log(DRY_RUN ? "DRY" : `✅ ${id ?? ""}`);
        } catch (e) {
          console.log(`❌ ${e.message}`);
        }
      }
    }

    console.log();
  }

  console.log("════════════════════════════════════════");
  if (DRY_RUN) {
    console.log(`DRY RUN — ${targets.length} candidates would receive the broadcast.`);
  } else {
    console.log(`Email  ✅ ${emailOk}  ❌ ${emailFail}`);
    console.log(`WA     ✅ ${waOk}  ❌ ${waFail}`);
    console.log(`Done.`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
