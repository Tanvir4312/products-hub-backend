import { z } from "zod";

export const createCouponValidationSchema = z.object({
    couponCode: z
        .string()
        .min(1, "Coupon code is required"),
    description: z
        .string()
        .min(1, "Description is required"),
    discount: z
        .number()
        .min(0, "Discount must be 0 or greater"),
    expiryDate: z
        .string()
        .min(1, "Expiry date is required"),
    usageLimit: z
        .number()
        .min(1, "Usage limit must be at least 1")
        .optional(),
});

export const updateCouponValidationSchema = z.object({
    description: z
        .string()
        .min(1, "Description is required")
        .optional(),
    discount: z
        .number()
        .min(0, "Discount must be 0 or greater")
        .optional(),
    expiryDate: z
        .string()
        .min(1, "Expiry date is required")
        .optional(),
    usageLimit: z
        .number()
        .min(1, "Usage limit must be at least 1")
        .optional(),
    isActive: z
        .boolean()
        .optional(),
});
