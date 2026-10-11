import "dotenv/config";
import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";
import { seedAdmin } from "./lib/seedAdmin";

const PORT = config.port;

async function main() {
  try {
    await prisma.$connect();
    console.log("Connected to the PostgreSQL database successfully.");

    // Ensure default working admin account exists
    await seedAdmin();

    const server = app.listen(PORT, () => {
      console.log(`🚀 GearUp Server is running on port ${PORT}`);
    });

    const exitHandler = async () => {
      if (server) {
        server.close(async () => {
          console.log("Server closed.");
          await prisma.$disconnect();
          process.exit(0);
        });
      } else {
        await prisma.$disconnect();
        process.exit(0);
      }
    };

    process.on("SIGTERM", exitHandler);
    process.on("SIGINT", exitHandler);
  } catch (error) {
    console.error("Error starting the server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
