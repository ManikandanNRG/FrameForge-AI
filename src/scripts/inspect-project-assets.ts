import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmwg5nczz0001u88sld5gnrmd';
  const assets = await prisma.productionAsset.findMany({
    where: { projectId },
  });
  console.log('ASSETS:', JSON.stringify(assets.map(a => ({ id: a.id, name: a.name, assetType: a.assetType })), null, 2));

  const scenes = await prisma.scene.findMany({
    where: { projectId },
    include: { shots: true },
    orderBy: { sceneNumber: 'asc' },
  });
  console.log(`Found ${scenes.length} scenes.`);
  for (const s of scenes) {
    console.log(`Scene ${s.sceneNumber} (${s.id}): ${s.heading} - ${s.shots.length} shots`);
  }
}

main().finally(() => prisma.$disconnect());
