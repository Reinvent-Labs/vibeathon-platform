/**
 * Broadcast "participation gratuite" email to all SELECTED candidates.
 *
 * Usage:
 *   node /app/_broadcast-gratuite.mjs --dry-run        # preview only
 *   node /app/_broadcast-gratuite.mjs --test           # send to test address only
 *   node /app/_broadcast-gratuite.mjs                  # live send to all SELECTED
 *
 * Retry-safe: set SENT_LOG env to a file path; already-sent emails are skipped.
 *   SENT_LOG=/tmp/gratuite-done.log node /app/_broadcast-gratuite.mjs
 */

import { readFileSync, appendFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir   = dirname(fileURLToPath(import.meta.url));
const DRY_RUN  = process.argv.includes("--dry-run");
const TEST_ONLY = process.argv.includes("--test");
const SENT_LOG  = process.env.SENT_LOG ?? "/tmp/gratuite-done.log";

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
  } catch { /**/ }
}
loadEnv();

const SMTP_HOST  = process.env.SMTP_HOST;
const SMTP_USER  = process.env.SMTP_USER;
const SMTP_PASS  = process.env.SMTP_PASSWORD;
const SMTP_PORT  = Number(process.env.SMTP_PORT ?? 587);
const EMAIL_FROM = process.env.EMAIL_FROM ?? "VIBEATHON CI <contact@vibeathonci.com>";
const DB_URL     = process.env.DATABASE_URL;

const TEST_RECIPIENTS = ["salomondiei08@gmail.com"];

function sentSet() {
  if (!existsSync(SENT_LOG)) return new Set();
  return new Set(readFileSync(SENT_LOG, "utf8").split("\n").map(l => l.trim()).filter(Boolean));
}

function markSent(email) {
  appendFileSync(SENT_LOG, email + "\n");
}

async function getCandidates() {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  const { rows } = await client.query(`
    SELECT id, "fullName", email, reference, status
    FROM "Participant"
    WHERE status = 'SELECTED'
      AND (category IS NULL OR category != 'VISITEUR')
    ORDER BY "fullName"
  `);
  await client.end();
  return rows;
}

