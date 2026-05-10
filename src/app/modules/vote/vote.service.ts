import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IVotePayload } from "./vote.interface";

const voteProduct = async (
    payload: IVotePayload,
    userId: string
) => {
    const { productId } = payload;

    // Check if product exists
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new AppError(status.NOT_FOUND, "Product not found");
    }

    // Check if user is the product owner
    if (product.ownerId === userId) {
        throw new AppError(
            status.FORBIDDEN,
            "You cannot vote on your own product"
        );
    }

    // Check if already voted
    const existingVote = await prisma.productVote.findUnique({
        where: {
            productId_userId: {
                productId,
                userId,
            },
        },
    });

    if (existingVote) {
        // Toggle: remove vote (unvote)
        await prisma.$transaction(async (tx) => {
            await tx.productVote.delete({
                where: {
                    productId_userId: {
                        productId,
                        userId,
                    },
                },
            });

            await tx.product.update({
                where: { id: productId },
                data: { votes: { decrement: 1 } },
            });
        });

        return {
            message: "Vote removed successfully",
            voted: false,
            productId,
        };
    }

    // Create new vote
    const vote = await prisma.$transaction(async (tx) => {
        const newVote = await tx.productVote.create({
            data: {
                productId,
                userId,
            },
            include: {
                user: {
                    select: {
                        name: true,
                        profilePhoto: true
                    }
                }
            }
        });

        await tx.product.update({
            where: { id: productId },
            data: { votes: { increment: 1 } },
        });

        return newVote;
    });

    return {
        vote,
        message: "Product voted successfully",
        voted: true,
        productId,
    };
};

const unvoteProduct = async (productId: string, userId: string) => {
    // Check if product exists
    const product = await prisma.product.findUnique({
        where: { id: productId },
    });

    if (!product) {
        throw new AppError(status.NOT_FOUND, "Product not found");
    }

    // Check if user is the product owner
    if (product.ownerId === userId) {
        throw new AppError(
            status.FORBIDDEN,
            "You cannot unvote your own product"
        );
    }

    // Check if vote exists
    const existingVote = await prisma.productVote.findUnique({
        where: {
            productId_userId: {
                productId,
                userId,
            },
        },
    });

    if (!existingVote) {
        throw new AppError(status.NOT_FOUND, "You have not voted for this product");
    }

    await prisma.$transaction(async (tx) => {
        await tx.productVote.delete({
            where: {
                productId_userId: {
                    productId,
                    userId,
                },
            },
        });

        await tx.product.update({
            where: { id: productId },
            data: { votes: { decrement: 1 } },
        });
    });

    return {
        message: "Vote removed successfully",
        productId,
    };
};

export const VoteServices = {
    voteProduct,
    unvoteProduct,
};
