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

export async function initializePaiementPro(
  participant: PaymentParticipant,
  channel: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const merchantId = process.env.PAIEMENTPRO_MERCHANT_ID ?? "PP-F92248";
  const [firstName, ...lastNameParts] = participant.fullName.split(" ");

  const payload = {
    merchantId,
    amount: EVENT.fee,
    description: `Participation ${EVENT.name}`,
    channel,
    countryCurrencyCode: "952",
    referenceNumber: participant.reference,
    customerEmail: participant.email,
    customerFirstName: firstName || participant.fullName,
    customerLastname: lastNameParts.join(" ") || participant.fullName,
    customerPhoneNumber: participant.phone,
    returnURL: `${appUrl}/statut?payment=return&email=${encodeURIComponent(participant.email)}`,
    notificationURL: `${appUrl}/api/webhooks/paiementpro`,
    returnContext: participant.id,
    url: "",
    success: false,
  };

  if (process.env.PAIEMENTPRO_DEMO_MODE !== "false") {
    return {
      success: true,
      demo: true,
      url: `${appUrl}/statut?payment=demo&participant=${participant.id}`,
      reference: participant.reference,
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

  return (await response.json()) as {
    success: boolean;
    url?: string;
    message?: string;
  };
}
