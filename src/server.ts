import app from "./app";
import { envVars } from "./app/config/env";
import { seedSuperAdmin } from "./app/utils/seed";
import { initSubscriptionCron } from "./app/modules/subscription/subscription.cron";
import { startAutoDeleteSuspendedUsersCron } from "./app/cron/autoDeleteSuspendedUsers";

// Start the server
const port = envVars.PORT;
const bootstrap = async () => {

  await seedSuperAdmin()
  
  // Initialize background jobs
  initSubscriptionCron();
  startAutoDeleteSuspendedUsersCron();

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
};

bootstrap();
