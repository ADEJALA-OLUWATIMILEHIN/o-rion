import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Umzug, SequelizeStorage } from 'umzug';
import { sequelize } from '../config/database.ts';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

export const migrator = new Umzug({
  migrations: {
    glob: ['*.ts', { cwd: dir }],
    resolve: ({ name, path: filePath, context }) => ({
      name,
      up: async () => (await import(filePath!)).up({ context }),
      down: async () => (await import(filePath!)).down({ context }),
    }),
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'schema_migrations' }),
  logger: console,
});

if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2] ?? 'up';
  try {
    if (cmd === 'down') await migrator.down();
    else if (cmd === 'reset') await migrator.down({ to: 0 });
    else await migrator.up();
  } finally {
    await sequelize.close();
  }
}
