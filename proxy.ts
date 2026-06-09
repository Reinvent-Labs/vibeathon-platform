import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await readSessionToken(token) : null;
  const path = request.nextUrl.pathname;
  if (session?.mustChangePassword && path !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }
  if (
    session &&
    !session.mustChangePassword &&
    path === "/change-password"
  ) {
    const destination =
      session.role === "JURY"
        ? "/jury"
        : session.role === "SCANNER"
          ? "/scan"
          : "/admin";
    return NextResponse.redirect(new URL(destination, request.url));
  }
  const permitted =
    session &&
    (path.startsWith("/change-password")
      ? Boolean(session.mustChangePassword)
      : session.mustChangePassword
        ? false
        : path.startsWith("/admin")
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
  matcher: [
    "/admin/:path*",
    "/jury/:path*",
    "/scan/:path*",
    "/change-password",
  ],
};
