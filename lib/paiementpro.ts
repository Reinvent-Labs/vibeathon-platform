import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { EVENT } from "@/lib/constants";

const INITIALIZE_URL =
  "https://www.paiementpro.net/webservice/onlinepayment/js/initialize/initialize.php";

type PaymentParticipant = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  reference: string;
};

type PaymentContext = {
  participantId: string;
  referenceNumber: string;
  amount: number;
};

function webhookSecret() {
  const secret = process.env.PAIEMENTPRO_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "PAIEMENTPRO_WEBHOOK_SECRET doit contenir au moins 32 caractères.",
    );
  }
  return secret;
}

function encodePaymentContext(context: PaymentContext) {
  return Buffer.from(JSON.stringify(context)).toString("base64url");
}

function signPaymentContext(encodedContext: string) {
  return createHmac("sha256", webhookSecret())
    .update(encodedContext)
    .digest("base64url");
}

export function decodePaymentContext(encodedContext: string): PaymentContext {
  const parsed = JSON.parse(
    Buffer.from(encodedContext, "base64url").toString("utf8"),
  ) as Partial<PaymentContext>;
  if (
    typeof parsed.participantId !== "string" ||
    typeof parsed.referenceNumber !== "string" ||
    typeof parsed.amount !== "number" ||
    !Number.isSafeInteger(parsed.amount) ||
    parsed.amount <= 0
  ) {
    throw new Error("Contexte de paiement invalide.");
  }
  return parsed as PaymentContext;
}

export function verifyPaymentContext(
  encodedContext: string,
  signature: string,
) {
  const expected = Buffer.from(signPaymentContext(encodedContext));
  const received = Buffer.from(signature);
  return (
    expected.length === received.length &&
    timingSafeEqual(expected, received)
  );
}

export async function initializePaiementPro(
  participant: PaymentParticipant,
  channel: string,
  options: { amount?: number; description?: string } = {},
) {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  const merchantId = process.env.PAIEMENTPRO_MERCHANT_ID;
  if (!merchantId) {
    throw new Error("L'identifiant marchand PaiementPro n'est pas configuré.");
  }
  const [firstName, ...lastNameParts] = participant.fullName.split(" ");
  const amount = options.amount ?? EVENT.fee;
  const description = options.description ?? `Participation ${EVENT.name}`;
  const referenceNumber =
    `${participant.reference}-${Date.now().toString(36)}-` +
    randomBytes(4).toString("hex");
  const encodedContext = encodePaymentContext({
    participantId: participant.id,
    referenceNumber,
    amount,
  });
  const signature = signPaymentContext(encodedContext);
  const callbackUrl =
    `${appUrl}/api/webhooks/paiementpro?context=` +
    `${encodeURIComponent(encodedContext)}&signature=${encodeURIComponent(signature)}`;

  const payload = {
    merchantId,
    amount,
    description,
    // PaiementPro rejects an empty channel, then its hosted page lets the
    // customer choose among all enabled providers.
    channel: channel || "WAVE",
    countryCurrencyCode: "952",
    referenceNumber,
    customerEmail: participant.email,
    customerFirstName: firstName || participant.fullName,
    customerLastname: lastNameParts.join(" ") || participant.fullName,
    customerPhoneNumber: participant.phone,
    returnURL:
      `${callbackUrl}&return=1&email=` +
      encodeURIComponent(participant.email),
    notificationURL: callbackUrl,
    returnContext: encodedContext,
    url: "",
    success: false,
  };

  if (process.env.PAIEMENTPRO_DEMO_MODE !== "false") {
    return {
      success: true,
      demo: true,
      url: `${appUrl}/statut?payment=demo&participant=${participant.id}`,
      reference: referenceNumber,
    };
  }

  const response = await fetch(INITIALIZE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`PaiementPro a répondu ${response.status}.`);
  }

  const result = (await response.json()) as {
    success: boolean;
    url?: string;
    message?: string;
    error?: string;
  };
  if (!result.success && result.error && !result.message) {
    result.message = result.error;
  }
  return result;
}
