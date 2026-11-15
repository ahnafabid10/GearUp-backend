import { prisma } from "../../lib/prisma";
import { ICreateCategory, IUpdateCategory } from "./category.interface";
import { categorySlug } from "./category.validation";

const fail = (message: string, statusCode = 409): never => { throw Object.assign(new Error(message), { statusCode }); };
const createCategory = async (payload: ICreateCategory) => {
  const name = payload.name.trim().replace(/\s+/g, " ");
  const slug = (payload.slug || categorySlug(name)).toLowerCase();
  if (await prisma.category.findFirst({where: {OR: [{name: {equals: name, mode: "insensitive"}}, {slug}]}})) fail("A category with this name already exists. Check inactive categories too.");
  return prisma.category.create({ data: { name, slug, description: payload.description, image: payload.image } });
};
const getAllCategories = (includeInactive = false) => prisma.category.findMany({
  where: includeInactive ? {} : { isActive: true },
  include: { _count: { select: { gearItems: true } } }, orderBy: { name: "asc" },
});
const getCategoryById = async (id: string) => {
  const category = await prisma.category.findFirst({ where: {id, isActive: true}, include: {_count: {select: {gearItems: true}}} });
  return category || fail("Category not found.", 404);
};
const updateCategory = async (id: string, payload: IUpdateCategory) => {
  const existing = await prisma.category.findUnique({where: {id}});
  if (!existing) fail("Category not found.", 404);
  const name = payload.name?.trim().replace(/\s+/g, " ");
  // Keep existing slugs stable when renaming, so bookmarked category URLs still work.
  const slug = payload.slug?.toLowerCase();
  if (await prisma.category.findFirst({where: {id: {not: id}, OR: [ ...(name ? [{name: {equals: name, mode: "insensitive" as const}}] : []), ...(slug ? [{slug}] : []) ]}})) fail("Another category already uses this name or slug.");
  return prisma.category.update({where: {id}, data: {name, slug, description: payload.description, image: payload.image, isActive: payload.isActive}});
};
const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({where: {id}, include: {_count: {select: {gearItems: true}}}});
  if (!category) fail("Category not found.", 404);
  if (category!._count.gearItems) fail("This category has gear. Deactivate it instead, or move its gear to another category first.");
  // The RESTRICT foreign key also protects against a concurrent new listing.
  await prisma.category.delete({where: {id}});
  return {message: "Category deleted"};
};
const suggestCategory = async (providerId: string, payload: ICreateCategory) => {
  const name = payload.name.trim().replace(/\s+/g, " ");
  const slug = categorySlug(name);
  if (await prisma.category.findFirst({where: {OR: [{slug}, {name: {equals: name, mode: "insensitive"}}]}})) fail("This category already exists. If it is inactive, ask an admin to reactivate it.");
  if (await prisma.categorySuggestion.findFirst({where: {slug, status: "PENDING"}})) fail("This category has already been suggested and is awaiting review.");
  return prisma.categorySuggestion.create({data: {name, slug, description: payload.description, providerId}});
};
const getSuggestions = (providerId?: string) => prisma.categorySuggestion.findMany({
  where: providerId ? {providerId} : {}, orderBy: {createdAt: "desc"},
  include: {provider: {select: {name: true}}, category: {select: {id: true, name: true, isActive: true}}},
});
const reviewSuggestion = (id: string, status: "APPROVED" | "REJECTED", reviewNote?: string) => prisma.$transaction(async tx => {
  // Claim the pending request inside the transaction. A second reviewer cannot process it twice.
  const claim = await tx.categorySuggestion.updateMany({where: {id, status: "PENDING"}, data: {status, reviewNote}});
  if (!claim.count) fail("This suggestion was already reviewed or no longer exists.");
  const suggestion = await tx.categorySuggestion.findUniqueOrThrow({where: {id}});
  if (status === "REJECTED") return suggestion;
  const existing = await tx.category.findFirst({where: {OR: [{slug: suggestion.slug}, {name: {equals: suggestion.name, mode: "insensitive"}}]}});
  if (existing && !existing.isActive) fail("Reactivate the existing category before approving this suggestion.");
  const category = existing || await tx.category.create({data: {name: suggestion.name, slug: suggestion.slug, description: suggestion.description}});
  return tx.categorySuggestion.update({where: {id}, data: {categoryId: category.id}});
});
export const categoryService = {createCategory, getAllCategories, getCategoryById, updateCategory, deleteCategory, suggestCategory, getSuggestions, reviewSuggestion};
