import { Op, QueryTypes } from 'sequelize';
import { sequelize, Conversation, Message, Listing, User, Offer, Hub } from '../models/index.ts';
import { badRequest, forbidden, notFound } from './httpError.ts';

const userAttrs = ['id', 'name', 'avatarUrl', 'verified', 'rating', 'tradesCount', 'campus', 'department', 'responseTime'];
const listingAttrs = ['id', 'title', 'price', 'images', 'condition', 'grade', 'negotiable', 'warrantyMonths', 'status', 'inspected', 'sellerId'];

export async function assertParticipant(conversationId: string, userId: string) {
  const convo = await Conversation.findByPk(conversationId);
  if (!convo) throw notFound('Conversation');
  if (convo.buyerId !== userId && convo.sellerId !== userId) throw forbidden('Not part of this conversation');
  return convo;
}

export async function listConversations(userId: string) {
  const convos = await Conversation.findAll({
    where: { [Op.or]: [{ buyerId: userId }, { sellerId: userId }] },
    order: [['lastMessageAt', 'DESC']],
    include: [
      { model: Listing, as: 'listing', attributes: listingAttrs },
      { model: User, as: 'buyer', attributes: userAttrs },
      { model: User, as: 'seller', attributes: userAttrs },
    ],
  });
  if (convos.length === 0) return [];

  const ids = convos.map((c) => c.id);
  const [lastMessages, unreadRows] = await Promise.all([
    sequelize.query<{ conversationId: string; body: string; type: string; senderId: string | null; createdAt: Date }>(
      `SELECT DISTINCT ON (conversation_id) conversation_id AS "conversationId", body, type,
              sender_id AS "senderId", created_at AS "createdAt"
         FROM messages WHERE conversation_id IN (:ids)
        ORDER BY conversation_id, created_at DESC`,
      { replacements: { ids }, type: QueryTypes.SELECT },
    ),
    Message.findAll({
      where: { conversationId: ids, readAt: null, senderId: { [Op.ne]: userId } },
      attributes: ['conversationId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['conversationId'],
      raw: true,
    }) as unknown as Promise<{ conversationId: string; count: string }[]>,
  ]);
  const lastBy = new Map(lastMessages.map((m) => [m.conversationId, m]));
  const unreadBy = new Map(unreadRows.map((r) => [r.conversationId, Number(r.count)]));

  return convos.map((c) => {
    const json = c.toJSON() as Record<string, unknown>;
    const role = c.buyerId === userId ? 'buyer' : 'seller';
    const last = lastBy.get(c.id);
    return {
      id: c.id,
      role,
      listing: json.listing,
      otherUser: role === 'buyer' ? json.seller : json.buyer,
      lastMessage: last ? { body: last.body, type: last.type, senderId: last.senderId, createdAt: last.createdAt } : null,
      unreadCount: unreadBy.get(c.id) ?? 0,
      lastMessageAt: c.lastMessageAt,
    };
  });
}

export async function unreadTotal(userId: string) {
  const count = await Message.count({
    where: { readAt: null, senderId: { [Op.ne]: userId } },
    include: [
      {
        model: Conversation,
        as: 'conversation',
        attributes: [],
        where: { [Op.or]: [{ buyerId: userId }, { sellerId: userId }] },
      },
    ],
  });
  return { unread: count };
}

export async function startConversation(buyerId: string, listingId: string, firstMessage?: string) {
  const listing = await Listing.findByPk(listingId);
  if (!listing) throw notFound('Listing');
  if (listing.sellerId === buyerId) throw badRequest("You can't message yourself about your own listing");

  const [convo, created] = await Conversation.findOrCreate({
    where: { listingId, buyerId },
    defaults: { listingId, buyerId, sellerId: listing.sellerId },
  });
  if (created) {
    await Message.create({ conversationId: convo.id, senderId: null, type: 'system', body: `Inquired about "${listing.title}"` });
  }
  if (firstMessage?.trim()) await sendMessage(convo.id, buyerId, { body: firstMessage });
  return getConversation(convo.id, buyerId);
}

export async function getConversation(conversationId: string, userId: string) {
  await assertParticipant(conversationId, userId);
  const convo = await Conversation.findByPk(conversationId, {
    include: [
      {
        model: Listing,
        as: 'listing',
        include: [{ model: Hub, as: 'hub' }],
      },
      { model: User, as: 'buyer', attributes: userAttrs },
      { model: User, as: 'seller', attributes: userAttrs },
    ],
  });
  const json = convo!.toJSON() as Record<string, unknown>;
  const role = convo!.buyerId === userId ? 'buyer' : 'seller';
  return { ...json, role, otherUser: role === 'buyer' ? json.seller : json.buyer };
}

export async function listMessages(conversationId: string, userId: string, after?: string) {
  const convo = await assertParticipant(conversationId, userId);
  const where: Record<string | symbol, unknown> = { conversationId };
  if (after) where.createdAt = { [Op.gt]: new Date(after) };
  const messages = await Message.findAll({
    where,
    order: [['createdAt', 'ASC']],
    include: [{ model: Offer, as: 'offer', include: [{ model: Hub, as: 'hub' }] }],
  });
  // Mark the other party's messages as read.
  await Message.update(
    { readAt: new Date() },
    { where: { conversationId, readAt: null, senderId: { [Op.ne]: userId } } },
  );
  return messages.map((m) => {
    const json = m.toJSON() as Record<string, unknown>;
    const offer = m.get('offer') as Offer | null;
    // Only the buyer ever sees the handover PIN.
    if (offer && offer.buyerId === userId && convo.buyerId === userId && offer.status === 'accepted') {
      json.offer = { ...offer.toJSON(), verificationPin: offer.verificationPin };
    }
    return json;
  });
}

export async function sendMessage(conversationId: string, senderId: string, input: { body?: string; imageUrl?: string | null }) {
  const convo = await assertParticipant(conversationId, senderId);
  const body = input.body?.trim() ?? '';
  if (!body && !input.imageUrl) throw badRequest('Message cannot be empty');
  const message = await Message.create({ conversationId, senderId, body, imageUrl: input.imageUrl ?? null, type: 'text' });
  await convo.update({ lastMessageAt: new Date() });
  return message;
}
