import { Request } from "express";
import { UserStatus } from "../../../generated/prisma/enums";
import { ValidationError } from "../../middlewares/validateRequest";

const updateUserStatus = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { status } = req.body || {};

  const validStatuses = Object.values(UserStatus);
  if (!status || !validStatuses.includes(status)) {
    errors.push({
      field: "status",
      message: `Status must be one of: ${validStatuses.join(", ")}.`,
    });
  }

  return errors;
};

export const adminValidation = {
  updateUserStatus,
};
