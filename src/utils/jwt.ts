import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { Role } from '@prisma/client';

export interface TokenPayload {
  userId: string;
  role: Role;
  email?: string | null;
}

export function signToken(payload: TokenPayload, options?: SignOptions): string {
  const signOptions: SignOptions = {
    expiresIn: (env.JWT_EXPIRES_IN as any) || '7d',
    ...options,
  };
  return jwt.sign(payload, env.JWT_SECRET, signOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
