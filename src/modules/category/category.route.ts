import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { categoryController } from "./category.controller";
import { categoryValidation } from "./category.validation";

const router = Router();

router.get("/", categoryController.getAllCategories);
router.get("/manage", auth(UserRole.ADMIN), categoryController.getManagedCategories);
router.get("/suggestions", auth(UserRole.ADMIN, UserRole.PROVIDER), categoryController.getSuggestions);
router.post("/suggestions", auth(UserRole.PROVIDER), validateRequest(categoryValidation.createCategory), categoryController.suggestCategory);
router.patch("/suggestions/:id", auth(UserRole.ADMIN), validateRequest(categoryValidation.reviewSuggestion), categoryController.reviewSuggestion);
router.get("/:id", categoryController.getCategoryById);
router.post(
  "/",
  auth(UserRole.ADMIN),
  validateRequest(categoryValidation.createCategory),
  categoryController.createCategory
);
router.patch("/:id", auth(UserRole.ADMIN), validateRequest(categoryValidation.updateCategory), categoryController.updateCategory);
router.delete("/:id", auth(UserRole.ADMIN), categoryController.deleteCategory);

export const categoryRoutes = router;
