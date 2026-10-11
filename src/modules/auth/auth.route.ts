import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { auth } from "../../middlewares/auth";
import { authController } from "./auth.controller";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.get(
  "/me",
  auth(UserRole.CUSTOMER, UserRole.PROVIDER, UserRole.ADMIN),
  authController.getMe
);

export const authRoutes = router;
