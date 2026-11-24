import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.ts';
import { requireAuth, currentUser } from '../middleware/auth.ts';
import * as chat from '../services/chatService.ts';
import { createOffer } from '../services/offerService.ts';

const router = Router();
router.use(requireAuth);

const idParam = z.object({ id: z.string().uuid() });

/**
 * @openapi
 * /conversations:
 *   get:
 *     tags: [Chat]
 *     summary: Your inbox
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Conversations with last message and unread count }
 *   post:
 *     tags: [Chat]
 *     summary: Start (or reopen) a conversation about a listing
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listingId]
 *             properties:
 *               listingId: { type: string }
 *               message: { type: string, example: Hi! Is this still available? }
 *     responses:
 *       201: { description: Conversation }
 */
router.get('/', async (req, res) => {
  res.json(await chat.listConversations(currentUser(req).id));
});

router.post('/', validate(z.object({ listingId: z.string().uuid(), message: z.string().max(2000).optional() })), async (req, res) => {
  const { listingId, message } = res.locals.body;
  res.status(201).json(await chat.startConversation(currentUser(req).id, listingId, message));
});

/**
 * @openapi
 * /conversations/unread:
 *   get:
 *     tags: [Chat]
 *     summary: Total unread messages (for the Inbox badge)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: "{ unread: number }" }
 */
router.get('/unread', async (req, res) => {
  res.json(await chat.unreadTotal(currentUser(req).id));
});

/**
 * @openapi
 * /conversations/{id}:
 *   get:
 *     tags: [Chat]
 *     summary: Conversation with listing and participants
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: OK }
 */
router.get('/:id', validate(idParam, 'params'), async (req, res) => {
  res.json(await chat.getConversation(res.locals.params.id, currentUser(req).id));
});

/**
 * @openapi
 * /conversations/{id}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Messages (marks incoming as read). Pass `after` (ISO date) to poll for new ones.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: query, name: after, schema: { type: string, format: date-time } }
 *     responses:
 *       200: { description: OK }
 *   post:
 *     tags: [Chat]
 *     summary: Send a message
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               body: { type: string }
 *               imageUrl: { type: string }
 *     responses:
 *       201: { description: Message }
 */
router.get('/:id/messages', validate(idParam, 'params'), validate(z.object({ after: z.string().datetime().optional() }), 'query'), async (req, res) => {
  res.json(await chat.listMessages(res.locals.params.id, currentUser(req).id, res.locals.query.after));
});

router.post(
  '/:id/messages',
  validate(idParam, 'params'),
  validate(z.object({ body: z.string().max(2000).optional(), imageUrl: z.string().max(2000).nullish() })),
  async (req, res) => {
    res.status(201).json(await chat.sendMessage(res.locals.params.id, currentUser(req).id, res.locals.body));
  },
);

/**
 * @openapi
 * /conversations/{id}/offers:
 *   post:
 *     tags: [Offers]
 *     summary: Buyer makes an escrow offer (replaces any pending one)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: integer, example: 40000 }
 *               note: { type: string, example: Can test ANC and pick up today at 4:30pm }
 *               hubId: { type: string }
 *               meetupAt: { type: string, format: date-time }
 *     responses:
 *       201: { description: Offer }
 */
router.post(
  '/:id/offers',
  validate(idParam, 'params'),
  validate(
    z.object({
      amount: z.number().int().positive(),
      note: z.string().max(500).optional(),
      hubId: z.string().uuid().nullish(),
      meetupAt: z.string().datetime().nullish(),
    }),
  ),
  async (req, res) => {
    res.status(201).json(await createOffer(res.locals.params.id, currentUser(req).id, res.locals.body));
  },
);

export default router;
