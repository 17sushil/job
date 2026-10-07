'use client';

import { buildCheck } from '@/lib/api-client';
import { clearLegacyStorage } from '@/lib/clear-legacy-storage';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Dev-preview self-heal: client chunks remember the build id of the page
 * that first loaded them. If the dev server has restarted since (new build
 * id), stale chunks would mix with fresh ones and cause impossible bugs -
 * so we force one clean reload.
 */
const BIRTH_BUILD =
  typeof document !== 'undefined'
    ? (document
        .querySelector('meta[name="app-build"]')
        ?.getAttribute('content') ?? null)
    : null;

export function BuildGuard() {
  const build = useQuery({
    queryKey: ['build'],
    enabled: process.env.NODE_ENV === 'production',
    queryFn: ({ signal }) => buildCheck(signal),
    staleTime: Infinity,
  });
  useEffect(() => {
    clearLegacyStorage();
  }, []);
  // UI lifecycle only: react to a deployment identifier, never fetch in an effect.
  useEffect(() => {
    if (BIRTH_BUILD && build.data?.id && build.data.id !== BIRTH_BUILD)
      window.location.reload();
  }, [build.data?.id]);
  return null;
}
