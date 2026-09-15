import bcrypt from 'bcrypt';
import { z } from 'zod';

import { AppError } from '../../common/errors/AppError.js';
import { AppDataSource } from '../../database/data-source.js';
import { User } from '../user/user.entity.js';
import type {
  AuthUser,
  LoginInput,
  LoginResult,
  RegisterInput,
  RegisterResult,
  UserRole,
} from './auth.types.js';

const SALT_ROUNDS = 10;

/** Lazy accessor — the DataSource is initialized in `server.ts` at startup. */
const userRepo = () => AppDataSource.getRepository(User);

/** Split an identifier into its email/phone parts. */
function splitIdentifier(identifier: string): {
  email: string | null;
  phone: string | null;
} {
  const trimmed = identifier.trim();
  const isEmail = z.string().email().safeParse(trimmed).success;
  return isEmail
    ? { email: trimmed.toLowerCase(), phone: null }
    : { email: null, phone: trimmed };
}

/** Strip sensitive fields before sending a user to the client. */
function toSafeUser(user: User): AuthUser {
  return {
    id: user.id,
    identifier: user.email ?? user.phone ?? '',
    email: user.email,
    phone: user.phone,
    role: user.role as UserRole,
  };
}

export class AuthService {
  private async findByIdentifier(identifier: string): Promise<User | null> {
    const trimmed = identifier.trim();
    return userRepo()
      .createQueryBuilder('user')
      .where('user.email = :value OR user.phone = :value', { value: trimmed })
      .orWhere('LOWER(user.email) = LOWER(:value)', { value: trimmed })
      .getOne();
  }

  async register(input: RegisterInput): Promise<RegisterResult> {
    const { email, phone } = splitIdentifier(input.identifier);

    const existing = await this.findByIdentifier(input.identifier);
    if (existing) {
      // Do not reveal whether an account exists — generic error prevents
      // account enumeration by attackers.
      throw new AppError(409, 'Invalid credentials');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await userRepo().save(
      userRepo().create({
        email,
        phone,
        role: input.role,
        passwordHash,
        name: null,
      }),
    );

    return { user: toSafeUser(user) };
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.findByIdentifier(input.identifier);

    if (!user || !user.passwordHash) {
      throw new AppError(401, 'Invalid email/phone or password');
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new AppError(401, 'Invalid email/phone or password');
    }

    return {
      user: toSafeUser(user),
      token: `demo-token-${user.id}`, // TODO(auth): sign a real JWT
    };
  }
}