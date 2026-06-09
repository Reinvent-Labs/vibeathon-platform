import { cookies } from "next/headers";
import { apiSuccess } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return apiSuccess({ loggedOut: true });
}
