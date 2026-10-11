import { Request } from "express";
import { ValidationError } from "../../middlewares/validateRequest";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const register = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { name, email, password, role } = req.body || {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Name is required and must be at least 2 characters long.",
    });
  }

  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    errors.push({
      field: "email",
      message: "A valid email address is required.",
    });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    errors.push({
      field: "password",
      message: "Password is required and must be at least 6 characters long.",
    });
  }

  if (role && !["CUSTOMER", "PROVIDER", "ADMIN"].includes(role)) {
    errors.push({
      field: "role",
      message: "Role must be either 'CUSTOMER', 'PROVIDER', or 'ADMIN'.",
    });
  }

  return errors;
};

const login = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { email, password } = req.body || {};

  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    errors.push({
      field: "email",
      message: "A valid email address is required.",
    });
  }

  if (!password || typeof password !== "string" || !password) {
    errors.push({
      field: "password",
      message: "Password is required.",
    });
  }

  return errors;
};

export const authValidation = {
  register,
  login,
};
