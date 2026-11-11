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

  const isCulinary =
    project.visualStyle === "CULINARY_MACRO_ASMR" ||
    (project.sourceIdea || "").toLowerCase().includes("cook") ||
    (project.sourceIdea || "").toLowerCase().includes("cooking") ||
    (project.sourceIdea || "").toLowerCase().includes("asmr") ||
    (project.sourceIdea || "").toLowerCase().includes("culinary") ||
    (project.sourceIdea || "").toLowerCase().includes("recipe") ||
    (project.genre || "").toLowerCase().includes("cooking") ||
    (project.genre || "").toLowerCase().includes("culinary");

  const isVintage =
    !isCulinary &&
    (project.visualStyle === "VINTAGE_FILM" ||
      (project.sourceIdea || "").toLowerCase().includes("1900") ||
      (project.sourceIdea || "").toLowerCase().includes("vintage") ||
      (project.sourceIdea || "").toLowerCase().includes("old years") ||
      (project.genre || "").toLowerCase().includes("historical") ||
      (project.genre || "").toLowerCase().includes("period"));

  const result = await provider.generateStructured({
    modelId,
    systemPrompt: `You are an elite film production designer, costume historian, and character artist creating the definitive Visual Consistency Bible for a film.
Film Title: "${project.title}"
Film Source Idea & Premise: "${project.sourceIdea}"
Visual Style: ${project.visualStyle.replace(/_/g, " ")} | Genre: ${project.genre || "Unspecified"} | Tone: ${project.tone || "Unspecified"}

For modern AI video tools (such as Google Flow, Veo, Kling, and Sora), character consistency requires extremely precise, unwavering physical descriptions that can be copied into every single shot's prompt to ensure the same actor/character appears.
Return JSON only.`,
    userPrompt: `Extract all characters, locations, key props, and visual style notes from this screenplay:

Film Idea & Historical Era: "${project.sourceIdea}"
Visual Style: "${project.visualStyle}"

Screenplay:
${screenplayText.slice(0, 8000)}

${isCulinary ? `CRITICAL CULINARY WORKSTATION & ASMR CONTINUITY DIRECTIVES:
- For CHARACTER: Define the Chef / Cook focusing on their hands and physical presence: clean chef hands with trimmed nails, rolled-up linen shirt sleeves, confident precise knife grip.
- For LOCATION: Define the Master Kitchen Workstation with unwavering architectural and surface details: Heavy end-grain walnut cutting board, seasoned cast-iron skillet, clean stone countertop, warm recessed directional spotlighting, soft herbal background shelves.
- For PROPS: Define key culinary tools with exact materials: Japanese Damascus steel chef knife with octagonal dark walnut handle, seasoned cast iron skillet with curved ergonomic handle.
` : `CRITICAL PERIOD & WARDROBE AUTHENTICITY DIRECTIVES:
1. STRICT HISTORICAL TIME-PERIOD ACCURACY:
   - Check the Film Idea & Historical Era carefully! If it specifies a historical period (e.g. "1900 years (vintage)", ancient, medieval, pre-independence colonial era): ALL characters' wardrobes, fabrics, accessories, and hairstyles MUST be 100% period-accurate to that exact era and geographic culture.
   - For 1900s South India / Tamil Nadu (Pudukkottai): Characters (including children) must wear authentic hand-spun unbleached khadi dhotis, veshti, angavastram, unstitched traditional cotton cloths, or traditional sarees.
   - STRICTLY PROHIBIT modern machine-stitched collared shirts, modern t-shirts, jeans, synthetic pants, sneakers, or contemporary 21st-century clothing! A boy in 1900s Tamil Nadu would wear a simple handloom veshti/mundu or bare torso with sacred thread/amulet, NEVER a modern buttoned western shirt!
`}
For each CHARACTER provide:
- name: Single-word or standard character name (e.g. Ayyanar, Yazhini, Chef) suitable for @mentions in Google Flow
- role: Protagonist / Antagonist / Supporting
- age: Estimated age (e.g. 10 for a child, 70 for an elderly artisan, 30 for chef)
- appearance: An ultra-detailed physical description tailored STRICTLY to this character's true age, gender, and regional heritage (skin tone, hair length/style, physical build, chef hands). NEVER copy or borrow traits from examples!
- wardrobe: EXACT clothing itemization matching their age, role, historical period, or culinary context (e.g., if 1900s: traditional handloom khadi veshti; if culinary: clean chef linen shirt with rolled sleeves)
- personality: Demeanor, physical posture, vocal cadence
- googleFlowCharacterPrompt: A standalone character generation prompt formatted specifically to paste into Google Flow's "Characters" side menu to create the character model matching the film's visual style (${project.visualStyle})
- voiceProfile: Precise voice directing instructions (or "Pure ASMR Foley, no spoken voice" for cooking ASMR)

For each LOCATION provide:
- name: Location name
- description: Detailed architectural, environmental, and terrain description matching the historical period or master culinary kitchen workstation
- lighting: Signature natural or atmospheric lighting quality

For each PROP provide:
- name: Prop name
- description: Physical appearance, materials, and significance (e.g. Damascus chef knife, seasoned cast iron pan, or historical bronze/clay)
- owner: Character who uses it

Return JSON matching: { characters: [{name, role, age, appearance, wardrobe, personality, arc?, googleFlowCharacterPrompt?, voiceProfile?}], locations: [{name, description, lighting, timeOfDayVariants?}], props: [{name, description, owner?}] }`,
    schema: ProductionBibleSchema,
  });

  const bible = result.data;

  // Clear previous draft assets for clean regeneration
  await prisma.productionAsset.deleteMany({ where: { projectId } });

  const defaultStyleSuffix = isCulinary
    ? "Ultra-high-definition macro culinary cinema, warm directional lighting, clean chef hands with rolled sleeves, appetizing natural textures."
    : isVintage
    ? "Authentic 1900s vintage 35mm archival photographic portrait, natural sepia and earth tones, period-accurate hand-spun khadi garments."
    : "Photorealistic cinematic portrait, soft natural daylight.";

  // Save characters with locked consistency anchor and Google Flow setup
  for (const c of bible.characters) {
    const consistencyAnchor = `${c.name}: ${c.appearance}. Wardrobe: ${c.wardrobe || (isVintage ? "authentic 1900s traditional khadi" : "traditional")}. Demeanor: ${c.personality}.`;
    const cleanTag = `@${c.name.replace(/[^a-zA-Z0-9]/g, "")}`;

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
          characterTag: cleanTag,
          googleFlowCharacterPrompt: c.googleFlowCharacterPrompt || `${c.name}, ${c.appearance}, wearing ${c.wardrobe || (isVintage ? "authentic 1900s hand-spun khadi attire" : "traditional attire")}. ${defaultStyleSuffix}`,
          voiceProfile: c.voiceProfile || `Authentic ${project.storyLanguage || "regional"} voice, natural cadence.`,
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
