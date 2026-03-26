import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function LandingPage() {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    try {
      const { auth } = await import('@clerk/nextjs/server');
      const { userId } = await auth();
      if (userId) {
        redirect('/dashboard');
      }
    } catch {
      // Clerk not configured, continue to landing page
    }
  }

  return (
    <div className="min-h-screen bg-bg bg-dot-grid flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center animate-fade-in">
        {/* Terminal-style header */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
          <span className="font-mono text-xs text-text-secondary">system online</span>
        </div>

        <h1 className="font-mono text-5xl font-bold text-text-primary mb-4">
          Developer
          <span className="text-accent">Intelligence</span>
        </h1>

        <p className="text-lg text-text-secondary mb-2 font-mono">
          Your Personal Knowledge OS
        </p>

        <p className="text-sm text-text-muted mb-12 max-w-md mx-auto">
          Notes, snippets, deep work focus, personal analytics, and AI assistant —
          all in one dark-theme workspace designed for how developers think.
        </p>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12 text-left">
          {[
            { icon: '>', label: 'Daily Log' },
            { icon: '#', label: 'Notes & Snippets' },
            { icon: '~', label: 'Deep Focus' },
            { icon: '$', label: 'AI Assistant' },
          ].map((feature) => (
            <div
              key={feature.label}
              className="rounded-lg border border-border bg-surface p-3 hover:border-border-hover transition-colors"
            >
              <span className="font-mono text-accent text-lg">{feature.icon}</span>
              <p className="font-mono text-xs text-text-secondary mt-1">{feature.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '/sign-up' : '/dashboard'}
            className="inline-flex items-center justify-center h-12 px-8 rounded-md bg-accent text-bg font-mono font-semibold text-sm hover:bg-accent-hover transition-colors shadow-[0_0_20px_rgba(0,229,200,0.2)] hover:shadow-[0_0_30px_rgba(0,229,200,0.3)]"
          >
            {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Get Started' : 'Enter Dashboard'}
          </Link>
          {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && (
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center h-12 px-8 rounded-md border border-border text-text-primary font-mono text-sm hover:border-accent hover:text-accent transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Terminal cursor */}
        <div className="mt-16 font-mono text-text-muted text-xs">
          <span className="text-text-secondary">$</span> developer-intelligence{' '}
          <span className="inline-block w-2 h-4 bg-accent animate-cursor-blink" />
        </div>
      </div>
    </div>
  );
}
