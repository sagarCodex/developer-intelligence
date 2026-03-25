'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Badge, Input, CodeBlock, useToast, ConfirmDialog } from '@repo/ui';
import { Plus, Search, Star, Trash2, Code2, Copy } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'rust', 'go', 'java', 'c', 'cpp',
  'html', 'css', 'sql', 'bash', 'json', 'yaml', 'markdown', 'other',
];

export default function SnippetsPage() {
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [expandedSnippet, setExpandedSnippet] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data, isLoading, refetch } = trpc.snippet.list.useQuery({
    search: search || undefined,
    language: langFilter ?? undefined,
  });

  const { data: languages } = trpc.snippet.getLanguages.useQuery();

  const createSnippet = trpc.snippet.create.useMutation({
    onSuccess: () => {
      refetch();
      setShowNew(false);
      toast({ title: 'Snippet created', variant: 'success' });
    },
  });

  const deleteSnippet = trpc.snippet.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast({ title: 'Snippet deleted', variant: 'success' });
    },
  });

  const toggleFavorite = trpc.snippet.toggleFavorite.useMutation({
    onSuccess: () => {
      refetch();
      toast({ title: 'Favorite toggled', variant: 'success' });
    },
  });

  const snippets = data?.snippets ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-text-primary">Snippets</h1>
          <p className="text-sm text-text-secondary mt-1">
            {snippets.length} snippet{snippets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4" />
          New Snippet
        </Button>
      </div>

      {/* Search and language filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search snippets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Badge
            variant={langFilter === null ? 'default' : 'secondary'}
            className="cursor-pointer"
            onClick={() => setLangFilter(null)}
          >
            All
          </Badge>
          {(languages ?? []).map(({ language, count }) => (
            <Badge
              key={language}
              variant={langFilter === language ? 'default' : 'secondary'}
              className="cursor-pointer"
              onClick={() => setLangFilter(langFilter === language ? null : language)}
            >
              {language} ({count})
            </Badge>
          ))}
        </div>
      </div>

      {/* New snippet form */}
      {showNew && (
        <NewSnippetForm
          onSubmit={(data) => createSnippet.mutate(data)}
          onCancel={() => setShowNew(false)}
          isLoading={createSnippet.isLoading}
        />
      )}

      {/* Snippets list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <div className="h-5 w-1/3 bg-surface-hover rounded animate-pulse" />
                <div className="h-32 w-full bg-surface-hover rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : snippets.length === 0 ? (
        <EmptyState onNew={() => setShowNew(true)} />
      ) : (
        <div className="space-y-4">
          {snippets.map((snippet) => (
            <Card
              key={snippet.id}
              className="group hover:border-border-hover transition-all"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-mono text-sm font-semibold text-text-primary">
                      {snippet.title}
                    </h3>
                    <Badge variant="default">{snippet.language}</Badge>
                    {snippet.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleFavorite.mutate({ id: snippet.id })}
                      className={`p-1 transition-colors ${
                        snippet.isFavorite ? 'text-warning' : 'text-text-muted hover:text-warning'
                      }`}
                    >
                      <Star className="h-4 w-4" fill={snippet.isFavorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(snippet.code)}
                      className="p-1 text-text-muted hover:text-accent"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPendingDeleteId(snippet.id)}
                      className="p-1 text-text-muted hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {snippet.description && (
                  <p className="text-xs text-text-secondary mb-3">{snippet.description}</p>
                )}
                <div
                  className={expandedSnippet === snippet.id ? '' : 'max-h-[200px] overflow-hidden relative'}
                >
                  <CodeBlock
                    code={snippet.code}
                    language={snippet.language}
                    showLineNumbers
                  />
                  {expandedSnippet !== snippet.id && snippet.code.split('\n').length > 8 && (
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-surface to-transparent" />
                  )}
                </div>
                {snippet.code.split('\n').length > 8 && (
                  <button
                    onClick={() =>
                      setExpandedSnippet(expandedSnippet === snippet.id ? null : snippet.id)
                    }
                    className="mt-2 text-xs font-mono text-accent hover:text-accent-hover"
                  >
                    {expandedSnippet === snippet.id ? 'collapse' : 'expand'}
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete Snippet"
        description="Are you sure you want to delete this snippet? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId) deleteSnippet.mutate({ id: pendingDeleteId });
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

function NewSnippetForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: { title: string; code: string; language: string; description?: string; tags?: string[] }) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  return (
    <Card variant="elevated">
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Snippet title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-10 rounded-md border border-border bg-surface px-3 text-sm font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
        <Input
          placeholder="Description (optional)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <textarea
          placeholder="Paste your code here..."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex min-h-[200px] w-full rounded-md border border-border bg-bg px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-y"
        />
        <Input
          placeholder="Tags (comma separated)..."
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={() =>
              onSubmit({
                title,
                code,
                language,
                description: description || undefined,
                tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
              })
            }
            disabled={!title.trim() || !code.trim()}
            isLoading={isLoading}
          >
            Save Snippet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-20">
      <Code2 className="h-12 w-12 text-text-muted mx-auto mb-4" />
      <h3 className="font-mono text-lg text-text-primary mb-2">No snippets yet</h3>
      <p className="text-sm text-text-secondary mb-6">
        Save your first code snippet to never write the same code twice.
      </p>
      <Button onClick={onNew}>
        <Plus className="h-4 w-4" />
        Save First Snippet
      </Button>
    </div>
  );
}
