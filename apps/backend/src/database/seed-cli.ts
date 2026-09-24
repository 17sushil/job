import 'reflect-metadata';
import { AppDataSource } from './data-source.js';
import { seedTeamAccounts } from './seed.js';

async function main() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  await seedTeamAccounts();
  console.log('[seed] done');
  await AppDataSource.destroy();
}

main().catch((error) => {
  console.error('[seed] failed', error);
  process.exit(1);
});
