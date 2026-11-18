import Stripe from "stripe";
import { OrderStatus, PaymentProvider, PaymentStatus, UserRole } from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import {
  IConfirmPayment,
  ICreateCheckoutSession,
  ICreatePaymentIntent,
  IVerifyCheckoutSession,
} from "./payment.interface";

const stripe = new Stripe(config.stripe_secret_key || "sk_test_mock", {
  apiVersion: "2025-02-24.acacia" as any,
});

const createPaymentIntent = async (
  customerId: string,
  payload: ICreatePaymentIntent
) => {
  const { rentalOrderId } = payload;

  const order = await prisma.rentalOrder.findUnique({
    where: { id: rentalOrderId },
    include: {
      gear: true,
      payment: true,
    },
  });

  if (!order) {
    throw new Error("Rental order not found.");
  }

  if (order.customerId !== customerId) {
    throw new Error("Forbidden: You do not own this rental order.");
  }

  if (order.status === OrderStatus.PAID) {
    throw new Error("This rental order has already been paid.");
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new Error("Cannot make payment for a cancelled rental order.");
  }

  // Calculate amount in cents (Stripe expects integers)
  const amountInCents = Math.round(order.totalAmount * 100);

  let clientSecret: string | null = null;
  let paymentIntentId: string = "";

  if (config.stripe_secret_key && !config.stripe_secret_key.includes("placeholder")) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: {
        rentalOrderId: order.id,
        customerId,
      },
    });
    clientSecret = paymentIntent.client_secret;
    paymentIntentId = paymentIntent.id;
  } else {
    // Development fallback if user has not yet configured actual live Stripe key
    paymentIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    clientSecret = `${paymentIntentId}_secret_mock`;
  }

  // Upsert payment record
  const payment = await prisma.payment.upsert({
    where: { rentalOrderId },
    update: {
      amount: order.totalAmount,
      stripePaymentIntentId: paymentIntentId,
      stripeClientSecret: clientSecret,
      status: PaymentStatus.PENDING,
    },
    create: {
      rentalOrderId,
      customerId,
      amount: order.totalAmount,
      currency: "usd",
      provider: PaymentProvider.STRIPE,
      stripePaymentIntentId: paymentIntentId,
      stripeClientSecret: clientSecret,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    paymentId: payment.id,
    rentalOrderId: order.id,
    amount: order.totalAmount,
    clientSecret,
    paymentIntentId,
  };
};

const confirmPayment = async (
  customerId: string,
  payload: IConfirmPayment
) => {
  const { rentalOrderId, paymentIntentId } = payload;

  const payment = await prisma.payment.findUnique({
    where: { rentalOrderId },
    include: { rentalOrder: true },
  });

  if (!payment) {
    throw new Error("Payment record not found for this rental order.");
  }

  if (payment.customerId !== customerId) {
    throw new Error("Forbidden: You do not own this payment record.");
  }

  if (payment.status === PaymentStatus.COMPLETED) {
    return {
      message: "Payment already confirmed.",
      payment,
    };
  }

  let isVerified = false;

  if (config.stripe_secret_key && !config.stripe_secret_key.includes("placeholder")) {
    let intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (
      intent.status === "requires_payment_method" ||
      intent.status === "requires_confirmation"
    ) {
      try {
        intent = await stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: "pm_card_visa",
          return_url: "http://localhost:5000",
        });
      } catch (stripeErr) {
        console.warn("Could not auto-confirm with pm_card_visa:", stripeErr);
      }
    }
    if (intent.status === "succeeded") {
      isVerified = true;
    }
  } else {
    // In mock/test dev mode, accept confirmation
    isVerified = true;
  }

  if (!isVerified) {
    throw new Error("Payment has not been completed on Stripe.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { rentalOrderId },
      data: {
        status: PaymentStatus.COMPLETED,
        transactionId: paymentIntentId,
        paidAt: new Date(),
      },
    });

    await tx.rentalOrder.update({
      where: { id: rentalOrderId },
      data: {
        status: OrderStatus.PAID,
      },
    });

    return updatedPayment;
  });

  return {
    message: "Payment successfully verified and order marked as PAID.",
    payment: result,
  };
};

