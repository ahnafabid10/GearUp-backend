import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { adminService } from "./admin.service";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllUsers(req.query as any);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All users retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await adminService.updateUserStatus(id as string, status);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `User status successfully updated to ${status}`,
    data: result,
  });
});

const getAllGearListings = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllGearListings(req.query as any);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All gear listings retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getAllRentalOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await adminService.getAllRentalOrders(req.query as any);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All rental orders retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const adminController = {
  getAllUsers,
  updateUserStatus,
  getAllGearListings,
  getAllRentalOrders,
};
