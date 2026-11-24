import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';
import { sequelize } from '../config/database.ts';

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare campus: CreationOptional<string>;
  declare department: CreationOptional<string | null>;
  declare avatarUrl: CreationOptional<string | null>;
  declare verified: CreationOptional<boolean>;
  declare rating: CreationOptional<number>;
  declare tradesCount: CreationOptional<number>;
  declare responseTime: CreationOptional<string>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  toJSON() {
    const { passwordHash: _omit, ...rest } = this.get();
    return rest;
  }
}

User.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    campus: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'UNILAG' },
    department: { type: DataTypes.STRING(120), allowNull: true },
    avatarUrl: { type: DataTypes.TEXT, allowNull: true },
    verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 5 },
    tradesCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    responseTime: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Replies in 1h' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'users' },
);
