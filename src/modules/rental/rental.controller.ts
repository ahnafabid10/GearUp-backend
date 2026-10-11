import { Request, Response } from "express";
import httpStatus from "http-status";
import { UserRole } from "../../../generated/prisma/enums";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { rentalService } from "./rental.service";

const createRentalOrder = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const result = await rentalService.createRentalOrder(customerId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Rental order created successfully",
    data: result,
  });
});

const getCustomerRentals = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const result = await rentalService.getCustomerRentals(customerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental orders fetched successfully",
    data: result,
  });
});

const getRentalById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role as UserRole;
  const result = await rentalService.getRentalById(
    req.params.id as string,
    userId,
    userRole
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental order details fetched successfully",
    data: result,
  });
});

const cancelRentalOrder = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const result = await rentalService.cancelRentalOrder(
    req.params.id as string,
    customerId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Rental order cancelled successfully",
    data: result,
  });
});

const getProviderOrders = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user!.id;
  const result = await rentalService.getProviderOrders(providerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Incoming rental orders fetched successfully",
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req: Request, res: Response) => {
  const providerId = req.user!.id;
  const result = await rentalService.updateOrderStatusByProvider(
    req.params.id as string,
    providerId,
    req.body.status
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Rental order status updated to ${req.body.status}`,
    data: result,
  });
});

export const rentalController = {
  createRentalOrder,
  getCustomerRentals,
  getRentalById,
  cancelRentalOrder,
  getProviderOrders,
  updateOrderStatus,
};
