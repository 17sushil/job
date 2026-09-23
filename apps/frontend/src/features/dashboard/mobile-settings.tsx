'use client';

import { useEffect, useState } from 'react';
import { Moon, Settings, Sun, X } from 'lucide-react';

import { useThemeStore } from '@/store/theme';

/**
 * Mobile-only settings entry point. On small screens the navbar swaps the
 * theme toggle for this button; the light/dark switch lives inside the
 * bottom sheet so the header stays uncluttered.
 */
export function MobileSettings() {
  const [open, setOpen] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        aria-label="Settings"
        title="Settings"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-all hover:scale-110 hover:text-primary-dark"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-foreground/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            className="animate-fade-in-up w-full rounded-t-2xl border-t border-border bg-card p-5 pb-8 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">Settings</h3>
              <button
                type="button"
                aria-label="Close settings"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Theme
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={
                  theme === 'light'
                    ? 'flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary-light py-3 text-sm font-semibold text-primary-dark'
                    : 'flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40'
                }
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={
                  theme === 'dark'
                    ? 'flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary-light py-3 text-sm font-semibold text-primary-dark'
                    : 'flex items-center justify-center gap-2 rounded-xl border border-border bg-background py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40'
                }
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
