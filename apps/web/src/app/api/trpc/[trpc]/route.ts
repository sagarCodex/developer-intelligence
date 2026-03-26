import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createTRPCContext } from '@repo/trpc';

const DEV_USER_ID = 'dev-user';

async function getUserId(): Promise<string | null> {
  // If Clerk is configured, use it
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { auth } = await import('@clerk/nextjs/server');
      const { userId } = await auth();
      return userId;
    } catch {
      return null;
    }
  }
  // Dev mode: return a hardcoded user ID
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
