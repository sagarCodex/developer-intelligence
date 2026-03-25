import { z } from 'zod';
import { prisma, Mood } from '@repo/db';
import { router, protectedProcedure } from '../trpc';

export const dailyLogRouter = router({
  getByDate: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });

      const dateStart = new Date(input.date);
      dateStart.setHours(0, 0, 0, 0);

      return prisma.dailyLog.findUnique({
        where: { userId_date: { userId: user.id, date: dateStart } },
      });
    }),

  getToday: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findFirstOrThrow({
      where: { clerkId: ctx.userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.dailyLog.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        date: z.date(),
        mood: z.nativeEnum(Mood).optional(),
        energyLevel: z.number().min(1).max(5).optional(),
        summary: z.string().optional(),
        wins: z.array(z.string()).default([]),
        blockers: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });

      const dateStart = new Date(input.date);
      dateStart.setHours(0, 0, 0, 0);

      return prisma.dailyLog.upsert({
        where: { userId_date: { userId: user.id, date: dateStart } },
        create: { ...input, date: dateStart, userId: user.id },
        update: { ...input, date: dateStart },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        mood: z.nativeEnum(Mood).optional(),
        energyLevel: z.number().min(1).max(5).optional(),
        summary: z.string().optional(),
        wins: z.array(z.string()).optional(),
        blockers: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      const { id, ...data } = input;
      return prisma.dailyLog.update({
        where: { id, userId: user.id },
        data,
      });
    }),

  getWeekSummary: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findFirstOrThrow({
      where: { clerkId: ctx.userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return prisma.dailyLog.findMany({
      where: {
        userId: user.id,
        date: { gte: weekAgo, lte: today },
      },
      orderBy: { date: 'desc' },
    });
  }),
});
