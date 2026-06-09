import { z } from "zod";

export const registrationSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  email: z.email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(8).max(30),
  city: z.string().trim().min(2).max(80),
  profile: z.enum([
    "Étudiant·e",
    "Jeune diplômé·e",
    "Entrepreneur·e",
    "Professionnel·le",
    "Autre",
  ]),
  motivation: z.string().trim().min(20).max(300),
  source: z.string().trim().max(120).optional().default(""),
});

export const statusLookupSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
});

export const paymentInitSchema = z.object({
  participantId: z.string().min(1),
  channel: z.enum(["WAVE", "ORANGE", "MTN", "CARD", ""]).default(""),
});

export const scanSchema = z.object({
  qrCode: z.string().trim().min(4).max(160),
  sessionId: z.string().trim().min(1),
});

export const scoreSubmissionSchema = z.object({
  teamId: z.string().min(1),
  comment: z.string().max(1000).optional().default(""),
  scores: z.record(z.string(), z.number().int().min(0).max(100)),
});
