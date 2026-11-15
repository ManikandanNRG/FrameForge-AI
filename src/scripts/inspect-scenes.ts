import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const scenes = await prisma.scene.findMany({
    where: { projectId: 'cmwg5nczz0001u88sld5gnrmd' },
    include: { shots: true },
    orderBy: { sceneNumber: 'asc' },
  });

  for (const sc of scenes) {
    console.log(`Scene ${sc.sceneNumber}: ${sc.title}`);
    for (const sh of sc.shots) {
      console.log(`  Shot ${sh.shotNumber}: ${sh.actionDescription?.slice(0, 100)}...`);
    }
  }
}

main().finally(() => prisma.$disconnect());
