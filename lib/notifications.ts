import nodemailer from "nodemailer";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

type EmailInput = {
  participantId?: string;
  to: string;
  subject: string;
  html: string;
  template: string;
};

function emailFrom() {
  return (
    process.env.RESEND_FROM_EMAIL ??
    process.env.EMAIL_FROM ??
    "VIBEATHON 2026 <onboarding@resend.dev>"
  );
}

/** Optional SMTP fallback when Resend is not configured. */
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
 * Send a transactional email.
 * Provider priority: Resend (if RESEND_API_KEY) → SMTP (if SMTP_HOST) →
 * queued (logged, no provider configured). Every attempt is recorded in EmailLog.
 */
export async function sendEmail(input: EmailInput) {
  const resendKey = process.env.RESEND_API_KEY;
  const transport = resendKey ? null : smtpTransport();

  let status: "SENT" | "QUEUED" | "FAILED" =
    resendKey || transport ? "SENT" : "QUEUED";
  let providerId: string | undefined;
  let error: string | undefined;

  try {
    if (resendKey) {
      const resend = new Resend(resendKey);
      const result = await resend.emails.send({
        from: emailFrom(),
        to: input.to,
        subject: input.subject,
        html: input.html,
      });
      if (result.error) throw new Error(result.error.message);
      providerId = result.data?.id;
    } else if (transport) {
      const result = await transport.sendMail({
        from: emailFrom(),
        to: input.to,
        subject: input.subject,
        html: input.html,
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
  if (digits.length === 10 && digits.startsWith("0")) digits = `225${digits.slice(1)}`;
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
                    ],
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

      const response = await fetch(
        `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      const payload = (await response.json()) as {
        messages?: { id: string }[];
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(payload.error?.message ?? "WhatsApp Cloud API error");
      }
      providerId = payload.messages?.[0]?.id;
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
