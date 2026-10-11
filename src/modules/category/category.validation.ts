import { Request } from "express";
import { ValidationError } from "../../middlewares/validateRequest";

const createCategory = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { name } = req.body || {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Category name is required and must be at least 2 characters long.",
    });
  }

  return errors;
};

export const categoryValidation = {
  createCategory,
};
