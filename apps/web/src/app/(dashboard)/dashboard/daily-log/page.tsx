'use client';

import { useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@repo/ui';
import { Plus, Smile, Meh, Frown, Zap, X, BookOpen } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

const MOODS = [
  { value: 'GREAT', icon: '🔥', label: 'Great' },
  { value: 'GOOD', icon: '😊', label: 'Good' },
  { value: 'OKAY', icon: '😐', label: 'Okay' },
  { value: 'BAD', icon: '😕', label: 'Bad' },
  { value: 'TERRIBLE', icon: '😫', label: 'Terrible' },
] as const;

const ENERGY_LEVELS = [1, 2, 3, 4, 5];

export default function DailyLogPage() {
  const { data: todayLog, isLoading, refetch } = trpc.dailyLog.getToday.useQuery();
  const { data: weekLogs } = trpc.dailyLog.getWeekSummary.useQuery();

  const createLog = trpc.dailyLog.create.useMutation({
    onSuccess: () => refetch(),
  });

  const updateLog = trpc.dailyLog.update.useMutation({
    onSuccess: () => refetch(),
  });

  const [mood, setMood] = useState<string>(todayLog?.mood ?? '');
  const [energy, setEnergy] = useState(todayLog?.energyLevel ?? 3);
  const [summary, setSummary] = useState(todayLog?.summary ?? '');
  const [wins, setWins] = useState<string[]>(todayLog?.wins ?? []);
  const [blockers, setBlockers] = useState<string[]>(todayLog?.blockers ?? []);
  const [newWin, setNewWin] = useState('');
  const [newBlocker, setNewBlocker] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (todayLog && !initialized) {
    setMood(todayLog.mood ?? '');
    setEnergy(todayLog.energyLevel ?? 3);
    setSummary(todayLog.summary ?? '');
    setWins(todayLog.wins ?? []);
    setBlockers(todayLog.blockers ?? []);
    setInitialized(true);
  }

  const handleSave = () => {
    const data = {
      mood: mood as 'GREAT' | 'GOOD' | 'OKAY' | 'BAD' | 'TERRIBLE' | undefined,
      energyLevel: energy,
      summary,
      wins,
      blockers,
    };

    if (todayLog) {
      updateLog.mutate({ id: todayLog.id, ...data });
    } else {
      createLog.mutate({ date: new Date(), ...data });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-mono text-2xl font-bold text-text-primary">Daily Log</h1>
        <p className="text-sm text-text-secondary mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main log form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mood */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">How are you feeling?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(m.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                      mood === m.value
                        ? 'border-accent bg-accent-muted'
                        : 'border-border hover:border-border-hover'
                    }`}
                  >
                    <span className="text-2xl">{m.icon}</span>
                    <span className="text-[10px] font-mono text-text-secondary">{m.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Energy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-warning" />
                Energy Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {ENERGY_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setEnergy(level)}
                    className={`flex-1 h-10 rounded-md font-mono text-sm font-bold transition-all ${
                      energy >= level
                        ? 'bg-accent text-bg'
                        : 'bg-surface border border-border text-text-muted hover:border-border-hover'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Today&apos;s Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What did you work on today?"
                className="flex min-h-[120px] w-full rounded-md border border-border bg-bg px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-y"
              />
            </CardContent>
          </Card>

          {/* Wins and Blockers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-accent">Wins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {wins.map((win, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text-primary font-mono">
                    <span className="text-accent">+</span>
                    <span className="flex-1">{win}</span>
                    <button onClick={() => setWins(wins.filter((_, j) => j !== i))} className="text-text-muted hover:text-danger">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a win..."
                    value={newWin}
                    onChange={(e) => setNewWin(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newWin.trim()) {
                        setWins([...wins, newWin.trim()]);
                        setNewWin('');
                      }
                    }}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-danger">Blockers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {blockers.map((blocker, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-text-primary font-mono">
                    <span className="text-danger">!</span>
                    <span className="flex-1">{blocker}</span>
                    <button onClick={() => setBlockers(blockers.filter((_, j) => j !== i))} className="text-text-muted hover:text-danger">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a blocker..."
                    value={newBlocker}
                    onChange={(e) => setNewBlocker(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newBlocker.trim()) {
                        setBlockers([...blockers, newBlocker.trim()]);
                        setNewBlocker('');
                      }
                    }}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Button onClick={handleSave} isLoading={createLog.isLoading || updateLog.isLoading} className="w-full">
            {todayLog ? 'Update Log' : 'Save Log'}
          </Button>
        </div>

        {/* Week sidebar */}
        <div className="space-y-4">
          <h2 className="font-mono text-sm font-semibold text-text-primary">This Week</h2>
          {(weekLogs ?? []).map((log) => (
            <Card key={log.id} className="hover:border-border-hover transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-text-secondary">
                    {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-sm">
                    {MOODS.find((m) => m.value === log.mood)?.icon ?? '—'}
                  </span>
                </div>
                {log.summary && (
                  <p className="text-xs text-text-muted line-clamp-2">{log.summary}</p>
                )}
              </CardContent>
            </Card>
          ))}
          {(weekLogs ?? []).length === 0 && (
            <p className="text-xs text-text-muted">No logs this week yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
