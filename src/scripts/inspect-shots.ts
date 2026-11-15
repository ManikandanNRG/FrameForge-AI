import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shots = await prisma.shot.findMany({
    where: { scene: { projectId: 'cmwg5nczz0001u88sld5gnrmd' } },
    include: { scene: true },
    orderBy: { shotNumber: 'asc' },
  });

  for (const s of shots) {
    console.log(`=== Scene ${s.scene.sceneNumber} (Shot ${s.shotNumber}) ===`);
    console.log(`ACTION: ${s.actionDescription}`);
    console.log(`STILL PROMPT: ${s.imagePrompt}\n`);
  }
}

main().finally(() => prisma.$disconnect());
