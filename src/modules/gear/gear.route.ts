import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares/validateRequest";
import { gearController } from "./gear.controller";
import { gearValidation } from "./gear.validation";

const router = Router();

// Public routes
router.get("/", gearController.getAllGear);
router.get("/:id", gearController.getGearById);

export const gearRoutes = router;

// Provider specific routes (/api/provider/gear)
const providerRouter = Router();
providerRouter.use(auth(UserRole.PROVIDER, UserRole.ADMIN));
providerRouter.get("/my", gearController.getMyGear);
providerRouter.post(
  "/",
  validateRequest(gearValidation.createGear),
  gearController.createGear
);
providerRouter.put(
  "/:id",
  validateRequest(gearValidation.updateGear),
  gearController.updateGear
);
providerRouter.delete("/:id", gearController.deleteGear);

export const providerGearRoutes = providerRouter;
