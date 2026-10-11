import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { userController } from "./user.controller";

const router = Router();

router.use(auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN));
router.get("/profile", userController.getMyProfile);
router.patch("/profile", userController.updateMyProfile);

export const userRoutes = router;
