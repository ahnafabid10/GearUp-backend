import { OrderStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ICreateReview } from "./review.interface";

const createReview = async (customerId: string, payload: ICreateReview) => {
  const { rentalOrderId, rating, comment } = payload;

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    throw new Error("Rating must be an integer between 1 and 5.");
  }

  const order = await prisma.rentalOrder.findUnique({
    where: { id: rentalOrderId },
    include: { review: true },
  });

  if (!order) {
    throw new Error("Rental order not found.");
  }

  if (order.customerId !== customerId) {
    throw new Error("Forbidden: You can only review your own rental orders.");
  }

  if (order.status !== OrderStatus.RETURNED) {
    throw new Error(
      `Reviews can only be submitted after the gear is returned. Current status is '${order.status}'.`
    );
  }

  if (order.review) {
    throw new Error("A review has already been submitted for this rental order.");
  }

  const review = await prisma.review.create({
    data: {
      customerId,
      gearId: order.gearId,
      rentalOrderId,
      rating: Math.round(numRating),
      comment,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
      gear: {
        select: {
          id: true,
          title: true,
          brand: true,
        },
      },
    },
  });

  return review;
};

const getGearReviews = async (gearId: string) => {
  const reviews = await prisma.review.findMany({
    where: { gearId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const avgRating =
    reviews.length > 0
      ? Number(
          (
            reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          ).toFixed(1)
        )
      : 0;

  return {
    reviews,
    averageRating: avgRating,
    totalReviews: reviews.length,
  };
};

export const reviewService = {
  createReview,
  getGearReviews,
};
