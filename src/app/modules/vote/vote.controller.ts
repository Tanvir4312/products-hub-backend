import { Request, Response } from "express";
import { VoteServices } from "./vote.service";
import { catchAsync } from "../../shared/cathAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const voteProduct = catchAsync(async (req: Request, res: Response) => {
    const currentUser = req.user;
    const result = await VoteServices.voteProduct(req.body, currentUser.userId);

    const httpStatus = result.voted ? status.CREATED : status.OK;

    sendResponse(res, {
        httpStatusCode: httpStatus,
        message: result.message,
        success: true,
        data: result,
    });
});

const unvoteProduct = catchAsync(async (req: Request, res: Response) => {
    const productId = req.params.productId as string;
    const currentUser = req.user;
    const result = await VoteServices.unvoteProduct(productId, currentUser.userId);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: result.message,
        success: true,
        data: result,
    });
});

export const VoteController = {
    voteProduct,
    unvoteProduct,
};
