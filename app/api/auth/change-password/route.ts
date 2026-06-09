import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { requestIp, writeAuditLog } from "@/lib/audit";
import {
  createSessionToken,
  getSession,
  isSameOrigin,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: z
      .string()
      .min(12)
      .max(200)
      .regex(/[a-z]/, "Une minuscule est requise.")
      .regex(/[A-Z]/, "Une majuscule est requise.")
      .regex(/[0-9]/, "Un chiffre est requis.")
      .regex(/[^A-Za-z0-9]/, "Un caractère spécial est requis."),
    confirmation: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmation, {
    message: "Les mots de passe ne correspondent pas.",
  });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!prisma) return apiError("Base de données indisponible.", 503);
  const session = await getSession();
  if (!session) return apiError("Session expirée.", 401);

  const parsed = passwordSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) {
    return apiError(
      parsed.error.issues[0]?.message ?? "Mot de passe invalide.",
    );
  }
  const user = await prisma.adminUser.findUnique({
    where: { id: session.userId },
  });
  if (!user?.active || !user.passwordHash) {
    return apiError("Compte indisponible.", 403);
  }
  if (!(await compare(parsed.data.currentPassword, user.passwordHash))) {
    return apiError("Le mot de passe temporaire est incorrect.", 401);
  }
  if (await compare(parsed.data.newPassword, user.passwordHash)) {
    return apiError("Choisis un nouveau mot de passe différent.", 409);
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: {
      passwordHash: await hash(parsed.data.newPassword, 12),
      mustChangePassword: false,
    },
  });
  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    mustChangePassword: false,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, sessionCookieOptions);
  await writeAuditLog({
    actorId: user.id,
    action: "AUTH_PASSWORD_CHANGED",
    entityType: "AdminUser",
    entityId: user.id,
    ipAddress: requestIp(request),
  });

  const destination =
    user.role === "JURY" ? "/jury" : user.role === "SCANNER" ? "/scan" : "/admin";
  return apiSuccess({ destination });
}
