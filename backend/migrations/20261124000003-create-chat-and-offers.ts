import { DataTypes, type QueryInterface } from 'sequelize';

const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};

export async function up({ context: qi }: { context: QueryInterface }) {
  await qi.createTable('conversations', {
    id: { type: DataTypes.UUID, primaryKey: true },
    listing_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'listings', key: 'id' }, onDelete: 'CASCADE' },
    buyer_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    seller_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    last_message_at: { type: DataTypes.DATE, allowNull: false },
    ...timestamps,
  });
  await qi.addIndex('conversations', ['listing_id', 'buyer_id'], { unique: true });

  await qi.createTable('offers', {
    id: { type: DataTypes.UUID, primaryKey: true },
    conversation_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'conversations', key: 'id' }, onDelete: 'CASCADE' },
    listing_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'listings', key: 'id' }, onDelete: 'CASCADE' },
    buyer_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
    hub_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'hubs', key: 'id' }, onDelete: 'SET NULL' },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    note: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
    meetup_at: { type: DataTypes.DATE, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    verification_pin: { type: DataTypes.STRING(6), allowNull: true },
    ...timestamps,
  });

  await qi.createTable('messages', {
    id: { type: DataTypes.UUID, primaryKey: true },
    conversation_id: { type: DataTypes.UUID, allowNull: false, references: { model: 'conversations', key: 'id' }, onDelete: 'CASCADE' },
    sender_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
    offer_id: { type: DataTypes.UUID, allowNull: true, references: { model: 'offers', key: 'id' }, onDelete: 'SET NULL' },
    type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'text' },
    body: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    image_url: { type: DataTypes.TEXT, allowNull: true },
    read_at: { type: DataTypes.DATE, allowNull: true },
    ...timestamps,
  });
  await qi.addIndex('messages', ['conversation_id', 'created_at']);
}

export async function down({ context: qi }: { context: QueryInterface }) {
  await qi.dropTable('messages');
  await qi.dropTable('offers');
  await qi.dropTable('conversations');
}
