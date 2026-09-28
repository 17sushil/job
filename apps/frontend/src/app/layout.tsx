import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'JobDev — Get hired faster',
    template: '%s · JobDev',
  },
  description:
    'JobDev connects candidates and recruiters. Create an account, complete your profile and get hired faster.',
  icons: { icon: '/logo-mark.svg' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        suppressHydrationWarning
      >
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3200,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: 'hsl(var(--success))', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: 'hsl(var(--destructive))', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  );
}
