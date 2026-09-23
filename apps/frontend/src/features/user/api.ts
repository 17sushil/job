import { apiClient } from '@/lib/api-client';

export async function getUsers() {
  return apiClient.get('/api/users');
}
