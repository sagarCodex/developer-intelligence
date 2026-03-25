import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-bg bg-dot-grid flex items-center justify-center">
      <SignIn />
    </div>
  );
}
