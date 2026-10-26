import { NextResponse } from "next/server";
import { COOKIE, verifySessionToken } from "@/lib/auth";

// Next.js 16 name for what used to be middleware.js.
// Everything except /login requires a valid signed session cookie.
export async function proxy(request) {
  const authed = await verifySessionToken(request.cookies.get(COOKIE)?.value);
  const onLogin = request.nextUrl.pathname === "/login";

  if (!authed && !onLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (authed && onLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
