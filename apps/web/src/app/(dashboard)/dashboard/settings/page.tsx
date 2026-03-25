'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@repo/ui';
import { Save, Settings } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export default function SettingsPage() {
  const { data: settings, isLoading, refetch } = trpc.user.getSettings.useQuery();

  const updateSettings = trpc.user.updateSettings.useMutation({
    onSuccess: () => refetch(),
  });

  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [dailyGoal, setDailyGoal] = useState(240);
  const [notifications, setNotifications] = useState(true);
  const [initialized, setInitialized] = useState(false);

  if (settings && !initialized) {
    setFocusDuration(Math.floor(settings.focusDuration / 60));
    setBreakDuration(Math.floor(settings.breakDuration / 60));
    setDailyGoal(settings.dailyGoalMinutes);
    setNotifications(settings.notificationsEnabled);
    setInitialized(true);
  }

  const handleSave = () => {
    updateSettings.mutate({
      focusDuration: focusDuration * 60,
      breakDuration: breakDuration * 60,
      dailyGoalMinutes: dailyGoal,
      notificationsEnabled: notifications,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Configure your workspace preferences</p>
      </div>

      {/* Focus settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Focus Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-text-secondary mb-1 block">
                Focus Duration (minutes)
              </label>
              <Input
                type="number"
                value={focusDuration}
                onChange={(e) => setFocusDuration(Number(e.target.value))}
                min={1}
                max={120}
              />
            </div>
            <div>
              <label className="text-xs font-mono text-text-secondary mb-1 block">
                Break Duration (minutes)
              </label>
              <Input
                type="number"
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                min={1}
                max={60}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-mono text-text-secondary mb-1 block">
              Daily Focus Goal (minutes)
            </label>
            <Input
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
              min={30}
              max={720}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setNotifications(!notifications)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                notifications ? 'bg-accent' : 'bg-border'
              }`}
            >
              <div
                className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                  notifications ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="text-sm text-text-primary font-mono">Enable notifications</span>
          </label>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1 p-4 rounded-lg border-2 border-accent bg-bg text-center cursor-pointer">
              <div className="h-8 w-full bg-surface rounded mb-2" />
              <span className="text-xs font-mono text-text-primary">Dark</span>
            </div>
            <div className="flex-1 p-4 rounded-lg border border-border bg-surface text-center cursor-not-allowed opacity-50">
              <div className="h-8 w-full bg-elevated rounded mb-2" />
              <span className="text-xs font-mono text-text-muted">Light (coming soon)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} isLoading={updateSettings.isLoading} className="w-full">
        <Save className="h-4 w-4" />
        Save Settings
      </Button>
    </div>
  );
}
