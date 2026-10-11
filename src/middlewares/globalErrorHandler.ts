import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Prisma } from "../../generated/prisma/client";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let errorMessage: string = err.message || "Internal Server Error";
  let errorDetails: any = err.errorDetails || err;

  if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    errorMessage = "You have provided incorrect field type or missing fields";
    errorDetails = {
      name: err.name,
      message: err.message,
    };
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = "Duplicate key error: A record with this value already exists.";
      errorDetails = {
        code: err.code,
        meta: err.meta,
      };
    } else if (err.code === "P2003") {
      statusCode = httpStatus.BAD_REQUEST;
      errorMessage = "Foreign key constraint failed.";
      errorDetails = {
        code: err.code,
        meta: err.meta,
      };
    } else if (err.code === "P2025") {
      statusCode = httpStatus.NOT_FOUND;
      errorMessage = "The requested record was not found.";
      errorDetails = {
        code: err.code,
        meta: err.meta,
      };
    }
  } else if (err instanceof Prisma.PrismaClientInitializationError) {
    if (err.errorCode === "P1000") {
      statusCode = httpStatus.UNAUTHORIZED;
      errorMessage = "Authentication failed against database server. Please check your credentials.";
    } else if (err.errorCode === "P1001") {
      statusCode = httpStatus.SERVICE_UNAVAILABLE;
      errorMessage = "Cannot reach database server.";
    }
  } else if (err.statusCode) {
    statusCode = err.statusCode;
  }

  // Consistent Error Response: { success, message, errorDetails }
  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    errorDetails: typeof errorDetails === "object" && !(errorDetails instanceof Error)
      ? errorDetails
      : {
          name: err.name || "Error",
          message: err.message || "An unexpected error occurred",
          stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        },
  });
};
