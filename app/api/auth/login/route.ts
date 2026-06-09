import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/auth";
import { allowRequest } from "@/lib/rate-limit";
import { z } from "zod";
import { requestIp, writeAuditLog } from "@/lib/audit";

const loginSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(200),
});

const DUMMY_PASSWORD_HASH =
  "$2b$12$Fu56nD3VgxXTHZwUE981FeS8eYXurgXHNz/tndF3isfRNC2tgtbPO";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!prisma) return apiError("La base de données n'est pas configurée.", 503);
  const parsed = loginSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return apiError("Identifiants invalides.", 401);

  const ip = requestIp(request);
  if (!allowRequest(`login:${ip}:${parsed.data.email}`, 5, 15 * 60 * 1000)) {
    return apiError(
      "Trop de tentatives. Réessaie dans quelques minutes.",
      429,
    );
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: parsed.data.email },
  });
  const valid = await compare(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  if (!user?.active || !user.passwordHash || !valid) {
    await writeAuditLog({
      action: "AUTH_LOGIN_FAILED",
      entityType: "AdminUser",
      entityId: user?.id,
      ipAddress: ip,
      metadata: { email: parsed.data.email },
    });
    return apiError("Identifiants invalides.", 401);
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
  await prisma.adminUser.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await writeAuditLog({
    actorId: user.id,
    action: "AUTH_LOGIN_SUCCEEDED",
    entityType: "AdminUser",
    entityId: user.id,
    ipAddress: ip,
  });

  const destination = user.mustChangePassword
    ? "/change-password"
    : user.role === "JURY"
      ? "/jury"
      : user.role === "SCANNER"
        ? "/scan"
        : "/admin";
  return apiSuccess({ destination, role: user.role });
}
