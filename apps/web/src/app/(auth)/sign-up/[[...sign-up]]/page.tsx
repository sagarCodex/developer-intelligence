import { redirect } from 'next/navigation';

export default function SignUpPage() {
  // If Clerk is not configured, redirect to dashboard (dev mode)
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    redirect('/dashboard');
  }

  // Dynamically import SignUp only when Clerk is configured
  const { SignUp } = require('@clerk/nextjs');

  return (
    <div className="min-h-screen bg-bg bg-dot-grid flex items-center justify-center">
      <SignUp />
    </div>
  );
}
