import { Router } from "express";
import { ReportController } from "./report.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { reportValidationSchema } from "./report.validation";
import { checkAuth } from "../../middlewares/checkAuth";

const router = Router();

// Report product - logged in user
router.post(
    "/",
    checkAuth(),
    validateRequest(reportValidationSchema),
    ReportController.reportProduct
);

export const ReportRoutes = router;
