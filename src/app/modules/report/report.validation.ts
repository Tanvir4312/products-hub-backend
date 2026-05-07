import { z } from "zod";

export const reportValidationSchema = z.object({
    productId: z
        .string()
        .min(1, "Product ID is required"),
    reason: z
        .string()
        .optional(),
});
