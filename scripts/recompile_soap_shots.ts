import { PrismaClient } from '@prisma/client';
import { compileCinematicPrompt } from '../src/lib/story/prompt-compiler';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmwn17qi30001u8i4fd1pgibh';
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      scenes: {
        orderBy: { sceneNumber: 'asc' },
        include: { shots: { orderBy: { shotNumber: 'asc' } } }
      }
    }
  });

  if (!project) {
    console.error('Project not found');
    return;
  }

  console.log(`Recompiling shots for project: ${project.title}`);

  for (const scene of project.scenes) {
    console.log(`\n=== Scene ${scene.sceneNumber}: ${scene.actionSummary.substring(0, 50)}... ===`);
    for (const shot of scene.shots) {
      const compiled = compileCinematicPrompt({
        actionDescription: shot.actionDescription,
        cameraMovement: shot.cameraMovement,
        shotSize: shot.shotSize === 'CLOSE_UP' ? 'Close-Up' : shot.shotSize === 'EXTREME_CLOSE_UP' ? 'Extreme Close-Up' : shot.shotSize === 'WIDE' ? 'Wide Angle' : 'Medium Shot',
        lighting: shot.lighting || 'Commercial hotel kitchen lighting, roaring gas burner flame reflections',
        locationDescription: scene.location,
        characterName: 'Master Parotta Chef',
        characterDescription: 'Tamil hotel parotta master in white banyan vest, swift rhythmic arms',
        heroObject: 'Unbranded Tamil Market Laundry & Bath Soaps',
        visualStyle: 'CULINARY_MACRO_ASMR',
        sourceIdea: project.description || 'ASMR Inedible Soap Cooking Madurai Kothu Parotta',
        genre: 'inedible cooking',
        tone: 'hypnotic ASMR hotel street food',
        aspectRatio: '16:9',
        targetDurationSeconds: 5,
        creditSaverMode: true
      });

      await prisma.shot.update({
        where: { id: shot.id },
        data: {
          imagePrompt: compiled.fluxStillPrompt,
          videoPrompt: compiled.klingPrompt,
          negativeConstraints: JSON.stringify(compiled.universalNegativePrompt)
        }
      });

      console.log(`  Shot ${shot.shotNumber} recompiled.`);
      console.log(`  FLUX Still Prompt:\n${compiled.fluxStillPrompt}\n`);
    }
  }

  console.log('All 9 shots recompiled and updated in DB successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
