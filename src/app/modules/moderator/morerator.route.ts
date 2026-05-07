import { Router } from "express";
import { ModeratorController } from "./moderator.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { updateModeratorValidationSchema } from "./moderator.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/index.js";
import { multerUpload } from "../../config/multer.config";

const router = Router();

router.get(
  "/query",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ModeratorController.getAllModerator,
);
router.get(
  "/",

  ModeratorController.getAllModeratorwithoutQuery,
);

router.get(
  "/:id",

  ModeratorController.getModeratorById,
);

router.put(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR),
  multerUpload.single("profilePhoto"),
  validateRequest(updateModeratorValidationSchema),
  ModeratorController.moderatorUpdate,
);

router.delete(
  "/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  ModeratorController.moderatorDelete,
);



export const ModeratorRoutes = router;
