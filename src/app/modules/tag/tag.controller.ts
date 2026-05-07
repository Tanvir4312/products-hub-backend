import { Request, Response } from "express";
import { TagServices } from "./tag.service";
import { catchAsync } from "../../shared/cathAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";

const createTag = catchAsync(async (req: Request, res: Response) => {
    const result = await TagServices.createTag(req.body);

    sendResponse(res, {
        httpStatusCode: status.CREATED,
        message: "Tag created successfully",
        success: true,
        data: result,
    });
});

const getAllTags = catchAsync(async (req: Request, res: Response) => {
    const nameFilter = req.query.name as string | undefined;
    const result = await TagServices.getAllTags(nameFilter);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Tags retrieved successfully",
        success: true,
        data: result,
    });
});

const updateTag = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await TagServices.updateTag(id, req.body);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Tag updated successfully",
        success: true,
        data: result,
    });
});

const deleteTag = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = await TagServices.deleteTag(id);

    sendResponse(res, {
        httpStatusCode: status.OK,
        message: "Tag deleted successfully",
        success: true,
        data: result,
    });
});

export const TagController = {
    createTag,
    getAllTags,
    updateTag,
    deleteTag,
};
