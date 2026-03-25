'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center bg-bg p-6">
      <div className="max-w-lg w-full space-y-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-[#FF5C56]" />
          <h2 className="font-mono text-lg font-bold text-text-primary">
            Something went wrong
          </h2>
        </div>

        <div className="rounded-md border border-border bg-surface p-4">
          <pre className="font-mono text-sm text-[#FF5C56] whitespace-pre-wrap break-words">
            {error.message || 'An unexpected error occurred'}
          </pre>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="font-mono text-sm px-4 py-2 rounded-md bg-accent text-bg font-medium hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="font-mono text-sm px-4 py-2 rounded-md border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
