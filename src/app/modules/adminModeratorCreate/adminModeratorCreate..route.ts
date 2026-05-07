import { Router } from "express";
import { UserController } from "./adminModeratorCreate.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createAdminZodSchema,
  createModeratorValidationSchema,
} from "./adminModeratorCreate..validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/index.js";

const router = Router();

router.post(
  "/create-moderator",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(createModeratorValidationSchema),
  UserController.createModerator,
);

router.post(
  "/create-admin",
  checkAuth(Role.SUPER_ADMIN),
  validateRequest(createAdminZodSchema),
  UserController.createAdmin,
);

router.get(
  "/",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserController.getAllUsers,
);

export const UserRoutes = router;
