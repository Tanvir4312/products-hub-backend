import { z } from "zod";

export const voteValidationSchema = z.object({
    productId: z
        .string()
        .min(1, "Product ID is required"),
});
