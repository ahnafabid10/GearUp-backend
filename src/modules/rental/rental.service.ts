import { OrderStatus, UserRole } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ICreateRentalOrder } from "./rental.interface";

const createRentalOrder = async (
  customerId: string,
  payload: ICreateRentalOrder
) => {
  const { gearId, notes } = payload;
  const start = new Date(payload.startDate);
  const end = new Date(payload.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid start date or end date format.");
  }

  if (start >= end) {
    throw new Error("End date must be after start date.");
  }

  const gear = await prisma.gearItem.findUnique({
    where: { id: gearId },
  });

  if (!gear) {
    throw new Error("Gear item not found.");
  }

  if (!gear.isAvailable || gear.availableStock <= 0) {
    throw new Error("This gear item is currently unavailable or out of stock.");
  }

  if (gear.providerId === customerId) {
    throw new Error("You cannot rent your own gear item.");
  }

  const diffTime = Math.abs(end.getTime() - start.getTime());
  const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const totalAmount = totalDays * gear.dailyPrice + gear.depositAmount;

  // Transaction: create rental order and decrement available stock
  const result = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.rentalOrder.create({
      data: {
        customerId,
        gearId,
        startDate: start,
        endDate: end,
        totalDays,
        dailyRate: gear.dailyPrice,
        depositAmount: gear.depositAmount,
        totalAmount,
        status: OrderStatus.PLACED,
        notes,
      },
      include: {
        gear: {
          include: {
            category: true,
            provider: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    const updatedStock = gear.availableStock - 1;
    await tx.gearItem.update({
      where: { id: gearId },
      data: {
        availableStock: updatedStock,
        isAvailable: updatedStock > 0,
      },
    });

    return newOrder;
  });

  return result;
};

const getCustomerRentals = async (customerId: string) => {
  const orders = await prisma.rentalOrder.findMany({
    where: { customerId },
    include: {
      gear: {
        include: {
          category: true,
          provider: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      payment: true,
      review: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders;
};

const getRentalById = async (
  id: string,
  userId: string,
  userRole: UserRole
) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id },
    include: {
      gear: {
        include: {
          category: true,
          provider: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      payment: true,
      review: true,
    },
  });

  if (!order) {
    throw new Error("Rental order not found.");
  }

  // Access check
  const isCustomer = order.customerId === userId;
  const isProvider = order.gear.providerId === userId;
  const isAdmin = userRole === UserRole.ADMIN;

  if (!isCustomer && !isProvider && !isAdmin) {
    throw new Error("Forbidden: You do not have access to view this rental order.");
  }

  return order;
};

const cancelRentalOrder = async (id: string, customerId: string) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id },
    include: { gear: true },
  });

  if (!order) {
    throw new Error("Rental order not found.");
  }

  if (order.customerId !== customerId) {
    throw new Error("Forbidden: You can only cancel your own orders.");
  }

  if (order.status !== OrderStatus.PLACED) {
    throw new Error(`Cannot cancel an order that is already in '${order.status}' status.`);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.rentalOrder.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
    });

    // Restore stock
    await tx.gearItem.update({
      where: { id: order.gearId },
      data: {
        availableStock: { increment: 1 },
        isAvailable: true,
      },
    });

    return updatedOrder;
  });

  return result;
};

const getProviderOrders = async (providerId: string) => {
  const orders = await prisma.rentalOrder.findMany({
    where: {
      gear: {
        providerId,
      },
    },
    include: {
      gear: {
        include: {
          category: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      },
      payment: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders;
};

const updateOrderStatusByProvider = async (
  id: string,
  providerId: string,
  newStatus: OrderStatus
) => {
  const order = await prisma.rentalOrder.findUnique({
    where: { id },
    include: { gear: true },
  });

  if (!order) {
    throw new Error("Rental order not found.");
  }

  if (order.gear.providerId !== providerId) {
    throw new Error("Forbidden: You can only update orders for your own gear.");
  }

  const validTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
    [OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
    [OrderStatus.PAID]: [OrderStatus.PICKED_UP, OrderStatus.CANCELLED],
    [OrderStatus.PICKED_UP]: [OrderStatus.RETURNED],
  };

  const allowedNext = validTransitions[order.status] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new Error(
      `Invalid status change. Cannot transition from ${order.status} to ${newStatus}.`
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.rentalOrder.update({
      where: { id },
      data: { status: newStatus },
      include: {
        gear: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If order returned or cancelled, restore gear stock
    if (newStatus === OrderStatus.RETURNED || newStatus === OrderStatus.CANCELLED) {
      await tx.gearItem.update({
        where: { id: order.gearId },
        data: {
          availableStock: { increment: 1 },
          isAvailable: true,
        },
      });
    }

    return updated;
  });

  return result;
};

export const rentalService = {
  createRentalOrder,
  getCustomerRentals,
  getRentalById,
  cancelRentalOrder,
  getProviderOrders,
  updateOrderStatusByProvider,
};
