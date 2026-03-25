'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Code2,
  CheckSquare,
  Timer,
  BookOpen,
  FolderKanban,
  Settings,
  Search,
  BarChart3,
  Bot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface CommandItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const commandItems: CommandItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/notes', icon: FileText, label: 'Notes' },
  { href: '/dashboard/snippets', icon: Code2, label: 'Snippets' },
  { href: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks' },
  { href: '/dashboard/focus', icon: Timer, label: 'Focus' },
  { href: '/dashboard/daily-log', icon: BookOpen, label: 'Daily Log' },
  { href: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
  { href: '/dashboard/stats', icon: BarChart3, label: 'Stats' },
  { href: '/dashboard/search', icon: Search, label: 'Search' },
  { href: '/dashboard/assistant', icon: Bot, label: 'AI Assistant' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const filtered = commandItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, []);

  const select = useCallback(
    (item: CommandItem) => {
      close();
      router.push(item.href);
    },
    [close, router],
  );

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
        setActiveIndex(0);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      // Small delay to ensure the modal is rendered
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Keyboard navigation inside the palette
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) select(item);
    }
  }

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[activeIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={close}
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-lg border border-border bg-surface shadow-2xl shadow-black/50 overflow-hidden font-mono"
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="h-4 w-4 text-text-secondary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent py-3.5 text-sm text-text-primary placeholder:text-text-secondary outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-bg px-1.5 py-0.5 text-[10px] text-text-secondary">
            ESC
          </kbd>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              No results found.
            </div>
          )}
          {filtered.map((item, index) => (
            <button
              key={item.href}
              onClick={() => select(item)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                index === activeIndex
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span>{item.label}</span>
              {index === activeIndex && (
                <span className="ml-auto text-[10px] text-text-secondary">
                  Enter ↵
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-[10px] text-text-secondary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-bg px-1 py-0.5">↑</kbd>
              <kbd className="rounded border border-border bg-bg px-1 py-0.5">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-bg px-1 py-0.5">↵</kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-border bg-bg px-1 py-0.5">Esc</kbd>
              Close
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-bg px-1 py-0.5">⌘K</kbd>
            Toggle
          </span>
        </div>
      </div>
    </div>
  );
}
