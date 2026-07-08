import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

async function main() {
  const connectionString = process.env.DATABASE_URL ?? "postgresql://vibeathon:change-me@localhost:5432/vibeathon";
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
  
  try {
    const contents = await prisma.siteContent.findMany();
    console.log("Database site content overrides:");
    console.log(JSON.stringify(contents, null, 2));
  } catch (err) {
    console.error("Error querying database:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
