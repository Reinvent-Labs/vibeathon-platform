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
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
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

export async function sendWhatsApp({
  participantId,
  phone,
  message,
  template,
}: {
  participantId?: string;
  phone: string;
  message: string;
  template: string;
}) {
  const apiKey = process.env.WASSENGER_API_KEY;
  const device = process.env.WASSENGER_DEVICE_ID;
  let status: "SENT" | "QUEUED" | "FAILED" =
    apiKey && device ? "SENT" : "QUEUED";
  let providerId: string | undefined;
  let error: string | undefined;

  try {
    if (apiKey && device) {
      const response = await fetch("https://api.wassenger.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Token: apiKey,
        },
        body: JSON.stringify({ phone, message, device }),
      });
      const payload = (await response.json()) as { id?: string; message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Wassenger error");
      providerId = payload.id;
    }
  } catch (caught) {
    status = "FAILED";
    error = caught instanceof Error ? caught.message : "Wassenger error";
  }

  if (prisma) {
    await prisma.emailLog.create({
      data: {
        participantId,
        channel: "WHATSAPP",
        template,
        recipient: phone,
        status,
        providerId,
        error,
      },
    });
  }
  return { status, providerId, error };
}
