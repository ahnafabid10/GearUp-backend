import { prisma } from "../../lib/prisma";
import { ICreateCategory, IUpdateCategory } from "./category.interface";

const createCategory = async (payload: ICreateCategory) => {
  const { name, description, image } = payload;
  const slug = payload.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

  const existing = await prisma.category.findFirst({
    where: {
      OR: [{ name }, { slug }],
    },
  });

  if (existing) {
    throw new Error("Category with this name or slug already exists.");
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      image,
    },
  });

  return category;
};

const getAllCategories = async () => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          gearItems: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories;
};

const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      gearItems: true,
      _count: {
        select: {
          gearItems: true,
        },
      },
    },
  });

  if (!category) {
    throw new Error("Category not found.");
  }

  return category;
};

const updateCategory = async (id: string, payload: IUpdateCategory) => {
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Category not found.");
  }

  const updated = await prisma.category.update({
    where: { id },
    data: payload,
  });

  return updated;
};

const deleteCategory = async (id: string) => {
  const existing = await prisma.category.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Category not found.");
  }

  await prisma.category.delete({
    where: { id },
  });

  return { message: "Category deleted successfully" };
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
