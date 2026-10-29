import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.OWNER_EMAIL ?? "owner@local";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: "Owner" },
  });

  // Ensure the default local media folder exists.
  const root = process.env.MEDIA_DEFAULT_ROOT ?? "./media";
  await mkdir(path.resolve(root), { recursive: true });

  // Seed one demo project so the studio isn't empty (only if none exist).
  const count = await prisma.project.count({ where: { ownerId: user.id } });
  if (count === 0) {
    await prisma.project.create({
      data: {
        ownerId: user.id,
        title: "Welcome project (demo)",
        sourceIdea:
          "A lone lighthouse keeper discovers a message in a bottle that changes everything.",
        description: "Seed demo project — edit or delete me.",
      },
    });
  }

  console.log("seed complete: owner =", user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
