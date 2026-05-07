import { Request, Response } from "express";
import { catchAsync } from "../../shared/cathAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { ModeratorService } from "./moderator.service";
import pick from "../../shared/pick";

import { getPaginationOptions } from "../../helper/paginationHelper";
import { moderatorFilterableFields } from "./moderator.constant";

const getAllModerator = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, moderatorFilterableFields);
  const { page, limit, skip } = getPaginationOptions(req.query);
  const sortBy = req.query.sortBy as string;
  const sortOrder = req.query.sortOrder as string;

  const result = await ModeratorService.getAllModerator(
    filters,
    { page, limit, skip, sortBy, sortOrder }
  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    message: "Moderator fetched successfully",
    success: true,
    data: result,
  });
});
const getAllModeratorwithoutQuery = catchAsync(async (req: Request, res: Response) => {
  const result = await ModeratorService.getAllModeratorwithoutQuery();
  sendResponse(res, {
    httpStatusCode: status.OK,
    message: "Moderator fetched successfully",
    success: true,
    data: result,
  });
});

const getModeratorById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ModeratorService.getModeratorById(id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    message: "Moderator fetched successfully",
    success: true,
    data: result,
  });
});

const moderatorUpdate = catchAsync(async (req: Request, res: Response) => {

  const id = req.params.id;

  const payload = {
    ...req.body,
    profilePhoto: req.file?.path,
  };
  const user = req.user;

  const result = await ModeratorService.moderatorUpdate(
    id as string,
    payload,
    user,

  );
  sendResponse(res, {
    httpStatusCode: status.OK,
    message: "Moderator updated successfully",
    success: true,
    data: result,
  });
});

const moderatorDelete = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ModeratorService.moderatorDelete(id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    message: "Moderator deleted successfully",
    success: true,
    data: result,
  });
});

export const ModeratorController = {
  getAllModerator,
  getAllModeratorwithoutQuery,
  getModeratorById,
  moderatorUpdate,
  moderatorDelete,
};
