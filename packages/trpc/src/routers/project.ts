import { z } from 'zod';
import { prisma } from '@repo/db';
import { router, protectedProcedure } from '../trpc';

export const projectRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        includeArchived: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.project.findMany({
        where: {
          userId: user.id,
          ...(!input.includeArchived && { isArchived: false }),
        },
        include: {
          _count: {
            select: { notes: true, snippets: true, tasks: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.project.findFirstOrThrow({
        where: { id: input.id, userId: user.id },
        include: {
          _count: {
            select: { notes: true, snippets: true, tasks: true },
          },
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#00E5C8'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.project.create({
        data: { ...input, userId: user.id },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().nullable().optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      const { id, ...data } = input;
      return prisma.project.update({
        where: { id, userId: user.id },
        data,
      });
    }),

  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.project.update({
        where: { id: input.id, userId: user.id },
        data: { isArchived: true },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.project.delete({
        where: { id: input.id, userId: user.id },
      });
    }),
});
