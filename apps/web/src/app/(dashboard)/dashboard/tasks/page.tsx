'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Badge, Input, useToast, ConfirmDialog } from '@repo/ui';
import { Plus, CheckSquare, Circle, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TODO: Circle,
  IN_PROGRESS: Clock,
  DONE: CheckSquare,
  CANCELLED: AlertTriangle,
};

const statusColors: Record<string, string> = {
  TODO: 'text-text-secondary',
  IN_PROGRESS: 'text-info',
  DONE: 'text-accent',
  CANCELLED: 'text-text-muted',
};

const priorityColors: Record<string, string> = {
  LOW: 'secondary',
  MEDIUM: 'default',
  HIGH: 'warning',
  URGENT: 'danger',
} as const;

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data, isLoading, refetch } = trpc.task.list.useQuery({
    status: (statusFilter as 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED') ?? undefined,
  });

  const createTask = trpc.task.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowNew(false);
      toast({ title: 'Task created', variant: 'success' });
    },
  });

  const updateStatus = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast({ title: 'Status updated', variant: 'success' });
    },
  });

  const deleteTask = trpc.task.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast({ title: 'Task deleted', variant: 'success' });
    },
  });

  const tasks = data?.tasks ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-text-primary">Tasks</h1>
          <p className="text-sm text-text-secondary mt-1">
            {tasks.filter((t) => t.status === 'DONE').length}/{tasks.length} completed
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={statusFilter === null ? 'default' : 'secondary'}
          className="cursor-pointer"
          onClick={() => setStatusFilter(null)}
        >
          All ({tasks.length})
        </Badge>
        {STATUS_OPTIONS.map((status) => {
          const count = tasks.filter((t) => t.status === status).length;
          return (
            <Badge
              key={status}
              variant={statusFilter === status ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setStatusFilter(statusFilter === status ? null : status)}
            >
              {status.replace('_', ' ')} ({count})
            </Badge>
          );
        })}
      </div>

      {/* New task form */}
      {showNew && (
        <NewTaskForm
          onSubmit={(title, priority) => createTask.mutate({ title, priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' })}
          onCancel={() => setShowNew(false)}
          isLoading={createTask.isLoading}
        />
      )}

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-5 w-3/4 bg-surface-hover rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20">
          <CheckSquare className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-mono text-lg text-text-primary mb-2">No tasks yet</h3>
          <p className="text-sm text-text-secondary mb-6">Create your first task to stay organized.</p>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" />
            Create First Task
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const StatusIcon = statusIcons[task.status] ?? Circle;
            const statusColor = statusColors[task.status] ?? 'text-text-secondary';

            return (
              <Card key={task.id} className="group hover:border-border-hover transition-all">
                <CardContent className="p-4 flex items-center gap-3">
                  <button
                    onClick={() => {
                      const nextStatus = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
                      updateStatus.mutate({ id: task.id, status: nextStatus as 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' });
                    }}
                    className={`flex-shrink-0 ${statusColor} hover:text-accent transition-colors`}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </button>
                  <span
                    className={`font-mono text-sm flex-1 ${
                      task.status === 'DONE' ? 'line-through text-text-muted' : 'text-text-primary'
                    }`}
                  >
                    {task.title}
                  </span>
                  <Badge variant={priorityColors[task.priority] as 'default' | 'secondary' | 'warning' | 'danger'} className="text-[10px]">
                    {task.priority}
                  </Badge>
                  <button
                    onClick={() => setPendingDeleteId(task.id)}
                    className="p-1 text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete Task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId) deleteTask.mutate({ id: pendingDeleteId });
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

function NewTaskForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (title: string, priority: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  return (
    <Card variant="elevated">
      <CardContent className="p-4 flex gap-3 items-center">
        <Input
          placeholder="Task title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && title.trim()) onSubmit(title, priority);
            if (e.key === 'Escape') onCancel();
          }}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="h-10 rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <Button onClick={() => onSubmit(title, priority)} disabled={!title.trim()} isLoading={isLoading}>
          Add
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </CardContent>
    </Card>
  );
}
