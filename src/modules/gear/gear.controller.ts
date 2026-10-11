import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { gearService } from "./gear.service";

const createGear = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user!.id;
  const result = await gearService.createGear(providerId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Gear item added successfully",
    data: result,
  });
});

const getAllGear = catchAsync(async (req: Request, res: Response) => {
  const result = await gearService.getAllGear(req.query);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gear items fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getGearById = catchAsync(async (req: Request, res: Response) => {
  const result = await gearService.getGearById(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gear item details fetched successfully",
    data: result,
  });
});

const updateGear = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user!.id;
  const result = await gearService.updateGear(
    req.params.id as string,
    providerId,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gear item updated successfully",
    data: result,
  });
});

const deleteGear = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user!.id;
  const result = await gearService.deleteGear(req.params.id as string, providerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Gear item deleted successfully",
    data: result,
  });
});

const getMyGear = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user!.id;
  const result = await gearService.getProviderGear(providerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Provider gear items fetched successfully",
    data: result,
  });
});

export const gearController = {
  createGear,
  getAllGear,
  getGearById,
  updateGear,
  deleteGear,
  getMyGear,
};
