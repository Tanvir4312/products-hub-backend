import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { LoginUserRoutes } from "../modules/loginUser/loginUser.route";
import { UserRoutes } from "../modules/adminModeratorCreate/adminModeratorCreate..route";

import { ChatRoutes } from "../modules/chat/chat.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { ModeratorRoutes } from "../modules/moderator/morerator.route";
import { TagRoutes } from "../modules/tag/tag.route";
import { ProductRoutes } from "../modules/product/product.route";
import { CouponRoutes } from "../modules/coupon/coupon.route";

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

router.use("/chat", ChatRoutes);

export const IndexRoutes = router;
