import { Router } from 'express';
import auth from './auth.ts';
import listings from './listings.ts';
import favorites from './favorites.ts';
import hubs from './hubs.ts';
import conversations from './conversations.ts';
import offers from './offers.ts';
import uploads from './uploads.ts';

const api = Router();
api.get('/health', (_req, res) => {
  res.json({ ok: true });
});
api.use('/auth', auth);
api.use('/listings', listings);
api.use('/favorites', favorites);
api.use('/hubs', hubs);
api.use('/conversations', conversations);
api.use('/offers', offers);
api.use('/uploads', uploads);

export default api;
