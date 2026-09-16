'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const InputWithIcon = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'> & { icon: React.ReactNode }
>(({ icon, className, ...props }, ref) => (
  <div className="relative">
    <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-muted-foreground/70">
      {icon}
    </span>
    <Input ref={ref} className={cn('pl-9', className)} {...props} />
  </div>
));
InputWithIcon.displayName = 'InputWithIcon';

export { InputWithIcon };
