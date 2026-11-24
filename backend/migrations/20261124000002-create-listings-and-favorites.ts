import { DataTypes, type QueryInterface } from 'sequelize';

const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};

export async function up({ context: qi }: { context: QueryInterface }) {
  await qi.createTable('listings', {
    id: { type: DataTypes.UUID, primaryKey: true },
    seller_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    hub_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'hubs', key: 'id' }, onDelete: 'SET NULL' },
    title: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    category: { type: DataTypes.STRING(40), allowNull: false },
    condition: { type: DataTypes.STRING(40), allowNull: false },
    grade: { type: DataTypes.STRING(20), allowNull: true },
    price: { type: DataTypes.INTEGER, allowNull: false },
    original_price: { type: DataTypes.INTEGER, allowNull: true },
    negotiable: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    images: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    tags: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    checks: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    warranty_months: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    location: { type: DataTypes.STRING(120), allowNull: false, defaultValue: 'UNILAG, Akoka' },
    inspected: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
    views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    ...timestamps,
  });
  await qi.addIndex('listings', ['status', 'category']);
  await qi.addIndex('listings', ['seller_id']);

  await qi.createTable('favorites', {
    id: { type: DataTypes.UUID, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    listing_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'listings', key: 'id' }, onDelete: 'CASCADE' },
    ...timestamps,
  });
  await qi.addIndex('favorites', ['user_id', 'listing_id'], { unique: true });
}

export async function down({ context: qi }: { context: QueryInterface }) {
  await qi.dropTable('favorites');
  await qi.dropTable('listings');
}
