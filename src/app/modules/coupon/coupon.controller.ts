import { Request, Response } from "express";
import { CouponServices } from "./coupon.service";
import { catchAsync } from "../../shared/cathAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import pick from "../../shared/pick";
import { getPaginationOptions } from "../../helper/paginationHelper";
import { couponFilterableFields } from "./coupon.constant";

const createCoupon = catchAsync(async (req: Request, res: Response) => {
    const result = await CouponServices.createCoupon(req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        message: "Coupon created successfully",
        success: true,
        data: result,
    });
});

const getAllCoupons = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, couponFilterableFields);
    const { page, limit, skip } = getPaginationOptions(req.query);
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as string;

    const result = await CouponServices.getAllCoupons(
        filters,
        { page, limit, skip, sortBy, sortOrder }
    );

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Coupons retrieved successfully",
        success: true,
        data: result,
    });
});


const updateCoupon = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CouponServices.updateCoupon(id, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Coupon updated successfully",
        success: true,
        data: result,
    });
});

const deleteCoupon = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await CouponServices.deleteCoupon(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Coupon deleted successfully",
        success: true,
        data: result,
    });
});

const validateCoupon = catchAsync(async (req: Request, res: Response) => {
    const { couponCode } = req.body;
    const result = await CouponServices.validateCoupon(couponCode);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Coupon is valid",
        success: true,
        data: result,
    });
});

export const CouponController = {
    createCoupon,
    getAllCoupons,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
};
