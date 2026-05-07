import { Router } from "express";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/index.js";

const router = Router();

router.post("/register", AuthController.registerApplicant);
router.post("/login", AuthController.loginUser);
router.get(
    "/me",
    checkAuth(
        Role.ADMIN,
        Role.MODERATOR,
        Role.USER,
        Role.SUPER_ADMIN,
    ),
    AuthController.getMe,
);

router.post("/refresh-token", AuthController.getNewToken);

router.post(
  "/change-password",
  checkAuth(Role.ADMIN, Role.MODERATOR, Role.SUPER_ADMIN, Role.USER),
  AuthController.changePassword,
);

router.post(
    "/logout",
    checkAuth(
       Role.ADMIN,
        Role.MODERATOR,
        Role.USER,
        Role.SUPER_ADMIN,
    ),
    AuthController.logoutUser,
);


router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);

export const AuthRoutes = router;
