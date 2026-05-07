import status from "http-status";
import { catchAsync } from "../../shared/cathAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AdminService } from "./admin.service";
import { Request, Response } from "express";
import { getPaginationOptions } from "../../helper/paginationHelper";
import pick from "../../shared/pick";
import { adminFilterableFields } from "./admin.constant";

const getAllAdmin = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, adminFilterableFields);
  const { page, limit, skip } = getPaginationOptions(req.query);
  const sortBy = req.query.sortBy as string;
  const sortOrder = req.query.sortOrder as string;

  const result = await AdminService.getAllAdmin(
    filters,
    { page, limit, skip, sortBy, sortOrder }
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    message: "Admin fetched successfully",
    success: true,
    data: result,
  });
});

const getAdminById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await AdminService.getAdminById(id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    message: "Admin fetched successfully",
    success: true,
    data: result,
  });
});

const updateAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const userId = req.user?.userId;
  const payload = {
    ...req.body,
    profilePhoto: req.file?.path,

  };

  const result = await AdminService.updateAdmin(id as string, payload, userId as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    message: "Admin updated successfully",
    success: true,
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const user = req.user;
  const result = await AdminService.deleteAdmin(id as string, user);
  sendResponse(res, {
    httpStatusCode: status.OK,
    message: "Admin deleted successfully",
    success: true,
    data: result,
  });
});

const changeUserStatus = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const currentUser = req.user;
  const id = req.params.id;
  const result = await AdminService.changeUserStatus(currentUser, payload, id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    message: "User status updated successfully",
    success: true,
    data: result,
  });
});

const changeUserRole = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user;
  const id = req.params.id;
  const result = await AdminService.changeUserRole(user, payload, id as string);
  sendResponse(res, {
    httpStatusCode: status.OK,
    message: "User role updated successfully",
    success: true,
    data: result,
  });
});

export const AdminController = {
  getAllAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  changeUserStatus,
  changeUserRole,
};
