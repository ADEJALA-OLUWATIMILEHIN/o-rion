import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { HttpError } from '../services/httpError.ts';

export type AuthUser = { id: string; email: string };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

function readToken(req: Request): AuthUser | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as jwt.JwtPayload;
    if (!payload.sub) return null;
    return { id: String(payload.sub), email: String(payload.email) };
  } catch {
    return null;
  }
}

/** Rejects the request with 401 unless a valid Bearer token is present. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readToken(req);
  if (!user) return next(new HttpError(401, 'Authentication required'));
  req.user = user;
  next();
}

/** Attaches req.user when a valid token is present, but never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const user = readToken(req);
  if (user) req.user = user;
  next();
}

/** For handlers behind requireAuth. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw new HttpError(401, 'Authentication required');
  return req.user;
}
