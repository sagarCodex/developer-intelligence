import { router } from './trpc';
import { userRouter } from './routers/user';
import { noteRouter } from './routers/note';
import { snippetRouter } from './routers/snippet';
import { taskRouter } from './routers/task';
import { focusRouter } from './routers/focus';
import { dailyLogRouter } from './routers/daily-log';
import { projectRouter } from './routers/project';
import { statsRouter } from './routers/stats';

export const appRouter = router({
  user: userRouter,
  note: noteRouter,
  snippet: snippetRouter,
  task: taskRouter,
  focus: focusRouter,
  dailyLog: dailyLogRouter,
  project: projectRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
