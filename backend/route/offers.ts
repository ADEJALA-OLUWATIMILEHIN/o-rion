import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.ts';
import { requireAuth, currentUser } from '../middleware/auth.ts';
import * as offers from '../services/offerService.ts';

const router = Router();
router.use(requireAuth);
const idParam = z.object({ id: z.string().uuid() });

/**
 * @openapi
 * /offers/{id}:
 *   get:
 *     tags: [Offers]
 *     summary: Offer detail (buyer also sees the handover PIN once accepted)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/:id', validate(idParam, 'params'), async (req, res) => {
  res.json(await offers.getOffer(res.locals.params.id, currentUser(req).id));
});

/**
 * @openapi
 * /offers/{id}/accept:
 *   post:
 *     tags: [Offers]
 *     summary: Seller accepts — funds locked in escrow, listing reserved
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: OK }
 * /offers/{id}/decline:
 *   post:
 *     tags: [Offers]
 *     summary: Seller declines
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: OK }
 * /offers/{id}/cancel:
 *   post:
 *     tags: [Offers]
 *     summary: Buyer cancels (refund)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: OK }
 * /offers/{id}/complete:
 *   post:
 *     tags: [Offers]
 *     summary: Seller enters buyer's handover PIN — escrow released, listing sold
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { type: object, required: [pin], properties: { pin: { type: string, example: '0427' } } } } }
 *     responses:
 *       200: { description: OK }
 */
router.post('/:id/accept', validate(idParam, 'params'), async (req, res) => {
  res.json(await offers.respondToOffer(res.locals.params.id, currentUser(req).id, 'accept'));
});

router.post('/:id/decline', validate(idParam, 'params'), async (req, res) => {
  res.json(await offers.respondToOffer(res.locals.params.id, currentUser(req).id, 'decline'));
});

router.post('/:id/cancel', validate(idParam, 'params'), async (req, res) => {
  res.json(await offers.cancelOffer(res.locals.params.id, currentUser(req).id));
});

router.post('/:id/complete', validate(idParam, 'params'), validate(z.object({ pin: z.string().regex(/^\d{4}$/) })), async (req, res) => {
  res.json(await offers.completeOffer(res.locals.params.id, currentUser(req).id, res.locals.body.pin));
});

export default router;
