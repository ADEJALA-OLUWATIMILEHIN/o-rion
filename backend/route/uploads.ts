import { Router } from 'express';
import { requireAuth } from '../middleware/auth.ts';
import { imageUpload } from '../middleware/upload.ts';
import { env } from '../config/env.ts';
import { badRequest } from '../services/httpError.ts';

const router = Router();

/**
 * @openapi
 * /uploads:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload up to 8 images (field name "images")
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       201: { description: "{ urls: string[] }" }
 */
router.post('/', requireAuth, imageUpload.array('images', 8), (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw badRequest('No images uploaded');
  res.status(201).json({ urls: files.map((f) => `${env.publicUrl}/uploads/${f.filename}`) });
});

export default router;
