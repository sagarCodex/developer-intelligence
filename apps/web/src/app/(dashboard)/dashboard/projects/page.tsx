'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Badge, Input } from '@repo/ui';
import { Plus, FolderKanban, Archive, Trash2, FileText, Code2, CheckSquare } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

const PROJECT_COLORS = [
  '#00E5C8', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#10B981', '#6366F1', '#F97316', '#14B8A6',
];

export default function ProjectsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { data: projects, isLoading, refetch } = trpc.project.list.useQuery({
    includeArchived: showArchived,
  });

  const createProject = trpc.project.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowNew(false);
    },
  });

  const archiveProject = trpc.project.archive.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteProject = trpc.project.delete.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-sm text-text-secondary mt-1">
            {(projects ?? []).filter((p) => !p.isArchived).length} active project{(projects ?? []).filter((p) => !p.isArchived).length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setShowArchived(!showArchived)}>
            <Archive className="h-4 w-4" />
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* New project form */}
      {showNew && (
        <NewProjectForm
          onSubmit={(name, description, color) =>
            createProject.mutate({ name, description: description || undefined, color })
          }
          onCancel={() => setShowNew(false)}
          isLoading={createProject.isLoading}
        />
      )}

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="h-5 w-3/4 bg-surface-hover rounded animate-pulse" />
                <div className="h-4 w-full bg-surface-hover rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (projects ?? []).length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-mono text-lg text-text-primary mb-2">No projects yet</h3>
          <p className="text-sm text-text-secondary mb-6">Create a project to organize your notes, snippets, and tasks.</p>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4" />
            Create First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(projects ?? []).map((project) => (
            <Card
              key={project.id}
              className={`group hover:border-border-hover transition-all ${project.isArchived ? 'opacity-60' : ''}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <h3 className="font-mono text-sm font-semibold text-text-primary">
                      {project.name}
                    </h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!project.isArchived && (
                      <button
                        onClick={() => archiveProject.mutate({ id: project.id })}
                        className="p-1 text-text-muted hover:text-warning"
                      >
                        <Archive className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteProject.mutate({ id: project.id })}
                      className="p-1 text-text-muted hover:text-danger"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {project.description && (
                  <p className="text-xs text-text-secondary mb-3 line-clamp-2">{project.description}</p>
                )}
                {project.isArchived && (
                  <Badge variant="secondary" className="mb-3 text-[10px]">Archived</Badge>
                )}
                <div className="flex gap-4 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> {project._count.notes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Code2 className="h-3 w-3" /> {project._count.snippets}
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" /> {project._count.tasks}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function NewProjectForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (name: string, description: string, color: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#00E5C8');

  return (
    <Card variant="elevated">
      <CardContent className="p-5 space-y-4">
        <Input
          placeholder="Project name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Input
          placeholder="Description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div>
          <label className="text-xs font-mono text-text-secondary mb-2 block">Color</label>
          <div className="flex gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-md transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-offset-bg ring-accent scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSubmit(name, description, color)} disabled={!name.trim()} isLoading={isLoading}>
            Create Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
