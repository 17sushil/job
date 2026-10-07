'use client';
import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { meRequest, type AuthUser } from './api';
import { apiGet } from '@/lib/api-client';
export const sessionKey = ['session'] as const;
export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: ({ signal }) => meRequest(signal),
    staleTime: 30_000,
  });
}
export function useSetSession() {
  const client = useQueryClient();
  return useCallback(
    (user: AuthUser) => {
      const previous = client.getQueryData<AuthUser>(sessionKey);
      if (previous && previous.id !== user.id) client.clear();
      client.setQueryData(sessionKey, user);
    },
    [client],
  );
}
/** All private lists are scoped to the signed-in account. */
export function useAccountQuery<T>(path: string) {
  const { data: user } = useSession();
  return useQuery({
    queryKey: ['account', user?.id, path],
    queryFn: ({ signal }) => apiGet<T>(path, signal),
    enabled: !!user,
  });
}
