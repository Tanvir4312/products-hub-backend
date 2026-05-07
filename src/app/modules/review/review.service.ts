import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { ICreateReviewPayload, IUpdateReviewPayload } from "./review.interface";
import { Prisma } from "../../../generated/prisma/index.js";

const createReview = async (
    payload: ICreateReviewPayload,
    userId: string
) => {
    const { rating, comment, productId } = payload;

    // Validate rating range (1-5)
    if (rating < 1 || rating > 5) {
        throw new AppError(status.BAD_REQUEST, "Rating must be between 1 and 5");
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new AppError(status.NOT_FOUND, "Product not found");
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
        where: {
            productId_userId: {
                productId,
                userId,
            },
        },
    });

    if (existingReview) {
        throw new AppError(
            status.CONFLICT,
            "You have already reviewed this product"
        );
    }

    const result = await prisma.review.create({
        data: {
            rating,
            comment: comment.trim(),
            productId,
            userId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                },
            },
            product: {
                select: {
                    id: true,
                    name: true,
                    photo: true,
                },
            },
        },
    });

    return result;
};

const getProductReviews = async (productId: string) => {
    // Check if product exists
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new AppError(status.NOT_FOUND, "Product not found");
    }

    const reviews = await prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                },
            },
        },
    });

    return reviews;
};

const getMyReviews = async (userId: string) => {
    const reviews = await prisma.review.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    photo: true,
                    description: true,
                },
            },
        },
    });

    return reviews;
};

const updateReview = async (
    reviewId: string,
    payload: IUpdateReviewPayload,
    userId: string
) => {
    const { rating, comment } = payload;

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
        where: { id: reviewId },
    });

    if (!existingReview) {
        throw new AppError(status.NOT_FOUND, "Review not found");
    }

    // Check if user owns this review
    if (existingReview.userId !== userId) {
        throw new AppError(
            status.FORBIDDEN,
            "You can only update your own reviews"
        );
    }

    // Validate rating if provided
    if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
            throw new AppError(status.BAD_REQUEST, "Rating must be between 1 and 5");
        }
    }

    const updateData: Prisma.ReviewUpdateInput = {};

    if (rating !== undefined) {
        updateData.rating = rating;
    }

    if (comment !== undefined) {
        updateData.comment = comment.trim();
    }

    const result = await prisma.review.update({
        where: { id: reviewId },
        data: updateData,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profilePhoto: true,
                },
            },
            product: {
                select: {
                    id: true,
                    name: true,
                    photo: true,
                },
            },
        },
    });

    return result;
};

const deleteReview = async (reviewId: string, userId: string) => {
    // Check if review exists
    const existingReview = await prisma.review.findUnique({
        where: { id: reviewId },
    });

    if (!existingReview) {
        throw new AppError(status.NOT_FOUND, "Review not found");
    }

    // Check if user owns this review
    if (existingReview.userId !== userId) {
        throw new AppError(
            status.FORBIDDEN,
            "You can only delete your own reviews"
        );
    }

    await prisma.review.delete({
        where: { id: reviewId },
    });

    return { message: "Review deleted successfully" };
};

export const ReviewServices = {
    createReview,
    getProductReviews,
    getMyReviews,
    updateReview,
    deleteReview,
};
