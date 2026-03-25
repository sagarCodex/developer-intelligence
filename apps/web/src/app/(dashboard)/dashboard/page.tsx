'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Timer, CheckSquare, Flame, FolderKanban } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export default function DashboardPage() {
  const { data: summary, isLoading } = trpc.stats.getSummary.useQuery();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Greeting */}
      <div>
        <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-border bg-surface px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-xs text-accent">system online</span>
        </div>
        <h1 className="font-mono text-2xl font-bold text-text-primary">
          We&apos;re good to go now.
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Here&apos;s your overview for today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Timer}
          label="Focus Time"
          value={isLoading ? '—' : `${summary?.todayFocusMinutes ?? 0}m`}
          subtitle="today"
        />
        <StatCard
          icon={CheckSquare}
          label="Tasks Done"
          value={isLoading ? '—' : String(summary?.todayTasksCompleted ?? 0)}
          subtitle="today"
        />
        <StatCard
          icon={Flame}
          label="Streak"
          value={isLoading ? '—' : `${summary?.streakDays ?? 0} days`}
          subtitle="consecutive"
          accent
        />
        <StatCard
          icon={FolderKanban}
          label="Projects"
          value={isLoading ? '—' : String(summary?.activeProjects ?? 0)}
          subtitle="active"
        />
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-bold text-text-primary">
              {isLoading ? '—' : summary?.totalNotes ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Snippets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-bold text-text-primary">
              {isLoading ? '—' : summary?.totalSnippets ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-bold text-text-primary">
              {isLoading ? '—' : summary?.totalTasksCompleted ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle: string;
  accent?: boolean;
}) {
  return (
    <Card variant="elevated">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-md ${
              accent ? 'bg-accent-muted' : 'bg-surface-hover'
            }`}
          >
            <Icon className={`h-5 w-5 ${accent ? 'text-accent' : 'text-text-secondary'}`} />
          </div>
          <div>
            <p className="text-xs text-text-secondary font-mono">{label}</p>
            <p className="font-mono text-xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-muted">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
