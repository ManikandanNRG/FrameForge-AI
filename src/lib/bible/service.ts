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
    systemPrompt: `You are an elite film production designer and character artist creating the definitive Visual Consistency Bible for a ${project.visualStyle.replace(/_/g, " ")} film.
For modern AI video tools (such as Google Flow, Veo, Kling, and Sora), character consistency requires extremely precise, unwavering physical descriptions that can be copied into every single shot's prompt to ensure the same actor/character appears.
Return JSON only.`,
    userPrompt: `Extract all characters, locations, key props, and visual style notes from this screenplay:

Screenplay:
${screenplayText.slice(0, 8000)}

For each CHARACTER provide:
- name: Character name (e.g. Murugan)
- role: Protagonist / Antagonist / Supporting
- age: Estimated age (e.g. 48)
- appearance: An ultra-detailed physical description for AI consistency (exact regional heritage/ethnicity, skin tone, facial hair, eye color, facial wrinkles/features, physical build, distinguishing marks)
- wardrobe: EXACT clothing itemization that stays consistent throughout the film (specific garments, exact colors, fabrics, wear & tear, accessories, footwear)
- personality: Demeanor, physical posture, vocal cadence

For each LOCATION provide:
- name: Location name
- description: Detailed architectural, environmental, and terrain description
- lighting: Signature natural or atmospheric lighting quality

For each PROP provide:
- name: Prop name
- description: Physical appearance, materials, and significance
- owner: Character who uses it

Return JSON matching: { characters: [{name, role, age, appearance, wardrobe, personality, arc?}], locations: [{name, description, lighting, timeOfDayVariants?}], props: [{name, description, owner?}], visualStyleNotes? }`,
    schema: ProductionBibleSchema,
  });

  const bible = result.data;

  // Clear previous draft assets for clean regeneration
  await prisma.productionAsset.deleteMany({ where: { projectId } });

  // Save characters with locked consistency anchor
  for (const c of bible.characters) {
    const consistencyAnchor = `${c.name}: ${c.appearance}. Wardrobe: ${c.wardrobe || "traditional"}. Demeanor: ${c.personality}.`;

    await prisma.productionAsset.create({
      data: {
        projectId,
        assetType: "CHARACTER",
        name: c.name,
        description: c.appearance,
        attributes: JSON.stringify({
          role: c.role,
          age: c.age,
          wardrobe: c.wardrobe,
          personality: c.personality,
          arc: c.arc,
          consistencyAnchor,
        }),
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
