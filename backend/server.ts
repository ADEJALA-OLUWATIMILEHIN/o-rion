import { env } from './config/env.ts';
import { sequelize } from './models/index.ts';
import { createApp } from './app.ts';

await sequelize.authenticate();
createApp().listen(env.port, () => {
  console.log(`O-Rion API on http://localhost:${env.port}/api  (docs: /api/docs)`);
});
