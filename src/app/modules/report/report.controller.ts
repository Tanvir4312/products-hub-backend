import { Request, Response } from "express";
import { ReportServices } from "./report.service";
import { catchAsync } from "../../shared/cathAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const reportProduct = catchAsync(async (req: Request, res: Response) => {
    const currentUser = req.user;
    const result = await ReportServices.reportProduct(req.body, currentUser.userId);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        message: result.message,
        success: true,
        data: result,
    });
});

export const ReportController = {
    reportProduct,
};
