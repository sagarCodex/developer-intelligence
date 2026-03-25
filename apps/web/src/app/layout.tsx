import type { Metadata } from 'next';
import { TRPCProvider } from '@/lib/trpc/provider';
import { ToastProvider } from '@repo/ui';
import './globals.css';

export const metadata: Metadata = {
  title: 'Developer Intelligence',
  description: 'Your Personal Knowledge OS — notes, snippets, deep work focus, and AI assistant for developers',
  themeColor: '#0A0A0A',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <TRPCProvider>
          <ToastProvider>{children}</ToastProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
