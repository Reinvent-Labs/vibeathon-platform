import { cookies } from "next/headers";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { isSameOrigin, createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requestIp } from "@/lib/audit";
import { allowRequest } from "@/lib/rate-limit";

type Body = { email?: string };

/**
 * Direct email-only jury login — no password, no link to click.
 * The jury portal is a closed, low-stakes tool for a small trusted panel
 * at a live event, so we trade email-ownership verification for reliability
 * (magic-link delivery was too flaky during the event).
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const ip = requestIp(request);
  if (!allowRequest(`jury-login:${ip}`, 20, 15 * 60 * 1000)) {
    return apiError("Trop de tentatives. Réessaie dans quelques minutes.", 429);
  }

  const body = await readJson<Body>(request);
  const email = body?.email?.trim().toLowerCase();
  if (!email) return apiError("Adresse e-mail manquante.");

  const user = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true, role: true, active: true },
  });

  if (!user || !user.active || !["JURY", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return apiError("Cette adresse n'est pas autorisée à accéder au portail jury.", 401);
  }

  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const sessionToken = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, sessionCookieOptions);

  return apiSuccess({ ok: true });
}
