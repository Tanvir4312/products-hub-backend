import { Router } from "express";
import { LoginUserController } from "./loginUser.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/index.js";
import { multerUpload } from "../../config/multer.config";

const router = Router();

// Update user profile
// - ADMIN and SUPER_ADMIN can update any user's profile (provide userId in body)
// - USER can only update their own profile
router.put(
    "/update-profile",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.USER),
    multerUpload.single("profilePhoto"),
    LoginUserController.updateUser,
);

// Get all users with role USER
// - Only ADMIN and SUPER_ADMIN can access this API
router.get(
    "/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    LoginUserController.getAllUsers,
);

export const LoginUserRoutes = router;
