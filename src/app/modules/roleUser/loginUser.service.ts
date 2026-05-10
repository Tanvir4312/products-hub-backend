import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelpers/AppError";
import status from "http-status";
import { IUpdateUserPayload, IUserFilterRequest } from "./loginUser.interface";
import { Role, Prisma } from "../../../../generated/prisma/index.js";
import { userSearchableFields } from "./loginUser.constant";

const updateUser = async (
    payload: IUpdateUserPayload,
    targetUserId: string,
    currentUserRole: string,
    currentUserId: string,
) => {
    const isExistUser = await prisma.user.findUnique({
        where: {
            id: targetUserId,
        },
    });

    if (!isExistUser) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    // Only ADMIN and SUPER_ADMIN can update other users' profiles
    // USER can only update their own profile
    if (currentUserRole !== Role.ADMIN && currentUserRole !== Role.SUPER_ADMIN) {
        if (targetUserId !== currentUserId) {
            throw new AppError(status.FORBIDDEN, "You can only update your own profile");
        }
    }

    // Ensure the target user is a USER role (not MODERATOR or ADMIN)
    // ADMIN and SUPER_ADMIN can bypass this check
    if (currentUserRole !== Role.ADMIN && currentUserRole !== Role.SUPER_ADMIN) {
        if (isExistUser.role !== Role.USER) {
            throw new AppError(status.FORBIDDEN, "You can only update user profiles");
        }
    }

    // Check if email is being updated and if it's already taken
    if (payload.email && payload.email !== isExistUser.email) {
        const existingUserWithEmail = await prisma.user.findUnique({
            where: {
                email: payload.email,
            },
        });

        if (existingUserWithEmail) {
            throw new AppError(status.CONFLICT, "Email already in use");
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Update the User record
        const updatedUser = await tx.user.update({
            where: {
                id: targetUserId,
            },
            data: {
                ...payload,
            },
        });

        // 2. Prepare sub-table update data
        const subTableUpdateData: any = {};
        if (payload.name) subTableUpdateData.name = payload.name;
        if (payload.email) subTableUpdateData.email = payload.email;
        if (payload.profilePhoto) subTableUpdateData.profilePhoto = payload.profilePhoto;
        if (payload.contactNumber) subTableUpdateData.contactNumber = payload.contactNumber;

        // 3. Sync with Admin table if user is an ADMIN or SUPER_ADMIN
        if (updatedUser.role === Role.ADMIN || updatedUser.role === Role.SUPER_ADMIN) {
            const admin = await tx.admin.findUnique({ where: { userId: targetUserId } });
            if (admin && Object.keys(subTableUpdateData).length > 0) {
                await tx.admin.update({
                    where: { userId: targetUserId },
                    data: subTableUpdateData,
                });
            }
        }

        // 4. Sync with Moderator table if user is a MODERATOR
        if (updatedUser.role === Role.MODERATOR) {
            const moderator = await tx.moderator.findUnique({ where: { userId: targetUserId } });
            if (moderator && Object.keys(subTableUpdateData).length > 0) {
                await tx.moderator.update({
                    where: { userId: targetUserId },
                    data: subTableUpdateData,
                });
            }
        }

        return updatedUser;
    });

    return result;
};

const getAllUsers = async (
    filters: IUserFilterRequest,
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

    const andCondition: Prisma.UserWhereInput[] = [];

    // Always filter by USER role
    andCondition.push({
        role: Role.USER,
    });

    // Search by name or email
    if (searchTerm) {
        andCondition.push({
            OR: userSearchableFields.map((field) => ({
                [field]: {
                    contains: searchTerm,
                    mode: "insensitive",
                },
            })),
        });
    }

    // Filter by status
    if (Object.keys(filterData).length > 0) {
        andCondition.push({
            AND: Object.entries(filterData).map(([field, value]) => ({
                [field]: {
                    equals: value,
                },
            })),
        });
    }

    const whereConditions: Prisma.UserWhereInput =
        andCondition.length > 0 ? { AND: andCondition } : { role: Role.USER };

    const users = await prisma.user.findMany({
        take: limit,
        skip,
        orderBy: {
            [sortBy]: sortOrder === "asc" ? "asc" : "desc",
        },
        where: whereConditions,
    });

    const totalUsers = await prisma.user.count({
        where: whereConditions,
    });

    return {
        data: users,
        meta: {
            limit,
            current_Page: page,
            total_page: Math.ceil(totalUsers / limit),
            total: totalUsers,
        },
    };
};

export const LoginUserServices = {
    updateUser,
    getAllUsers,
};
