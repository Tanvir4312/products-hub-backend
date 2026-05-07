import { z } from "zod";
import { Gender } from "../../../generated/prisma/index.js";

export const updateModeratorValidationSchema = z.object({

  name: z
    .string("Name must be a string")
    .min(5, "Name must be at least 5 characters")
    .max(30, "Name must be at most 30 characters")
    .optional(),

  email: z
    .email("Please provide a valid email address")
    .optional(),

  contactNumber: z
    .string("Contact number must be a string")
    .min(11, "Contact number must be at least 11 characters")
    .max(15, "Contact number must be at most 15 characters")
    .optional(),

  gender: z
    .enum(
      [Gender.MALE, Gender.FEMALE],
      "Gender must be either MALE, FEMALE or OTHER",
    )
    .optional(),

  profilePhoto: z
    .url("Profile photo must be a valid URL")
    .optional(),
})


