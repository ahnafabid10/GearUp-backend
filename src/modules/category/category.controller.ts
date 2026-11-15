import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { categoryService } from "./category.service";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.createCategory(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Category created successfully",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getAllCategories();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories fetched successfully",
    data: result,
  });
});

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getCategoryById(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category fetched successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.updateCategory(req.params.id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.deleteCategory(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category deleted successfully",
    data: result,
  });
});

const getManagedCategories = catchAsync(async (_req: Request, res: Response) => {
  sendResponse(res, {success: true, statusCode: 200, message: "Categories fetched", data: await categoryService.getAllCategories(true)});
});
const suggestCategory = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {success: true, statusCode: 201, message: "Suggestion sent for admin review", data: await categoryService.suggestCategory(req.user!.id, req.body)});
});
const getSuggestions = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {success: true, statusCode: 200, message: "Suggestions fetched", data: await categoryService.getSuggestions(req.user!.role === "ADMIN" ? undefined : req.user!.id)});
});
const reviewSuggestion = catchAsync(async (req: Request, res: Response) => {
  sendResponse(res, {success: true, statusCode: 200, message: "Suggestion reviewed", data: await categoryService.reviewSuggestion(req.params.id as string, req.body.status, req.body.reviewNote)});
});

export const categoryController = {
  getManagedCategories,
  suggestCategory,
  getSuggestions,
  reviewSuggestion,
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
