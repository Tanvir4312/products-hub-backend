import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { UserStatus } from "../../../generated/prisma/index.js";

/**
 * Cron Job: Auto-delete suspended users after 1 month.
 * Runs every day at midnight.
 */
export const startAutoDeleteSuspendedUsersCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("[Cron] Running auto-delete check for suspended users...");

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    try {
      // Find all suspended users whose suspension is older than 1 month
      const usersToDelete = await prisma.user.findMany({
        where: {
          status: UserStatus.SUSPENDED,
          suspendedAt: {
            lte: oneMonthAgo,
          },
          isDeleted: false,
        },
        select: { id: true, email: true, name: true },
      });

      if (usersToDelete.length === 0) {
        console.log("[Cron] No suspended users eligible for auto-deletion.");
        return;
      }

      console.log(`[Cron] Found ${usersToDelete.length} user(s) to auto-delete.`);

      for (const user of usersToDelete) {
        await prisma.$transaction(async (tx) => {
          // Soft-delete the user
          await tx.user.update({
            where: { id: user.id },
            data: {
              isDeleted: true,
              deletedAt: new Date(),
            },
          });

          // Clean up sessions (may already be cleared, but ensure cleanup)
          await tx.session.deleteMany({ where: { userId: user.id } });

          // Clean up accounts
          await tx.account.deleteMany({ where: { userId: user.id } });
        });

        console.log(`[Cron] Auto-deleted suspended user: ${user.email} (${user.id})`);
      }

      console.log(`[Cron] Auto-deletion complete. ${usersToDelete.length} user(s) processed.`);
    } catch (error) {
      console.error("[Cron] Error during auto-delete of suspended users:", error);
    }
  });

  console.log("[Cron] Auto-delete suspended users cron job scheduled (runs daily at midnight).");
};
