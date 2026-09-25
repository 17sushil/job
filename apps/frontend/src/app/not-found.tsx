import type { Metadata } from 'next';
import Link from 'next/link';
import { Compass } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light">
        <Compass className="h-8 w-8 text-primary-dark" />
      </span>
      <div className="space-y-2">
        <p className="text-6xl font-black tracking-tight text-primary">404</p>
        <h1 className="text-xl font-bold">This page wandered off</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          The link may be old or the page moved. Head back and keep your
          search on track.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/">
          <Button type="button">Back to home</Button>
        </Link>
        <Link href="/dashboard">
          <Button type="button" variant="outline">
            Open dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
