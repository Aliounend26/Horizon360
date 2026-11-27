import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import cron from 'node-cron';
import { generateMaintenanceNotifications, generateDocumentExpiryNotifications } from './services/maintenanceService';
import { User } from './models';
import { runSeed } from './seed/seed';

async function main() {
  await connectDB();

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    if (env.nodeEnv !== 'development') {
      throw new Error('No users found. Create an administrator before starting the server outside development.');
    }
    console.log('[server] Empty database detected — seeding demo data...');
    await runSeed();
  }

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`[server] Horizon360 API listening on http://localhost:${env.port}`);
  });

  // Refresh maintenance/document notifications every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await generateMaintenanceNotifications();
      await generateDocumentExpiryNotifications();
    } catch (err) {
      console.error('[cron] notification refresh failed', err);
    }
  });
}

main().catch((err) => {
  console.error('[server] Fatal startup error:', err);
  process.exit(1);
});
