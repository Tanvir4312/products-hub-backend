import { Router } from "express";
import { CouponController } from "./coupon.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createCouponValidationSchema, updateCouponValidationSchema } from "./coupon.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/index.js";

const router = Router();

// Create coupon (admin only)
router.post(
    "/create",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(createCouponValidationSchema),
    CouponController.createCoupon
);


router.get(
    "/",
  
    CouponController.getAllCoupons
);


// Update coupon (admin only)
router.patch(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateCouponValidationSchema),
    CouponController.updateCoupon
);

// Delete coupon (admin only)
router.delete(
    "/:id",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    CouponController.deleteCoupon
);

export const CouponRoutes = router;
