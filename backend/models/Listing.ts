import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional, type ForeignKey } from 'sequelize';
import { sequelize } from '../config/database.ts';
import type { User } from './User.ts';
import type { Hub } from './Hub.ts';

export const CONDITIONS = ['brand_new', 'certified_refurbished', 'pre_owned_excellent', 'pre_owned_fair'] as const;
export type Condition = (typeof CONDITIONS)[number];

export const CATEGORIES = ['phones', 'laptops', 'audio', 'tablets', 'cameras', 'books', 'fashion', 'home', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const LISTING_STATUSES = ['active', 'reserved', 'sold'] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export type ListingChecks = {
  batteryHealth?: number;
  functionalTested?: boolean;
  originalBox?: boolean;
  proofOfPurchase?: boolean;
  serialVerified?: boolean;
};

export class Listing extends Model<InferAttributes<Listing>, InferCreationAttributes<Listing>> {
  declare id: CreationOptional<string>;
  declare sellerId: ForeignKey<User['id']>;
  declare hubId: ForeignKey<Hub['id']> | null;
  declare title: string;
  declare description: CreationOptional<string>;
  declare category: Category;
  declare condition: Condition;
  declare grade: CreationOptional<string | null>;
  declare price: number;
  declare originalPrice: CreationOptional<number | null>;
  declare negotiable: CreationOptional<boolean>;
  declare images: CreationOptional<string[]>;
  declare tags: CreationOptional<string[]>;
  declare checks: CreationOptional<ListingChecks>;
  declare warrantyMonths: CreationOptional<number>;
  declare location: CreationOptional<string>;
  declare inspected: CreationOptional<boolean>;
  declare status: CreationOptional<ListingStatus>;
  declare views: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Listing.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    category: { type: DataTypes.STRING(40), allowNull: false },
    condition: { type: DataTypes.STRING(40), allowNull: false },
    grade: { type: DataTypes.STRING(20), allowNull: true },
    price: { type: DataTypes.INTEGER, allowNull: false },
    originalPrice: { type: DataTypes.INTEGER, allowNull: true },
    negotiable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    images: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    tags: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    checks: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    warrantyMonths: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    location: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'UNILAG, Akoka' },
    inspected: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
    views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'listings' },
);
