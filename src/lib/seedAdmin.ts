import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "./prisma";

export const seedAdmin = async () => {
  const adminEmail = "admin@gearup.com";
  const adminPassword = "admin123";

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(
        adminPassword,
        Number(config.bcrypt_salt_rounds)
      );

      await prisma.user.create({
        data: {
          name: "GearUp Super Admin",
          email: adminEmail,
          password: hashedPassword,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          phone: "+1234567890",
          address: "GearUp Headquarter",
        },
      });

      console.log("Default admin seeded: admin@gearup.com / admin123");
    }
  } catch (error) {
    console.error("Error checking or seeding admin:", error);
  }
};
