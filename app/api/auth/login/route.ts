import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!prisma) return apiError("La base de données n'est pas configurée.", 503);
  const body = await readJson<{ email?: string; password?: string }>(request);
  if (!body?.email || !body.password) return apiError("Identifiants manquants.");

  const user = await prisma.adminUser.findUnique({
    where: { email: body.email.toLowerCase() },
  });
  if (!user?.active || !user.passwordHash) return apiError("Identifiants invalides.", 401);
  const valid = await compare(body.password, user.passwordHash);
  if (!valid) return apiError("Identifiants invalides.", 401);

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });

  const destination =
    user.role === "JURY" ? "/jury" : user.role === "SCANNER" ? "/scan" : "/admin";
  return apiSuccess({ destination, role: user.role });
}
