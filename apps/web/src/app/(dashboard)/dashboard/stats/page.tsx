'use client';

import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton } from '@repo/ui';
import { Flame, Timer, FileText, Code2, CheckSquare, TrendingUp } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export default function StatsPage() {
  const { data: summary, isLoading: summaryLoading } = trpc.stats.getSummary.useQuery();
  const { data: weeklyStats, isLoading: weeklyLoading } = trpc.stats.getWeeklyStats.useQuery();
  const { data: streakInfo, isLoading: streakLoading } = trpc.stats.getStreakInfo.useQuery();

  const isLoading = summaryLoading || weeklyLoading || streakLoading;
  const streak = streakInfo?.currentStreak ?? 0;
  const activityData = streakInfo?.activityData ?? [];

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Top stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center space-y-2">
                <Skeleton className="h-5 w-5 mx-auto" />
                <Skeleton className="h-7 w-12 mx-auto" />
                <Skeleton className="h-3 w-14 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Heatmap skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>

        {/* Weekly breakdown skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 flex-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-mono text-2xl font-bold text-text-primary">Personal Stats</h1>
        <p className="text-sm text-text-secondary mt-1">Track your growth and consistency</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MiniStat icon={Flame} label="Streak" value={`${streak}d`} accent />
        <MiniStat icon={Timer} label="Focus Today" value={`${summary?.todayFocusMinutes ?? 0}m`} />
        <MiniStat icon={CheckSquare} label="Tasks Done" value={String(summary?.totalTasksCompleted ?? 0)} />
        <MiniStat icon={FileText} label="Notes" value={String(summary?.totalNotes ?? 0)} />
        <MiniStat icon={Code2} label="Snippets" value={String(summary?.totalSnippets ?? 0)} />
        <MiniStat icon={TrendingUp} label="Projects" value={String(summary?.activeProjects ?? 0)} />
      </div>

      {/* Activity heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-accent" />
            Activity Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap data={activityData} />
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-[10px] text-text-muted">Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: getHeatmapColor(level) }}
              />
            ))}
            <span className="text-[10px] text-text-muted">More</span>
          </div>
        </CardContent>
      </Card>

      {/* Weekly breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          {(weeklyStats ?? []).length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">
              No activity data this week. Start focusing to see your stats!
            </p>
          ) : (
            <div className="space-y-3">
              {(weeklyStats ?? []).map((stat) => (
                <div key={stat.id} className="flex items-center gap-4">
                  <span className="font-mono text-xs text-text-secondary w-20">
                    {new Date(stat.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 flex gap-2">
                    <BarSegment value={stat.focusMinutes} max={240} color="bg-accent" label={`${stat.focusMinutes}m focus`} />
                  </div>
                  <div className="flex gap-3 text-[10px] text-text-muted font-mono">
                    <span>{stat.tasksCompleted} tasks</span>
                    <span>{stat.notesCreated} notes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <Icon className={`h-5 w-5 mx-auto mb-2 ${accent ? 'text-accent' : 'text-text-secondary'}`} />
        <p className="font-mono text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-[10px] text-text-muted mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

function BarSegment({
  value,
  max,
  color,
  label,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
}) {
  const width = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex-1 group relative">
      <div className="h-6 bg-surface rounded-md overflow-hidden">
        <div
          className={`h-full ${color} rounded-md transition-all duration-500`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-text-primary opacity-0 group-hover:opacity-100 transition-opacity">
        {label}
      </span>
    </div>
  );
}

function ActivityHeatmap({ data }: { data: Array<{ date: Date; focusMinutes: number; tasksCompleted: number }> }) {
  // Generate last 52 weeks (364 days) of cells
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells: Array<{ date: Date; level: number }> = [];

  const dataMap = new Map<string, number>();
  for (const d of data) {
    const key = new Date(d.date).toISOString().split('T')[0];
    dataMap.set(key ?? '', (d.focusMinutes ?? 0) + (d.tasksCompleted ?? 0) * 10);
  }

  for (let i = 363; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0] ?? '';
    const activity = dataMap.get(key) ?? 0;
    let level = 0;
    if (activity > 0) level = 1;
    if (activity >= 30) level = 2;
    if (activity >= 60) level = 3;
    if (activity >= 120) level = 4;
    cells.push({ date, level });
  }

  // Arrange into 7 rows (days of week) x 52 columns (weeks)
  const weeks: Array<Array<{ date: Date; level: number } | null>> = [];
  let currentWeek: Array<{ date: Date; level: number } | null> = [];

  // Pad the first week
  const firstDay = cells[0]?.date.getDay() ?? 0;
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push(null);
  }

  for (const cell of cells) {
    currentWeek.push(cell);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] min-w-[700px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((cell, di) => (
              <div
                key={di}
                className="h-3 w-3 rounded-sm transition-colors"
                style={{ backgroundColor: cell ? getHeatmapColor(cell.level) : 'transparent' }}
                title={cell ? `${cell.date.toLocaleDateString()}: level ${cell.level}` : ''}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function getHeatmapColor(level: number): string {
  const colors = [
    '#1A1A1A', // 0 - no activity
    '#004D40', // 1 - low
    '#00796B', // 2 - medium
    '#009688', // 3 - high
    '#00E5C8', // 4 - very high
  ];
  return colors[level] ?? colors[0] ?? '#1A1A1A';
}
