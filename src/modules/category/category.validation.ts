import { Request } from "express";
import { ValidationError } from "../../middlewares/validateRequest";

export const categorySlug = (name: string) => name.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");

function validate(req: Request, partial: boolean): ValidationError[] {
  const body = req.body || {};
  const errors: ValidationError[] = [];
  if ((!partial || body.name !== undefined) && (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 80 || !categorySlug(body.name))) {
    errors.push({ field: "name", message: "Enter a category name between 2 and 80 characters." });
  }
  if (body.slug !== undefined && (typeof body.slug !== "string" || !/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(body.slug) || body.slug.length > 100)) {
    errors.push({ field: "slug", message: "Use a lowercase, hyphen-separated slug (up to 100 characters)." });
  }
  for (const field of ["description", "image"]) {
    if (body[field] !== undefined && (typeof body[field] !== "string" || body[field].length > 1000)) errors.push({field, message: `${field} must be text up to 1000 characters.`});
  }
  if (body.image) {
    try { if (new URL(body.image).protocol !== "https:") throw new Error(); }
    catch { errors.push({field: "image", message: "Use an HTTPS image URL."}); }
  }
  if (body.isActive !== undefined && typeof body.isActive !== "boolean") errors.push({field: "isActive", message: "isActive must be a boolean."});
  return errors;
}
const reviewSuggestion = (req: Request): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!["APPROVED", "REJECTED"].includes(req.body?.status)) errors.push({field: "status", message: "Choose approve or reject."});
  if (req.body?.reviewNote !== undefined && (typeof req.body.reviewNote !== "string" || req.body.reviewNote.length > 500)) errors.push({field: "reviewNote", message: "Review note must be text up to 500 characters."});
  return errors;
};
export const categoryValidation = { createCategory: (req: Request) => validate(req, false), updateCategory: (req: Request) => validate(req, true), reviewSuggestion };
