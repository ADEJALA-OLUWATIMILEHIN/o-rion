import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional, type ForeignKey } from 'sequelize';
import { sequelize } from '../config/database.ts';
import type { User } from './User.ts';
import type { Conversation } from './Conversation.ts';
import type { Offer } from './Offer.ts';

export const MESSAGE_TYPES = ['text', 'offer', 'system'] as const;
export type MessageType = (typeof MESSAGE_TYPES)[number];

export class Message extends Model<InferAttributes<Message>, InferCreationAttributes<Message>> {
  declare id: CreationOptional<string>;
  declare conversationId: ForeignKey<Conversation['id']>;
  declare senderId: ForeignKey<User['id']> | null;
  declare offerId: ForeignKey<Offer['id']> | null;
  declare type: CreationOptional<MessageType>;
  declare body: CreationOptional<string>;
  declare imageUrl: CreationOptional<string | null>;
  declare readAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Message.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'text' },
    body: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    imageUrl: { type: DataTypes.TEXT, allowNull: true },
    readAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'messages' },
);
