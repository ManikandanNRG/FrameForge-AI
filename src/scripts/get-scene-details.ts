import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const scene1 = await prisma.scene.findFirst({
    where: { projectId: 'cmwg5nczz0001u88sld5gnrmd', sceneNumber: 1 },
    include: { shots: true },
  });
  const scene11 = await prisma.scene.findFirst({
    where: { projectId: 'cmwg5nczz0001u88sld5gnrmd', sceneNumber: 11 },
    include: { shots: true },
  });

  console.log('SCENE 1:', JSON.stringify(scene1, null, 2));
  console.log('SCENE 11:', JSON.stringify(scene11, null, 2));
}

main().finally(() => prisma.$disconnect());
