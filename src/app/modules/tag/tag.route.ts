import { Router } from "express";
import { TagController } from "./tag.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createTagValidationSchema, updateTagValidationSchema } from "./tag.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma";

const router = Router();

// Create tag
router.post(
    "/create",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(createTagValidationSchema),
    TagController.createTag
);

// Get all tags
router.get(
    "/",
    TagController.getAllTags
);

// Update tag
router.patch(
    "/:id",
        checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    validateRequest(updateTagValidationSchema),
    TagController.updateTag
);

// Delete tag
router.delete(
    "/:id",
        checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    TagController.deleteTag
);

export const TagRoutes = router;
