import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = process.argv[2] || 'cmwja2y3t0001u8qgfh5w3gtj';
  const shots = await prisma.shot.findMany({
    where: { projectId },
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
