import test from 'node:test';
import assert from 'node:assert/strict';
import { getQueryClient } from '../src/lib/query-client';

test('deduplicates concurrent reads and reuses a fresh result', async () => {
  const client = getQueryClient();
  let calls = 0;
  const options = {
    queryKey: ['session'],
    queryFn: async () => {
      calls++;
      return { id: 'first' };
    },
  };
  const [first, second] = await Promise.all([
    client.fetchQuery(options),
    client.fetchQuery(options),
  ]);
  assert.equal(first, second);
  await client.fetchQuery(options);
  assert.equal(calls, 1);
  client.clear();
});
test('account keys isolate private data and logout clearing removes it', () => {
  const client = getQueryClient();
  client.setQueryData(['account', 'first', 'resume'], { private: true });
  assert.equal(client.getQueryData(['account', 'second', 'resume']), undefined);
  client.clear();
  assert.equal(client.getQueryCache().getAll().length, 0);
  assert.equal(client.getMutationCache().getAll().length, 0);
});
test('server renders do not share clients; failed writes are never auto-replayed', () => {
  const client = getQueryClient();
  assert.notEqual(client, getQueryClient());
  assert.equal(client.getDefaultOptions().mutations?.retry, false);
  assert.equal(client.getDefaultOptions().queries?.retry, false);
  assert.equal(client.getDefaultOptions().mutations?.gcTime, 0);
});
