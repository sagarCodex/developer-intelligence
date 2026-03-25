'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, Card, CardContent, Badge, Input, Skeleton, useToast, ConfirmDialog } from '@repo/ui';
import { Plus, Search, Pin, Trash2, FileText, Eye, Edit3 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState(false);
  const { toast } = useToast();

  const { data, isLoading, refetch } = trpc.note.list.useQuery({
    search: search || undefined,
    tags: selectedTag ? [selectedTag] : undefined,
  });

  const createNote = trpc.note.create.useMutation({
    onSuccess: () => {
      refetch();
      setNewNote(false);
      toast({ title: 'Note created', variant: 'success' });
    },
  });

  const deleteNote = trpc.note.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast({ title: 'Note deleted', variant: 'success' });
    },
  });

  const togglePin = trpc.note.togglePin.useMutation({
    onSuccess: () => {
      refetch();
      toast({ title: 'Pin toggled', variant: 'success' });
    },
  });

  const notes = data?.notes ?? [];

  // Collect all unique tags
  const allTags = [...new Set(notes.flatMap((n) => n.tags))];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-text-primary">Notes</h1>
          <p className="text-sm text-text-secondary mt-1">
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setNewNote(true)}>
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-2 items-center flex-wrap">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTag === tag ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* New note form */}
      {newNote && (
        <NewNoteForm
          onSubmit={(title, content, tags) => {
            createNote.mutate({ title, content, tags });
          }}
          onCancel={() => setNewNote(false)}
          isLoading={createNote.isLoading}
        />
      )}

      {/* Notes grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState onNew={() => setNewNote(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onPin={() => togglePin.mutate({ id: note.id })}
              onDelete={() => setPendingDeleteId(note.id)}
              onEdit={() => setEditingNote(note.id)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId) deleteNote.mutate({ id: pendingDeleteId });
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />

      {/* Edit modal */}
      {editingNote && (
        <EditNoteModal
          noteId={editingNote}
          onClose={() => {
            setEditingNote(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function NoteCard({
  note,
  onPin,
  onDelete,
  onEdit,
}: {
  note: {
    id: string;
    title: string;
    content: string;
    tags: string[];
    isPinned: boolean;
    updatedAt: Date;
  };
  onPin: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const preview = note.content.slice(0, 150) + (note.content.length > 150 ? '...' : '');
  const timeAgo = formatTimeAgo(note.updatedAt);

  return (
    <Card
      className="group cursor-pointer hover:border-border-hover transition-all"
      onClick={onEdit}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-mono text-sm font-semibold text-text-primary truncate flex-1">
            {note.isPinned && <Pin className="inline h-3 w-3 text-accent mr-1" />}
            {note.title}
          </h3>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin();
              }}
              className="p-1 text-text-muted hover:text-accent"
            >
              <Pin className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-text-muted hover:text-danger"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="text-xs text-text-secondary mb-3 line-clamp-3 font-mono prose prose-invert prose-xs max-w-none prose-p:m-0 prose-headings:m-0 prose-ul:m-0 prose-ol:m-0 prose-li:m-0 prose-code:text-accent prose-code:text-[10px]">
          {preview ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{preview}</ReactMarkdown>
          ) : (
            <p>Empty note</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
          <span className="text-[10px] text-text-muted">{timeAgo}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function NewNoteForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (title: string, content: string, tags: string[]) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  return (
    <Card variant="elevated">
      <CardContent className="p-5 space-y-4">
        <Input
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <textarea
          placeholder="Start writing in markdown..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex min-h-[200px] w-full rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-y"
        />
        <Input
          placeholder="Tags (comma separated)..."
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSubmit(
                title,
                content,
                tagsInput
                  .split(',')
                  .map((t) => t.trim())
                  .filter(Boolean),
              )
            }
            disabled={!title.trim()}
            isLoading={isLoading}
          >
            Create Note
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EditNoteModal({ noteId, onClose }: { noteId: string; onClose: () => void }) {
  const { toast } = useToast();
  const { data: note, isLoading } = trpc.note.getById.useQuery({ id: noteId });
  const updateNote = trpc.note.update.useMutation({
    onSuccess: () => {
      toast({ title: 'Note updated', variant: 'success' });
      onClose();
    },
  });
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  if (note && !initialized) {
    setTitle(note.title);
    setContent(note.content);
    setInitialized(true);
  }

  if (isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <Card
        variant="elevated"
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <CardContent className="p-6 space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold"
          />
          {/* Edit/Preview toggle */}
          <div className="flex gap-1 border-b border-border pb-0">
            <button
              onClick={() => setPreviewMode(false)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition-colors -mb-[1px] ${
                !previewMode
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Edit3 className="h-3 w-3" /> Edit
            </button>
            <button
              onClick={() => setPreviewMode(true)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition-colors -mb-[1px] ${
                previewMode
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Eye className="h-3 w-3" /> Preview
            </button>
          </div>
          {previewMode ? (
            <div className="min-h-[400px] rounded-md border border-border bg-bg px-4 py-3 prose prose-invert prose-sm max-w-none font-mono prose-headings:font-mono prose-code:text-accent prose-pre:bg-surface prose-pre:border prose-pre:border-border prose-a:text-accent">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="text-text-muted italic">Nothing to preview</p>
              )}
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex min-h-[400px] w-full rounded-md border border-border bg-bg px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent resize-y"
            />
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => updateNote.mutate({ id: noteId, title, content })}
              isLoading={updateNote.isLoading}
            >
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="text-center py-20">
      <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
      <h3 className="font-mono text-lg text-text-primary mb-2">No notes yet</h3>
      <p className="text-sm text-text-secondary mb-6">
        Create your first note to start building your knowledge base.
      </p>
      <Button onClick={onNew}>
        <Plus className="h-4 w-4" />
        Create First Note
      </Button>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}
