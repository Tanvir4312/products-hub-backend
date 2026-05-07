import { Request, Response } from "express";
import { LoginUserServices } from "./loginUser.service";
import { catchAsync } from "../../shared/cathAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { Role } from "../../../generated/prisma/index.js";
import pick from "../../shared/pick";
import { getPaginationOptions } from "../../helper/paginationHelper";
import { userFilterableFields } from "./loginUser.constant";

const updateUser = catchAsync(async (req: Request, res: Response) => {
    const currentUser = req.user;
    const { userId, ...updateData } = req.body;

    const payload = {
        ...updateData,
        profilePhoto: req.file?.path,
    };

    // Admin and Super Admin can update any user's profile
    // USER can only update their own profile
    const targetUserId = (currentUser.role === Role.ADMIN || currentUser.role === Role.SUPER_ADMIN) && userId
        ? userId
        : currentUser.userId;

    const result = await LoginUserServices.updateUser(payload, targetUserId, currentUser.role, currentUser.userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "User profile updated successfully",
        success: true,
        data: result,
    });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, userFilterableFields);
    const { page, limit, skip } = getPaginationOptions(req.query);
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as string;

    const result = await LoginUserServices.getAllUsers(
        filters,
        { page, limit, skip, sortBy, sortOrder }
    );

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Users retrieved successfully",
        success: true,
        data: result,
    });
});

export const LoginUserController = {
    updateUser,
    getAllUsers,
};
