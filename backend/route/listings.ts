import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.ts';
import { requireAuth, optionalAuth, currentUser } from '../middleware/auth.ts';
import * as listings from '../services/listingService.ts';
import { toggleFavorite } from '../services/favoriteService.ts';
import { CATEGORIES, CONDITIONS, LISTING_STATUSES } from '../models/Listing.ts';

const router = Router();

const checksSchema = z
  .object({
    batteryHealth: z.number().min(0).max(100).optional(),
    functionalTested: z.boolean().optional(),
    originalBox: z.boolean().optional(),
    proofOfPurchase: z.boolean().optional(),
    serialVerified: z.boolean().optional(),
  })
  .partial();

const listingSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(4000).optional(),
  category: z.enum(CATEGORIES),
  condition: z.enum(CONDITIONS),
  grade: z.string().max(20).nullish(),
  price: z.number().int().positive(),
  originalPrice: z.number().int().positive().nullish(),
  negotiable: z.boolean().optional(),
  images: z.array(z.string().max(2000)).max(8).optional(),
  tags: z.array(z.string().max(40)).max(10).optional(),
  checks: checksSchema.optional(),
  warrantyMonths: z.number().int().min(0).max(36).optional(),
  location: z.string().max(120).optional(),
  hubId: z.string().uuid().nullish(),
});

const querySchema = z.object({
  q: z.string().max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
  condition: z.enum(CONDITIONS).optional(),
  inspected: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sellerId: z.string().uuid().optional(),
  status: z.enum(LISTING_STATUSES).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'best_match']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

/**
 * @openapi
 * /listings:
 *   get:
 *     tags: [Listings]
 *     summary: Browse and search listings
 *     parameters:
 *       - { in: query, name: q, schema: { type: string } }
 *       - { in: query, name: category, schema: { type: string, enum: [phones, laptops, audio, tablets, cameras, books, fashion, home, other] } }
 *       - { in: query, name: condition, schema: { type: string, enum: [brand_new, certified_refurbished, pre_owned_excellent, pre_owned_fair] } }
 *       - { in: query, name: inspected, schema: { type: boolean }, description: Hub-verified only }
 *       - { in: query, name: minPrice, schema: { type: integer } }
 *       - { in: query, name: maxPrice, schema: { type: integer } }
 *       - { in: query, name: sellerId, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [active, reserved, sold] } }
 *       - { in: query, name: sort, schema: { type: string, enum: [best_match, newest, price_asc, price_desc] } }
 *       - { in: query, name: page, schema: { type: integer } }
 *       - { in: query, name: limit, schema: { type: integer } }
 *     responses:
 *       200: { description: Paginated listings }
 *   post:
 *     tags: [Listings]
 *     summary: Create a listing
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content: { application/json: { schema: { $ref: '#/components/schemas/ListingInput' } } }
 *     responses:
 *       201: { description: Created }
 */
router.get('/', optionalAuth, validate(querySchema, 'query'), async (req, res) => {
  res.json(await listings.listListings(res.locals.query, req.user?.id));
});

router.post('/', requireAuth, validate(listingSchema), async (req, res) => {
  res.status(201).json(await listings.createListing(currentUser(req).id, res.locals.body));
});

/**
 * @openapi
 * /listings/assess:
 *   post:
 *     tags: [Listings]
 *     summary: Grade a draft listing (legitimacy score + fair price suggestion)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [condition]
 *             properties:
 *               condition: { type: string, example: certified_refurbished }
 *               originalPrice: { type: integer, example: 180000 }
 *               imageCount: { type: integer, example: 3 }
 *               checks: { type: object, example: { functionalTested: true, originalBox: true, proofOfPurchase: true, batteryHealth: 94 } }
 *     responses:
 *       200: { description: Assessment }
 */
router.post(
  '/assess',
  validate(
    z.object({
      condition: z.enum(CONDITIONS),
      originalPrice: z.number().int().positive().optional(),
      imageCount: z.number().int().min(0).optional(),
      checks: checksSchema.optional(),
    }),
  ),
  (_req, res) => {
    res.json(listings.assessListing(res.locals.body));
  },
);

/**
 * @openapi
 * /listings/{id}:
 *   get:
 *     tags: [Listings]
 *     summary: Listing detail
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: OK }
 *       404: { description: Not found }
 *   patch:
 *     tags: [Listings]
 *     summary: Update your listing
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       content: { application/json: { schema: { $ref: '#/components/schemas/ListingInput' } } }
 *     responses:
 *       200: { description: OK }
 *   delete:
 *     tags: [Listings]
 *     summary: Delete your listing
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       204: { description: Deleted }
 */
const idParam = z.object({ id: z.string().uuid() });

router.get('/:id', optionalAuth, validate(idParam, 'params'), async (req, res) => {
  res.json(await listings.getListing(res.locals.params.id, req.user?.id));
});

router.patch(
  '/:id',
  requireAuth,
  validate(idParam, 'params'),
  validate(listingSchema.partial().extend({ status: z.enum(LISTING_STATUSES).optional() })),
  async (req, res) => {
    res.json(await listings.updateListing(res.locals.params.id, currentUser(req).id, res.locals.body));
  },
);

router.delete('/:id', requireAuth, validate(idParam, 'params'), async (req, res) => {
  await listings.deleteListing(res.locals.params.id, currentUser(req).id);
  res.status(204).end();
});

/**
 * @openapi
 * /listings/{id}/favorite:
 *   post:
 *     tags: [Favorites]
 *     summary: Toggle saved state
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: "{ isFavorite: boolean }" }
 */
router.post('/:id/favorite', requireAuth, validate(idParam, 'params'), async (req, res) => {
  res.json(await toggleFavorite(currentUser(req).id, res.locals.params.id));
});

export default router;
