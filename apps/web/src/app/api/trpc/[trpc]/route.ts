import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { getServerSession } from 'next-auth';
import { appRouter, createTRPCContext } from '@repo/trpc';
import { authOptions } from '@/lib/auth';
import { prisma } from '@repo/db';

const DEV_USER_ID = 'dev-user';

async function getUserId(): Promise<string | null> {
  // 1. Try NextAuth (Google login)
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (dbUser) return dbUser.id;
    }
  } catch {
    // NextAuth not available, continue
  }

  // 2. Try Clerk if configured
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { auth } = await import('@clerk/nextjs/server');
      const { userId } = await auth();
      return userId;
    } catch {
      // Clerk not available
    }
  }

  // 3. Dev mode fallback
  return DEV_USER_ID;
}

const handler = async (req: Request) => {
  const userId = await getUserId();

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ userId }),
  });
};

export { handler as GET, handler as POST };
