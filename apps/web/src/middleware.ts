import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  // Allow all auth-related routes (NextAuth + Clerk)
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/sign-in') ||
    pathname.startsWith('/sign-up') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // If Clerk is configured, use Clerk middleware
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');

    const isPublicRoute = createRouteMatcher([
      '/',
      '/sign-in(.*)',
      '/sign-up(.*)',
      '/api/auth(.*)',
      '/api/webhooks/clerk',
    ]);

    return clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await (auth as any).protect();
      }
    })(request, {} as never);
  }

  // Otherwise allow all routes (NextAuth handles its own protection)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
