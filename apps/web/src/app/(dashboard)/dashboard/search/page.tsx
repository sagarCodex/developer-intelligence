'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Badge, Input } from '@repo/ui';
import { Search, FileText, Code2, CheckSquare, FolderKanban } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

type ResultType = 'all' | 'notes' | 'snippets' | 'tasks' | 'projects';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ResultType>('all');

  const debouncedQuery = useDebounce(query, 300);
  const hasQuery = debouncedQuery.length >= 2;

  const { data: notes } = trpc.note.list.useQuery(
    { search: debouncedQuery, limit: 10 },
    { enabled: hasQuery && (activeTab === 'all' || activeTab === 'notes') },
  );
  const { data: snippets } = trpc.snippet.list.useQuery(
    { search: debouncedQuery, limit: 10 },
    { enabled: hasQuery && (activeTab === 'all' || activeTab === 'snippets') },
  );
  const { data: tasks } = trpc.task.list.useQuery(
    { limit: 50 },
    { enabled: hasQuery && (activeTab === 'all' || activeTab === 'tasks') },
  );
  const { data: projects } = trpc.project.list.useQuery(
    { includeArchived: true },
    { enabled: hasQuery && (activeTab === 'all' || activeTab === 'projects') },
  );

  // Filter tasks and projects client-side since they don't have search params
  const filteredTasks = (tasks?.tasks ?? []).filter(
    (t) =>
      t.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (t.description?.toLowerCase().includes(debouncedQuery.toLowerCase()) ?? false),
  );
  const filteredProjects = (projects ?? []).filter(
    (p) =>
      p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      (p.description?.toLowerCase().includes(debouncedQuery.toLowerCase()) ?? false),
  );

  const noteResults = notes?.notes ?? [];
  const snippetResults = snippets?.snippets ?? [];

  const totalResults =
    (activeTab === 'all' || activeTab === 'notes' ? noteResults.length : 0) +
    (activeTab === 'all' || activeTab === 'snippets' ? snippetResults.length : 0) +
    (activeTab === 'all' || activeTab === 'tasks' ? filteredTasks.length : 0) +
    (activeTab === 'all' || activeTab === 'projects' ? filteredProjects.length : 0);

  const tabs: { key: ResultType; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { key: 'all', label: 'All', icon: Search, count: totalResults },
    { key: 'notes', label: 'Notes', icon: FileText, count: noteResults.length },
    { key: 'snippets', label: 'Snippets', icon: Code2, count: snippetResults.length },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare, count: filteredTasks.length },
    { key: 'projects', label: 'Projects', icon: FolderKanban, count: filteredProjects.length },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-bold text-text-primary">Search</h1>
        <p className="text-sm text-text-secondary mt-1">Find anything across your knowledge base</p>
      </div>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
        <input
          type="text"
          placeholder="Search notes, snippets, tasks, projects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full h-14 rounded-lg border border-border bg-surface pl-12 pr-4 text-lg font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        />
      </div>

      {/* Tabs */}
      {hasQuery && (
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${
                activeTab === tab.key
                  ? 'bg-accent-muted text-accent'
                  : 'bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon className="h-3 w-3" />
              {tab.label}
              <span className="text-text-muted">({tab.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {!hasQuery ? (
        <div className="text-center py-20">
          <Search className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-sm text-text-secondary">Type at least 2 characters to search</p>
        </div>
      ) : totalResults === 0 ? (
        <div className="text-center py-20">
          <Search className="h-12 w-12 text-text-muted mx-auto mb-4" />
          <p className="text-sm text-text-secondary">
            No results for &quot;{debouncedQuery}&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Notes */}
          {(activeTab === 'all' || activeTab === 'notes') &&
            noteResults.map((note) => (
              <ResultCard
                key={`note-${note.id}`}
                type="Note"
                icon={FileText}
                title={note.title}
                preview={note.content.slice(0, 120)}
                tags={note.tags}
                date={note.updatedAt}
                href={`/dashboard/notes`}
              />
            ))}

          {/* Snippets */}
          {(activeTab === 'all' || activeTab === 'snippets') &&
            snippetResults.map((snippet) => (
              <ResultCard
                key={`snippet-${snippet.id}`}
                type={snippet.language}
                icon={Code2}
                title={snippet.title}
                preview={snippet.code.slice(0, 120)}
                tags={snippet.tags}
                date={snippet.updatedAt}
                href={`/dashboard/snippets`}
              />
            ))}

          {/* Tasks */}
          {(activeTab === 'all' || activeTab === 'tasks') &&
            filteredTasks.map((task) => (
              <ResultCard
                key={`task-${task.id}`}
                type={task.status}
                icon={CheckSquare}
                title={task.title}
                preview={task.description ?? ''}
                tags={[]}
                date={task.updatedAt}
                href={`/dashboard/tasks`}
              />
            ))}

          {/* Projects */}
          {(activeTab === 'all' || activeTab === 'projects') &&
            filteredProjects.map((project) => (
              <ResultCard
                key={`project-${project.id}`}
                type="Project"
                icon={FolderKanban}
                title={project.name}
                preview={project.description ?? ''}
                tags={[]}
                date={project.updatedAt}
                href={`/dashboard/projects`}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({
  type,
  icon: Icon,
  title,
  preview,
  tags,
  date,
  href,
}: {
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  preview: string;
  tags: string[];
  date: Date;
  href: string;
}) {
  return (
    <a href={href}>
      <Card className="hover:border-border-hover transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-md bg-surface-hover flex items-center justify-center mt-0.5">
              <Icon className="h-4 w-4 text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-mono text-sm font-semibold text-text-primary truncate">
                  {title}
                </h3>
                <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                  {type}
                </Badge>
              </div>
              {preview && (
                <p className="text-xs text-text-muted line-clamp-1 font-mono">{preview}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[9px]">
                    {tag}
                  </Badge>
                ))}
                <span className="text-[10px] text-text-muted ml-auto">
                  {new Date(date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
