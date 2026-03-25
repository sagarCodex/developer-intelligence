import { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-md border bg-surface px-3 py-2 text-sm font-mono text-text-primary placeholder:text-text-muted transition-colors',
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

Input.displayName = 'Input';
