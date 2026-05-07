import { Request, Response } from "express";
import { ReviewServices } from "./review.service";
import { catchAsync } from "../../shared/cathAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const createReview = catchAsync(async (req: Request, res: Response) => {
    const currentUser = req.user;
    const result = await ReviewServices.createReview(req.body, currentUser.userId);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        message: "Review created successfully",
        success: true,
        data: result,
    });
});

const getProductReviews = catchAsync(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const result = await ReviewServices.getProductReviews(productId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Product reviews retrieved successfully",
        success: true,
        data: result,
    });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
    const currentUser = req.user;
    const result = await ReviewServices.getMyReviews(currentUser.userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "My reviews retrieved successfully",
        success: true,
        data: result,
    });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
    const reviewId = req.params.id as string;
    const currentUser = req.user;
    const result = await ReviewServices.updateReview(
        reviewId,
        req.body,
        currentUser.userId
    );

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Review updated successfully",
        success: true,
        data: result,
    });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
    const reviewId = req.params.id as string;
    const currentUser = req.user;
    const result = await ReviewServices.deleteReview(reviewId, currentUser.userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Review deleted successfully",
        success: true,
        data: result,
    });
});

export const ReviewController = {
    createReview,
    getProductReviews,
    getMyReviews,
    updateReview,
    deleteReview,
};
