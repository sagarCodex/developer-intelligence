import { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border bg-surface px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted transition-colors resize-y',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-danger' : 'border-border hover:border-border-hover',
            className,
          )}
          {...props}
        />
        {error ? <p className="mt-1 text-xs text-danger font-mono">{error}</p> : null}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
