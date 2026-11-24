import { Sequelize } from 'sequelize';
import { env } from './env.ts';

export const sequelize = new Sequelize(env.databaseUrl, {
  dialect: 'postgres',
  logging: false,
  define: { underscored: true },
});
