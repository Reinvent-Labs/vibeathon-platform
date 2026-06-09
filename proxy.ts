import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  // Secure by default: staff areas are protected unless auth is explicitly
  // disabled (AUTH_REQUIRED="false"), e.g. for a local UI walkthrough.
  if (process.env.AUTH_REQUIRED === "false") return NextResponse.next();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;
  const path = request.nextUrl.pathname;
  const permitted =
    session &&
    (path.startsWith("/admin")
      ? ["SUPER_ADMIN", "ADMIN"].includes(session.role)
      : path.startsWith("/jury")
        ? ["SUPER_ADMIN", "ADMIN", "JURY"].includes(session.role)
        : path.startsWith("/scan")
          ? ["SUPER_ADMIN", "ADMIN", "SCANNER"].includes(session.role)
          : false);
  if (permitted) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/jury/:path*", "/scan/:path*"],
};
