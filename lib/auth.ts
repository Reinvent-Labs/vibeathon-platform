import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "vibeathon_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

export type SessionPayload = {
  userId: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "JURY" | "SCANNER";
  mustChangePassword?: boolean;
};

function sessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("vibeathon-platform")
    .setAudience("vibeathon-staff")
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(sessionKey());
}

export async function readSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, sessionKey(), {
      issuer: "vibeathon-platform",
      audience: "vibeathon-staff",
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return token ? readSessionToken(token) : null;
}

export async function requireRole(
  allowed: SessionPayload["role"][],
): Promise<
  (SessionPayload & { fullName: string; active: true }) | null
> {
  const session = await getSession();
  if (
    !session ||
    session.mustChangePassword ||
    !allowed.includes(session.role) ||
    !prisma
  ) {
    return null;
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      active: true,
      mustChangePassword: true,
    },
  });
  if (
    !user?.active ||
    user.email !== session.email ||
    user.role !== session.role ||
    user.mustChangePassword ||
    !allowed.includes(user.role)
  ) {
    return null;
  }
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    mustChangePassword: false,
    fullName: user.fullName,
    active: true,
  };
}

// Compare by HOST (not full origin) so a TLS-terminating proxy (Caddy sees
// https, the app is reached over http internally) does not trip the CSRF check.
// x-forwarded-host is NOT used to build the allowlist — it is attacker-controllable
// without a strict proxy. Only env vars and the intrinsic request URL are trusted.
export function isSameOrigin(request: Request) {
  const allowedHosts = new Set<string>();
  const addHost = (value: string | null | undefined) => {
    if (!value) return;
    const first = value.split(",")[0]?.trim();
    if (!first) return;
    try {
      allowedHosts.add(new URL(first).host);
    } catch {
      allowedHosts.add(first); // bare "host" or "host:port"
    }
  };

  try {
    allowedHosts.add(new URL(request.url).host);
  } catch {
    // ignore unparseable request URL
  }
  addHost(process.env.APP_ORIGIN);
  addHost(process.env.NEXT_PUBLIC_APP_URL);
  // DOMAIN is the Caddy/reverse-proxy hostname (e.g. vibethon.reinvent-labs.com)
  addHost(process.env.DOMAIN ? `https://${process.env.DOMAIN}` : undefined);

  const source = request.headers.get("origin") ?? request.headers.get("referer");
  if (source) {
    try {
      return allowedHosts.has(new URL(source).host);
    } catch {
      return false;
    }
  }
  // No Origin/Referer: non-browser client or same-origin server navigation.
  return process.env.NODE_ENV !== "production";
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_DURATION_SECONDS,
  path: "/",
};
