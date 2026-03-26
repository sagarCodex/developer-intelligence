import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create dev user if it doesn't exist
  const user = await prisma.user.upsert({
    where: { clerkId: 'dev-user' },
    update: {},
    create: {
      clerkId: 'dev-user',
      email: 'dev@developer-intelligence.local',
      name: 'Terminal_User',
      timezone: 'UTC',
    },
  });

  console.log(`✅ Dev user ready: ${user.id} (${user.email})`);

  // Create a sample project
  const project = await prisma.project.upsert({
    where: { id: 'dev-project-1' },
    update: {},
    create: {
      id: 'dev-project-1',
      userId: user.id,
      name: 'Developer Intelligence',
      description: 'Personal knowledge OS for developers',
      color: '#00E5C8',
    },
  });

  console.log(`✅ Sample project: ${project.name}`);

  // Create sample notes
  const notes = [
    {
      id: 'dev-note-1',
      title: 'Getting Started with Developer Intelligence',
      content: `# Welcome to Developer Intelligence\n\nThis is your personal knowledge OS. Here's what you can do:\n\n- **Notes**: Capture ideas, learnings, and documentation\n- **Snippets**: Save reusable code with syntax highlighting\n- **Tasks**: Track your work with status and priority\n- **Focus Timer**: Deep work sessions with Pomodoro-style timer\n- **Daily Log**: Reflect on your day with mood and energy tracking\n- **Stats**: Visualize your productivity patterns\n\n> "The best way to predict the future is to create it." — Peter Drucker`,
      tags: ['welcome', 'getting-started'],
      isPinned: true,
    },
    {
      id: 'dev-note-2',
      title: 'Vim Cheatsheet',
      content: `# Essential Vim Commands\n\n## Navigation\n- \`h j k l\` — left, down, up, right\n- \`w b\` — word forward/backward\n- \`gg G\` — top/bottom of file\n- \`0 $\` — start/end of line\n\n## Editing\n- \`i a\` — insert before/after cursor\n- \`o O\` — new line below/above\n- \`dd\` — delete line\n- \`yy p\` — yank and paste\n\n## Search\n- \`/pattern\` — search forward\n- \`n N\` — next/previous match`,
      tags: ['vim', 'cheatsheet', 'tools'],
      isPinned: false,
    },
  ];

  for (const note of notes) {
    await prisma.note.upsert({
      where: { id: note.id },
      update: {},
      create: {
        ...note,
        userId: user.id,
        projectId: project.id,
      },
    });
  }

  console.log(`✅ Sample notes created: ${notes.length}`);

  // Create sample snippets
  const snippets = [
    {
      id: 'dev-snippet-1',
      title: 'React Custom Hook — useDebounce',
      language: 'typescript',
      code: `import { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n\n  useEffect(() => {\n    const handler = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delay);\n\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n\n  return debouncedValue;\n}`,
      description: 'A reusable debounce hook for search inputs and API calls',
      tags: ['react', 'hooks', 'typescript'],
      isFavorite: true,
    },
    {
      id: 'dev-snippet-2',
      title: 'Prisma Singleton Pattern',
      language: 'typescript',
      code: `import { PrismaClient } from '@prisma/client';\n\nconst globalForPrisma = globalThis as unknown as {\n  prisma: PrismaClient | undefined;\n};\n\nexport const prisma =\n  globalForPrisma.prisma ??\n  new PrismaClient({\n    log: process.env.NODE_ENV === 'development'\n      ? ['query', 'error', 'warn']\n      : ['error'],\n  });\n\nif (process.env.NODE_ENV !== 'production') {\n  globalForPrisma.prisma = prisma;\n}`,
      description: 'Prevent multiple Prisma instances in Next.js dev mode',
      tags: ['prisma', 'nextjs', 'database'],
      isFavorite: true,
    },
  ];

  for (const snippet of snippets) {
    await prisma.snippet.upsert({
      where: { id: snippet.id },
      update: {},
      create: {
        ...snippet,
        userId: user.id,
        projectId: project.id,
      },
    });
  }

  console.log(`✅ Sample snippets created: ${snippets.length}`);

  // Create sample tasks
  const tasks = [
    {
      id: 'dev-task-1',
      title: 'Set up CI/CD pipeline',
      status: 'TODO' as const,
      priority: 'HIGH' as const,
    },
    {
      id: 'dev-task-2',
      title: 'Write unit tests for tRPC routers',
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
    },
    {
      id: 'dev-task-3',
      title: 'Configure Prisma schema',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      completedAt: new Date(),
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        ...task,
        userId: user.id,
        projectId: project.id,
      },
    });
  }

  console.log(`✅ Sample tasks created: ${tasks.length}`);

  // Create settings
  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'dark',
      focusDuration: 1500,
      breakDuration: 300,
      dailyGoalMinutes: 240,
    },
  });

  console.log(`✅ Settings configured`);
  console.log(`\n🚀 Seed complete! Start the app with: pnpm dev`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
