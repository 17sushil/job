import * as bcrypt from 'bcrypt';

import { UserRole } from '../modules/user/user.entity.js';
import { UserRepository } from '../modules/user/user.repository.js';

/**
 * Shared team accounts. Created automatically on backend boot (and via
 * `pnpm run seed`) whenever they are missing, so every developer and
 * teammate can sign in with the same credentials on a fresh database and
 * restarts never wipe the known logins. Passwords are bcrypt-hashed here,
 * exactly like real registrations.
 */
export const TEAM_ACCOUNTS = [
  {
    email: 'candidate@jobdev.app',
    mobile: '+9779800000001',
    name: 'Demo Candidate',
    role: UserRole.CANDIDATE,
    password: 'Candidate123',
  },
  {
    email: 'recruiter@jobdev.app',
    mobile: '+9779800000002',
    name: 'Demo Recruiter',
    role: UserRole.RECRUITER,
    password: 'Recruiter123',
  },
  {
    email: 'admin@jobdev.app',
    mobile: '+9779800000003',
    name: 'Team Admin',
    role: UserRole.ADMIN,
    password: 'Admin12345',
  },
] as const;

/** Idempotent: only inserts accounts that do not exist yet. */
export async function seedTeamAccounts() {
  const repo = new UserRepository();

  for (const account of TEAM_ACCOUNTS) {
    const existing = await repo.findByEmail(account.email);
    if (existing) continue;

    await repo.create({
      email: account.email,
      mobile: account.mobile,
      name: account.name,
      role: account.role,
      password: await bcrypt.hash(account.password, 10),
    });
    console.log(
      `[seed] created ${account.role.toLowerCase()} account: ${account.email}`,
    );
  }
}
