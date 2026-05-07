import { Router } from "express";
import { VoteController } from "./vote.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { voteValidationSchema } from "./vote.validation";
import { checkAuth } from "../../middlewares/checkAuth";

const router = Router();

// Vote product (toggle: vote/unvote) - logged in user
router.post(
    "/",
    checkAuth(),
    validateRequest(voteValidationSchema),
    VoteController.voteProduct
);

// Unvote product - logged in user
router.delete(
    "/:productId",
    checkAuth(),
    VoteController.unvoteProduct
);

export const VoteRoutes = router;
