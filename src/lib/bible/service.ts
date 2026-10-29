import { prisma } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import type { TextGenerationProvider } from "@/lib/providers/types";
import { ProductionBibleSchema } from "./schemas";

export async function extractBible(
  provider: TextGenerationProvider,
  modelId: string,
  projectId: string,
  screenplayText: string,
  jobId: string,
): Promise<void> {
  logger.info({ projectId }, "bible extraction starting");

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  const result = await provider.generateStructured({
    modelId,
    systemPrompt: `You are a production designer. Extract all production entities from this screenplay for a ${project.visualStyle.replace(/_/g, " ")} film. Return JSON only.`,
    userPrompt: `Extract characters, locations, props, and visual style notes from this screenplay:\n\n${screenplayText.slice(0, 8000)}\n\nReturn JSON matching: { characters: [{name, role, age?, appearance, wardrobe?, personality, arc?}], locations: [{name, description, lighting?, timeOfDayVariants?}], props: [{name, description, owner?}], visualStyleNotes? }`,
    schema: ProductionBibleSchema,
  });

  const bible = result.data;

  // Save characters
  for (const c of bible.characters) {
    await prisma.productionAsset.create({
      data: {
        projectId,
        assetType: "CHARACTER",
        name: c.name,
        description: c.appearance,
        attributes: JSON.stringify({ role: c.role, age: c.age, wardrobe: c.wardrobe, personality: c.personality, arc: c.arc }),
        approvalStatus: "DRAFT",
      },
    });
  }

  // Save locations
  for (const l of bible.locations) {
    await prisma.productionAsset.create({
      data: {
        projectId,
        assetType: "LOCATION",
        name: l.name,
        description: l.description,
        attributes: JSON.stringify({ lighting: l.lighting, timeOfDayVariants: l.timeOfDayVariants }),
        approvalStatus: "DRAFT",
      },
    });
  }

  // Save props
  for (const p of bible.props ?? []) {
    await prisma.productionAsset.create({
      data: {
        projectId,
        assetType: "PROP",
        name: p.name,
        description: p.description,
        attributes: JSON.stringify({ owner: p.owner }),
        approvalStatus: "DRAFT",
      },
    });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { currentStage: "BIBLE" },
  });

  logger.info({ projectId }, "bible extraction complete");
}
