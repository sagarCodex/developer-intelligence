import { z } from 'zod';
import { prisma } from '@repo/db';
import { router, protectedProcedure } from '../trpc';

export const noteRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        tags: z.array(z.string()).optional(),
        search: z.string().optional(),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });

      const notes = await prisma.note.findMany({
        where: {
          userId: user.id,
          ...(input.projectId && { projectId: input.projectId }),
          ...(input.tags?.length && { tags: { hasSome: input.tags } }),
          ...(input.search && {
            OR: [
              { title: { contains: input.search, mode: 'insensitive' as const } },
              { content: { contains: input.search, mode: 'insensitive' as const } },
            ],
          }),
        },
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (notes.length > input.limit) {
        const nextItem = notes.pop();
        nextCursor = nextItem?.id;
      }

      return { notes, nextCursor };
    }),

  getById: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    const user = await prisma.user.findFirstOrThrow({
      where: { clerkId: ctx.userId },
    });
    return prisma.note.findFirstOrThrow({
      where: { id: input.id, userId: user.id },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().default(''),
        projectId: z.string().optional(),
        tags: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.note.create({
        data: { ...input, userId: user.id },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().optional(),
        projectId: z.string().nullable().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      const { id, ...data } = input;
      return prisma.note.update({
        where: { id, userId: user.id },
        data,
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.note.delete({
        where: { id: input.id, userId: user.id },
      });
    }),

  togglePin: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      const note = await prisma.note.findFirstOrThrow({
        where: { id: input.id, userId: user.id },
      });
      return prisma.note.update({
        where: { id: input.id },
        data: { isPinned: !note.isPinned },
      });
    }),
});
