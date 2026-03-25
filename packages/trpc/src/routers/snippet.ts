import { z } from 'zod';
import { prisma } from '@repo/db';
import { router, protectedProcedure } from '../trpc';

export const snippetRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
        language: z.string().optional(),
        tags: z.array(z.string()).optional(),
        search: z.string().optional(),
        favoritesOnly: z.boolean().default(false),
        cursor: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });

      const snippets = await prisma.snippet.findMany({
        where: {
          userId: user.id,
          ...(input.projectId && { projectId: input.projectId }),
          ...(input.language && { language: input.language }),
          ...(input.tags?.length && { tags: { hasSome: input.tags } }),
          ...(input.favoritesOnly && { isFavorite: true }),
          ...(input.search && {
            OR: [
              { title: { contains: input.search, mode: 'insensitive' as const } },
              { code: { contains: input.search, mode: 'insensitive' as const } },
              { description: { contains: input.search, mode: 'insensitive' as const } },
            ],
          }),
        },
        orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (snippets.length > input.limit) {
        const nextItem = snippets.pop();
        nextCursor = nextItem?.id;
      }

      return { snippets, nextCursor };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.snippet.findFirstOrThrow({
        where: { id: input.id, userId: user.id },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        language: z.string().min(1),
        code: z.string().min(1),
        description: z.string().optional(),
        projectId: z.string().optional(),
        tags: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      return prisma.snippet.create({
        data: { ...input, userId: user.id },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        language: z.string().optional(),
        code: z.string().optional(),
        description: z.string().nullable().optional(),
        projectId: z.string().nullable().optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      const { id, ...data } = input;
      return prisma.snippet.update({
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
      return prisma.snippet.delete({
        where: { id: input.id, userId: user.id },
      });
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findFirstOrThrow({
        where: { clerkId: ctx.userId },
      });
      const snippet = await prisma.snippet.findFirstOrThrow({
        where: { id: input.id, userId: user.id },
      });
      return prisma.snippet.update({
        where: { id: input.id },
        data: { isFavorite: !snippet.isFavorite },
      });
    }),

  getLanguages: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findFirstOrThrow({
      where: { clerkId: ctx.userId },
    });
    const result = await prisma.snippet.groupBy({
      by: ['language'],
      where: { userId: user.id },
      _count: { language: true },
      orderBy: { _count: { language: 'desc' } },
    });
    return result.map((r) => ({ language: r.language, count: r._count.language }));
  }),
});
