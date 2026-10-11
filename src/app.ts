import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import config from "./config";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
import { notFound } from "./middlewares/notFound";
import { adminRoutes } from "./modules/admin/admin.route";
import { authRoutes } from "./modules/auth/auth.route";
import { categoryRoutes } from "./modules/category/category.route";
import { gearRoutes, providerGearRoutes } from "./modules/gear/gear.route";
import { paymentRoutes } from "./modules/payment/payment.route";
import { providerOrderRoutes, rentalRoutes } from "./modules/rental/rental.route";
import { reviewRoutes } from "./modules/review/review.route";
import { userRoutes } from "./modules/user/user.route";

const app: Application = express();

// Stripe webhook raw parser must precede express.json()
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));

// Standard parsers and middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: [config.app_url, "http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Health check endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "GearUp Backend API is running! 🏋️",
    status: "Healthy",
    timestamp: new Date().toISOString(),
  });
});

// Application Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/gear", gearRoutes);
app.use("/api/provider/gear", providerGearRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/provider/orders", providerOrderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

// Error handling middlewares
app.use(notFound);
app.use(globalErrorHandler);

export default app;
