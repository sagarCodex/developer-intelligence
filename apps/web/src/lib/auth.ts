import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@repo/db';

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Upsert user in our database on every sign-in
      try {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name || undefined,
            avatarUrl: user.image || undefined,
          },
          create: {
            clerkId: account?.providerAccountId || user.id,
            email: user.email,
            name: user.name || null,
            avatarUrl: user.image || null,
          },
        });
      } catch (error) {
        console.error('Failed to upsert user:', error);
      }

      return true;
    },
    async session({ session, token }) {
      // Attach our DB user ID to the session
      if (session.user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, clerkId: true },
          });
          if (dbUser) {
            (session as any).userId = dbUser.id;
            (session as any).dbUserId = dbUser.id;
          }
        } catch (error) {
          console.error('Failed to fetch user:', error);
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
  },
  session: {
    strategy: 'jwt',
  },
};
