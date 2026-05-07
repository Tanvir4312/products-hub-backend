import { Request, Response } from "express";
import { ProductServices } from "./product.service";
import { catchAsync } from "../../shared/cathAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import AppError from "../../errorHelpers/AppError";
import pick from "../../shared/pick";
import { getPaginationOptions } from "../../helper/paginationHelper";
import { productFilterableFields } from "./product.constant";

const createProduct = catchAsync(async (req: Request, res: Response) => {
    // Check if file was uploaded
    if (!req.file) {
        throw new AppError(status.BAD_REQUEST, "Product photo is required");
    }

    const photoPath = req.file.path;
    const currentUser = req.user;

    const payload = {
        ...req.body,
        photo: photoPath,
    };

    // ownerId is taken from authenticated user, not request body
    const result = await ProductServices.createProduct(
        payload,
        currentUser.userId
    );

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        message: "Product created successfully",
        success: true,
        data: result,
    });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, productFilterableFields);
    const { page, limit, skip } = getPaginationOptions(req.query);
    const sortBy = req.query.sortBy as string;
    const sortOrder = req.query.sortOrder as string;

    const result = await ProductServices.getAllProducts(
        filters,
        { page, limit, skip, sortBy, sortOrder }
    );

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Products retrieved successfully",
        success: true,
        data: result,
    });
});

const getProductById = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await ProductServices.getProductById(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Product retrieved successfully",
        success: true,
        data: result,
    });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const currentUser = req.user;

    const payload: any = {
        ...req.body,
    };

    // If new photo uploaded, include it
    if (req.file) {
        payload.photo = req.file.path;
    }

    const result = await ProductServices.updateProduct(
        id,
        payload,
        currentUser.userId,
        currentUser.role
    );

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Product updated successfully",
        success: true,
        data: result,
    });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const currentUser = req.user;

    const result = await ProductServices.deleteProduct(
        id,
        currentUser.userId,
        currentUser.role
    );

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Product deleted successfully",
        success: true,
        data: result,
    });
});

export const ProductController = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
};
