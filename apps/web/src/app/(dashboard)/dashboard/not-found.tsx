import Link from 'next/link';

export default function DashboardNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center bg-bg p-6">
      <div className="max-w-lg w-full space-y-6 text-center">
        <p className="font-mono text-6xl font-bold text-accent">404</p>
        <h2 className="font-mono text-lg font-bold text-text-primary">
          Page not found
        </h2>
        <p className="font-mono text-sm text-text-secondary">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-block font-mono text-sm px-4 py-2 rounded-md bg-accent text-bg font-medium hover:opacity-90 transition-opacity"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
