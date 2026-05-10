import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IReportPayload } from "./report.interface";

const reportProduct = async (
    payload: IReportPayload,
    userId: string
) => {
    const { productId, reason } = payload;

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
            "You cannot report your own product"
        );
    }

    // Check if already reported
    const existingReport = await prisma.productReport.findUnique({
        where: {
            productId_userId: {
                productId,
                userId,
            },
        },
    });

    if (existingReport) {
        throw new AppError(
            status.CONFLICT,
            "You have already reported this product"
        );
    }

    // Create report and update product stats in a transaction
    await prisma.$transaction(async (tx) => {
        // 1. Create the report record
        await tx.productReport.create({
            data: {
                productId,
                userId,
                reason: reason || null,
            },
        });

        // 2. Increment report count and set reportedStatus to true in the product table
        await tx.product.update({
            where: { id: productId },
            data: {
                report: { increment: 1 },
                reportedStatus: true
            },
        });
    });

    return {
        message: "Report done",
        productId,
    };
};

export const ReportServices = {
    reportProduct,
};
