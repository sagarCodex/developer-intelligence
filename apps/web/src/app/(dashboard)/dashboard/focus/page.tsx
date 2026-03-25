'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

const PRESET_DURATIONS = [
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '60m', seconds: 60 * 60 },
  { label: '90m', seconds: 90 * 60 },
];

type TimerState = 'idle' | 'running' | 'paused';

export default function FocusPage() {
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: todayStats } = trpc.focus.todayStats.useQuery();
  const { data: history, refetch: refetchHistory } = trpc.focus.list.useQuery({ limit: 10 });

  const startSession = trpc.focus.start.useMutation({
    onSuccess: (session) => {
      setActiveSessionId(session.id);
    },
  });

  const endSession = trpc.focus.end.useMutation({
    onSuccess: () => {
      setActiveSessionId(null);
      refetchHistory();
    },
  });

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (timerState === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval_();
            setTimerState('idle');
            if (activeSessionId) {
              endSession.mutate({ id: activeSessionId });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval_();
    }
    return clearInterval_;
  }, [timerState, activeSessionId, clearInterval_, endSession]);

  const handleStart = () => {
    if (timerState === 'idle') {
      setTimeLeft(duration);
      startSession.mutate({ duration, type: 'DEEP_WORK' });
    }
    setTimerState('running');
  };

  const handlePause = () => {
    setTimerState('paused');
  };

  const handleReset = () => {
    clearInterval_();
    setTimerState('idle');
    setTimeLeft(duration);
    if (activeSessionId) {
      endSession.mutate({ id: activeSessionId });
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-mono text-2xl font-bold text-text-primary">Deep Work Focus</h1>
        <p className="text-sm text-text-secondary mt-1">
          {todayStats ? `${todayStats.totalMinutes}m focused today (${todayStats.sessionCount} sessions)` : 'Loading...'}
        </p>
      </div>

      {/* Timer */}
      <Card variant="elevated" className="overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-surface-hover">
          <div
            className="h-full bg-accent transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <CardContent className="p-12 text-center">
          {/* Duration presets */}
          {timerState === 'idle' && (
            <div className="flex gap-3 justify-center mb-8">
              {PRESET_DURATIONS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setDuration(preset.seconds);
                    setTimeLeft(preset.seconds);
                  }}
                  className={`px-4 py-2 rounded-md font-mono text-sm transition-colors ${
                    duration === preset.seconds
                      ? 'bg-accent-muted text-accent border border-accent'
                      : 'bg-surface border border-border text-text-secondary hover:border-border-hover'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}

          {/* Time display */}
          <div className="font-mono text-8xl font-bold text-text-primary mb-8 tabular-nums">
            <span className={timerState === 'running' ? 'text-accent' : ''}>
              {String(minutes).padStart(2, '0')}
            </span>
            <span className={timerState === 'running' ? 'text-accent animate-cursor-blink' : 'text-text-muted'}>
              :
            </span>
            <span className={timerState === 'running' ? 'text-accent' : ''}>
              {String(seconds).padStart(2, '0')}
            </span>
          </div>

          {/* Controls */}
          <div className="flex gap-4 justify-center">
            {timerState === 'idle' && (
              <Button size="lg" onClick={handleStart}>
                <Play className="h-5 w-5" />
                Start Focus
              </Button>
            )}
            {timerState === 'running' && (
              <Button size="lg" variant="secondary" onClick={handlePause}>
                <Pause className="h-5 w-5" />
                Pause
              </Button>
            )}
            {timerState === 'paused' && (
              <>
                <Button size="lg" onClick={handleStart}>
                  <Play className="h-5 w-5" />
                  Resume
                </Button>
                <Button size="lg" variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-5 w-5" />
                  Reset
                </Button>
              </>
            )}
            {timerState === 'running' && (
              <Button size="lg" variant="danger" onClick={handleReset}>
                <RotateCcw className="h-5 w-5" />
                Stop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session history */}
      <div>
        <h2 className="font-mono text-lg font-semibold text-text-primary mb-4">Recent Sessions</h2>
        {history?.sessions.length === 0 ? (
          <p className="text-sm text-text-secondary">No focus sessions yet. Start your first one above.</p>
        ) : (
          <div className="space-y-2">
            {history?.sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Timer className="h-4 w-4 text-accent" />
                    <span className="font-mono text-sm text-text-primary">
                      {Math.floor(session.duration / 60)}m {session.duration % 60}s
                    </span>
                    <Badge variant="default" className="text-[10px]">
                      {session.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="text-xs text-text-muted font-mono">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
