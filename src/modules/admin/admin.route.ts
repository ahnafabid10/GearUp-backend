import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { adminController } from "./admin.controller";
import { adminValidation } from "./admin.validation";

const router = Router();

router.use(auth(UserRole.ADMIN));

router.get("/users", adminController.getAllUsers);
router.patch(
  "/users/:id",
  validateRequest(adminValidation.updateUserStatus),
  adminController.updateUserStatus
);
router.get("/gear", adminController.getAllGearListings);
router.get("/rentals", adminController.getAllRentalOrders);

export const adminRoutes = router;
