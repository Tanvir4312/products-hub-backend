import { Request, Response } from "express";
import { SubscriptionServices } from "./subscription.service";
import { catchAsync } from "../../shared/cathAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { getPaginationOptions } from "../../helper/paginationHelper";
import pick from "../../shared/pick";

const subscribe = catchAsync(async (req: Request, res: Response) => {
    const currentUser = req.user;
    const result = await SubscriptionServices.subscribe(req.body, currentUser.userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Subscription successful",
        success: true,
        data: result,
    });
});

const subscriberFilterableFields: string[] = ["searchTerm"];

const getAllSubscribers = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, subscriberFilterableFields);
    const { page, limit, skip } = getPaginationOptions(req.query);
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as string;

    const result = await SubscriptionServices.getAllSubscribers(
        filters,
        { page, limit, skip, sortBy, sortOrder }
    );

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Subscribers retrieved successfully",
        success: true,
        data: result,
    });
});

export const SubscriptionController = {
    subscribe,
    getAllSubscribers,
};
