'use client';

import { Briefcase, UserRound } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { UserRole } from '@/features/auth/schemas';

const OPTIONS: Array<{
  value: UserRole;
  title: string;
  description: string;
  icon: typeof Briefcase;
}> = [
  {
    value: 'candidate',
    title: 'Job seeker',
    description: 'I am looking for a job',
    icon: UserRound,
  },
  {
    value: 'recruiter',
    title: 'Recruiter',
    description: 'I am hiring talent',
    icon: Briefcase,
  },
];

export function RoleSelector({
  value,
  onChange,
}: {
  value?: UserRole;
  onChange: (value: UserRole) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map(({ value: option, title, description, icon: Icon }) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={selected}
            className={cn(
              'flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors',
              selected
                ? 'border-primary bg-primary-light ring-1 ring-primary'
                : 'border-input bg-card hover:bg-accent',
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5',
                selected ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            <span
              className={cn(
                'text-sm font-semibold',
                selected ? 'text-primary-dark' : 'text-foreground',
              )}
            >
              {title}
            </span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </button>
        );
      })}
    </div>
  );
}