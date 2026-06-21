import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

type EmailInput = {
  participantId?: string;
  to: string;
  subject: string;
  text?: string;
  html: string;
  template: string;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType: string;
    cid?: string;
  }[];
};

function emailFrom() {
  return (
    process.env.EMAIL_FROM ??
    process.env.SMTP_FROM ??
    "VIBEATHON 2026 <contact@vibeathonci.com>"
  );
}

/** SMTP transport (single provider). Null when SMTP is not configured. */
function smtpTransport() {
  if (!process.env.SMTP_HOST) return null;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === "true";
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    // Port 587 starts unencrypted and must upgrade before credentials are sent.
    requireTLS:
      !secure && (process.env.SMTP_REQUIRE_TLS ?? "true") === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
}

/**
 * Send a transactional email over SMTP.
 * When SMTP is not configured the message is recorded as QUEUED (logged only).
 * Every attempt is recorded in EmailLog.
 */
export async function sendEmail(input: EmailInput) {
  const transport = smtpTransport();

  let status: "SENT" | "QUEUED" | "FAILED" = transport ? "SENT" : "QUEUED";
  let providerId: string | undefined;
  let error: string | undefined;

  try {
    if (transport) {
      const result = await transport.sendMail({
        from: emailFrom(),
        to: input.to,
        replyTo: process.env.SMTP_USER,
        subject: input.subject,
        text: input.text,
        html: input.html,
        attachments: input.attachments,
      });
      providerId = result.messageId;
    }
  } catch (caught) {
    status = "FAILED";
    error = caught instanceof Error ? caught.message : "Email provider error";
  }

  if (prisma) {
    await prisma.emailLog.create({
      data: {
        participantId: input.participantId,
        channel: "EMAIL",
        template: input.template,
        recipient: input.to,
        subject: input.subject,
        status,
        providerId,
        error,
      },
    });
  }

  return { status, providerId, error };
}

/** Meta WhatsApp Cloud API recipients must be digits only, with country code. */
function normalizeWhatsAppNumber(phone: string) {
  let digits = phone.replace(/[^\d]/g, "");
  // Local Ivorian numbers (10 digits, e.g. 07xxxxxxxx) → prefix +225.
  if (digits.length === 10 && digits.startsWith("0")) digits = `225${digits}`;
  return digits;
}

/**
 * Send a WhatsApp message via the Meta WhatsApp Cloud API.
 *
 * `message` is a free-form text body (only delivered inside the 24h customer
 * service window). For business-initiated notifications pass `waTemplate` with
 * an approved template name; Meta rejects free-form text outside the window.
 */
export async function sendWhatsApp({
  participantId,
  phone,
  message,
  template,
  waTemplate,
}: {
  participantId?: string;
  phone: string;
  message: string;
  template: string;
  waTemplate?: {
    name: string;
    languageCode?: string;
    bodyParams?: string[];
    buttonUrlParams?: string[];
  };
}) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION ?? "v21.0";
  const to = normalizeWhatsAppNumber(phone);

  let status: "SENT" | "QUEUED" | "FAILED" =
    token && phoneNumberId && to ? "SENT" : "QUEUED";
  let providerId: string | undefined;
  let error: string | undefined;

  try {
    if (token && phoneNumberId && to) {
      const body = waTemplate
        ? {
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
              name: waTemplate.name,
              language: { code: waTemplate.languageCode ?? "fr" },
              ...(waTemplate.bodyParams?.length
                ? {
                    components: [
                      {
                        type: "body",
                        parameters: waTemplate.bodyParams.map((text) => ({
                          type: "text",
                          text,
                        })),
                      },
                      ...(waTemplate.buttonUrlParams ?? []).map(
                        (text, index) => ({
                          type: "button",
                          sub_type: "url",
                          index: String(index),
                          parameters: [{ type: "text", text }],
                        }),
                      ),
                    ],
                  }
                : waTemplate.buttonUrlParams?.length
                  ? {
                      components: waTemplate.buttonUrlParams.map(
                        (text, index) => ({
                          type: "button",
                          sub_type: "url",
                          index: String(index),
                          parameters: [{ type: "text", text }],
                        }),
                      ),
                    }
                  : {}),
            },
          }
        : {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: message, preview_url: true },
          };

      const sendToNumber = async (recipient: string) =>
        fetch(
          `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ...body, to: recipient }),
          },
        );

      const response = await sendToNumber(to);
      const payload = (await response.json()) as {
        messages?: { id: string }[];
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "WhatsApp Cloud API error");
      }
      providerId = payload.messages?.[0]?.id;

      // Per-message BCC disabled — daily digest cron handles admin summary instead.
    }
  } catch (caught) {
    status = "FAILED";
    error = caught instanceof Error ? caught.message : "WhatsApp Cloud API error";
  }

  if (prisma) {
    await prisma.emailLog.create({
      data: {
        participantId,
        channel: "WHATSAPP",
        template,
        recipient: to || phone,
        status,
        providerId,
        error,
      },
    });
  }
  return { status, providerId, error };
}
