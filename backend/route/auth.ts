import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.ts';
import { requireAuth, currentUser } from '../middleware/auth.ts';
import * as auth from '../services/authService.ts';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  campus: z.string().max(120).optional(),
  department: z.string().max(120).optional(),
});

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create an account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Ada Okafor }
 *               email: { type: string, example: ada@live.unilag.edu.ng }
 *               password: { type: string, example: password123 }
 *               campus: { type: string, example: UNILAG }
 *               department: { type: string, example: "Eng '26" }
 *     responses:
 *       201: { description: Created, content: { application/json: { schema: { $ref: '#/components/schemas/AuthResponse' } } } }
 *       409: { description: Email already registered }
 */
router.post('/register', validate(registerSchema), async (_req, res) => {
  res.status(201).json(await auth.register(res.locals.body));
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and receive a JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: ada@live.unilag.edu.ng }
 *               password: { type: string, example: password123 }
 *     responses:
 *       200: { description: OK, content: { application/json: { schema: { $ref: '#/components/schemas/AuthResponse' } } } }
 *       401: { description: Invalid credentials }
 */
router.post('/login', validate(z.object({ email: z.string().email(), password: z.string().min(1) })), async (_req, res) => {
  const { email, password } = res.locals.body;
  res.json(await auth.login(email, password));
});

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK, content: { application/json: { schema: { $ref: '#/components/schemas/User' } } } }
 *   patch:
 *     tags: [Auth]
 *     summary: Update profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               campus: { type: string }
 *               department: { type: string }
 *               avatarUrl: { type: string }
 *     responses:
 *       200: { description: OK }
 */
router.get('/me', requireAuth, async (req, res) => {
  res.json(await auth.getUser(currentUser(req).id));
});

router.patch(
  '/me',
  requireAuth,
  validate(
    z.object({
      name: z.string().min(2).max(120).optional(),
      campus: z.string().max(120).optional(),
      department: z.string().max(120).optional(),
      avatarUrl: z.string().max(2000).optional(),
    }),
  ),
  async (req, res) => {
    res.json(await auth.updateProfile(currentUser(req).id, res.locals.body));
  },
);

export default router;
