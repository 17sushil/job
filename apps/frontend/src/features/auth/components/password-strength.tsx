'use client';

import { cn } from '@/lib/utils';

function scorePassword(value: string): number {
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  return score; // 0..4
}

const LABELS = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'];
const BAR_COLORS = [
  'bg-destructive',
  'bg-destructive',
  'bg-warning',
  'bg-info',
  'bg-success',
];

export function PasswordStrength({ value }: { value: string }) {
  const score = value ? scorePassword(value) : 0;

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              'h-1 flex-1 rounded-full bg-border transition-colors duration-300',
              value && index < score && BAR_COLORS[score],
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          'text-xs transition-colors',
          value ? 'text-muted-foreground' : 'text-muted-foreground/60',
        )}
      >
        {value
          ? LABELS[score]
          : 'Use 8+ characters with letters, numbers & symbols'}
      </p>
    </div>
  );
}
