import { randomUUID } from "node:crypto";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/notifications";

const LINK_TTL_MINUTES = 15;

type Body = { email?: string };

export async function POST(request: Request) {
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const body = await readJson<Body>(request);
  const email = body?.email?.trim().toLowerCase();
  if (!email) return apiError("Adresse e-mail manquante.");

  // Only JURY (or admin) accounts can use magic link sign-in
  const user = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true, fullName: true, role: true, active: true },
  });

  // Always return success to avoid email enumeration
  if (!user || !user.active || !["JURY", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    return apiSuccess({ sent: true });
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + LINK_TTL_MINUTES * 60 * 1000);

  await prisma.magicToken.create({ data: { email, token, expiresAt } });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vibethon.reinvent-labs.com";
  const link = `${appUrl}/api/jury/verify?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Votre lien d'accès jury — VIBEATHON 2026",
    template: "jury-magic-link",
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#0a0a0a;color:#e5e5e5;padding:40px 20px;text-align:center;">
  <img src="${appUrl}/logo.png" alt="VIBEATHON" width="120" style="margin-bottom:32px;" />
  <h1 style="font-size:24px;font-weight:700;margin:0 0 12px;">Espace jury</h1>
  <p style="color:#a3a3a3;margin:0 0 32px;">Bonjour ${user.fullName}, voici votre lien de connexion. Il expire dans ${LINK_TTL_MINUTES} minutes.</p>
  <a href="${link}" style="display:inline-block;background:#75FF8D;color:#0a0a0a;font-weight:700;font-size:16px;padding:14px 32px;border-radius:8px;text-decoration:none;">Accéder au portail jury →</a>
  <p style="color:#525252;font-size:13px;margin-top:32px;">Si vous n'avez pas demandé ce lien, ignorez cet e-mail.</p>
</body>
</html>`,
    text: `Bonjour ${user.fullName},\n\nVoici votre lien de connexion au portail jury VIBEATHON 2026 (expire dans ${LINK_TTL_MINUTES} minutes) :\n\n${link}\n\nSi vous n'avez pas demandé ce lien, ignorez cet e-mail.`,
  });

  return apiSuccess({ sent: true });
}
