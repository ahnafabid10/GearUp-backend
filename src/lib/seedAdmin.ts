import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "./prisma";

export const seedAdmin = async () => {
  const adminEmail = config.admin_email || "abidnirob10@gmail.com";
  const adminPassword = config.admin_password || "123456789";

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    const hashedPassword = await bcrypt.hash(
      adminPassword,
      Number(config.bcrypt_salt_rounds)
    );

    if (!existingAdmin) {
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

      console.log(`Default admin seeded: ${adminEmail} / ${adminPassword}`);
    } else {
      await prisma.user.update({
        where: { email: adminEmail },
        data: {
          role: UserRole.ADMIN,
          password: hashedPassword,
        },
      });
      console.log(`Admin account updated to ADMIN role: ${adminEmail}`);
    }
  } catch (error) {
    console.error("Error checking or seeding admin:", error);
  }
};
