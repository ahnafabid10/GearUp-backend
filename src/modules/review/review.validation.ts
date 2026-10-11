import { Request } from "express";
import { ValidationError } from "../../middlewares/validateRequest";

const createReview = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { rentalOrderId, rating, comment } = req.body || {};

  if (!rentalOrderId || typeof rentalOrderId !== "string" || rentalOrderId.trim().length === 0) {
    errors.push({ field: "rentalOrderId", message: "rentalOrderId is required." });
  }

  if (rating === undefined || isNaN(Number(rating))) {
    errors.push({ field: "rating", message: "rating must be an integer between 1 and 5." });
  } else {
    const num = Number(rating);
    if (!Number.isInteger(num) || num < 1 || num > 5) {
      errors.push({ field: "rating", message: "rating must be an integer between 1 and 5." });
    }
  }

  if (!comment || typeof comment !== "string" || comment.trim().length < 3) {
    errors.push({ field: "comment", message: "comment is required and must be at least 3 characters." });
  }

  return errors;
};

export const reviewValidation = {
  createReview,
};
