import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { gearController } from "./gear.controller";

const router = Router();

// Public routes
router.get("/", gearController.getAllGear);
router.get("/:id", gearController.getGearById);

export const gearRoutes = router;

// Provider specific routes (/api/provider/gear)
const providerRouter = Router();
providerRouter.use(auth(UserRole.PROVIDER, UserRole.ADMIN));
providerRouter.get("/my", gearController.getMyGear);
providerRouter.post("/", gearController.createGear);
providerRouter.put("/:id", gearController.updateGear);
providerRouter.delete("/:id", gearController.deleteGear);

export const providerGearRoutes = providerRouter;
