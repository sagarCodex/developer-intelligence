import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 font-mono text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-accent-muted text-accent px-2.5 py-0.5 rounded-full',
        secondary: 'bg-surface-hover text-text-secondary px-2.5 py-0.5 rounded-full',
        outline:
          'border border-border text-text-secondary px-2.5 py-0.5 rounded-full hover:border-border-hover',
        danger: 'bg-danger-muted text-danger px-2.5 py-0.5 rounded-full',
        warning: 'bg-warning-muted text-warning px-2.5 py-0.5 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
