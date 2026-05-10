import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { ICreateCouponPayload, IUpdateCouponPayload, ICouponFilterRequest } from "./coupon.interface";
import { Prisma } from "../../../../generated/prisma/index.js";
import { couponSearchableFields } from "./coupon.constant";

// Helper function to check if coupon is expired and update isActive
const checkAndUpdateExpiry = async (coupon: any) => {
    const now = new Date();
    const expiry = new Date(coupon.expiryDate);

    if (expiry < now && coupon.isActive) {
        // Auto-disable expired coupon
        await prisma.coupon.update({
            where: { id: coupon.id },
            data: { isActive: false },
        });
        return { ...coupon, isActive: false };
    }

    return coupon;
};

const createCoupon = async (payload: ICreateCouponPayload) => {
    const { couponCode, description, discount, expiryDate, usageLimit } = payload;

    // Trim inputs
    const trimmedCode = couponCode.trim().toUpperCase();
    const trimmedDescription = description.trim();

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
        where: { couponCode: trimmedCode },
    });

    if (existingCoupon) {
        throw new AppError(status.CONFLICT, "Coupon code already exists");
    }

    // Validate discount
    if (discount < 0) {
        throw new AppError(status.BAD_REQUEST, "Discount must be 0 or greater");
    }

    // Validate usageLimit
    const finalUsageLimit = usageLimit ?? 1;
    if (finalUsageLimit < 1) {
        throw new AppError(status.BAD_REQUEST, "Usage limit must be at least 1");
    }

    // Validate expiry date
    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime())) {
        throw new AppError(status.BAD_REQUEST, "Invalid expiry date");
    }

    // Check if expiry date is in the past
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
    expiry.setHours(0, 0, 0, 0);

    if (expiry < now) {
        throw new AppError(status.BAD_REQUEST, "Expiry date cannot be in the past");
    }

    const result = await prisma.coupon.create({
        data: {
            couponCode: trimmedCode,
            description: trimmedDescription,
            discount,
            expiryDate: expiry,
            usageLimit: finalUsageLimit,
            usedCount: 0,
            isActive: true,
        },
    });

    return result;
};

const getAllCoupons = async (
    filters: ICouponFilterRequest,
    options: {
        page: number;
        limit: number;
        skip: number;
        sortBy?: string;
        sortOrder?: string;
    }
) => {
    const { searchTerm, ...filterData } = filters;
    const { limit, skip, page } = options;
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "desc";

    const andCondition: Prisma.CouponWhereInput[] = [];

    // Search by couponCode
    if (searchTerm) {
        andCondition.push({
            OR: couponSearchableFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }

    // Filter by isActive
    if (filterData.isActive !== undefined) {
        const isActiveValue = filterData.isActive === "true" ? true : filterData.isActive === "false" ? false : undefined;
        if (isActiveValue !== undefined) {
            if (isActiveValue === true) {
                // If requesting active coupons, only show those that are:
                // 1. Manually set to active
                // 2. Not expired
                // 3. Not reached usage limit
                andCondition.push({
                    isActive: true,
                    expiryDate: {
                        gt: new Date(),
                    },
                    // We can't easily compare usedCount < usageLimit in Prisma where clause 
                    // without a raw query or computed field.
                    // However, we can at least filter by date here.
                });
            } else {
                andCondition.push({
                    isActive: false,
                });
            }
        }
    }

    const whereConditions: Prisma.CouponWhereInput =
        andCondition.length > 0 ? { AND: andCondition } : {};

    const coupons = await prisma.coupon.findMany({
        take: limit,
        skip,
        orderBy: {
            [sortBy]: sortOrder === "asc" ? "asc" : "desc",
        },
        where: whereConditions,
    });

    // Check expiry for each coupon and update if needed
    // ALSO filter out exhausted coupons if isActive=true was requested
    const filteredCoupons = (await Promise.all(
        coupons.map(async (coupon) => {
            const updated = await checkAndUpdateExpiry(coupon);
            return updated;
        })
    )).filter(coupon => {
        // If we are filtering by active, also ensure usage limit isn't reached
        if (filterData.isActive === "true") {
            return coupon.isActive && coupon.usedCount < coupon.usageLimit;
        }
        return true;
    });

    const totalCoupons = await prisma.coupon.count({
        where: whereConditions,
    });

    return {
        data: filteredCoupons,
        meta: {
            limit,
            current_Page: page,
            total_page: Math.ceil(totalCoupons / limit),
            total: totalCoupons,
        },
    };
};


const updateCoupon = async (id: string, payload: IUpdateCouponPayload) => {
    const { description, discount, expiryDate, usageLimit, isActive } = payload;

    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
        where: { id },
    });

    if (!existingCoupon) {
        throw new AppError(status.NOT_FOUND, "Coupon not found");
    }

    // Prepare update data
    const updateData: any = {};

    if (description !== undefined) {
        updateData.description = description.trim();
    }

    if (discount !== undefined) {
        if (discount < 0) {
            throw new AppError(status.BAD_REQUEST, "Discount must be 0 or greater");
        }
        updateData.discount = discount;
    }

    if (expiryDate !== undefined) {
        const expiry = new Date(expiryDate);
        if (isNaN(expiry.getTime())) {
            throw new AppError(status.BAD_REQUEST, "Invalid expiry date");
        }

        // Check if expiry date is in the past
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
        expiry.setHours(0, 0, 0, 0);

        if (expiry < now) {
            throw new AppError(status.BAD_REQUEST, "Expiry date cannot be in the past");
        }

        updateData.expiryDate = expiry;
    }

    if (usageLimit !== undefined) {
        if (usageLimit < 1) {
            throw new AppError(status.BAD_REQUEST, "Usage limit must be at least 1");
        }
        updateData.usageLimit = usageLimit;
    }

    if (isActive !== undefined) {
        updateData.isActive = isActive;
    }

    const result = await prisma.coupon.update({
        where: { id },
        data: updateData,
    });

    return result;
};

const deleteCoupon = async (id: string) => {
    // Check if coupon exists
    const existingCoupon = await prisma.coupon.findUnique({
        where: { id },
    });

    if (!existingCoupon) {
        throw new AppError(status.NOT_FOUND, "Coupon not found");
    }

    await prisma.coupon.delete({
        where: { id },
    });

    return { message: "Coupon deleted successfully" };
};

// Validate coupon for usage (bonus function)
const validateCoupon = async (couponCode: string) => {
    const coupon = await prisma.coupon.findUnique({
        where: { couponCode: couponCode.toUpperCase() },
    });

    if (!coupon) {
        throw new AppError(status.NOT_FOUND, "Coupon not found");
    }

    // Check expiry
    const now = new Date();
    if (new Date(coupon.expiryDate) < now) {
        throw new AppError(status.BAD_REQUEST, "Coupon has expired");
    }

    // Check if active
    if (!coupon.isActive) {
        throw new AppError(status.BAD_REQUEST, "Coupon is not active");
    }

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit) {
        throw new AppError(status.BAD_REQUEST, "Coupon usage limit reached");
    }

    return coupon;
};

export const CouponServices = {
    createCoupon,
    getAllCoupons,

    updateCoupon,
    deleteCoupon,
    validateCoupon,
};
