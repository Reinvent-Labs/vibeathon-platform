/**
 * Send a single WhatsApp test message to a specific number.
 * Usage: node /app/_wa-ping.mjs <phone> [selected|waitlist]
 * Example: node /app/_wa-ping.mjs 0787668486 selected
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
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

const WA_TOKEN    = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WA_VERSION  = process.env.WHATSAPP_API_VERSION ?? "v21.0";

function normalize(phone) {
  let d = phone.replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.length === 10 && d.startsWith("0")) d = `225${d}`;
  return d;
}

const rawPhone = process.argv[2];
const statusArg = (process.argv[3] ?? "selected").toLowerCase();

if (!rawPhone) {
  console.error("Usage: node _wa-ping.mjs <phone> [selected|waitlist]");
  process.exit(1);
}

const to = normalize(rawPhone);
const templateName = statusArg === "waitlist"
  ? (process.env.WHATSAPP_TEMPLATE_RESULTS ?? "vibeathon_resultats_disponibles")
  : (process.env.WHATSAPP_TEMPLATE_PAYMENT_REMINDER ?? "vibeathon_rappel_paiement");

console.log(`Sending WhatsApp template "${templateName}" to ${to} …`);

const body = {
  messaging_product: "whatsapp",
  to,
  type: "template",
  template: {
    name: templateName,
    language: { code: "fr" },
    components: [
      { type: "body", parameters: [{ type: "text", text: "Salomon" }] },
    ],
  },
};

const res = await fetch(`https://graph.facebook.com/${WA_VERSION}/${WA_PHONE_ID}/messages`, {
  method: "POST",
  headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const json = await res.json();

if (!res.ok) {
  console.error("❌ Error:", json?.error?.message ?? JSON.stringify(json));
  process.exit(1);
}

console.log("✅ Sent. wamid:", json?.messages?.[0]?.id ?? JSON.stringify(json));
