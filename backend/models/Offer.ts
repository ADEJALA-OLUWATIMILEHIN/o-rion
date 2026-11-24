import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional, type ForeignKey } from 'sequelize';
import { sequelize } from '../config/database.ts';
import type { User } from './User.ts';
import type { Listing } from './Listing.ts';
import type { Conversation } from './Conversation.ts';
import type { Hub } from './Hub.ts';

export const OFFER_STATUSES = ['pending', 'accepted', 'declined', 'cancelled', 'expired', 'completed'] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

/** An escrow offer: funds are "reserved" until the buyer verifies the item at a hub. */
export class Offer extends Model<InferAttributes<Offer>, InferCreationAttributes<Offer>> {
  declare id: CreationOptional<string>;
  declare conversationId: ForeignKey<Conversation['id']>;
  declare listingId: ForeignKey<Listing['id']>;
  declare buyerId: ForeignKey<User['id']>;
  declare hubId: ForeignKey<Hub['id']> | null;
  declare amount: number;
  declare note: CreationOptional<string>;
  declare status: CreationOptional<OfferStatus>;
  declare meetupAt: CreationOptional<Date | null>;
  declare expiresAt: Date;
  declare verificationPin: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  toJSON() {
    const { verificationPin: _omit, ...rest } = this.get();
    return rest;
  }
}

Offer.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
    meetupAt: { type: DataTypes.DATE, allowNull: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    verificationPin: { type: DataTypes.STRING(6), allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'offers' },
);
