import { Router } from "express";
import { SubscriptionController } from "./subscription.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { subscribeValidationSchema } from "./subscription.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/index.js";

const router = Router();

// Subscribe with optional coupon (authenticated users)
router.post(
    "/subscribe",
    checkAuth(),
    validateRequest(subscribeValidationSchema),
    SubscriptionController.subscribe
);

// Get all subscribers (admin only)
router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    SubscriptionController.getAllSubscribers
);

export const SubscriptionRoutes = router;
