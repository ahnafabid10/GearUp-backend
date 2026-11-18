import { Request } from "express";
import { ValidationError } from "../../middlewares/validateRequest";

const createPayment = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { rentalOrderId } = req.body || {};

  if (!rentalOrderId || typeof rentalOrderId !== "string" || rentalOrderId.trim().length === 0) {
    errors.push({ field: "rentalOrderId", message: "rentalOrderId is required." });
  }

  return errors;
};

const confirmPayment = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { rentalOrderId, paymentIntentId } = req.body || {};

  if (!rentalOrderId || typeof rentalOrderId !== "string" || rentalOrderId.trim().length === 0) {
    errors.push({ field: "rentalOrderId", message: "rentalOrderId is required." });
  }

  if (!paymentIntentId || typeof paymentIntentId !== "string" || paymentIntentId.trim().length === 0) {
    errors.push({ field: "paymentIntentId", message: "paymentIntentId is required." });
  }

  return errors;
};

const createCheckoutSession = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { rentalOrderId } = req.body || {};

  if (!rentalOrderId || typeof rentalOrderId !== "string" || rentalOrderId.trim().length === 0) {
    errors.push({ field: "rentalOrderId", message: "rentalOrderId is required." });
  }

  return errors;
};

const verifyCheckoutSession = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  const { rentalOrderId, sessionId } = req.body || {};

  if (!rentalOrderId || typeof rentalOrderId !== "string" || rentalOrderId.trim().length === 0) {
    errors.push({ field: "rentalOrderId", message: "rentalOrderId is required." });
  }

  if (!sessionId || typeof sessionId !== "string" || sessionId.trim().length === 0) {
    errors.push({ field: "sessionId", message: "sessionId is required." });
  }

  return errors;
};

export const paymentValidation = {
  createPayment,
  confirmPayment,
  createCheckoutSession,
  verifyCheckoutSession,
};
