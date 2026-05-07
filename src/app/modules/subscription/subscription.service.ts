import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { ISubscribePayload, ISubscriptionResponse, ISubscriberFilterRequest } from "./subscription.interface";
import { Prisma, SubscriptionStatus } from "../../../generated/prisma/index.js";

const SUBSCRIPTION_FEE = 500;

// Generate unique fake transaction ID
const generateTransactionId = (): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `FAKE_TRX_${timestamp}_${random}`;
};

// Validate and apply coupon
const validateAndApplyCoupon = async (couponCode?: string): Promise<{ discount: number; finalPrice: number }> => {
    if (!couponCode) {
        return { discount: 0, finalPrice: SUBSCRIPTION_FEE };
    }

    const coupon = await prisma.coupon.findUnique({
        where: { couponCode: couponCode.toUpperCase() },
    });

    if (!coupon) {
        throw new AppError(status.NOT_FOUND, "Coupon not found");
    }

    if (!coupon.isActive) {
        throw new AppError(status.BAD_REQUEST, "Coupon is not active");
    }

    // Check expiry
    const now = new Date();
    if (new Date(coupon.expiryDate) < now) {
        throw new AppError(status.BAD_REQUEST, "Coupon has expired");
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
        throw new AppError(status.BAD_REQUEST, "Coupon usage limit reached");
    }

    // Calculate discount
    const discountAmount = (SUBSCRIPTION_FEE * coupon.discount) / 100;
    const finalPrice = SUBSCRIPTION_FEE - discountAmount;

    return { discount: coupon.discount, finalPrice };
};

const subscribe = async (
    payload: ISubscribePayload,
    userId: string
): Promise<ISubscriptionResponse> => {
    const { couponCode } = payload;

    // Find or create subscriber by userId
    let subscriber = await prisma.subscriber.findUnique({
        where: { userId },
    });

    // Fallback: create subscriber if not exists (should not happen if registration works correctly)
    if (!subscriber) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true },
        });

        if (!user) {
            throw new AppError(status.NOT_FOUND, "User not found");
        }

        subscriber = await prisma.subscriber.create({
            data: {
                email: user.email,
                name: user.name || "",
                userId: user.id,
                isSubscribed: false,
                paymentVerified: false,
                status: SubscriptionStatus.PENDING,
            },
        });
    }

    // Check if already subscribed
    if (subscriber.isSubscribed && subscriber.paymentVerified) {
        throw new AppError(status.BAD_REQUEST, "User is already subscribed");
    }

    // Validate coupon and calculate final price
    const { discount, finalPrice } = await validateAndApplyCoupon(couponCode);

    // Generate fake transaction ID
    const transactionId = generateTransactionId();

    // Use transaction for atomic operations
    const result = await prisma.$transaction(async (tx) => {
        // Update coupon usage count if coupon was used
        if (couponCode && discount > 0) {
            await tx.coupon.update({
                where: { couponCode: couponCode.toUpperCase() },
                data: { usedCount: { increment: 1 } },
            });
        }

        // Create payment record
        const payment = await tx.payment.create({
            data: {
                subscriberId: subscriber.id,
                price: finalPrice,
                transactionId,
                subscriptionDate: new Date(),
            },
        });

        // Update subscriber
        const updatedSubscriber = await tx.subscriber.update({
            where: { id: subscriber.id },
            data: {
                isSubscribed: true,
                paymentVerified: true,
                status: SubscriptionStatus.ACTIVE,
                subscriptionDate: new Date(),
            },
        });

        return { payment, subscriber: updatedSubscriber };
    });

    return {
        payment: {
            id: result.payment.id,
            subscriberId: result.payment.subscriberId,
            price: result.payment.price,
            transactionId: result.payment.transactionId,
            subscriptionDate: result.payment.subscriptionDate,
            createdAt: result.payment.createdAt,
        },
        finalAmount: finalPrice,
        discountApplied: discount,
        transactionId,
        subscriber: {
            id: result.subscriber.id,
            email: result.subscriber.email,
            name: result.subscriber.name,
            isSubscribed: result.subscriber.isSubscribed,
            paymentVerified: result.subscriber.paymentVerified,
            status: result.subscriber.status,
            subscriptionDate: result.subscriber.subscriptionDate,
        },
    };
};

const getAllSubscribers = async (
    filters: ISubscriberFilterRequest,
    options: {
        page: number;
        limit: number;
        skip: number;
        sortBy?: string;
        sortOrder?: string;
    }
) => {
    const { searchTerm } = filters;
    const { limit, skip, page } = options;
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "desc";

    const andCondition: Prisma.SubscriberWhereInput[] = [];

    // Only return active subscribers
    andCondition.push({
        isSubscribed: true,
        paymentVerified: true,
        status: SubscriptionStatus.ACTIVE,
    });

    // Search by name, email, or payment transactionId
    if (searchTerm) {
        andCondition.push({
            OR: [
                // Search by subscriber name
                {
                    name: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
                // Search by subscriber email
                {
                    email: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
                // Search by payment transactionId
                {
                    payments: {
                        some: {
                            transactionId: {
                                contains: searchTerm,
                                mode: "insensitive",
                            },
                        },
                    },
                },
            ],
        });
    }

    const whereConditions: Prisma.SubscriberWhereInput =
        andCondition.length > 0 ? { AND: andCondition } : {};

    const subscribers = await prisma.subscriber.findMany({
        where: whereConditions,
        take: limit,
        skip,
        orderBy: {
            [sortBy]: sortOrder === "asc" ? "asc" : "desc",
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
            payments: {
                orderBy: { createdAt: "desc" },
                take: 1,
            },
        },
    });

    const totalSubscribers = await prisma.subscriber.count({
        where: whereConditions,
    });

    return {
        data: subscribers,
        meta: {
            limit,
            current_Page: page,
            total_page: Math.ceil(totalSubscribers / limit),
            total: totalSubscribers,
        },
    };
};

export const SubscriptionServices = {
    subscribe,
    getAllSubscribers,
};
