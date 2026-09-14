import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export const config = {
  matcher: ["/api/admin/:path*", "/admin/:path*"],
};

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    // Must match the sign-in flow's own default (@auth/core lib/init.js:
    // `config.useSecureCookies ?? url.protocol === "https:"`), or getToken()
    // looks up the plain `authjs.session-token` cookie while the browser
    // actually holds `__Secure-authjs.session-token`, silently finding
    // nothing and bouncing every logged-in request back to /admin/login.
    secureCookie: request.nextUrl.protocol === "https:",
  });
  if (token) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}
