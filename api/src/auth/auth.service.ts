import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser, LoginResult } from './auth.types';

type UserRow = {
  user_id: string;
  email: string;
  password_hash: string;
  role: string;
  full_name: string | null;
  is_active: boolean;
};

type TokenPayload = AuthUser & {
  exp: number;
};

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly tokenSecret =
    process.env.AUTH_TOKEN_SECRET ?? 'riskapp-local-auth-secret-change-me';
  private readonly tokenTtlSeconds = Number(process.env.AUTH_TOKEN_TTL_SECONDS ?? 60 * 60 * 12);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureUsersTable();
    await this.ensureAdminUser();
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const rows = await this.prisma.$queryRaw<UserRow[]>`
      SELECT
        user_id,
        email,
        password_hash,
        role,
        full_name,
        is_active
      FROM erm.app_users
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `;

    const user = rows[0];
    if (!user || !user.is_active || !this.verifyPassword(password, user.password_hash)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const authUser: AuthUser = {
      userId: user.user_id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    };

    return this.createLoginResult(authUser);
  }

  verifyToken(token: string): LoginResult['user'] {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const expectedSignature = this.sign(encodedPayload);
    if (signature.length !== expectedSignature.length) {
      throw new UnauthorizedException('Invalid token signature');
    }

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new UnauthorizedException('Invalid token signature');
    }

    let payload: TokenPayload;
    try {
      payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as TokenPayload;
    } catch {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
  }

  async me(userId: string): Promise<AuthUser> {
    const rows = await this.prisma.$queryRaw<UserRow[]>`
      SELECT
        user_id,
        email,
        password_hash,
        role,
        full_name,
        is_active
      FROM erm.app_users
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const user = rows[0];
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: user.user_id,
      email: user.email,
      role: user.role,
      name: user.full_name,
    };
  }

  private createLoginResult(user: AuthUser): LoginResult {
    const exp = Math.floor(Date.now() / 1000) + this.tokenTtlSeconds;
    const payload: TokenPayload = { ...user, exp };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.sign(encodedPayload);

    return {
      token: `${encodedPayload}.${signature}`,
      user,
      expiresAt: new Date(exp * 1000).toISOString(),
    };
  }

  private sign(value: string): string {
    return createHmac('sha256', this.tokenSecret).update(value).digest('base64url');
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${derivedKey}`;
  }

  private verifyPassword(password: string, hash: string): boolean {
    const [algorithm, salt, expectedHash] = hash.split(':');
    if (algorithm !== 'scrypt' || !salt || !expectedHash) {
      return false;
    }

    const candidate = scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');

    if (candidate.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(candidate, expected);
  }

  private async ensureUsersTable(): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      CREATE SCHEMA IF NOT EXISTS erm;

      CREATE TABLE IF NOT EXISTS erm.app_users (
        user_id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'ADMIN',
        full_name TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  private async ensureAdminUser(): Promise<void> {
    const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@riskapp.local').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin123!';
    const adminName = (process.env.ADMIN_NAME ?? 'Super User').trim() || null;

    const rows = await this.prisma.$queryRaw<{ user_id: string }[]>`
      SELECT user_id
      FROM erm.app_users
      WHERE email = ${adminEmail}
      LIMIT 1
    `;

    if (rows[0]?.user_id) {
      await this.prisma.$executeRaw`
        UPDATE erm.app_users
        SET full_name = ${adminName}
        WHERE email = ${adminEmail}
      `;
      return;
    }

    await this.prisma.$executeRaw`
      INSERT INTO erm.app_users (
        user_id,
        email,
        password_hash,
        role,
        full_name
      )
      VALUES (
        ${'U-ADMIN'},
        ${adminEmail},
        ${this.hashPassword(adminPassword)},
        ${'ADMIN'},
        ${adminName}
      )
    `;

    this.logger.log(`Seeded default admin user: ${adminEmail}`);
  }
}

