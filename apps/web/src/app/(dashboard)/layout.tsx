'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import {
  LayoutDashboard,
  FileText,
  Code2,
  CheckSquare,
  Timer,
  BookOpen,
  FolderKanban,
  Settings,
  Menu,
  X,
  Search,
  BarChart3,
  Bot,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@repo/ui';

const navItems = [
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-surface border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="font-mono text-sm font-bold text-text-primary">
              Dev<span className="text-accent">Intel</span>
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-text-secondary hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-mono transition-colors',
                  isActive
                    ? 'bg-accent-muted text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-surface-hover flex items-center justify-center">
              <User className="h-4 w-4 text-text-secondary" />
            </div>
            <span className="font-mono text-xs text-text-secondary">Terminal_User</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="h-16 flex items-center px-4 border-b border-border lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text-secondary hover:text-text-primary"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 font-mono text-sm font-bold text-text-primary">
            Dev<span className="text-accent">Intel</span>
          </span>
        </header>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}
