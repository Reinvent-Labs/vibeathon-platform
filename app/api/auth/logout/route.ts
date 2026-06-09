import { cookies } from "next/headers";
import { apiError, apiSuccess } from "@/lib/api";
import { getSession, isSameOrigin, SESSION_COOKIE } from "@/lib/auth";
import { requestIp, writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const session = await getSession();
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  if (session) {
    await writeAuditLog({
      actorId: session.userId,
      action: "AUTH_LOGOUT",
      entityType: "AdminUser",
      entityId: session.userId,
      ipAddress: requestIp(request),
    });
  }
  return apiSuccess({ loggedOut: true });
}
