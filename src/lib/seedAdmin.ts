import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "./prisma";

export const seedAdmin = async () => {
  const adminsToSeed = [
    {
      email: config.admin_email || "admin@rentnest.com",
      password: config.admin_password || "admin123",
      name: "GearUp Platform Admin",
    },
    {
      email: "admin@rentnest.com",
      password: "admin123",
      name: "GearUp Platform Admin",
    },
    {
      email: "abidnirob10@gmail.com",
      password: "123456789",
      name: "GearUp Super Admin",
    },
  ];

  const processed = new Set<string>();

  for (const item of adminsToSeed) {
    if (processed.has(item.email)) continue;
    processed.add(item.email);

    try {
      const existingAdmin = await prisma.user.findUnique({
        where: { email: item.email },
      });

      const hashedPassword = await bcrypt.hash(
        item.password,
        Number(config.bcrypt_salt_rounds || 10)
      );

      if (!existingAdmin) {
        await prisma.user.create({
          data: {
            name: item.name,
            email: item.email,
            password: hashedPassword,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            phone: "+1234567890",
            address: "GearUp Headquarter",
          },
        });

        console.log(`Default admin seeded: ${item.email} / ${item.password}`);
      } else {
        await prisma.user.update({
          where: { email: item.email },
          data: {
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            password: hashedPassword,
          },
        });
        console.log(`Admin account updated to ADMIN role: ${item.email}`);
      }
    } catch (error) {
      console.error(`Error checking or seeding admin ${item.email}:`, error);
    }
  }
};
