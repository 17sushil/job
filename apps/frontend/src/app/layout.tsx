import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    default: 'JobDev — Get hired faster',
    template: '%s · JobDev',
  },
  description:
    'JobDev auto-builds your profile from your resume and generates an ATS-ready resume for any job in under 30 seconds.',
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
      </body>
    </html>
  );
}