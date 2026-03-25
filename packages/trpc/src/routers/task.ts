import { z } from 'zod';
import { prisma, TaskStatus, TaskPriority } from '@repo/db';
import { router, protectedProcedure } from '../trpc';

export const taskRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        status: z.nativeEnum(TaskStatus).optional(),
        priority: z.nativeEnum(TaskPriority).optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });

      const tasks = await prisma.task.findMany({
        where: {
          userId: user.id,
          ...(input.projectId && { projectId: input.projectId }),
          ...(input.status && { status: input.status }),
          ...(input.priority && { priority: input.priority }),
        },
        orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (tasks.length > input.limit) {
        const nextItem = tasks.pop();
        nextCursor = nextItem?.id;
      }

      return { tasks, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.task.findFirstOrThrow({
        where: { id: input.id, userId: user.id },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        projectId: z.string().optional(),
        priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
        dueDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.task.create({
        data: { ...input, userId: user.id },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().nullable().optional(),
        projectId: z.string().nullable().optional(),
        priority: z.nativeEnum(TaskPriority).optional(),
        dueDate: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      const { id, ...data } = input;
      return prisma.task.update({
        where: { id, userId: user.id },
        data,
      });
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(TaskStatus),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.task.update({
        where: { id: input.id, userId: user.id },
        data: {
          status: input.status,
          completedAt: input.status === TaskStatus.DONE ? new Date() : null,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.task.delete({
        where: { id: input.id, userId: user.id },
      });
    }),
});
