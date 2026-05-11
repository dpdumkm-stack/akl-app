import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    const res = NextResponse.next();
    
    // Content Security Policy untuk dev mode (Turbopack)
    const cspHeader = `
        default-src 'self' *;
        script-src 'self' 'unsafe-eval' 'unsafe-inline' *;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' data: https://fonts.gstatic.com;
        img-src 'self' blob: data: *;
        connect-src 'self' ws:* http:* https:*;
        frame-src 'none';
        object-src 'none';
    `.replace(/\s{2,}/g, ' ').trim();

    res.headers.set('Content-Security-Policy', cspHeader);
    
    return res;
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|login|print|_next/static|_next/image|favicon.ico).*)",
  ],
};
