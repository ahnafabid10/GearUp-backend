import { prisma } from "../../lib/prisma";
import { IUpdateProfile } from "./user.interface";

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true },
    include: {
      _count: {
        select: {
          gearItems: true,
          rentalOrders: true,
          reviews: true,
          payments: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
};

const updateMyProfile = async (userId: string, payload: IUpdateProfile) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: payload.name,
      phone: payload.phone,
      address: payload.address,
    },
    omit: { password: true },
  });

  return updatedUser;
};

export const userService = {
  getMyProfile,
  updateMyProfile,
};
