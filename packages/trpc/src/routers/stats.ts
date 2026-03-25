import { z } from 'zod';
import { prisma } from '@repo/db';
import { router, protectedProcedure } from '../trpc';

export const statsRouter = router({
  getDailyStats: protectedProcedure
    .input(z.object({ date: z.date().optional() }))
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });

      const date = input.date ?? new Date();
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);

      return prisma.stat.findUnique({
        where: { userId_date: { userId: user.id, date: dateStart } },
      });
    }),

  getWeeklyStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findFirstOrThrow({
      where: { clerkId: ctx.userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return prisma.stat.findMany({
      where: {
        userId: user.id,
        date: { gte: weekAgo, lte: today },
      },
      orderBy: { date: 'asc' },
    });
  }),

  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findFirstOrThrow({
      where: { clerkId: ctx.userId },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayStats, totalTasks, totalNotes, totalSnippets, activeProjects, currentStreak] =
      await Promise.all([
        prisma.stat.findUnique({
          where: { userId_date: { userId: user.id, date: today } },
        }),
        prisma.task.count({
          where: { userId: user.id, status: 'DONE' },
        }),
        prisma.note.count({ where: { userId: user.id } }),
        prisma.snippet.count({ where: { userId: user.id } }),
        prisma.project.count({
          where: { userId: user.id, isArchived: false },
        }),
        prisma.stat.findFirst({
          where: { userId: user.id },
          orderBy: { date: 'desc' },
          select: { streakDays: true },
        }),
      ]);

    return {
      todayFocusMinutes: todayStats?.focusMinutes ?? 0,
      todayTasksCompleted: todayStats?.tasksCompleted ?? 0,
      totalTasksCompleted: totalTasks,
      totalNotes,
      totalSnippets,
      activeProjects,
      streakDays: currentStreak?.streakDays ?? 0,
    };
  }),

  getStreakInfo: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findFirstOrThrow({
      where: { clerkId: ctx.userId },
    });

    const stats = await prisma.stat.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 365,
      select: { date: true, focusMinutes: true, tasksCompleted: true },
    });

    // Calculate current streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i];
      if (!stat) break;

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      const statDate = new Date(stat.date);
      statDate.setHours(0, 0, 0, 0);

      if (statDate.getTime() !== expectedDate.getTime()) break;
      if (stat.focusMinutes > 0 || stat.tasksCompleted > 0) {
        streak++;
      } else {
        break;
      }
    }

    return {
      currentStreak: streak,
      activityData: stats.map((s) => ({
        date: s.date,
        focusMinutes: s.focusMinutes,
        tasksCompleted: s.tasksCompleted,
      })),
    };
  }),
});