function buildEmail(name) {
  const firstName = name.split(/\s+/)[0];

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Participation gratuite — VIBEATHON CI</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 20px">
<tr><td align="center">
<table width="100%" style="max-width:600px">
  <tr><td>
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#00ff88,#7c3aed,#ff0080);padding:3px;border-radius:16px;margin-bottom:28px">
      <div style="background:#0f0f0f;border-radius:14px;padding:32px 36px;text-align:center">
        <p style="margin:0 0 8px;font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#666">VIBEATHON Côte d'Ivoire 2026</p>
        <h1 style="margin:0;font-size:26px;font-weight:900;background:linear-gradient(135deg,#00ff88,#7c3aed,#ff0080);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">Bonne nouvelle !</h1>
      </div>
    </div>

    <!-- Body -->
    <div style="background:#111;border:1px solid #1a1a1a;border-radius:12px;padding:32px 36px;color:#c8c8c8;font-size:15px;line-height:1.75">
      <p style="margin:0 0 20px">Bonsoir ${firstName},</p>

      <p style="margin:0 0 20px">Nous avons une excellente nouvelle à partager avec vous !</p>

      <p style="margin:0 0 20px">Grâce au soutien d'un partenaire engagé aux côtés du VIBEATHON Côte d'Ivoire, les frais de participation à la compétition de Vibe Coding sont désormais <strong style="color:#00ff88">entièrement pris en charge</strong>.</p>

      <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-left:4px solid #00ff88;border-radius:8px;padding:20px 24px;margin:24px 0">
        <p style="margin:0;font-size:17px;font-weight:700;color:#fff">La participation à la compétition devient <span style="color:#00ff88">gratuite</span> pour les 100 candidats sélectionnés.</p>
      </div>

      <p style="margin:0 0 20px">Pour les participants ayant déjà effectué leur paiement, un remboursement intégral sera effectué dans les prochains jours selon les modalités qui leur seront communiquées.</p>

      <p style="margin:0 0 20px">Par ailleurs, dans le cadre de la confirmation définitive des participants, nous avons constaté que certaines personnes sélectionnées se sont désistées ou n'ont pas pu être jointes malgré plusieurs tentatives de contact. Ces places seront attribuées aux candidats figurant sur la liste d'attente afin de permettre à d'autres talents de rejoindre l'aventure.</p>

      <p style="margin:0 0 20px">Les candidats définitivement retenus sont invités à rejoindre le groupe WhatsApp officiel du VIBEATHON, qui servira de canal principal pour toutes les communications relatives au bootcamp et à la compétition.</p>

      <div style="background:#0a0a0a;border:1px solid #1a1a1a;border-radius:10px;padding:20px 24px;margin:24px 0">
        <p style="margin:0 0 14px;font-weight:700;color:#fff;font-size:14px">Pour être ajouté au groupe WhatsApp, veuillez contacter :</p>
        <p style="margin:0 0 10px;color:#c8c8c8">
          <strong style="color:#fff">Ingrid BROU</strong> – Responsable Pôle Compétition<br>
          <a href="tel:+22505467559003" style="color:#00ff88;text-decoration:none">+225 05 46 75 59 03</a>
        </p>
        <p style="margin:0;color:#c8c8c8">
          <strong style="color:#fff">Ruth Amenan</strong> – Pôle Compétition<br>
          <a href="tel:+22505866881096" style="color:#00ff88;text-decoration:none">+225 05 86 68 81 96</a>
        </p>
      </div>

      <p style="margin:0 0 12px;font-weight:700;color:#fff">Merci de transmettre les informations suivantes :</p>
      <ul style="margin:0 0 20px;padding-left:20px;color:#c8c8c8">
        <li style="margin-bottom:6px">Nom et Prénoms</li>
        <li style="margin-bottom:6px">Adresse e-mail</li>
        <li style="margin-bottom:6px">Numéro de téléphone WhatsApp</li>
        <li>Nom du groupe (si applicable)</li>
      </ul>

      <p style="margin:0 0 20px">Nous vous remercions pour votre confiance et votre enthousiasme. Nous avons hâte de vous retrouver pour cette première édition du VIBEATHON Côte d'Ivoire.</p>

      <p style="margin:0">À très bientôt,<br><strong style="color:#fff">L'équipe VIBEATHON Côte d'Ivoire</strong></p>
    </div>

    <!-- Footer -->
    <p style="margin:24px 0 0;text-align:center;font-size:12px;color:#333">
      VIBEATHON 2026 · Abidjan, Côte d'Ivoire · 11 juillet 2026
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = `Bonsoir ${firstName},

Nous avons une excellente nouvelle à partager avec vous !

Grâce au soutien d'un partenaire engagé aux côtés du VIBEATHON Côte d'Ivoire, les frais de participation à la compétition de Vibe Coding sont désormais entièrement pris en charge.

La participation à la compétition devient donc GRATUITE pour les 100 candidats sélectionnés.

Pour les participants ayant déjà effectué leur paiement, un remboursement intégral sera effectué dans les prochains jours selon les modalités qui leur seront communiquées.

Par ailleurs, dans le cadre de la confirmation définitive des participants, nous avons constaté que certaines personnes sélectionnées se sont désistées ou n'ont pas pu être jointes malgré plusieurs tentatives de contact. Ces places seront attribuées aux candidats figurant sur la liste d'attente afin de permettre à d'autres talents de rejoindre l'aventure.

Les candidats définitivement retenus sont invités à rejoindre le groupe WhatsApp officiel du VIBEATHON.

Pour être ajouté au groupe WhatsApp, veuillez contacter :

- Ingrid BROU – Responsable Pôle Compétition : +225 05 46 75 59 03
- Ruth Amenan – Pôle Compétition : +225 05 86 68 81 96

Merci de transmettre : Nom et Prénoms, Adresse e-mail, Numéro WhatsApp, Nom du groupe (si applicable).

Nous vous remercions pour votre confiance et votre enthousiasme.

À très bientôt,
L'équipe VIBEATHON Côte d'Ivoire`;

  return { html, text };
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const already = sentSet();
  const candidates = await getCandidates();

  const targets = TEST_ONLY
    ? TEST_RECIPIENTS.map(email => ({ email, fullName: "Test User" }))
    : candidates;

  console.log(`\n📧 Broadcast "participation gratuite" — ${targets.length} destinataires\n`);
  if (DRY_RUN) { console.log("DRY RUN — aucun email envoyé."); targets.forEach(c => console.log(`  ${c.email}`)); return; }

  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: false, requireTLS: true,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  let sent = 0, skipped = 0, failed = 0;

  for (const candidate of targets) {
    const email = candidate.email?.trim();
    if (!email || email.length < 5) { console.log(`  ⚠️  No email: ${candidate.fullName}`); skipped++; continue; }
    if (already.has(email)) { console.log(`  ⏭️  Skip (already sent): ${email}`); skipped++; continue; }

    const { html, text } = buildEmail(candidate.fullName ?? "Cher Compétiteur");

    let retries = 0;
    while (retries < 3) {
      try {
        await transport.sendMail({
          from: EMAIL_FROM,
          to: email,
          subject: "VIBEATHON CI — Participation gratuite 🎉",
          text,
          html,
        });
        markSent(email);
        sent++;
        console.log(`  ✅ [${sent}] ${candidate.fullName} <${email}>`);
        break;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("rate") || msg.includes("limit") || msg.includes("too many") || msg.includes("421") || msg.includes("450")) {
          console.log(`  ⏳ Rate limit — pause 65s then retry...`);
          await sleep(65000);
          retries++;
        } else {
          console.log(`  ❌ ${email}: ${msg}`);
          failed++;
          break;
        }
      }
    }

    await sleep(3000);
  }

  console.log(`\nDone. ✅ ${sent} envoyés  ⏭️ ${skipped} ignorés  ❌ ${failed} échecs\n`);
}

main().catch(e => { console.error(e); process.exit(1); });
