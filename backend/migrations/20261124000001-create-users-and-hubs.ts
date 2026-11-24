import { DataTypes, type QueryInterface } from 'sequelize';

const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};

export async function up({ context: qi }: { context: QueryInterface }) {
  await qi.createTable('users', {
    id: { type: DataTypes.UUID, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    campus: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'UNILAG' },
    department: { type: DataTypes.STRING(120), allowNull: true },
    avatar_url: { type: DataTypes.TEXT, allowNull: true },
    verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 5 },
    trades_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    response_time: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'Replies in 1h' },
    ...timestamps,
  });

  await qi.createTable('hubs', {
    id: { type: DataTypes.UUID, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    area: { type: DataTypes.STRING(120), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    features: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    ...timestamps,
  });
}

export async function down({ context: qi }: { context: QueryInterface }) {
  await qi.dropTable('hubs');
  await qi.dropTable('users');
}
