import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { badRequest } from '../services/httpError.ts';

type Part = 'body' | 'query' | 'params';

/** Parses req[part] with the schema; parsed data is stored on res.locals[part]. */
export function validate(schema: ZodType, part: Part = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(badRequest('Validation failed', result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))));
    }
    res.locals[part] = result.data;
    next();
  };
}
