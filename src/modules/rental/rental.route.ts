import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { rentalController } from "./rental.controller";

const router = Router();

router.post("/", auth(UserRole.CUSTOMER), rentalController.createRentalOrder);
router.get("/", auth(UserRole.CUSTOMER), rentalController.getCustomerRentals);
router.get(
  "/:id",
  auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN),
  rentalController.getRentalById
);
router.patch("/:id/cancel", auth(UserRole.CUSTOMER), rentalController.cancelRentalOrder);

export const rentalRoutes = router;

// Provider order routes (/api/provider/orders)
const providerOrderRouter = Router();
providerOrderRouter.use(auth(UserRole.PROVIDER, UserRole.ADMIN));
providerOrderRouter.get("/", rentalController.getProviderOrders);
providerOrderRouter.patch("/:id", rentalController.updateOrderStatus);

export const providerOrderRoutes = providerOrderRouter;
