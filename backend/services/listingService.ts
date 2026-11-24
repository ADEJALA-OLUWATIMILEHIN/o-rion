import { Op, type WhereOptions, type Order } from 'sequelize';
import { Listing, User, Hub, Favorite, type Condition, type Category, type ListingStatus, type ListingChecks } from '../models/index.ts';
import { forbidden, notFound } from './httpError.ts';

export type ListingQuery = {
  q?: string;
  category?: Category;
  condition?: Condition;
  inspected?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  status?: ListingStatus;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'best_match';
  page?: number;
  limit?: number;
};

const sellerAttrs = ['id', 'name', 'avatarUrl', 'verified', 'rating', 'tradesCount', 'campus', 'department', 'responseTime'];

async function favoriteIds(userId: string | undefined, listingIds: string[]) {
  if (!userId || listingIds.length === 0) return new Set<string>();
  const favs = await Favorite.findAll({ where: { userId, listingId: listingIds }, attributes: ['listingId'] });
  return new Set(favs.map((f) => f.listingId));
}

export async function listListings(query: ListingQuery, viewerId?: string) {
  const where: WhereOptions<Listing> & Record<string | symbol, unknown> = { status: query.status ?? 'active' };
  if (query.category) where.category = query.category;
  if (query.condition) where.condition = query.condition;
  if (query.inspected) where.inspected = true;
  if (query.sellerId) where.sellerId = query.sellerId;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice !== undefined ? { [Op.gte]: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { [Op.lte]: query.maxPrice } : {}),
    };
  }
  if (query.q) {
    const like = `%${query.q.trim()}%`;
    where[Op.or] = [{ title: { [Op.iLike]: like } }, { description: { [Op.iLike]: like } }];
  }

  const order: Order =
    query.sort === 'price_asc'
      ? [['price', 'ASC']]
      : query.sort === 'price_desc'
        ? [['price', 'DESC']]
        : query.sort === 'newest'
          ? [['createdAt', 'DESC']]
          : [['inspected', 'DESC'], ['views', 'DESC'], ['createdAt', 'DESC']];

  const limit = Math.min(query.limit ?? 20, 50);
  const page = Math.max(query.page ?? 1, 1);
  const { rows, count } = await Listing.findAndCountAll({
    where,
    order,
    limit,
    offset: (page - 1) * limit,
    include: [
      { model: User, as: 'seller', attributes: sellerAttrs },
      { model: Hub, as: 'hub' },
    ],
  });
  const favs = await favoriteIds(viewerId, rows.map((r) => r.id));
  return {
    items: rows.map((r) => ({ ...r.toJSON(), isFavorite: favs.has(r.id) })),
    total: count,
    page,
    pageSize: limit,
  };
}

export async function getListing(id: string, viewerId?: string) {
  const listing = await Listing.findByPk(id, {
    include: [
      { model: User, as: 'seller', attributes: sellerAttrs },
      { model: Hub, as: 'hub' },
    ],
  });
  if (!listing) throw notFound('Listing');
  if (viewerId !== listing.sellerId) await listing.increment('views');
  const favs = await favoriteIds(viewerId, [listing.id]);
  return { ...listing.toJSON(), isFavorite: favs.has(listing.id) };
}

export type ListingInput = {
  title: string;
  description?: string;
  category: Category;
  condition: Condition;
  grade?: string | null;
  price: number;
  originalPrice?: number | null;
  negotiable?: boolean;
  images?: string[];
  tags?: string[];
  checks?: ListingChecks;
  warrantyMonths?: number;
  location?: string;
  hubId?: string | null;
};

export async function createListing(sellerId: string, input: ListingInput) {
  const listing = await Listing.create({ ...input, sellerId, hubId: input.hubId ?? null });
  return getListing(listing.id, sellerId);
}

async function ownedListing(id: string, userId: string) {
  const listing = await Listing.findByPk(id);
  if (!listing) throw notFound('Listing');
  if (listing.sellerId !== userId) throw forbidden('Only the seller can change this listing');
  return listing;
}

export async function updateListing(id: string, userId: string, patch: Partial<ListingInput> & { status?: ListingStatus }) {
  const listing = await ownedListing(id, userId);
  await listing.update(patch);
  return getListing(id, userId);
}

export async function deleteListing(id: string, userId: string) {
  const listing = await ownedListing(id, userId);
  await listing.destroy();
}

const CONDITION_FACTOR: Record<Condition, number> = {
  brand_new: 0.85,
  certified_refurbished: 0.6,
  pre_owned_excellent: 0.5,
  pre_owned_fair: 0.35,
};

/**
 * Rule-based listing assessment used by the "Snap & Sell" grading flow.
 * Scores how complete the seller's disclosures are and suggests a fair price range.
 * (A real deployment would swap this for an image/IMEI verification service.)
 */
export function assessListing(input: { condition: Condition; originalPrice?: number; checks?: ListingChecks; imageCount?: number }) {
  const checks = input.checks ?? {};
  let score = 50;
  if (checks.functionalTested) score += 12;
  if (checks.originalBox) score += 8;
  if (checks.proofOfPurchase) score += 14;
  if (checks.serialVerified) score += 10;
  if ((checks.batteryHealth ?? 0) >= 85) score += 4;
  score += Math.min(input.imageCount ?? 0, 4) * 0.5;
  score = Math.min(Math.round(score), 99);

  const notes: string[] = [];
  if (!checks.proofOfPurchase) notes.push('Add a receipt or proof of purchase to boost buyer trust.');
  if (!checks.functionalTested) notes.push('Confirm a functional test so buyers know it works.');
  if ((input.imageCount ?? 0) < 4) notes.push('Listings with 4+ photos sell faster.');

  let suggested: { low: number; high: number; recommended: number } | null = null;
  if (input.originalPrice && input.originalPrice > 0) {
    const base = input.originalPrice * CONDITION_FACTOR[input.condition];
    const trustBoost = 1 + (score - 50) / 500;
    const recommended = Math.round((base * trustBoost) / 500) * 500;
    suggested = { low: Math.round((recommended * 0.9) / 500) * 500, high: Math.round((recommended * 1.1) / 500) * 500, recommended };
  }
  return { legitimacyScore: score, certifiable: score >= 80, notes, suggestedPrice: suggested };
}
