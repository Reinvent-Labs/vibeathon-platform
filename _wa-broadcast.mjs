/**
 * WhatsApp broadcast — sends the right template to each group:
 *   SELECTED  → vibeathon_dossier_accepte   (félicitations, lien paiement)
 *   WAITLIST  → vibeathon_resultats_disponibles  (liste d'attente)
 *   REJECTED  → vibeathon_resultats_disponibles  (non retenu)
 *
 * Usage (run on the server from the vibeathon-platform dir):
 *   node _wa-broadcast.mjs [--dry-run] [--test-only]
 *
 *   --dry-run   : show who would receive without actually calling the API
 *   --test-only : send only to TEST_PHONE (one message per group type)
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const DRY_RUN   = process.argv.includes("--dry-run");
const TEST_ONLY = process.argv.includes("--test-only");

// ── Load .env ─────────────────────────────────────────────────────────────────
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

// ── Config ────────────────────────────────────────────────────────────────────
const TOKEN    = process.env.WHATSAPP_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERSION  = process.env.WHATSAPP_API_VERSION ?? "v21.0";
const APP_URL  = (process.env.NEXT_PUBLIC_APP_URL ?? "https://vibethon.reinvent-labs.com").replace(/\/$/, "");
const DB_URL   = process.env.DATABASE_URL;

const TEMPLATES = {
  selected : process.env.WHATSAPP_TEMPLATE_ACCEPTED  ?? "vibeathon_dossier_accepte",
  waitlist : process.env.WHATSAPP_TEMPLATE_RESULTS   ?? "vibeathon_resultats_disponibles",
  rejected : process.env.WHATSAPP_TEMPLATE_RESULTS   ?? "vibeathon_resultats_disponibles",
};

const TEST_PHONES = ["+2250788138332", "0022587668486"];

if (!TOKEN || !PHONE_ID) {
  console.error("❌  WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set.");
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalize(phone) {
  let digits = phone.replace(/[^\d]/g, "");
  // 00XXXX → drop the leading 00 (international dial prefix)
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Local 10-digit starting with 0 → add CI country code
  if (digits.length === 10 && digits.startsWith("0")) digits = `225${digits.slice(1)}`;
  // 225 + 10-digit local (starts with 0) = 13 digits → drop the extra 0
  // e.g. 2250788138332 → 225788138332
  if (digits.length === 13 && digits.startsWith("2250")) digits = `225${digits.slice(4)}`;
  return digits;
}

// Build the right WA template body for each group.
function buildTemplateBody(group, templateName, name) {

  if (group === "selected") {
    // vibeathon_dossier_accepte — body param: [name] only
    return {
      messaging_product: "whatsapp",
      type: "template",
      template: {
        name: templateName,
        language: { code: "fr" },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: name }],
          },
        ],
      },
    };
  }

  // waitlist + rejected both use vibeathon_resultats_disponibles — body param: [name]
  return {
    messaging_product: "whatsapp",
    type: "template",
    template: {
      name: templateName,
      language: { code: "fr" },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: name }],
        },
      ],
    },
  };
}

async function sendWa(to, group, name) {
  const toNorm = normalize(to);
  const templateName = TEMPLATES[group];

  if (DRY_RUN) {
    console.log(`  [DRY-${group.toUpperCase()}] → ${toNorm}  name="${name}"`);
    return { status: "DRY" };
  }

  const body = {
    to: toNorm,
    ...buildTemplateBody(group, templateName, name),
  };

  const res = await fetch(
    `https://graph.facebook.com/${VERSION}/${PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  const json = await res.json();
  if (!res.ok) {
    return { status: "FAILED", error: json?.error?.message ?? String(res.status) };
  }
  return { status: "SENT", id: json?.messages?.[0]?.id };
}

// ── Fetch participants by status group ────────────────────────────────────────
async function getParticipants() {
  if (!DB_URL) {
    console.warn("⚠  No DATABASE_URL — only the test number will be used.");
    return { selected: [], waitlist: [], rejected: [] };
  }
  let pg;
  try { pg = await import("pg"); }
  catch { console.warn("⚠  'pg' not found. Run: npm install pg"); return { selected: [], waitlist: [], rejected: [] }; }

  const { default: { Client } } = pg;
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  const result = await client.query(
    `SELECT "id", "fullName", "email", "phone", "status"
     FROM "Participant"
     WHERE "status" IN ('SELECTED', 'WAITLIST', 'REJECTED')
     ORDER BY "status", "fullName"`
  );
  await client.end();

  const selected = result.rows.filter(r => r.status === "SELECTED");
  const waitlist = result.rows.filter(r => r.status === "WAITLIST");
  const rejected = result.rows.filter(r => r.status === "REJECTED");
  return { selected, waitlist, rejected };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀  VIBEATHON WhatsApp Broadcast — Résultats`);
  console.log(`   App URL : ${APP_URL}`);
  console.log(`   Mode    : ${DRY_RUN ? "DRY RUN" : TEST_ONLY ? "TEST ONLY" : "LIVE"}\n`);

  const { selected, waitlist, rejected } = TEST_ONLY
    ? { selected: [], waitlist: [], rejected: [] }
    : await getParticipants();

  console.log(`📋  SELECTED  : ${selected.length}`);
  console.log(`📋  WAITLIST  : ${waitlist.length}`);
  console.log(`📋  REJECTED  : ${rejected.length}`);

  // Test entries — one per group per test number
  const testEntries = (idPrefix) =>
    TEST_PHONES.map((phone, i) => ({
      id: `${idPrefix}-${i}`,
      fullName: "Test Salomond",
      email: "salomondiei08@gmail.com",
      phone,
    }));

  const groups = [
    { label: "SELECTED", group: "selected", items: [...selected, ...testEntries("test-s")] },
    { label: "WAITLIST", group: "waitlist", items: [...waitlist, ...testEntries("test-w")] },
    { label: "REJECTED", group: "rejected", items: [...rejected, ...testEntries("test-r")] },
  ];

  let totalSent = 0, totalFailed = 0, totalDry = 0;

  for (const { label, group, items } of groups) {
    console.log(`\n── ${label} (${items.length}) ──────────────────────────────`);
    for (const p of items) {
      const tag = p.id.startsWith("test") ? "[TEST]" : `[${p.id.slice(0, 8)}]`;
      process.stdout.write(`${tag} ${p.fullName} (${normalize(p.phone)}) … `);
      const result = await sendWa(p.phone, group, p.fullName);
      if (result.status === "SENT")   { totalSent++;   console.log(`✅ SENT  ${result.id ?? ""}`); }
      else if (result.status === "FAILED") { totalFailed++; console.log(`❌ FAILED  ${result.error}`); }
      else                             { totalDry++;    }
      if (!DRY_RUN) await new Promise(r => setTimeout(r, 120));
    }
  }

  console.log(`\n════════════════════════════════`);
  if (DRY_RUN) console.log(`DRY RUN — ${totalDry} messages would be sent.`);
  else console.log(`Done. ✅ ${totalSent} envoyés  ❌ ${totalFailed} échoués`);
}

main().catch(err => { console.error(err); process.exit(1); });
