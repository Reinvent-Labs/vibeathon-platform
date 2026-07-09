import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token || !prisma) redirect("/jury?error=invalid");

  const magic = await prisma.magicToken.findUnique({ where: { token } });

  if (!magic || magic.usedAt || magic.expiresAt < new Date()) {
    redirect("/jury?error=expired");
  }

  const user = await prisma.adminUser.findUnique({
    where: { email: magic.email },
    select: { id: true, email: true, fullName: true, role: true, active: true },
  });

  if (!user || !user.active || !["JURY", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    redirect("/jury?error=unauthorized");
  }

  // Mark token as used
  await prisma.magicToken.update({ where: { token }, data: { usedAt: new Date() } });

  // Update last login
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const sessionToken = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, sessionCookieOptions);

  redirect("/jury");
}
