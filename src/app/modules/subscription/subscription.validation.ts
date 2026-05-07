import { z } from "zod";

export const subscribeValidationSchema = z.object({
    couponCode: z
        .string()
        .optional(),
});
