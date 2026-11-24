import { sequelize } from '../config/database.ts';
import { User } from './User.ts';
import { Hub } from './Hub.ts';
import { Listing } from './Listing.ts';
import { Favorite } from './Favorite.ts';
import { Conversation } from './Conversation.ts';
import { Offer } from './Offer.ts';
import { Message } from './Message.ts';

User.hasMany(Listing, { foreignKey: 'sellerId', as: 'listings' });
Listing.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });

Hub.hasMany(Listing, { foreignKey: 'hubId', as: 'listings' });
Listing.belongsTo(Hub, { foreignKey: 'hubId', as: 'hub' });

User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Listing.hasMany(Favorite, { foreignKey: 'listingId', as: 'favorites' });
Favorite.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });

Conversation.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });
Conversation.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });
Conversation.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Conversation.hasMany(Offer, { foreignKey: 'conversationId', as: 'offers' });

Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(Offer, { foreignKey: 'offerId', as: 'offer' });

Offer.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Offer.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });
Offer.belongsTo(User, { foreignKey: 'buyerId', as: 'buyer' });
Offer.belongsTo(Hub, { foreignKey: 'hubId', as: 'hub' });

export { sequelize, User, Hub, Listing, Favorite, Conversation, Offer, Message };
export type { Condition, Category, ListingStatus, ListingChecks } from './Listing.ts';
