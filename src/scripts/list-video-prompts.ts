import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const shots = await prisma.shot.findMany({
    where: { scene: { projectId: 'cmwg5nczz0001u88sld5gnrmd' } },
    include: { scene: true },
    orderBy: { shotNumber: 'asc' },
  });

  for (const s of shots) {
    console.log(`=== SCENE ${s.scene.sceneNumber}: ${s.scene.heading} ===`);
    console.log(`DURATION: ${s.targetDurationSeconds}s`);
    console.log(`VIDEO PROMPT: ${s.videoPrompt}\n`);
  }
}

main().finally(() => prisma.$disconnect());
