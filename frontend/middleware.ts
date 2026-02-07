import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  // Allow the request to proceed and handle auth on the client side
  // Since we're not using nextCookies plugin, server-side auth checks won't work properly
  
  // For protected routes, let the client-side code handle authentication
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};