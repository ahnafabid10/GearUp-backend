import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  app_url: process.env.APP_URL || "http://localhost:3000",
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET || "gearup_jwt_access_secret_key_12345",
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET || "gearup_jwt_refresh_secret_key_12345",
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "1d",
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  stripe_secret_key: process.env.STRIPE_SECRET_KEY || "",
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || ""
};
