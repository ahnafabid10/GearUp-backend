import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { ICreateGear, IGearQuery, IUpdateGear } from "./gear.interface";

const createGear = async (providerId: string, payload: ICreateGear) => {
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new Error("Category does not exist.");
  }

  const stock = Number(payload.totalStock) || 1;

  const gear = await prisma.gearItem.create({
    data: {
      title: payload.title,
      description: payload.description,
      brand: payload.brand,
      categoryId: payload.categoryId,
      providerId,
      dailyPrice: Number(payload.dailyPrice),
      depositAmount: Number(payload.depositAmount) || 0,
      totalStock: stock,
      availableStock: stock,
      images: payload.images || [],
      specifications: payload.specifications || {},
      isAvailable: payload.isAvailable ?? true,
    },
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
  });

  return gear;
};

const getAllGear = async (query: IGearQuery) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const andConditions: Prisma.GearItemWhereInput[] = [];

  // Search filter
  if (query.search) {
    andConditions.push({
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { brand: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  // Category filter
  if (query.categoryId) {
    andConditions.push({ categoryId: query.categoryId });
  } else if (query.category) {
    andConditions.push({
      category: {
        slug: { equals: query.category, mode: "insensitive" },
      },
    });
  }

  // Brand filter
  if (query.brand) {
    andConditions.push({
      brand: { contains: query.brand, mode: "insensitive" },
    });
  }

  // Price filter
  if (query.minPrice !== undefined && query.minPrice !== "") {
    andConditions.push({
      dailyPrice: { gte: Number(query.minPrice) },
    });
  }
  if (query.maxPrice !== undefined && query.maxPrice !== "") {
    andConditions.push({
      dailyPrice: { lte: Number(query.maxPrice) },
    });
  }

  // Availability filter
  if (query.isAvailable !== undefined && query.isAvailable !== "") {
    const isAvail = query.isAvailable === "true";
    andConditions.push({
      isAvailable: isAvail,
      availableStock: isAvail ? { gt: 0 } : undefined,
    });
  }

  const whereCondition: Prisma.GearItemWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const [gearItems, total] = await Promise.all([
    prisma.gearItem.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
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
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    }),
    prisma.gearItem.count({ where: whereCondition }),
  ]);

  // Calculate average rating
  const data = gearItems.map((item) => {
    const avgRating =
      item.reviews.length > 0
        ? Number(
            (
              item.reviews.reduce((acc, r) => acc + r.rating, 0) /
              item.reviews.length
            ).toFixed(1)
          )
        : 0;

    const { reviews, ...rest } = item;
    return {
      ...rest,
      averageRating: avgRating,
      reviewCount: reviews.length,
    };
  });

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
  };
};

const getGearById = async (id: string) => {
  const gear = await prisma.gearItem.findUnique({
    where: { id },
    include: {
      category: true,
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
        },
      },
      reviews: {
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
      },
    },
  });

  if (!gear) {
    throw new Error("Gear item not found.");
  }

  const avgRating =
    gear.reviews.length > 0
      ? Number(
          (
            gear.reviews.reduce((acc, r) => acc + r.rating, 0) /
            gear.reviews.length
          ).toFixed(1)
        )
      : 0;

  return {
    ...gear,
    averageRating: avgRating,
    reviewCount: gear.reviews.length,
  };
};

const updateGear = async (
  id: string,
  providerId: string,
  payload: IUpdateGear
) => {
  const gear = await prisma.gearItem.findUnique({
    where: { id },
  });

  if (!gear) {
    throw new Error("Gear item not found.");
  }

  if (gear.providerId !== providerId) {
    throw new Error("Forbidden: You can only edit your own gear items.");
  }

  const updateData: Prisma.GearItemUpdateInput = {};

  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.description !== undefined) updateData.description = payload.description;
  if (payload.brand !== undefined) updateData.brand = payload.brand;
  if (payload.dailyPrice !== undefined) updateData.dailyPrice = Number(payload.dailyPrice);
  if (payload.depositAmount !== undefined) updateData.depositAmount = Number(payload.depositAmount);
  if (payload.totalStock !== undefined) updateData.totalStock = Number(payload.totalStock);
  if (payload.availableStock !== undefined) updateData.availableStock = Number(payload.availableStock);
  if (payload.images !== undefined) updateData.images = payload.images;
  if (payload.specifications !== undefined) updateData.specifications = payload.specifications;
  if (payload.isAvailable !== undefined) updateData.isAvailable = payload.isAvailable;
  if (payload.categoryId !== undefined) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!categoryExists) throw new Error("Category does not exist.");
    updateData.category = { connect: { id: payload.categoryId } };
  }

  const updated = await prisma.gearItem.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
      provider: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return updated;
};

const deleteGear = async (id: string, providerId: string) => {
  const gear = await prisma.gearItem.findUnique({
    where: { id },
  });

  if (!gear) {
    throw new Error("Gear item not found.");
  }

  if (gear.providerId !== providerId) {
    throw new Error("Forbidden: You can only delete your own gear items.");
  }

  await prisma.gearItem.delete({
    where: { id },
  });

  return { message: "Gear item deleted successfully" };
};

const getProviderGear = async (providerId: string) => {
  const items = await prisma.gearItem.findMany({
    where: { providerId },
    include: {
      category: true,
      _count: {
        select: {
          rentalOrders: true,
          reviews: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return items;
};

export const gearService = {
  createGear,
  getAllGear,
  getGearById,
  updateGear,
  deleteGear,
  getProviderGear,
};
