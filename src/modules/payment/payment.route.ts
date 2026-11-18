import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { paymentController } from "./payment.controller";
import { paymentValidation } from "./payment.validation";

const router = Router();

router.post(
  "/create",
  auth(UserRole.CUSTOMER),
  validateRequest(paymentValidation.createPayment),
  paymentController.createPayment
);
router.post(
  "/confirm",
  auth(UserRole.CUSTOMER),
  validateRequest(paymentValidation.confirmPayment),
  paymentController.confirmPayment
);
router.post(
  "/checkout-session",
  auth(UserRole.CUSTOMER),
  validateRequest(paymentValidation.createCheckoutSession),
  paymentController.createCheckoutSession
);
router.post(
  "/verify-session",
  auth(UserRole.CUSTOMER),
  validateRequest(paymentValidation.verifyCheckoutSession),
  paymentController.verifyCheckoutSession
);
router.get("/", auth(UserRole.CUSTOMER), paymentController.getPayments);
router.get(
  "/:id",
  auth(UserRole.CUSTOMER, UserRole.ADMIN),
  paymentController.getPaymentById
);
router.post("/webhook", paymentController.handleWebhook);

export const paymentRoutes = router;
