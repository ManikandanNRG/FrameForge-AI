import { z } from "zod";
import { apiHandler } from "@/lib/api/handler";
import { badRequest, forbidden, notFound } from "@/lib/errors";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";
import { generateSocialLaunchKit } from "@/lib/story/launch-kit";
import { compileCinematicPrompt } from "@/lib/story/prompt-compiler";
import { detectPhysicalEntities } from "@/lib/story/world-engine";

const createEpisodeSchema = z.object({
  title: z.string().min(1).max(200),
  sourceIdea: z.string().min(1).max(5000),
  studioEnvironment: z.string().max(500).optional(),
  chefWardrobeOverride: z.string().max(500).optional(),
  runtimeSeconds: z.number().int().min(15).max(7200).optional(),
});

export const POST = apiHandler(async (req, ctx) => {
  const ownerId = await requireUserId();
  const { seriesId } = await ctx.params;
  const series = await prisma.series.findUnique({
    where: { id: seriesId as string },
    include: {
      episodes: {
        orderBy: { episodeNumber: "desc" },
        take: 1,
      },
    },
  });

  if (!series) throw notFound("Series not found");
  if (series.ownerId !== ownerId) throw forbidden();

  const body = await req.json();
  const parsed = createEpisodeSchema.safeParse(body);
  if (!parsed.success) {
    throw badRequest("Invalid episode data", parsed.error.issues);
  }

  const latestEpisode = series.episodes[0];
  const nextEpisodeNumber = (latestEpisode?.episodeNumber ?? 0) + 1;
  const targetRuntime = parsed.data.runtimeSeconds ?? series.targetRuntime ?? 20;
  const studioEnvironment =
    parsed.data.studioEnvironment ||
    series.defaultStudioEnvironment ||
    "Dark Walnut End-Grain Butcher Block";
  const wardrobe =
    parsed.data.chefWardrobeOverride ||
    series.defaultChefWardrobe ||
    "vintage brass tinker goggles, sleek matte-black half-mask with gold cheekline slit vents, leather artisan apron, black grip gloves";

  // 1. Create the new Episode Project inheriting 100% Channel DNA
  const newProject = await prisma.project.create({
    data: {
      ownerId,
      seriesId: series.id,
      episodeNumber: nextEpisodeNumber,
      title: parsed.data.title,
      description: `Episode ${nextEpisodeNumber} of ${series.title}: 20s Viral Rapid ASMR Masterpiece.`,
      sourceIdea: parsed.data.sourceIdea,
      visualStyle: series.visualStyle,
      genre: series.genre,
      tone: series.tone,
      dialogueMode: series.dialogueMode,
      aspectRatio: series.aspectRatio,
      targetRuntime,
      storyLanguage: series.storyLanguage,
      studioEnvironment,
      chefWardrobeOverride: parsed.data.chefWardrobeOverride,
      currentStage: "STORY",
      status: "ACTIVE",
    },
  });

  // 2. Clone or Link Lead Character from Previous Episodes
  const existingChar = await prisma.productionAsset.findFirst({
    where: {
      project: { seriesId: series.id },
      assetType: "CHARACTER",
    },
    orderBy: { createdAt: "desc" },
  });

  const leadChar = await prisma.productionAsset.create({
    data: {
      projectId: newProject.id,
      assetType: "CHARACTER",
      name: existingChar?.name || "The Shadow Alchemist Chef",
      description:
        existingChar?.description ||
        "An athletic male artisan culinary alchemist chef with intense hazel eyes, swept dark tousled hair, brass vintage tinker goggles with dark circular glass resting on forehead, and a bespoke aerodynamic matte-black tactical half-mask with vertical gold cheekline slit vents.",
      canonicalMediaId: existingChar?.canonicalMediaId || null,
      attributes: JSON.stringify({
        wardrobeLock: wardrobe,
        role: "LEAD_CHEF",
        channelId: series.id,
      }),
      continuityRules: JSON.stringify([
        "Strictly wears vintage brass tinker goggles, sleek matte-black half-mask with gold cheekline slit vents, black grip gloves, leather apron.",
        "Maintain 100% facial and wardrobe consistency across every scene.",
      ]),
      approvalStatus: "APPROVED",
    },
  });

  // 3. Auto-detect Inedible Hero Object
  const detected = detectPhysicalEntities(
    `${newProject.title} ${newProject.sourceIdea}`,
    newProject.sourceIdea
  );
  const heroObject = detected.inedibleHeroObject || "Inedible Physical Hero Object";

  // 4. Initialize Step 5 Social Launch Kit & Master Thumbnail
  const launchKit = generateSocialLaunchKit({
    id: newProject.id,
    title: newProject.title,
    description: newProject.description,
    sourceIdea: newProject.sourceIdea,
    visualStyle: newProject.visualStyle,
    aspectRatio: newProject.aspectRatio,
    productionAssets: [leadChar],
  });

  const defaultThumbnailPrompt =
    newProject.aspectRatio === "PORTRAIT_9_16"
      ? launchKit.thumbnailPrompts.portrait9x16
      : launchKit.thumbnailPrompts.landscape16x9;

  const thumbnailData = {
    prompt: defaultThumbnailPrompt,
    aspectRatio: newProject.aspectRatio === "PORTRAIT_9_16" ? "9:16" : "16:9",
    style: "OBJECT_COOKING_HOOK",
    headlineText: "DO NOT EAT THIS!",
    overlayStyle: "viral-header",
    fontSize: "large",
    fontFamily: "Impact",
    gradient: "sunset",
    verticalPos: 5,
    horizontalPos: "top-center",
  };

  const thumbnailArtifact = await prisma.storyArtifact.create({
    data: {
      projectId: newProject.id,
      artifactType: "YOUTUBE_THUMBNAIL",
    },
  });

  await prisma.artifactVersion.create({
    data: {
      artifactId: thumbnailArtifact.id,
      versionNumber: 1,
      contentText: JSON.stringify(thumbnailData),
    },
  });

  // 5. Generate Initial Story Artifacts (LOGLINE, PREMISE, SYNOPSIS)
  const logline = `In a 20-second high-density ASMR whirlwind, a rogue masked alchemist chef violently dismantles a ${heroObject}, cooks its hardware in a ${studioEnvironment}, and serves it with an iconic nod and thumbs-up.`;
  const premise = `Episode ${nextEpisodeNumber} of ${series.title}: 20s Viral Rapid ASMR Masterpiece (Bayashi 2X Pacing · 5 High-Density Scenes). The chef transforms an authentic ${heroObject} into a sizzling gourmet creation, packing 3 to 4 micro-actions per 4-second clip and 90% ingredient framing.`;
  const synopsis = `Act I: The 4-Beat Rapid Disassembly Hook (0:00 - 0:04)
At the ${studioEnvironment}, The Shadow Alchemist Chef slams the ${heroObject} and extracts its primary hardware components in a high-speed 2X flurry.

Act II: Fracture, Slicing, Batter & Coating (0:04 - 0:08)
Components are snapped, sliced with a Damascus blade, dredged into golden glaze, and coated with panko resistor breadcrumbs.

Act III: Sizzling High-Heat Cook (0:08 - 0:12)
Hardware is dropped into searing heat or bubbling oil with explosive sizzle, flipped with brass chopsticks, and lifted with tongs.

Act IV: Assembly Pocket & Diagonal Crunch Slice (0:12 - 0:16)
Components are folded with silicone thermal pads and ribbon cables into a crisp seared pocket and sliced diagonally straight through with an acoustic crack.

Act V: Hero Crunch Pull & Confident Chef Thumbs-Up (0:16 - 0:20)
Steaming cross-section crunch pull revealing melted glaze, camera tilts up, and the chef flashes a sharp, confident thumbs-up to camera!`;

  const artifactsToCreate = [
    { type: "LOGLINE", text: logline },
    { type: "PREMISE", text: premise },
    { type: "SYNOPSIS", text: synopsis },
  ];

  for (const art of artifactsToCreate) {
    const createdArt = await prisma.storyArtifact.create({
      data: {
        projectId: newProject.id,
        artifactType: art.type,
      },
    });
    await prisma.artifactVersion.create({
      data: {
        artifactId: createdArt.id,
        versionNumber: 1,
        contentText: art.text,
      },
    });
  }

  // 6. Generate 5-Scene Bayashi Rapid ASMR Scenes & Multi-Engine Shot Prompts
  const sceneTemplates = [
    {
      num: 1,
      heading: `INT. ${studioEnvironment.toUpperCase()} - DISASSEMBLY HOOK (0:00 - 0:04)`,
      action: `[0:00-0:01] Black-gloved hands violently slam an authentic ${heroObject} onto the ${studioEnvironment} (*THUD*). [0:01-0:02] In a split-second motion, thumb forcefully ejects key components with a sharp whip-snap (*SNAP-CLICK*). [0:02-0:03] Precision mini-screwdriver rapidly spins and pops screws, cracking open the housing (*CLICK-CLACK*). [0:03-0:04] Titanium tweezers rapidly pluck internal components into a small brass prep dish. 90% screen real estate locked on hardware; extreme close-up macro. 2X fast-forward tempo.`,
      shotSize: "Extreme Close-Up",
      cameraMovement: "Rapid Top-Down Macro Snap",
      foley: `Binaural ASMR Foley: Heavy thud on workstation, sharp plastic snap-click, rapid metallic screwdriver clicks, rhythmic brass dish ping. Pure acoustic Foley, zero speech, zero music.`,
    },
    {
      num: 2,
      heading: `INT. ${studioEnvironment.toUpperCase()} - HARDWARE SNAP, NOODLE CHOP & BATTER (0:04 - 0:08)`,
      action: `[0:04-0:05] Black-gloved hands cleanly snap the internal circuit board down the center with a loud acoustic fracture (*CRACK*). [0:05-0:06] Heavy Damascus knife rapidly chops multicolored ribbon cables into razor-thin noodles in high-speed staccato (*thwack-thwack-thwack*). [0:06-0:07] Gloved hand plunges the hardware into a thick golden rosin flux glaze dish and flips them (*SPLAT*). [0:07-0:08] Transferred into a shallow tray of panko resistor breadcrumbs; gloved palm firmly presses down to coat evenly. 90% camera fill; 2X rapid tempo.`,
      shotSize: "Extreme Close-Up Macro",
      cameraMovement: "Top-Down Flat Lay Lock",
      foley: `Binaural ASMR Foley: Loud crisp circuit board snap crack, rapid staccato knife thwacks, wet suction splash of thick glaze batter, acoustic crunch of resistor panko pressed under palm.`,
    },
    {
      num: 3,
      heading: `INT. COOK STATION - FOAMING SIZZLE & HIGH-HEAT SEAR (0:08 - 0:12)`,
      action: `[0:08-0:10] Black-gloved hands lower the battered ${heroObject} hardware into a searing pan with an explosive, foaming sizzle (*TZZZZZZZZ*). Micro-bubbles boil vigorously around the hardware. [0:10-0:11] Long brass cooking chopsticks quickly flip the golden-crusted components. [0:11-0:12] Stainless tongs lift the steaming, golden-crispy creation out onto an elevated wire cooling rack; hot glaze crackles fiercely. 90% camera fill; extreme macro 45° angle.`,
      shotSize: "Macro Close-Up 45-Degree",
      cameraMovement: "Low Angle Oil Surface Push",
      foley: `Binaural ASMR Foley: Violent explosive sizzle and high-heat roar (TZZZZZZ), brass chopstick clinks against pan rim, hot droplets crackling on wire rack.`,
    },
    {
      num: 4,
      heading: `INT. ${studioEnvironment.toUpperCase()} - 4-QUADRANT FOLD & KNIFE CRUNCH (0:12 - 0:16)`,
      action: `[0:12-0:13] On a flat sheet, black-gloved hands rapidly arrange 4 quadrants: crispy golden tempura ${heroObject} chips, yellow silicone thermal pad squares, miniature SMD resistor seasonings, and coiled copper ribbon cables. [0:13-0:14] In a fast 4-fold sequence, gloved hands fold the sheet clockwise into a tight triangular crunch pocket. [0:14-0:15] Hands press the pocket onto a hot ridged cast-iron grill pan (*CHHHHH*), searing crisp dark lines. [0:15-0:16] Transferred to board; heavy Damascus knife slices diagonally straight through the pocket with a razor-loud acoustic *CRUNCH*. 90% camera fill; 2X hyper-tempo.`,
      shotSize: "Top-Down Flat Lay",
      cameraMovement: "Rapid Dynamic Macro Pan",
      foley: `Binaural ASMR Foley: Rapid parchment paper rustle, loud grill pan sear sizzle (CHHHHH), razor-sharp acoustic crust crunch as heavy knife slices diagonally through toasted pocket.`,
    },
    {
      num: 5,
      heading: `INT. HERO SHOWCASE - CRUNCH PULL & CHEF THUMBS-UP (0:16 - 0:20)`,
      action: `[0:16-0:18] Extreme macro close-up. Two black-gloved hands grip the two halves of the diagonally sliced tempura pocket and pull them slowly apart: thick strands of bubbling golden rosin flux glaze stretch between crispy tempura ${heroObject} halves, coiled copper ribbons, and golden crunch crust as aromatic steam billows outward. [0:18-0:19] Plated on a pristine bright white ceramic coupe plate crowned with a prominent ${heroObject} component chip. Camera tilts up smoothly to The Shadow Alchemist Chef in brass goggles and sleek matte-black mask. [0:19-0:20] Chef looks directly into the lens, gives an appreciative slow nod, and flashes a sharp, confident thumbs-up to camera!`,
      shotSize: "Extreme Close-Up to Medium Up-Tilt",
      cameraMovement: "Macro Pull and Slow Tilt Up",
      foley: `Binaural ASMR Foley: Tactile acoustic crunch pull, soft bubbling glaze stretch, gentle ceramic plate contact, soft deep breath from mask cheek vents. Ending on silence.`,
    },
  ];

  for (const t of sceneTemplates) {
    const scene = await prisma.scene.create({
      data: {
        projectId: newProject.id,
        sceneNumber: t.num,
        heading: t.heading,
        location: studioEnvironment,
        timeOfDay: "NIGHT",
        actionSummary: t.action,
        estimatedDurationSeconds: 4,
        approvalStatus: "APPROVED",
      },
    });

    const bundle = compileCinematicPrompt({
      actionDescription: t.action,
      shotSize: t.shotSize,
      cameraMovement: t.cameraMovement,
      characterName: leadChar.name,
      characterDescription: leadChar.description,
      wardrobeLock: wardrobe,
      locationDescription: studioEnvironment,
      heroObject,
      visualStyle: newProject.visualStyle,
      genre: newProject.genre,
      tone: newProject.tone,
      aspectRatio: newProject.aspectRatio,
      targetDurationSeconds: 4,
      sourceIdea: newProject.sourceIdea,
    });

    await prisma.shot.create({
      data: {
        sceneId: scene.id,
        projectId: newProject.id,
        shotNumber: 1,
        actionDescription: t.action,
        shotSize: t.shotSize,
        cameraMovement: t.cameraMovement,
        lighting: "Warm directional culinary studio lighting, soft key illumination, appetizing natural highlights",
        mood: "Satisfying, Crisp & Hypnotic",
        targetDurationSeconds: 4,
        aspectRatio: newProject.aspectRatio,
        imagePrompt: bundle.fluxStillPrompt,
        videoPrompt: bundle.googleFlowPrompt,
        negativeConstraints: bundle.universalNegativePrompt,
        approvalStatus: "APPROVED",
      },
    });
  }

  // Fetch full project with scenes & series info
  const completeEpisode = await prisma.project.findUnique({
    where: { id: newProject.id },
    include: {
      series: true,
      productionAssets: true,
      scenes: {
        include: { shots: true },
        orderBy: { sceneNumber: "asc" },
      },
    },
  });

  return { ok: true, episode: completeEpisode };
});
