import { z } from 'zod';
import { prisma, FocusType } from '@repo/db';
import { router, protectedProcedure } from '../trpc';

export const focusRouter = router({
  start: protectedProcedure
    .input(
      z.object({
        type: z.nativeEnum(FocusType).default(FocusType.DEEP_WORK),
        duration: z.number().min(60).max(14400), // 1 min to 4 hours
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.focusSession.create({
        data: {
          userId: user.id,
          type: input.type,
          duration: input.duration,
          startedAt: new Date(),
        },
      });
    }),

  end: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      const session = await prisma.focusSession.findFirstOrThrow({
        where: { id: input.id, userId: user.id },
      });

      const endedAt = new Date();
      const actualDuration = Math.floor(
        (endedAt.getTime() - session.startedAt.getTime()) / 1000,
      );

      const updated = await prisma.focusSession.update({
        where: { id: input.id },
        data: {
          endedAt,
          duration: actualDuration,
          notes: input.notes,
        },
      });

      // Update daily stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.stat.upsert({
        where: { userId_date: { userId: user.id, date: today } },
        create: {
          userId: user.id,
          date: today,
          focusMinutes: Math.floor(actualDuration / 60),
        },
        update: {
          focusMinutes: { increment: Math.floor(actualDuration / 60) },
        },
      });

      return updated;
    }),

  list: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });

      const sessions = await prisma.focusSession.findMany({
        where: { userId: user.id },
        orderBy: { startedAt: 'desc' },
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (sessions.length > input.limit) {
        const nextItem = sessions.pop();
        nextCursor = nextItem?.id;
      }

      return { sessions, nextCursor };
    }),

  todayStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findFirstOrThrow({
      where: { clerkId: ctx.userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await prisma.focusSession.findMany({
      where: {
        userId: user.id,
        startedAt: { gte: today, lt: tomorrow },
        endedAt: { not: null },
      },
    });

    const totalSeconds = sessions.reduce((acc, s) => acc + s.duration, 0);
    return {
      totalMinutes: Math.floor(totalSeconds / 60),
      sessionCount: sessions.length,
    };
  }),
});
