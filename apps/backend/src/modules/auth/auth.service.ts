import { randomUUID } from 'node:crypto';

import { AppError } from '../../common/errors/AppError.js';
import type {
  AuthUser,
  LoginInput,
  LoginResult,
  RegisterInput,
  RegisterResult,
} from './auth.types.js';

type StoredUser = AuthUser & { password: string };

/**
 * In-memory store for the training scaffold.
 * TODO(auth): replace with a real repository once the database layer
 * (`src/database/client.ts`) is wired — and hash passwords with argon2/bcrypt.
 */
const users: StoredUser[] = [];

function toSafeUser({
  password: _password,
  ...safeUser
}: StoredUser): AuthUser {
  return safeUser;
}

export class AuthService {
  register(input: RegisterInput): RegisterResult {
        const exists = users.some((user) => user.email === input.email);
    if (exists) {
      // Do not reveal whether an account exists — generic error prevents
      // account enumeration by attackers.
      throw new AppError(409, 'Invalid credentials');
    }
    const user: StoredUser = {
      id: randomUUID(),
      email: input.email,
      phone: input.phone,
      role: input.role,
      password: input.password, // TODO(auth): hash before persisting
    };

    users.push(user);
    return { user: toSafeUser(user) };
  }

  login(input: LoginInput): LoginResult {
    const user = users.find(
      (candidate) =>
        candidate.email === input.identifier ||
        candidate.phone === input.identifier,
    );

    if (!user || user.password !== input.password) {
      throw new AppError(401, 'Invalid email/phone or password');
    }

    return {
      user: toSafeUser(user),
      token: `demo-token-${user.id}`, // TODO(auth): sign a real JWT
    };
  }
}