import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { StoryOptionSchema } from "@/lib/story/schemas";

const selectOptionSchema = z.object({
  option: StoryOptionSchema,
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { projectId } = await ctx.params;

  const project = await prisma.project.findUnique({ where: { id: projectId as string } });
  if (!project) throw notFound("Project not found");
  if (project.ownerId !== ownerId) throw forbidden();

  const body = await req.json().catch(() => ({}));
  const parsed = selectOptionSchema.safeParse(body);
  if (!parsed.success) throw badRequest("Invalid option data");

  const option = parsed.data.option;

  // 1. Update Project Title
  await prisma.project.update({
    where: { id: projectId as string },
    data: {
      title: option.title,
      description: option.logline,
    },
  });

  // 2. Save LOGLINE and PREMISE artifacts
  const loglineArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "LOGLINE" } },
    create: { projectId: projectId as string, artifactType: "LOGLINE", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const loglineCount = await prisma.artifactVersion.count({ where: { artifactId: loglineArt.id } });
  const loglineVer = await prisma.artifactVersion.create({
    data: {
      artifactId: loglineArt.id,
      versionNumber: loglineCount + 1,
      contentText: option.logline,
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: loglineArt.id },
    data: { currentVersionId: loglineVer.id },
  });

  const premiseArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "PREMISE" } },
    create: { projectId: projectId as string, artifactType: "PREMISE", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const premiseCount = await prisma.artifactVersion.count({ where: { artifactId: premiseArt.id } });
  const premiseVer = await prisma.artifactVersion.create({
    data: {
      artifactId: premiseArt.id,
      versionNumber: premiseCount + 1,
      contentText: option.premise,
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: premiseArt.id },
    data: { currentVersionId: premiseVer.id },
  });

  // 3. Save SCREENPLAY artifact
  const screenplayJson = {
    title: option.title,
    scenes: option.scenes,
    totalEstimatedDurationSeconds: option.scenes.reduce((acc, sc) => acc + (sc.estimatedDurationSeconds || 8), 0),
  };

  const screenplayArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "SCREENPLAY" } },
    create: { projectId: projectId as string, artifactType: "SCREENPLAY", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const spCount = await prisma.artifactVersion.count({ where: { artifactId: screenplayArt.id } });
  const spVer = await prisma.artifactVersion.create({
    data: {
      artifactId: screenplayArt.id,
      versionNumber: spCount + 1,
      contentText: JSON.stringify(screenplayJson, null, 2),
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: screenplayArt.id },
    data: { currentVersionId: spVer.id },
  });

  // 4. Save SYNOPSIS artifact
  const synopsisText = `CREATIVE ANGLE: ${option.conceptAngle}
TITLE: ${option.title}

LOGLINE:
${option.logline}

PREMISE:
${option.premise}

NARRATIVE SUMMARY:
${option.scenes
  .map(
    (s) =>
      `• Scene ${s.sceneNumber} (${s.heading}): ${s.action} ${
        s.dialogue ? `[Dialogue: ${s.dialogue}]` : ""
      }`
  )
  .join("\n\n")}

PRODUCTION VISION:
A cinematic visual short set in ${project.visualStyle.replace(/_/g, " ")}, featuring authentic ${project.storyLanguage} dialogue and dynamic pacing.`;

  const synopsisArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "SYNOPSIS" } },
    create: { projectId: projectId as string, artifactType: "SYNOPSIS", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const synCount = await prisma.artifactVersion.count({ where: { artifactId: synopsisArt.id } });
  const synVer = await prisma.artifactVersion.create({
    data: {
      artifactId: synopsisArt.id,
      versionNumber: synCount + 1,
      contentText: synopsisText,
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: synopsisArt.id },
    data: { currentVersionId: synVer.id },
  });

  // 5. Save OUTLINE artifact (3-Act Dramatic Structure)
  const act1Scenes = option.scenes.slice(0, 2);
  const act2Scenes = option.scenes.slice(2, 4);
  const act3Scenes = option.scenes.slice(4);

  const outlineJson = {
    acts: [
      {
        actNumber: 1,
        title: "Act I — The Hook & Inciting Event",
        summary: act1Scenes.map((s) => s.action).join(" "),
        sequences: act1Scenes.map((s) => `Scene ${s.sceneNumber}: ${s.heading}`),
      },
      {
        actNumber: 2,
        title: "Act II — Rising Stakes & Confrontation",
        summary: act2Scenes.map((s) => s.action).join(" "),
        sequences: act2Scenes.map((s) => `Scene ${s.sceneNumber}: ${s.heading}`),
      },
      {
        actNumber: 3,
        title: "Act III — Climax & Viral Resolution",
        summary: act3Scenes.map((s) => s.action).join(" "),
        sequences: act3Scenes.map((s) => `Scene ${s.sceneNumber}: ${s.heading}`),
      },
    ],
    estimatedRuntimeMinutes: Math.max(1, Math.round(screenplayJson.totalEstimatedDurationSeconds / 60)),
  };

  const outlineArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "OUTLINE" } },
    create: { projectId: projectId as string, artifactType: "OUTLINE", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const outCount = await prisma.artifactVersion.count({ where: { artifactId: outlineArt.id } });
  const outVer = await prisma.artifactVersion.create({
    data: {
      artifactId: outlineArt.id,
      versionNumber: outCount + 1,
      contentText: JSON.stringify(outlineJson, null, 2),
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: outlineArt.id },
    data: { currentVersionId: outVer.id },
  });

  // 6. Extract Characters & Save CHARACTER_ARCS artifact + Production Assets
  const charMap = new Map<string, { role: string; scenes: string[] }>();
  for (const sc of option.scenes) {
    const matches = (sc.action + " " + (sc.dialogue || "")).match(/\[@([A-Za-z0-9_-]+)\]/g) || [];
    for (const m of matches) {
      const name = m.replace(/\[@|\]/g, "");
      if (!charMap.has(name)) {
        charMap.set(name, {
          role: charMap.size === 0 ? "Protagonist" : "Supporting",
          scenes: [sc.heading],
        });
      } else {
        charMap.get(name)!.scenes.push(sc.heading);
      }
    }
  }

  // Fallback characters if none tagged
  if (charMap.size === 0) {
    charMap.set("Protagonist", { role: "Protagonist", scenes: ["Main Story World"] });
  }

  const charArcsJson = {
    characters: Array.from(charMap.entries()).map(([name, info]) => ({
      name,
      role: info.role,
      arc: `Experiences the primary story beats across ${info.scenes.length} scenes, driving the action in ${info.scenes[0] || "the film"}.`,
    })),
  };

  const charArcArt = await prisma.storyArtifact.upsert({
    where: { projectId_artifactType: { projectId: projectId as string, artifactType: "CHARACTER_ARCS" } },
    create: { projectId: projectId as string, artifactType: "CHARACTER_ARCS", approvalStatus: "DRAFT" },
    update: { approvalStatus: "DRAFT" },
  });
  const arcCount = await prisma.artifactVersion.count({ where: { artifactId: charArcArt.id } });
  const arcVer = await prisma.artifactVersion.create({
    data: {
      artifactId: charArcArt.id,
      versionNumber: arcCount + 1,
      contentText: JSON.stringify(charArcsJson, null, 2),
      source: "AI",
      createdByUserId: ownerId,
    },
  });
  await prisma.storyArtifact.update({
    where: { id: charArcArt.id },
    data: { currentVersionId: arcVer.id },
  });

  // Auto-create character assets in Production Bible so Step 2 (Assets) is immediately populated!
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

  const isGhibli =
    project.visualStyle === "GHIBLI_ANIME" ||
    project.visualStyle === "GHIBLI" ||
    (project.sourceIdea || "").toLowerCase().includes("ghibli") ||
    (project.sourceIdea || "").toLowerCase().includes("zibly");

  const isCartoon = project.visualStyle === "CARTOON_2D";
  const is3DAnim = project.visualStyle === "ANIMATION_3D" || project.visualStyle === "KIDS_3D_ANIMATION";

  for (const [name, info] of Array.from(charMap.entries())) {
    const existingAsset = await prisma.productionAsset.findFirst({
      where: { projectId: projectId as string, name },
    });
    if (!existingAsset) {
      const wardrobeDesc = isCulinary
        ? "Clean professional chef attire, natural linen rolled-up sleeves, trimmed clean nails, precise knife grip."
        : isVintage
        ? "Authentic 1900s traditional hand-spun unbleached khadi attire (strictly no modern machine-stitched collared shirts, t-shirts, or synthetic fabrics)."
        : isGhibli
        ? "Charming whimsical attire with soft natural textures, colorful playful suspenders or sweater, comfortable sports shoes or barefoot in grass."
        : isCartoon
        ? "Bright colorful cartoon clothing with clean graphic shapes and cheerful friendly colors."
        : "Authentic traditional regional attire matching the story era and culture.";

      const charPrompt = isCulinary
        ? `Ultra-photorealistic portrait of ${name} (Chef hands preparing ingredients, rolled-up linen shirt sleeves, precise confident grip, warm directional kitchen lighting).`
        : isVintage
        ? `Authentic 1900s vintage 35mm archival photographic portrait of ${name}, natural sepia and muted earth tones, period-accurate hand-spun khadi garments, soft vintage depth of field.`
        : isGhibli
        ? `Charming Studio Ghibli style anime portrait of ${name}, expressive lively eyes, warm friendly smile, soft watercolor textures, lush pastoral green meadow and blue sky background, Hayao Miyazaki aesthetic.`
        : isCartoon
        ? `Cute and colorful 2D children's storybook cartoon character portrait of ${name}, bright bold outlines, cheerful expressive eyes, vibrant sunny background.`
        : is3DAnim
        ? `Vibrant Pixar-quality 3D animated character portrait of ${name}, soft warm studio lighting, playful stylized features, bouncy cheerful expression.`
        : `Photorealistic cinematic character portrait of ${name}, authentic cultural features, detailed skin texture, natural expressive eyes, high production value 35mm film still.`;

      const attributes = {
        role: info.role,
        age: name.toLowerCase().includes("boy") || name.toLowerCase().includes("karthi") || name.toLowerCase().includes("kavin") || isGhibli || isCartoon ? 8 : 35,
        wardrobe: wardrobeDesc,
        googleFlowCharacterPrompt: charPrompt,
        voiceProfile: isCulinary
          ? "Pure ambient culinary Foley (no spoken dialogue)."
          : isGhibli || isCartoon || is3DAnim
          ? `Bright, cheerful, and energetic voice for young children (warm melodic tone, joyful pacing).`
          : `Authentic ${project.storyLanguage} native speaker, natural conversational cadence, expressive emotional range.`,
      };
      await prisma.productionAsset.create({
        data: {
          projectId: projectId as string,
          name,
          assetType: "CHARACTER",
          description: `${info.role} in ${option.title}`,
          attributes: JSON.stringify(attributes),
          approvalStatus: "APPROVED",
        },
      });
    }
  }

  // 7. Synchronize Database Scenes and Shots with Dynamic Multi-Angle Camera Coverage
  await prisma.scene.deleteMany({ where: { projectId: projectId as string } });

  const CULINARY_CAMERA_ROTATION = [
    { shotSize: "Wide Shot", cameraAngle: "Eye-Level", cameraMovement: "Slow cinematic establishing push-in across kitchen workstation, showcasing mise en place" },
    { shotSize: "Top-Down (Bird's Eye Flat Lay)", cameraAngle: "90° Overhead", cameraMovement: "Overhead static framing with subtle floating drift over cutting board" },
    { shotSize: "Macro Extreme Close-Up (ECU)", cameraAngle: "Low 45-Degree", cameraMovement: "Macro 85mm probe lens tracking knife edge slicing cleanly through fresh ingredient, f/1.8 shallow DOF" },
    { shotSize: "Close-Up", cameraAngle: "Low-Angle Pan", cameraMovement: "Low-angle dynamic slide as sizzling oil shimmers and aromatic steam billows in hot pan" },
    { shotSize: "Medium Shot (Chef POV)", cameraAngle: "Over-the-Shoulder First-Person", cameraMovement: "First-person chef hands perspective actively cooking, tossing, and basting with spoon" },
    { shotSize: "Macro Extreme Close-Up (ECU)", cameraAngle: "High 45-Degree", cameraMovement: "Macro close-up on simmering reduction with glistening bubbles bursting at 60fps" },
    { shotSize: "Close-Up (Plating)", cameraAngle: "30-Degree Orbit", cameraMovement: "Smooth orbital pan around completed dish on dark slate, delicate garnish placement" },
    { shotSize: "Macro Extreme Close-Up (ECU)", cameraAngle: "Low 45-Degree", cameraMovement: "Macro slow-motion cross-section cut revealing tender juicy interior and crispy crust" },
  ];

  const KIDS_ANIMATION_CAMERA_ROTATION = [
    { shotSize: "Wide Establishing Shot", cameraAngle: "High-Angle Jib", cameraMovement: "Slow majestic jib descent revealing lush vibrant green meadow, blooming wildflowers, and children's sports arena under bright sunny skies" },
    { shotSize: "Dynamic Medium Tracking", cameraAngle: "Low-Angle Track", cameraMovement: "Energetic low-angle camera tracking alongside character in joyful motion, 24fps fluid animation" },
    { shotSize: "Close-Up", cameraAngle: "Eye-Level", cameraMovement: "Warm intimate close-up on character's beaming joyful expression and sparkling eyes with soft golden sunlight rim" },
    { shotSize: "Extreme Action Close-Up", cameraAngle: "Dynamic Tilt", cameraMovement: "Playful focal push-in on sports equipment and action in motion with whimsical wind swirls" },
    { shotSize: "Wide Panoramic Shot", cameraAngle: "Low-Angle Pan", cameraMovement: "Sweeping upward pan toward azure sky with billowy white clouds and cheering friends" },
  ];

  const STANDARD_DYNAMIC_ROTATION = [
    { shotSize: "Wide Shot", cameraAngle: "Eye-Level", cameraMovement: "Smooth cinematic establishing tracking shot forward at 24fps" },
    { shotSize: "Medium Shot", cameraAngle: "Eye-Level", cameraMovement: "Dynamic lateral tracking shot moving alongside character at 24fps" },
    { shotSize: "Close-Up", cameraAngle: "Low-Angle", cameraMovement: "Low-angle backward tracking shot facing character torso and facial emotion" },
    { shotSize: "Extreme Close-Up", cameraAngle: "Dutch Angle", cameraMovement: "Intense focal push-in on character eyes and active physical prop" },
    { shotSize: "Medium-Close Shot", cameraAngle: "Over-the-Shoulder", cameraMovement: "Over-the-shoulder handheld floating camera motion at 24fps" },
    { shotSize: "Wide Panoramic Shot", cameraAngle: "High-Angle Crane", cameraMovement: "High-angle slow jib tilt-down revealing atmospheric environment" },
  ];

  const cameraRotation = isCulinary
    ? CULINARY_CAMERA_ROTATION
    : isGhibli || isCartoon || is3DAnim
    ? KIDS_ANIMATION_CAMERA_ROTATION
    : STANDARD_DYNAMIC_ROTATION;

  for (const sc of option.scenes) {
    const scene = await prisma.scene.create({
      data: {
        projectId: projectId as string,
        sceneNumber: sc.sceneNumber,
        heading: sc.heading,
        location: sc.location,
        timeOfDay: sc.timeOfDay,
        actionSummary: sc.action.slice(0, 255),
        estimatedDurationSeconds: sc.estimatedDurationSeconds || 8,
      },
    });

    // Create primary shot for the scene with dynamic camera framing
    let charTag = "";
    let charName = "";
    const tagMatch = sc.action.match(/\[@([A-Za-z0-9_-]+)\]/) || (sc.dialogue && sc.dialogue.match(/\[@([A-Za-z0-9_-]+)\]/));
    if (tagMatch) {
      charTag = `[@${tagMatch[1]}]`;
      charName = tagMatch[1];
    }

    const audioPayload = {
      dialogue: isCulinary ? "" : (sc.dialogue || ""),
      voiceover: isCulinary ? "" : (sc.voiceover || ""),
      audioPrompt: sc.audioScript || "",
      characterTag: charTag,
      characterName: charName,
    };

    const camPreset = cameraRotation[(sc.sceneNumber - 1) % cameraRotation.length];

    await prisma.shot.create({
      data: {
        projectId: projectId as string,
        sceneId: scene.id,
        shotNumber: sc.sceneNumber,
        actionDescription: sc.action,
        shotSize: camPreset.shotSize,
        cameraAngle: camPreset.cameraAngle,
        cameraMovement: camPreset.cameraMovement,
        lighting: isCulinary
          ? "Warm culinary studio lighting, soft key illumination on workstation, appetizing natural food glistening"
          : isVintage
          ? "Warm natural historical lighting, soft dust motes, period ambience"
          : "Warm cinematic natural lighting, soft shadows",
        targetDurationSeconds: sc.estimatedDurationSeconds || 8,
        negativeConstraints: JSON.stringify(audioPayload),
      },
    });
  }

  return {
    ok: true,
    screenplay: screenplayJson,
  };
});

