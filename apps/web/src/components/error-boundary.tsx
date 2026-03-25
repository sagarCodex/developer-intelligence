'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
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
                {this.state.error?.message || 'An unexpected error occurred'}
              </pre>
            </div>

            <button
              onClick={this.handleReset}
              className="font-mono text-sm px-4 py-2 rounded-md bg-accent text-bg font-medium hover:opacity-90 transition-opacity"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
