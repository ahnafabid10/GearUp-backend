import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";
import { UserRole } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import { catchAsync } from "../utils/catchAsync";
import { jwtUtils } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
      };
    }
  }
}

export const auth = (...requiredRoles: UserRole[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : req.headers.authorization;

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "You are not logged in. Please log in to access this resource.",
        errorDetails: {
          field: "Authorization",
          error: "Missing authorization token in headers or cookies",
        },
      });
    }

    const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

    if (!verifiedToken.success || !verifiedToken.data) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: verifiedToken.error || "Invalid or expired token. Please log in again.",
        errorDetails: {
          field: "Authorization",
          error: "Token validation failed",
        },
      });
    }

    const { id, email, name, role } = verifiedToken.data as JwtPayload & {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };

    if (requiredRoles.length && !requiredRoles.includes(role)) {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "Forbidden. You don't have permission to access this resource.",
        errorDetails: {
          role,
          requiredRoles,
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "User not found. Please log in again.",
        errorDetails: {
          userId: id,
          error: "User record does not exist",
        },
      });
    }

    if (user.status === "SUSPENDED") {
      return res.status(httpStatus.FORBIDDEN).json({
        success: false,
        message: "Your account has been suspended. Please contact admin.",
        errorDetails: {
          status: user.status,
          error: "Account suspended",
        },
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  });
};
