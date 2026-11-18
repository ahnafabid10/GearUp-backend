import { prisma } from "./prisma";
import { UserRole } from "../../generated/prisma/enums";

export const cleanupLegacyUsers = async () => {
  try {
    const emailsToDelete = [
      "customer@gearup.com",
      "provider@gearup.com",
      "admin@example.com",
      "customer@example.com",
      "admin@gearup.com",
    ];

    const usersToDelete = await prisma.user.findMany({
      where: { email: { in: emailsToDelete } },
    });

    if (usersToDelete.length === 0) {
      console.log("No legacy users found to clean up.");
      return;
    }

    // Find provider to reassign items to (prefer abidprovider@gmail.com)
    let targetProvider = await prisma.user.findFirst({
      where: { email: "abidprovider@gmail.com" },
    });

    if (!targetProvider) {
      targetProvider = await prisma.user.findFirst({
        where: { role: UserRole.PROVIDER, NOT: { email: { in: emailsToDelete } } },
      });
    }

    const userIdsToDelete = usersToDelete.map((u) => u.id);

    if (targetProvider) {
      // Reassign all gear items from these users to target provider so products remain intact
      const updatedGear = await prisma.gearItem.updateMany({
        where: { providerId: { in: userIdsToDelete } },
        data: { providerId: targetProvider.id },
      });
      console.log(
        `Successfully preserved and reassigned ${updatedGear.count} gear items to provider: ${targetProvider.email}`
      );
    }

    // Now safely delete the requested users
    const deleted = await prisma.user.deleteMany({
      where: { email: { in: emailsToDelete } },
    });

    console.log(
      `Successfully removed ${deleted.count} legacy users from the database:`,
      emailsToDelete
    );
  } catch (err) {
    console.error("Error during legacy users cleanup:", err);
  }
};
