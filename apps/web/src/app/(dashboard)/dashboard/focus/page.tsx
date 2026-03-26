'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@repo/ui';
import { Play, Pause, RotateCcw, Timer, Plus, Minus, Settings2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

const PRESET_DURATIONS = [
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '60m', seconds: 60 * 60 },
  { label: '90m', seconds: 90 * 60 },
];

const FOCUS_TYPES = [
  { label: 'Deep Work', value: 'DEEP_WORK' as const },
  { label: 'Shallow Work', value: 'SHALLOW_WORK' as const },
  { label: 'Learning', value: 'LEARNING' as const },
  { label: 'Break', value: 'BREAK' as const },
];

type TimerState = 'idle' | 'running' | 'paused';

export default function FocusPage() {
  const [duration, setDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [focusType, setFocusType] = useState<'DEEP_WORK' | 'SHALLOW_WORK' | 'LEARNING' | 'BREAK'>('DEEP_WORK');
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustom, setShowCustom] = useState(false);
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
      startSession.mutate({ duration, type: focusType });
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

  const adjustDuration = (delta: number) => {
    const newDuration = Math.max(60, Math.min(180 * 60, duration + delta * 60));
    setDuration(newDuration);
    if (timerState === 'idle') {
      setTimeLeft(newDuration);
    }
  };

  const handleCustomSubmit = () => {
    const mins = parseInt(customMinutes);
    if (mins > 0 && mins <= 180) {
      const newDuration = mins * 60;
      setDuration(newDuration);
      setTimeLeft(newDuration);
      setShowCustom(false);
      setCustomMinutes('');
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  const durationMinutes = Math.floor(duration / 60);

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

        <CardContent className="p-8 md:p-12 text-center">
          {/* Timer config - only visible when idle */}
          {timerState === 'idle' && (
            <div className="space-y-6 mb-8">
              {/* Duration presets */}
              <div className="flex flex-wrap gap-2 justify-center items-center">
                {PRESET_DURATIONS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setDuration(preset.seconds);
                      setTimeLeft(preset.seconds);
                      setShowCustom(false);
                    }}
                    className={`px-4 py-2 rounded-md font-mono text-sm transition-colors ${
                      duration === preset.seconds && !showCustom
                        ? 'bg-accent-muted text-accent border border-accent'
                        : 'bg-surface border border-border text-text-secondary hover:border-border-hover'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}

                {/* Custom duration toggle */}
                <button
                  onClick={() => setShowCustom(!showCustom)}
                  className={`px-4 py-2 rounded-md font-mono text-sm transition-colors ${
                    showCustom
                      ? 'bg-accent-muted text-accent border border-accent'
                      : 'bg-surface border border-border text-text-secondary hover:border-border-hover'
                  }`}
                >
                  <Settings2 className="h-3.5 w-3.5 inline mr-1.5" />
                  Custom
                </button>
              </div>

              {/* Custom duration input */}
              {showCustom && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => adjustDuration(-5)}
                    className="h-10 w-10 rounded-md border border-border bg-surface text-text-secondary hover:border-accent hover:text-accent flex items-center justify-center transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customMinutes || durationMinutes}
                      onChange={(e) => {
                        setCustomMinutes(e.target.value);
                        const mins = parseInt(e.target.value);
                        if (mins > 0 && mins <= 180) {
                          setDuration(mins * 60);
                          setTimeLeft(mins * 60);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCustomSubmit();
                      }}
                      min={1}
                      max={180}
                      className="w-20 h-10 text-center rounded-md border border-border bg-surface font-mono text-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="font-mono text-sm text-text-secondary">minutes</span>
                  </div>

                  <button
                    onClick={() => adjustDuration(5)}
                    className="h-10 w-10 rounded-md border border-border bg-surface text-text-secondary hover:border-accent hover:text-accent flex items-center justify-center transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Focus type selector */}
              <div className="flex flex-wrap gap-2 justify-center">
                {FOCUS_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFocusType(type.value)}
                    className={`px-3 py-1.5 rounded-full font-mono text-xs transition-colors ${
                      focusType === type.value
                        ? 'bg-accent text-bg font-semibold'
                        : 'bg-surface border border-border text-text-secondary hover:border-border-hover'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
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

          {/* Running state info */}
          {timerState !== 'idle' && (
            <div className="mb-6">
              <Badge variant="default" className="text-xs">
                {FOCUS_TYPES.find((t) => t.value === focusType)?.label || 'Deep Work'} • {durationMinutes}m session
              </Badge>
            </div>
          )}

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
