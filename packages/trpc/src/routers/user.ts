import { z } from 'zod';
import { prisma } from '@repo/db';
import { router, publicProcedure, protectedProcedure } from '../trpc';

export const userRouter = router({
  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findFirst({
      where: { clerkId: ctx.userId },
      include: { settings: true },
    });
    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        timezone: z.string().optional(),
        avatarUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.user.update({
        where: { clerkId: ctx.userId },
        data: input,
      });
    }),

  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findFirstOrThrow({
      where: { clerkId: ctx.userId },
    });
    return prisma.settings.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        theme: z.string().optional(),
        focusDuration: z.number().min(60).max(7200).optional(),
        breakDuration: z.number().min(60).max(3600).optional(),
        dailyGoalMinutes: z.number().min(30).max(720).optional(),
        notificationsEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.settings.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...input },
        update: input,
      });
    }),

  syncClerkUser: publicProcedure
    .input(
      z.object({
        clerkId: z.string(),
        email: z.string().email(),
        name: z.string().nullable().optional(),
        avatarUrl: z.string().nullable().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return prisma.user.upsert({
        where: { clerkId: input.clerkId },
        create: {
          clerkId: input.clerkId,
          email: input.email,
          name: input.name ?? undefined,
          avatarUrl: input.avatarUrl ?? undefined,
        },
        update: {
          email: input.email,
          name: input.name ?? undefined,
          avatarUrl: input.avatarUrl ?? undefined,
        },
      });
    }),
});
