import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { LoginUserRoutes } from "../modules/roleUser/loginUser.route";
import { UserRoutes } from "../modules/adminModeratorCreate/adminModeratorCreate..route";

import { ChatRoutes } from "../modules/chat/chat.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { ModeratorRoutes } from "../modules/moderator/morerator.route";
import { TagRoutes } from "../modules/tag/tag.route";
import { ProductRoutes } from "../modules/product/product.route";
import { CouponRoutes } from "../modules/coupon/coupon.route";
import { SubscriptionRoutes } from "../modules/subscription/subscription.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { VoteRoutes } from "../modules/vote/vote.route";
import { ReportRoutes } from "../modules/report/report.route";
import { StatsRoutes } from "../modules/stats/stats.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/me", LoginUserRoutes);
router.use("/users", UserRoutes);
router.use("/admin", AdminRoutes);
router.use("/moderator", ModeratorRoutes);
router.use("/loginUser", LoginUserRoutes);
router.use("/tags", TagRoutes);
router.use("/products", ProductRoutes);
router.use("/coupons", CouponRoutes);
router.use("/subscription", SubscriptionRoutes);
router.use("/reviews", ReviewRoutes);
router.use("/products/vote", VoteRoutes);
router.use("/products/report", ReportRoutes);
router.use("/stats", StatsRoutes);

router.use("/chat", ChatRoutes);

export const IndexRoutes = router;
