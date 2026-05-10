import { Router } from "express";
import { ProductController } from "./product.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createProductValidationSchema, updateProductValidationSchema } from "./product.validation";
import { multerUpload } from "../../config/multer.config";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../../../../generated/prisma/index.js";

const router = Router();

// Create product with image upload (authenticated users)
router.post(
    "/create",
    checkAuth(Role.USER, Role.SUPER_ADMIN),
    multerUpload.single("photo"),
    validateRequest(createProductValidationSchema),
    ProductController.createProduct
);

// Get all products (public)
router.get(
    "/",
    ProductController.getAllProducts
);

// Get my products (authenticated)
router.get(
    "/my-products",
    checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR),
    ProductController.getMyProducts
);

// Get single product by ID (public)
router.get(
    "/:id",
    ProductController.getProductById
);

// Update product (owner, admin, super_admin)
router.patch(
    "/:id",
    checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR),
    multerUpload.single("photo"),
    validateRequest(updateProductValidationSchema),
    ProductController.updateProduct
);

// Delete product (owner, admin, super_admin)
router.delete(
    "/:id",
    checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN, Role.MODERATOR),
    ProductController.deleteProduct
);

export const ProductRoutes = router;
