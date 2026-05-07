import { Router } from "express";
import { ReviewController } from "./review.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createReviewValidationSchema, updateReviewValidationSchema } from "./review.validation";
import { checkAuth } from "../../middlewares/checkAuth";

const router = Router();

// Create review (any logged-in user)
router.post(
    "/",
    checkAuth(),
    validateRequest(createReviewValidationSchema),
    ReviewController.createReview
);

// Get all reviews for a product (public)
router.get(
    "/product/:productId",
    ReviewController.getProductReviews
);

// Get logged-in user's reviews
router.get(
    "/my-reviews",
    checkAuth(),
    ReviewController.getMyReviews
);

// Update review (review owner only)
router.patch(
    "/:id",
    checkAuth(),
    validateRequest(updateReviewValidationSchema),
    ReviewController.updateReview
);

// Delete review (review owner only)
router.delete(
    "/:id",
    checkAuth(),
    ReviewController.deleteReview
);

export const ReviewRoutes = router;
