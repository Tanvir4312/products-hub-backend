import { z } from "zod";
import { Gender } from "../../../generated/prisma/index.js";

export const createModeratorValidationSchema = z.object({
    password: z
        .string("Password is required")
        .min(6, "Password must be at least 6 characters long"),

    moderator: z.object({
        name: z
            .string("Name is required")
            .min(3, "Name must be at least 3 characters")
            .max(50, "Name cannot exceed 50 characters"),

        email: z
            .string("Email is required")
            .email("Please enter a valid email address"),

        contactNumber: z
            .string("Contact number is required")
            .min(11, "Contact number must be at least 11 digits")
            .max(15, "Contact number cannot exceed 15 digits")
            .optional(),





        gender: z.enum(
            [Gender.MALE, Gender.FEMALE],
            "Gender must be either MALE, FEMALE, or OTHER",
        ),

        profilePhoto: z
            .string("Profile photo URL is required")
            .url("Please provide a valid image URL")
            .optional(),

        isDeleted: z.boolean("isDeleted must be a boolean value").default(false),


    }),
});

export const createAdminZodSchema = z.object({
    password: z
        .string("Password is required")
        .min(6, "Password must be at least 6 characters")
        .max(20, "Password must be at most 20 characters"),
    admin: z.object({
        name: z
            .string("Name is required and must be string")
            .min(5, "Name must be at least 5 characters")
            .max(30, "Name must be at most 30 characters"),
        email: z.email("Invalid email address"),
        contactNumber: z
            .string("Contact number is required")
            .min(11, "Contact number must be at least 11 characters")
            .max(14, "Contact number must be at most 15 characters")
            .optional(),
        profilePhoto: z.url("Profile photo must be a valid URL").optional(),
    }),
    role: z.enum(
        ["ADMIN", "SUPER_ADMIN"],
        "Role must be either ADMIN or SUPER_ADMIN",
    ),
});
