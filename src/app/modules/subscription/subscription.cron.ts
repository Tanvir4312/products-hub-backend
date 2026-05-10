import cron from "node-cron";
import { prisma } from "../../lib/prisma";
import { SubscriptionStatus } from "../../../../generated/prisma/index.js";

// Run every day at midnight
export const initSubscriptionCron = () => {
    cron.schedule("0 0 * * *", async () => {
        try {
            console.log("Running subscription expiration check...");
            
            // Calculate date 1 month ago
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            // Update all active subscriptions older than 1 month
            const updateResult = await prisma.subscriber.updateMany({
                where: {
                    isSubscribed: true,
                    status: SubscriptionStatus.ACTIVE,
                    subscriptionDate: {
                        lte: oneMonthAgo,
                    },
                },
                data: {
                    isSubscribed: false,
                    status: SubscriptionStatus.PENDING,
                },
            });

            console.log(`Successfully expired ${updateResult.count} subscriptions.`);
        } catch (error) {
            console.error("Error running subscription expiration cron:", error);
        }
    });
    
    console.log("Subscription cron job initialized.");
};
