import { Favorite, Listing, User, Hub } from '../models/index.ts';
import { notFound } from './httpError.ts';

export async function toggleFavorite(userId: string, listingId: string) {
  if (!(await Listing.findByPk(listingId))) throw notFound('Listing');
  const existing = await Favorite.findOne({ where: { userId, listingId } });
  if (existing) {
    await existing.destroy();
    return { isFavorite: false };
  }
  await Favorite.create({ userId, listingId });
  return { isFavorite: true };
}

export async function listFavorites(userId: string) {
  const favs = await Favorite.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Listing,
        as: 'listing',
        include: [
          { model: User, as: 'seller', attributes: ['id', 'name', 'avatarUrl', 'verified', 'rating', 'tradesCount'] },
          { model: Hub, as: 'hub' },
        ],
      },
    ],
  });
  return favs.map((f) => ({ ...(f.get('listing') as Listing).toJSON(), isFavorite: true }));
}
