import { type CreateTRPCReact, createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@repo/trpc';

export const trpc: CreateTRPCReact<AppRouter, unknown, null> = createTRPCReact<AppRouter>();
