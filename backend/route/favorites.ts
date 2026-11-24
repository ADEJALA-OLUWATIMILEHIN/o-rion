import { Router } from 'express';
import { requireAuth, currentUser } from '../middleware/auth.ts';
import { listFavorites } from '../services/favoriteService.ts';

const router = Router();

/**
 * @openapi
 * /favorites:
 *   get:
 *     tags: [Favorites]
 *     summary: Your saved listings
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/', requireAuth, async (req, res) => {
  res.json(await listFavorites(currentUser(req).id));
});

export default router;