const createCheckoutSession = async (
  customerId: string,
  payload: ICreateCheckoutSession
) => {
  const { rentalOrderId } = payload;

  const order = await prisma.rentalOrder.findUnique({
    where: { id: rentalOrderId },
    include: {
      gear: true,
      payment: true,
    },
  });

  if (!order) {
    throw new Error("Rental order not found.");
  }

  if (order.customerId !== customerId) {
    throw new Error("Forbidden: You do not own this rental order.");
  }

  if (order.status === OrderStatus.PAID) {
    throw new Error("This rental order has already been paid.");
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new Error("Cannot make payment for a cancelled rental order.");
  }

  const amountInCents = Math.round(order.totalAmount * 100);
  const appBaseUrl = config.app_url || "http://localhost:3030";

  let checkoutUrl: string | null = null;
  let sessionId: string = "";

  if (config.stripe_secret_key && !config.stripe_secret_key.includes("placeholder")) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: order.gear.title,
              description: `GearUp Rental: ${order.totalDays} day(s) from ${new Date(order.startDate).toLocaleDateString()} to ${new Date(order.endDate).toLocaleDateString()}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appBaseUrl}/payment/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appBaseUrl}/payment/cancel?order=${order.id}`,
      metadata: {
        rentalOrderId: order.id,
        customerId,
      },
    });

    checkoutUrl = session.url;
    sessionId = session.id;
  } else {
    // Development fallback
    sessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    checkoutUrl = `${appBaseUrl}/payment/success?order=${order.id}&session_id=${sessionId}`;
  }

  // Upsert payment record
  await prisma.payment.upsert({
    where: { rentalOrderId },
    update: {
      amount: order.totalAmount,
      stripePaymentIntentId: sessionId,
      status: PaymentStatus.PENDING,
    },
    create: {
      rentalOrderId,
      customerId,
      amount: order.totalAmount,
      currency: "usd",
      provider: PaymentProvider.STRIPE,
      stripePaymentIntentId: sessionId,
      status: PaymentStatus.PENDING,
    },
  });

  return {
    rentalOrderId: order.id,
    amount: order.totalAmount,
    sessionId,
    checkoutUrl,
  };
};

const verifyCheckoutSession = async (
  customerId: string,
  payload: IVerifyCheckoutSession
) => {
  const { rentalOrderId, sessionId } = payload;

  const order = await prisma.rentalOrder.findUnique({
    where: { id: rentalOrderId },
    include: { payment: true },
  });

  if (!order) {
    throw new Error("Rental order not found.");
  }

  if (order.customerId !== customerId) {
    throw new Error("Forbidden: You do not own this rental order.");
  }

  if (order.status === OrderStatus.PAID) {
    return {
      message: "Order already marked as PAID.",
      order,
    };
  }

  let isPaid = false;

  if (config.stripe_secret_key && !config.stripe_secret_key.includes("placeholder")) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status === "paid") {
      isPaid = true;
    }
  } else {
    // Development fallback
    isPaid = true;
  }

  if (!isPaid) {
    throw new Error("Stripe checkout session has not been completed or paid.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.upsert({
      where: { rentalOrderId },
      update: {
        status: PaymentStatus.COMPLETED,
        transactionId: sessionId,
        paidAt: new Date(),
      },
      create: {
        rentalOrderId,
        customerId,
        amount: order.totalAmount,
        currency: "usd",
        provider: PaymentProvider.STRIPE,
        transactionId: sessionId,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      },
    });

    const updatedOrder = await tx.rentalOrder.update({
      where: { id: rentalOrderId },
      data: {
        status: OrderStatus.PAID,
      },
      include: {
        gear: true,
      },
    });

    return { payment: updatedPayment, order: updatedOrder };
  });

  return {
    message: "Payment successfully verified and order marked as PAID.",
    ...result,
  };
};

const handleStripeWebhook = async (event: Stripe.Event) => {
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const rentalOrderId = paymentIntent.metadata?.rentalOrderId;

    if (rentalOrderId) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: { rentalOrderId },
          data: {
            status: PaymentStatus.COMPLETED,
            transactionId: paymentIntent.id,
            paidAt: new Date(),
          },
        });

        await tx.rentalOrder.update({
          where: { id: rentalOrderId },
          data: {
            status: OrderStatus.PAID,
          },
        });
      });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const rentalOrderId = session.metadata?.rentalOrderId;

    if (rentalOrderId && session.payment_status === "paid") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.updateMany({
          where: { rentalOrderId },
          data: {
            status: PaymentStatus.COMPLETED,
            transactionId: session.id,
            paidAt: new Date(),
          },
        });

        await tx.rentalOrder.update({
          where: { id: rentalOrderId },
          data: {
            status: OrderStatus.PAID,
          },
        });
      });
    }
  }

  return { received: true };
};

const getCustomerPayments = async (customerId: string) => {
  const payments = await prisma.payment.findMany({
    where: { customerId },
    include: {
      rentalOrder: {
        include: {
          gear: {
            select: {
              id: true,
              title: true,
              brand: true,
              images: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return payments;
};

const getPaymentById = async (
  id: string,
  userId: string,
  userRole: UserRole
) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      rentalOrder: {
        include: {
          gear: true,
        },
      },
    },
  });

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  if (payment.customerId !== userId && userRole !== UserRole.ADMIN) {
    throw new Error("Forbidden: You do not have permission to view this payment.");
  }

  return payment;
};

export const paymentService = {
  createPaymentIntent,
  confirmPayment,
  createCheckoutSession,
  verifyCheckoutSession,
  handleStripeWebhook,
  getCustomerPayments,
  getPaymentById,
};
