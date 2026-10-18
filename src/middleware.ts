import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/app" || pathname.startsWith("/app/") || pathname.startsWith("/invite/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/admin/")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/app", "/app/:path*", "/invite/:path*"],
};
