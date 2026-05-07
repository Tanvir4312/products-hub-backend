import { z } from "zod";
import { ProductStatus } from "../../../generated/prisma/index.js";

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
});
