import { z } from "zod";

export const createReviewValidationSchema = z.object({
    rating: z
        .number()
        .min(1, "Rating must be at least 1")
        .max(5, "Rating must be at most 5"),
    comment: z
        .string()
        .min(1, "Comment is required"),
    productId: z
        .string()
        .min(1, "Product ID is required"),
});

export const updateReviewValidationSchema = z.object({
    rating: z
        .number()
        .min(1, "Rating must be at least 1")
        .max(5, "Rating must be at most 5")
        .optional(),
    comment: z
        .string()
        .min(1, "Comment is required")
        .optional(),
});
