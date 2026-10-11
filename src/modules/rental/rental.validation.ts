import { Request } from "express";
import { OrderStatus } from "../../../generated/prisma/enums";
import { ValidationError } from "../../middlewares/validateRequest";

const createRental = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { gearId, startDate, endDate } = req.body || {};

  if (!gearId || typeof gearId !== "string" || gearId.trim().length === 0) {
    errors.push({ field: "gearId", message: "gearId is required." });
  }

  if (!startDate) {
    errors.push({ field: "startDate", message: "startDate is required." });
  } else {
    const s = new Date(startDate);
    if (isNaN(s.getTime())) {
      errors.push({ field: "startDate", message: "startDate must be a valid date format." });
    }
  }

  if (!endDate) {
    errors.push({ field: "endDate", message: "endDate is required." });
  } else {
    const e = new Date(endDate);
    if (isNaN(e.getTime())) {
      errors.push({ field: "endDate", message: "endDate must be a valid date format." });
    }
  }

  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && s >= e) {
      errors.push({
        field: "endDate",
        message: "endDate must be strictly after startDate.",
      });
    }
  }

  return errors;
};

const updateOrderStatus = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { status } = req.body || {};

  const validStatuses = Object.values(OrderStatus);
  if (!status || !validStatuses.includes(status)) {
    errors.push({
      field: "status",
      message: `Status must be one of: ${validStatuses.join(", ")}.`,
    });
  }

  return errors;
};

export const rentalValidation = {
  createRental,
  updateOrderStatus,
};
