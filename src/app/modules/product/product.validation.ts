import { z } from "zod";
import { ProductStatus } from "../../../../generated/prisma/index.js";

export const createProductValidationSchema = z.object({
    name: z
        .string()
        .min(1, "Product name is required"),
    description: z
        .string()
        .min(1, "Description is required"),
    tagIds: z
        .array(z.string())
        .min(1, "At least one tag is required"),
    links: z
        .string()
        .min(1, "Link is required")
        .url("Must be a valid URL"),
});

export const updateProductValidationSchema = z.object({
    name: z
        .string()
        .min(1, "Product name is required")
        .optional(),
    description: z
        .string()
        .min(1, "Description is required")
        .optional(),
    tagIds: z
        .array(z.string())
        .optional(),
    status: z
        .enum([ProductStatus.PENDING, ProductStatus.APPROVED, ProductStatus.REJECTED])
        .optional(),
    links: z
        .string()
        .url("Must be a valid URL")
        .optional(),
    isFeatured: z.boolean().optional(),
});
