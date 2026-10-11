import { Request, Response } from "express";
import httpStatus from "http-status";
import Stripe from "stripe";
import { UserRole } from "../../../generated/prisma/enums";
import config from "../../config";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";

const stripe = new Stripe(config.stripe_secret_key || "sk_test_mock", {
  apiVersion: "2025-02-24.acacia" as any,
});

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const result = await paymentService.createPaymentIntent(customerId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Payment intent created successfully",
    data: result,
  });
});

const confirmPayment = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const result = await paymentService.confirmPayment(customerId, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.payment,
  });
});

const getPayments = catchAsync(async (req: Request, res: Response) => {
  const customerId = req.user!.id;
  const result = await paymentService.getCustomerPayments(customerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment history fetched successfully",
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const userRole = req.user!.role as UserRole;
  const result = await paymentService.getPaymentById(
    req.params.id as string,
    userId,
    userRole
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment details fetched successfully",
    data: result,
  });
});

const handleWebhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    if (config.stripe_webhook_secret && sig) {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        config.stripe_webhook_secret
      );
    } else {
      event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    }

    const result = await paymentService.handleStripeWebhook(event);
    res.status(httpStatus.OK).json(result);
  } catch (err: any) {
    console.error("Stripe webhook verification error:", err.message);
    res.status(httpStatus.BAD_REQUEST).json({
      error: `Webhook Error: ${err.message}`,
    });
  }
};

export const paymentController = {
  createPayment,
  confirmPayment,
  getPayments,
  getPaymentById,
  handleWebhook,
};
