import { z } from "zod";

export const createTagValidationSchema = z.object({
    name: z
        .string()
        .min(2, "Tag name must be at least 2 characters")
        .trim(),
});

export const updateTagValidationSchema = z.object({
    name: z
        .string()
        .min(2, "Tag name must be at least 2 characters")
        .trim(),
});
