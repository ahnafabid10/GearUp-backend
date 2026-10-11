import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

export type ValidationError = {
  field: string;
  message: string;
};

export type ValidatorFunction = (
  req: Request
) => ValidationError[] | Promise<ValidationError[]>;

export const validateRequest = (validator: ValidatorFunction) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = await validator(req);

      if (errors && errors.length > 0) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: errors[0]?.message || "Input validation failed",
          errorDetails: errors,
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
