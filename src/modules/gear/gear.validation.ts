import { Request } from "express";
import { ValidationError } from "../../middlewares/validateRequest";

const createGear = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { title, description, brand, categoryId, dailyPrice, totalStock } = req.body || {};

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    errors.push({ field: "title", message: "Title is required." });
  }

  if (!description || typeof description !== "string" || description.trim().length === 0) {
    errors.push({ field: "description", message: "Description is required." });
  }

  if (!brand || typeof brand !== "string" || brand.trim().length === 0) {
    errors.push({ field: "brand", message: "Brand is required." });
  }

  if (!categoryId || typeof categoryId !== "string" || categoryId.trim().length === 0) {
    errors.push({ field: "categoryId", message: "CategoryId is required." });
  }

  if (dailyPrice === undefined || isNaN(Number(dailyPrice)) || Number(dailyPrice) <= 0) {
    errors.push({
      field: "dailyPrice",
      message: "Daily price must be a positive number greater than 0.",
    });
  }

  if (totalStock !== undefined && (isNaN(Number(totalStock)) || Number(totalStock) < 0)) {
    errors.push({
      field: "totalStock",
      message: "Total stock must be a non-negative integer.",
    });
  }

  return errors;
};

const updateGear = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { dailyPrice, totalStock } = req.body || {};

  if (dailyPrice !== undefined && (isNaN(Number(dailyPrice)) || Number(dailyPrice) <= 0)) {
    errors.push({
      field: "dailyPrice",
      message: "Daily price must be a positive number greater than 0.",
    });
  }

  if (totalStock !== undefined && (isNaN(Number(totalStock)) || Number(totalStock) < 0)) {
    errors.push({
      field: "totalStock",
      message: "Total stock must be a non-negative integer.",
    });
  }

  return errors;
};

export const gearValidation = {
  createGear,
  updateGear,
};
