import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    const res = NextResponse.next();
    
    // Content Security Policy untuk dev mode (Turbopack)
    const cspHeader = `
        default-src 'self' http://localhost:* http://127.0.0.1:*;
        script-src 'self' 'unsafe-eval' 'unsafe-inline' http://localhost:* http://127.0.0.1:*;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' data: https://fonts.gstatic.com;
        img-src 'self' blob: data: http://localhost:* http://127.0.0.1:*;
        connect-src 'self' ws://localhost:* ws://127.0.0.1:* http://localhost:* http://127.0.0.1:*;
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
