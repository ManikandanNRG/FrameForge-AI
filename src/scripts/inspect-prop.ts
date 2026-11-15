import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const prop = await prisma.productionAsset.findUnique({
    where: { id: 'cmwg5nd150009u88s5hajkivh' },
  });
  console.log('PROP:', JSON.stringify(prop, null, 2));
}

main().finally(() => prisma.$disconnect());
