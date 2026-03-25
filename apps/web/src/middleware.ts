import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(request: NextRequest) {
  // If Clerk is not configured, allow all routes
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return NextResponse.next();
  }

  // Dynamically import Clerk middleware only when configured
  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');

  const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/clerk',
  ]);

  return clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await (auth as any).protect();
    }
  })(request, {} as never);
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
