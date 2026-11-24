import { Router } from 'express';
import { Hub } from '../models/index.ts';

const router = Router();

/**
 * @openapi
 * /hubs:
 *   get:
 *     tags: [Hubs]
 *     summary: Certified safe-exchange hubs
 *     responses:
 *       200: { description: OK }
 */
router.get('/', async (_req, res) => {
  res.json(await Hub.findAll({ order: [['name', 'ASC']] }));
});

export default router;
