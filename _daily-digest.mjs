/**
 * Daily digest — sends a summary of new payments + visitor registrations
 * to admin emails. Run via cron at e.g. 08:00 every day.
 *
 * Usage: node /app/_daily-digest.mjs [--hours=24]
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

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

// Recipients — always sent to both
const ADMIN_EMAILS = [
  "salomondiei@gmail.com",
  "ossey.nelly@gmail.com",
].filter((v, i, a) => v && a.indexOf(v) === i); // dedupe

const hoursArg = process.argv.find(a => a.startsWith("--hours="));
const HOURS = hoursArg ? Number(hoursArg.split("=")[1]) : 24;

async function main() {
  const since = new Date(Date.now() - HOURS * 60 * 60 * 1000);
  console.log(`\n📊 Daily digest — last ${HOURS}h (since ${since.toISOString()})\n`);

  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();

  // New payments (CONFIRMED/PAID/CHECKED_IN) in last N hours
  const { rows: payments } = await client.query(`
    SELECT reference, "fullName", email, phone, category, "paidAt"
    FROM "Participant"
    WHERE status IN ('PAID','CONFIRMED','CHECKED_IN')
      AND (category IS NULL OR category != 'VISITEUR')
      AND "paidAt" >= $1
    ORDER BY "paidAt" DESC
  `, [since]);

  // New visitor registrations in last N hours
  const { rows: visitors } = await client.query(`
    SELECT reference, "fullName", email, phone, status, "createdAt"
    FROM "Participant"
    WHERE category = 'VISITEUR'
      AND "createdAt" >= $1
    ORDER BY "createdAt" DESC
  `, [since]);

  // Overall totals
  const { rows: totals } = await client.query(`
    SELECT
      COUNT(*) FILTER (WHERE status IN ('PAID','CONFIRMED','CHECKED_IN') AND (category IS NULL OR category != 'VISITEUR')) as total_paid,
      COUNT(*) FILTER (WHERE status = 'SELECTED' AND (category IS NULL OR category != 'VISITEUR')) as total_selected,
      COUNT(*) FILTER (WHERE status = 'WAITLIST') as total_waitlist,
      COUNT(*) FILTER (WHERE category = 'VISITEUR') as total_visitors
    FROM "Participant"
  `);

  await client.end();

  const t = totals[0];

  if (payments.length === 0 && visitors.length === 0) {
    console.log("Rien de nouveau. Pas d'email envoyé.");
    return;
  }

  const dateLabel = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  function section(title, rows, fields) {
    if (!rows.length) return "";
    const rowsHtml = rows.map(r =>
      `<tr>${fields.map(f => `<td style="padding:8px 12px;border-bottom:1px solid #1a1a1a;font-size:13px;color:#b0b0b0">${r[f.key] ?? "—"}</td>`).join("")}</tr>`
    ).join("");
    const headerHtml = fields.map(f => `<th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555;font-weight:600">${f.label}</th>`).join("");
    return `
      <h3 style="margin:28px 0 12px;font-size:14px;font-weight:700;color:#fff">${title} <span style="font-size:12px;font-weight:500;color:#555">(${rows.length})</span></h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border-radius:8px;overflow:hidden;border:1px solid #1a1a1a">
        <thead><tr style="background:#0a0a0a">${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;
  }

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 20px">
<tr><td align="center">
<table width="100%" style="max-width:680px">
  <tr><td>
    <p style="margin:0 0 4px;font-size:20px;font-weight:900;color:#fff">📊 Rapport quotidien VIBEATHON</p>
    <p style="margin:0 0 24px;font-size:13px;color:#555">${dateLabel} · Dernières ${HOURS}h</p>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px">
      ${[
        { label: "Payés", value: t.total_paid, color: "#75ff8d" },
        { label: "Sélectionnés", value: t.total_selected, color: "#ba77ff" },
        { label: "Attente", value: t.total_waitlist, color: "#43d9ff" },
        { label: "Visiteurs", value: t.total_visitors, color: "#ff9f43" },
      ].map(card => `
        <div style="background:#111;border:1px solid #1a1a1a;border-radius:10px;padding:16px;text-align:center">
          <div style="font-size:24px;font-weight:900;color:${card.color}">${card.value}</div>
          <div style="font-size:11px;color:#555;margin-top:4px">${card.label}</div>
        </div>`).join("")}
    </div>

    ${section("Nouveaux paiements", payments, [
      { label: "Réf", key: "reference" },
      { label: "Nom", key: "fullName" },
      { label: "Email", key: "email" },
      { label: "Date", key: "paidAt" },
    ])}

    ${section("Nouveaux visiteurs", visitors, [
      { label: "Réf", key: "reference" },
      { label: "Nom", key: "fullName" },
      { label: "Email", key: "email" },
      { label: "Statut", key: "status" },
    ])}

    <p style="margin:32px 0 0;font-size:12px;color:#333">Rapport automatique VIBEATHON 2026</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  const text = [
    `Rapport quotidien VIBEATHON — ${dateLabel}`,
    ``,
    `TOTAUX: Payés ${t.total_paid} | Sélectionnés ${t.total_selected} | Attente ${t.total_waitlist} | Visiteurs ${t.total_visitors}`,
    ``,
    payments.length ? `NOUVEAUX PAIEMENTS (${payments.length}):\n` + payments.map(p => `  - ${p.fullName} <${p.email}> — ${p.reference}`).join("\n") : "",
    visitors.length ? `\nNOUVEAUX VISITEURS (${visitors.length}):\n` + visitors.map(v => `  - ${v.fullName} <${v.email}> — ${v.reference}`).join("\n") : "",
  ].filter(Boolean).join("\n");

  const { default: nodemailer } = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: false, requireTLS: true,
    tls: process.env.SMTP_TLS_SERVERNAME
      ? { servername: process.env.SMTP_TLS_SERVERNAME }
      : undefined,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const subject = `[VIBEATHON] Rapport ${dateLabel} — ${payments.length} paiement(s), ${visitors.length} visiteur(s)`;

  for (const to of ADMIN_EMAILS) {
    try {
      if (process.env.RESEND_API_KEY) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to,
            reply_to: process.env.EMAIL_REPLY_TO ?? SMTP_USER,
            subject,
            text,
            html,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`Resend ${response.status}: ${errorBody}`);
        }
      } else {
        await transport.sendMail({ from: EMAIL_FROM, to, subject, text, html });
      }
      console.log(`✅ Envoyé à ${to}`);
    } catch (e) {
      console.log(`❌ ${to}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`\nDone. ${payments.length} paiements, ${visitors.length} visiteurs.`);
}

main().catch(e => { console.error(e); process.exit(1); });
