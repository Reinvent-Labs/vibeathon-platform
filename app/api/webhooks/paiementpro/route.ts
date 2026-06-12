import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import { findParticipantById, updateParticipantStatus } from "@/lib/repository";
import { sendEmail, sendWhatsApp } from "@/lib/notifications";
import { appBaseUrl, badgeUrlFor } from "@/lib/campaigns";
import { renderCmsEmail } from "@/lib/cms-email";
import { whatsAppMessages } from "@/lib/whatsapp-templates";
import {
  decodePaymentContext,
  verifyPaymentContext,
} from "@/lib/paiementpro";
import { writeAuditLog } from "@/lib/audit";

function callbackValues(request: Request) {
  const url = new URL(request.url);
  return {
    encodedContext: url.searchParams.get("context") ?? "",
    signature: url.searchParams.get("signature") ?? "",
    shouldRedirect: url.searchParams.get("return") === "1",
    email: url.searchParams.get("email") ?? "",
  };
}

function paymentSucceeded(payload: Record<string, unknown>) {
  const rawStatus = String(
    payload.status ??
      payload.responsecode ??
      payload.responseCode ??
      payload.success ??
      payload.code ??
      "",
  ).toLowerCase();
  return ["success", "true", "0", "paid", "completed"].includes(rawStatus);
}

async function readPayload(request: Request) {
  if (request.method === "GET") {
    return Object.fromEntries(new URL(request.url).searchParams);
  }
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? ((await request.json()) as Record<string, unknown>)
    : Object.fromEntries(await request.formData());
}

function redirectToStatus(request: Request, email: string, outcome: string) {
  const url = new URL("/statut", request.url);
  url.searchParams.set("payment", outcome);
  if (email) url.searchParams.set("email", email);
  return NextResponse.redirect(url, 303);
}

async function handleCallback(request: Request) {
  const { encodedContext, signature, shouldRedirect, email } =
    callbackValues(request);
  if (
    !encodedContext ||
    !signature ||
    !verifyPaymentContext(encodedContext, signature)
  ) {
    return apiError("Signature invalide.", 401);
  }

  let context;
  try {
    context = decodePaymentContext(encodedContext);
  } catch {
    return apiError("Contexte de paiement invalide.", 400);
  }
  const payload = await readPayload(request);
  const returnedContext = String(payload.returnContext ?? "");
  const returnedReference = String(
    payload.referenceNumber ?? payload.reference ?? "",
  );
  if (returnedContext && returnedContext !== encodedContext) {
    return apiError("Contexte de paiement incohérent.", 400);
  }
  if (
    returnedReference &&
    returnedReference !== context.referenceNumber
  ) {
    return apiError("Référence de paiement incohérente.", 400);
  }
  const returnedAmount = Number(payload.amount ?? payload.montant ?? NaN);
  if (Number.isFinite(returnedAmount) && returnedAmount !== context.amount) {
    return apiError("Montant de paiement incohérent.", 400);
  }
  const participant = await findParticipantById(context.participantId);
  if (!participant) return apiError("Participant introuvable.", 404);
  if (!paymentSucceeded(payload)) {
    if (["PAID", "CONFIRMED", "CHECKED_IN"].includes(participant.status)) {
      return shouldRedirect
        ? redirectToStatus(request, participant.email, "success")
        : apiSuccess({ received: true, updated: false, duplicate: true });
    }
    return shouldRedirect
      ? redirectToStatus(request, email, "pending")
      : apiSuccess({ received: true, updated: false });
  }

  if (
    !["SELECTED", "PAID", "CONFIRMED", "CHECKED_IN"].includes(
      participant.status,
    )
  ) {
    return apiError("Ce dossier n'est pas éligible au paiement.", 409);
  }
  if (["PAID", "CONFIRMED", "CHECKED_IN"].includes(participant.status)) {
    return shouldRedirect
      ? redirectToStatus(request, participant.email, "success")
      : apiSuccess({ received: true, updated: false, duplicate: true });
  }

  await updateParticipantStatus(participant.id, "CONFIRMED");
  await writeAuditLog({
    action: "PAYMENT_CONFIRMED",
    entityType: "Participant",
    entityId: participant.id,
    metadata: {
      reference: context.referenceNumber,
      amount: context.amount,
      provider: "PaiementPro",
    },
  });
  const appUrl = appBaseUrl();
  const badgeUrl = badgeUrlFor(participant);
  const qrBuffer = await QRCode.toBuffer(participant.qrCode, {
    width: 480,
    margin: 1,
    color: {
      dark: "#050807",
      light: "#ffffff",
    },
  });
  const paymentWhatsapp = whatsAppMessages.paymentConfirmed(
    participant.fullName,
    badgeUrl,
  );
  const paymentEmail = await renderCmsEmail("paymentConfirmed", {
    name: participant.fullName,
    reference: participant.reference,
    badgeUrl,
    appUrl,
  });
  await Promise.all([
    sendEmail({
      participantId: participant.id,
      to: participant.email,
      subject: paymentEmail.subject,
      text: `${paymentEmail.text}\n\n${badgeUrl}`,
      html: paymentEmail.html,
      template: "payment-badge",
      attachments: [
        {
          filename: "badge-qr-vibeathon.png",
          content: qrBuffer,
          contentType: "image/png",
          cid: "vibeathon-qr",
        },
      ],
    }),
    sendWhatsApp({
      participantId: participant.id,
      phone: participant.phone,
      message: paymentWhatsapp.message,
      template: "payment-badge",
      waTemplate: paymentWhatsapp.waTemplate,
    }),
  ]);
  return shouldRedirect
    ? redirectToStatus(request, participant.email, "success")
    : apiSuccess({ received: true, updated: true });
}

export async function POST(request: Request) {
  return handleCallback(request);
}

export async function GET(request: Request) {
  return handleCallback(request);
}
