import crypto from 'node:crypto';
import { Op } from 'sequelize';
import { sequelize, Offer, Message, Conversation, Listing, User, Hub } from '../models/index.ts';
import { assertParticipant } from './chatService.ts';
import { badRequest, forbidden, notFound, HttpError } from './httpError.ts';

const OFFER_TTL_HOURS = 18;

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

async function postSystem(conversationId: string, body: string, offerId: string | null = null, transaction?: import('sequelize').Transaction) {
  await Message.create({ conversationId, senderId: null, type: 'system', body, offerId }, { transaction });
  await Conversation.update({ lastMessageAt: new Date() }, { where: { id: conversationId }, transaction });
}

/** Expire stale pending offers lazily whenever offers are touched. */
async function expireStale() {
  await Offer.update({ status: 'expired' }, { where: { status: 'pending', expiresAt: { [Op.lt]: new Date() } } });
}

export async function createOffer(
  conversationId: string,
  buyerId: string,
  input: { amount: number; note?: string; hubId?: string | null; meetupAt?: string | null },
) {
  const convo = await assertParticipant(conversationId, buyerId);
  if (convo.buyerId !== buyerId) throw forbidden('Only the buyer can make an escrow offer');
  const listing = await Listing.findByPk(convo.listingId);
  if (!listing) throw notFound('Listing');
  if (listing.status !== 'active') throw badRequest('This item is no longer available');
  if (input.amount <= 0) throw badRequest('Offer must be greater than zero');
  if (input.amount > listing.price) throw badRequest('Offer cannot exceed the asking price');
  if (!listing.negotiable && input.amount !== listing.price) throw badRequest('This listing is not negotiable');
  if (input.hubId && !(await Hub.findByPk(input.hubId))) throw notFound('Hub');

  return sequelize.transaction(async (transaction) => {
    // A buyer has at most one live offer per conversation.
    await Offer.update({ status: 'cancelled' }, { where: { conversationId, status: 'pending' }, transaction });
    const offer = await Offer.create(
      {
        conversationId,
        listingId: listing.id,
        buyerId,
        amount: input.amount,
        note: input.note ?? '',
        hubId: input.hubId ?? listing.hubId ?? null,
        meetupAt: input.meetupAt ? new Date(input.meetupAt) : null,
        expiresAt: new Date(Date.now() + OFFER_TTL_HOURS * 3600_000),
      },
      { transaction },
    );
    await Message.create({ conversationId, senderId: buyerId, type: 'offer', offerId: offer.id, body: `Escrow offer: ${naira(offer.amount)}` }, { transaction });
    await Conversation.update({ lastMessageAt: new Date() }, { where: { id: conversationId }, transaction });
    return offer;
  });
}

async function loadOffer(id: string) {
  await expireStale();
  const offer = await Offer.findByPk(id);
  if (!offer) throw notFound('Offer');
  const convo = await Conversation.findByPk(offer.conversationId);
  return { offer, convo: convo! };
}

export async function respondToOffer(id: string, sellerId: string, action: 'accept' | 'decline') {
  const { offer, convo } = await loadOffer(id);
  if (convo.sellerId !== sellerId) throw forbidden('Only the seller can respond to this offer');
  if (offer.status !== 'pending') throw new HttpError(409, `Offer is already ${offer.status}`);

  return sequelize.transaction(async (transaction) => {
    if (action === 'decline') {
      await offer.update({ status: 'declined' }, { transaction });
      await postSystem(convo.id, `Seller declined the ${naira(offer.amount)} offer. Escrow released back to buyer.`, offer.id, transaction);
      return offer;
    }
    const pin = crypto.randomInt(0, 10_000).toString().padStart(4, '0');
    await offer.update({ status: 'accepted', verificationPin: pin }, { transaction });
    await Listing.update({ status: 'reserved' }, { where: { id: offer.listingId }, transaction });
    // Other buyers' pending offers on this listing lapse.
    await Offer.update(
      { status: 'declined' },
      { where: { listingId: offer.listingId, status: 'pending', id: { [Op.ne]: offer.id } }, transaction },
    );
    await postSystem(
      convo.id,
      `Offer accepted! ${naira(offer.amount)} is locked in escrow. The buyer shares their 4-digit handover PIN at the hub after testing the item.`,
      offer.id,
      transaction,
    );
    return offer;
  });
}

export async function cancelOffer(id: string, buyerId: string) {
  const { offer, convo } = await loadOffer(id);
  if (offer.buyerId !== buyerId) throw forbidden('Only the buyer can cancel this offer');
  if (!['pending', 'accepted'].includes(offer.status)) throw new HttpError(409, `Offer is already ${offer.status}`);
  return sequelize.transaction(async (transaction) => {
    const wasAccepted = offer.status === 'accepted';
    await offer.update({ status: 'cancelled' }, { transaction });
    if (wasAccepted) await Listing.update({ status: 'active' }, { where: { id: offer.listingId }, transaction });
    await postSystem(convo.id, `Buyer cancelled the ${naira(offer.amount)} offer. Escrow refunded.`, offer.id, transaction);
    return offer;
  });
}

/** Seller enters the buyer's handover PIN: escrow is released and the item is marked sold. */
export async function completeOffer(id: string, sellerId: string, pin: string) {
  const { offer, convo } = await loadOffer(id);
  if (convo.sellerId !== sellerId) throw forbidden('Only the seller can confirm handover');
  if (offer.status !== 'accepted') throw new HttpError(409, 'Offer must be accepted before handover');
  if (offer.verificationPin !== pin) throw badRequest('Incorrect handover PIN');

  return sequelize.transaction(async (transaction) => {
    await offer.update({ status: 'completed' }, { transaction });
    await Listing.update({ status: 'sold' }, { where: { id: offer.listingId }, transaction });
    await User.increment('tradesCount', { where: { id: [convo.buyerId, convo.sellerId] }, transaction });
    await postSystem(convo.id, `Handover verified. ${naira(offer.amount)} released from escrow to the seller. Trade complete!`, offer.id, transaction);
    return offer;
  });
}

export async function getOffer(id: string, userId: string) {
  const { offer, convo } = await loadOffer(id);
  if (convo.buyerId !== userId && convo.sellerId !== userId) throw forbidden();
  const json = offer.toJSON() as Record<string, unknown>;
  if (offer.buyerId === userId && offer.status === 'accepted') json.verificationPin = offer.verificationPin;
  return json;
}
