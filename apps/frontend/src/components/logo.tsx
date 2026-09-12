import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * JobDev logo mark — a resume document with a "scanned & approved" checkmark,
 * on a blue→cyan gradient tile. It visualises the core flow:
 * upload resume → ATS match → hired, faster (the check doubles as an upward step).
 */
function Mark({ gradientId }: { gradientId: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-full w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2943C8" />
          <stop offset="55%" stopColor="#3B57E7" />
          <stop offset="100%" stopColor="#40C9C6" />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="46"
        height="46"
        rx="12"
        fill={`url(#${gradientId})`}
      />
      {/* resume document */}
      <path
        d="M15 11h13l5 5v17a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4V15a4 4 0 0 1 4-4Z"
        fill="#FFFFFF"
      />
      <path d="M28 11v5h5Z" fill="#D9E2FF" />
      <rect x="17" y="20" width="10" height="2.4" rx="1.2" fill="#C6D1FA" />
      <rect x="17" y="25" width="15" height="2.4" rx="1.2" fill="#DDE4FF" />
      <rect x="17" y="30" width="8" height="2.4" rx="1.2" fill="#DDE4FF" />
      {/* ATS-approved badge */}
      <circle cx="32.5" cy="31.5" r="7.5" fill="#22B573" />
      <path
        d="M28.9 31.7l2.5 2.5 4.7-4.7"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export interface LogoProps {
  variant?: 'dark' | 'light';
  size?: number;
  showTagline?: boolean;
  className?: string;
}

export function Logo({
  variant = 'dark',
  size = 40,
  showTagline = true,
  className,
}: LogoProps) {
  const gradientId = React.useId();

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className="inline-block shrink-0"
        style={{ width: size, height: size }}
      >
        <Mark gradientId={gradientId} />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'text-xl font-bold tracking-tight',
            variant === 'light' ? 'text-white' : 'text-[#171A24]',
          )}
        >
          Job
          <span
            className={variant === 'light' ? 'text-[#9DB8FF]' : 'text-primary'}
          >
            Dev
          </span>
        </span>
        {showTagline && (
          <span
            className={cn(
              'mt-1 text-[11px] font-medium',
              variant === 'light' ? 'text-white/70' : 'text-muted-foreground',
            )}
          >
            Get hired faster
          </span>
        )}
      </span>
    </span>
  );
}