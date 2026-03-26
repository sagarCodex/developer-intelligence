'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@repo/ui';
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If already signed in, redirect to dashboard
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  // If no Google OAuth configured, redirect to dashboard (dev mode)
  const hasGoogleAuth = typeof window !== 'undefined'; // We check on server via env, but on client we just show the button

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleDevMode = () => {
    router.push('/dashboard');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-bg bg-dot-grid flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg bg-dot-grid flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-mono text-3xl font-bold text-text-primary mb-2">
            Dev<span className="text-accent">Intel</span>
          </h1>
          <p className="text-sm text-text-secondary font-mono">
            Sign in to your knowledge OS
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-8 space-y-4">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-md border border-border bg-white text-gray-800 font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-2 text-text-muted font-mono">or</span>
            </div>
          </div>

          {/* Dev mode - continue without auth */}
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleDevMode}
          >
            Continue without signing in
          </Button>

          <p className="text-[10px] text-text-muted text-center font-mono pt-2">
            Dev mode uses a local account. Sign in with Google to sync across devices.
          </p>
        </div>

        {/* Terminal cursor */}
        <div className="mt-8 text-center font-mono text-text-muted text-xs">
          <span className="text-text-secondary">$</span> authenticate{' '}
          <span className="inline-block w-2 h-4 bg-accent animate-cursor-blink" />
        </div>
      </div>
    </div>
  );
}
