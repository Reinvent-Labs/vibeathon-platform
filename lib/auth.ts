import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "vibeathon_session";

export type SessionPayload = {
  userId: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "JURY" | "SCANNER";
};

function sessionKey() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "development-only-change-me",
  );
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(sessionKey());
}

export async function readSessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, sessionKey());
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
): Promise<SessionPayload | null> {
  if (process.env.AUTH_REQUIRED !== "true") {
    return {
      userId: "development-user",
      email: "dev@localhost",
      role: allowed[0] ?? "SUPER_ADMIN",
    };
  }
  const session = await getSession();
  return session && allowed.includes(session.role) ? session : null;
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}
