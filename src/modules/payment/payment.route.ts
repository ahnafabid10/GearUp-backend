import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { paymentController } from "./payment.controller";

const router = Router();

router.post("/create", auth(UserRole.CUSTOMER), paymentController.createPayment);
router.post("/confirm", auth(UserRole.CUSTOMER), paymentController.confirmPayment);
router.get("/", auth(UserRole.CUSTOMER), paymentController.getPayments);
router.get(
  "/:id",
  auth(UserRole.CUSTOMER, UserRole.ADMIN),
  paymentController.getPaymentById
);
router.post("/webhook", paymentController.handleWebhook);

export const paymentRoutes = router;
