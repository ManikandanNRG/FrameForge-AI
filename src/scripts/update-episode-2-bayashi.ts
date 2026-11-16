import { PrismaClient } from "@prisma/client";
import { compileCinematicPrompt } from "../lib/story/prompt-compiler";

const prisma = new PrismaClient();

async function main() {
  const projectId = "cmwja2y3t0001u8qgfh5w3gtj";
  console.log(`Updating Project ${projectId} to Bayashi 2X Rapid ASMR (20s, 5 High-Density Scenes)...`);

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    throw new Error(`Project ${projectId} not found!`);
  }

  // 1. Update Project Metadata
  await prisma.project.update({
    where: { id: projectId },
    data: {
      targetRuntime: 20,
      description:
        "Episode 2 of Inedible Gourmet ASMR: 20s Viral Rapid ASMR Masterpiece (Bayashi 2X Pacing · 5 High-Density Scenes). The Shadow Alchemist transforms a translucent purple Game Boy Color and Pokémon cartridge into a sizzling golden tempura masterwork with rapid 2X micro-actions, 90% ingredient framing, pure binaural ASMR, and the iconic hero crunch pull & confident chef thumbs-up to camera.",
      updatedAt: new Date(),
    },
  });
  console.log("Updated project targetRuntime to 20s.");

  // 2. Define the 5 High-Density Bayashi Scenes
  const scenes = [
    {
      sceneNumber: 1,
      heading: "INT. ALCHEMIST WORKBENCH - DISASSEMBLY - 4-BEAT RAPID HOOK (0:00 - 0:04)",
      location: "Dark Walnut Butcher Block",
      timeOfDay: "NIGHT",
      action:
        "[0:00-0:01] Black-gloved hands violently slam a translucent purple Game Boy Color onto the dark walnut cutting board (*THUD*). [0:01-0:02] In a split-second motion, his thumb forcefully ejects the golden Pokémon cartridge with a sharp, echoing plastic whip-snap (*SNAP-CLICK*). [0:02-0:03] A specialized mini-screwdriver rapidly spins and pops 6 tiny tri-wing screws, cracking open the translucent plastic shell (*CLICK-CLACK*). [0:03-0:04] Titanium tweezers rapidly pluck the black rubber D-pad and magenta A/B buttons into a small brass prep dish. 90% screen real estate locked on cutting board and hardware; extreme close-up macro. 2X fast-forward tempo.",
      dialogue: "",
      voiceover: "",
      audioScript:
        "Binaural ASMR Foley: Heavy wooden butcher block thud, sharp plastic cartridge snap-click, rapid metallic screwdriver clicks and popping screw threads, rhythmic brass dish ping. Pure acoustic Foley, zero speech, zero music.",
      estimatedDurationSeconds: 4,
      shotSize: "Extreme Close-Up",
      cameraMovement: "Rapid Top-Down Macro Snap",
    },
    {
      sceneNumber: 2,
      heading: "INT. ALCHEMIST WORKBENCH - PCB SNAP, NOODLE CHOP & BATTER (0:04 - 0:08)",
      location: "Walnut Prep Board & Glaze Dish",
      timeOfDay: "NIGHT",
      action:
        "[0:04-0:05] Black-gloved hands cleanly snap the emerald circuit board down the center with a loud, acoustic chocolate-bar fracture (*CRACK*). [0:05-0:06] A heavy Damascus santoku knife rapidly chops flat multicolored ribbon cables into razor-thin ramen noodles in high-speed staccato (*thwack-thwack-thwack*). [0:06-0:07] Gloved hand plunges the snapped PCB halves and gold cartridge into a thick golden glaze batter dish and flips them (*SPLAT*). [0:07-0:08] Transferred into a shallow tray of panko resistor breadcrumbs; gloved palm firmly presses down to coat evenly. 90% camera fill on board and batter tray; 2X rapid tempo.",
      dialogue: "",
      voiceover: "",
      audioScript:
        "Binaural ASMR Foley: Loud crisp PCB snap crack, rapid staccato knife thwacks against walnut block, wet suction splash of thick glaze batter, acoustic crunch of panko breadcrumbs pressed under palm.",
      estimatedDurationSeconds: 4,
      shotSize: "Extreme Close-Up Macro",
      cameraMovement: "Top-Down Flat Lay Lock",
    },
    {
      sceneNumber: 3,
      heading: "INT. STOVE STATION - FOAMING TEMPURA DEEP-FRY & SIZZLE (0:08 - 0:12)",
      location: "Hot Oil Tempura Pot",
      timeOfDay: "NIGHT",
      action:
        "[0:08-0:10] Black-gloved hands lower the battered Game Boy halves and golden cartridge into a pot of bubbling hot tempura oil with an explosive, foaming sizzle (*TZZZZZZZZ*). Golden micro-bubbles boil vigorously around the hardware. [0:10-0:11] Long brass cooking chopsticks quickly flip the golden-crusted circuit boards. [0:11-0:12] Stainless tongs lift the steaming, golden-crispy tempura out of the foaming oil onto an elevated wire cooling rack; hot oil crackles fiercely. 90% camera fill on oil surface; extreme macro 45° angle.",
      dialogue: "",
      voiceover: "",
      audioScript:
        "Binaural ASMR Foley: Violent explosive oil hiss and high-heat foaming roar (TZZZZZZ), brass chopstick clinks against pan rim, hot oil droplets dripping and crackling on metal wire rack.",
      estimatedDurationSeconds: 4,
      shotSize: "Macro Close-Up 45-Degree",
      cameraMovement: "Low Angle Oil Surface Push",
    },
    {
      sceneNumber: 4,
      heading: "INT. WORKBENCH & GRILL - 4-QUADRANT WRAP & KNIFE CRUNCH (0:12 - 0:16)",
      location: "Grill Pan & Board",
      timeOfDay: "NIGHT",
      action:
        "[0:12-0:13] On a flat tortilla, gloved hands rapidly load 4 quadrants: crispy PCB tempura, thick yellow cheddar cheese slice, fresh diced tomato/onion, and coiled copper wire bacon. [0:13-0:14] In a viral 4-fold sequence, hands fold each quadrant clockwise into a tight triangular pocket. [0:14-0:15] Slams wrap onto a searing ribbed cast-iron grill pan (*CHHHHH*), instantly searing dark charred grill stripes. [0:15-0:16] Transferred to board; heavy chef knife slices diagonally straight through the wrap with a razor-loud acoustic *CRUNCH*. 90% camera fill; 2X hyper-tempo.",
      dialogue: "",
      voiceover: "",
      audioScript:
        "Binaural ASMR Foley: Rapid parchment paper rustle, loud grill pan sear sizzle (CHHHHH), razor-sharp acoustic crust crunch as heavy knife slices diagonally through toasted wrap.",
      estimatedDurationSeconds: 4,
      shotSize: "Top-Down Flat Lay",
      cameraMovement: "Rapid Dynamic Macro Pan",
    },
    {
      sceneNumber: 5,
      heading: "INT. HERO SHOWCASE - CRUNCH PULL & CHEF THUMBS-UP (0:16 - 0:20)",
      location: "Chef Showcase & White Coupe Plate",
      timeOfDay: "NIGHT",
      action:
        "[0:16-0:18] Extreme macro close-up. Two black-gloved hands grip the two halves of the diagonally sliced wrap and pull them slowly apart: thick strands of bubbling melted cheddar stretch between crispy tempura PCB halves, coiled copper ribbons, and golden crunch crust as aromatic steam billows outward. [0:18-0:19] Plated on a pristine bright white ceramic coupe plate crowned with the golden Pokémon cartridge chip. Camera tilts up smoothly to The Shadow Alchemist Chef in brass goggles and sleek matte-black mask. [0:19-0:20] Chef looks directly into the lens, gives an appreciative slow nod, and flashes a sharp, confident thumbs-up to camera! On-screen text: 'CONCEPTUAL ARTWORK & ASMR ENTERTAINMENT ONLY — INEDIBLE.'",
      dialogue: "",
      voiceover: "",
      audioScript:
        "Binaural ASMR Foley: Tactile acoustic crunch pull, soft bubbling cheese stretch, gentle ceramic plate contact, soft deep breath from mask cheek vents. Ending on silence.",
      estimatedDurationSeconds: 4,
      shotSize: "Extreme Close-Up to Medium Up-Tilt",
      cameraMovement: "Macro Pull and Slow Tilt Up",
    },
  ];

  // 3. Update Artifacts (LOGLINE, PREMISE, SYNOPSIS, SCREENPLAY)
  const logline =
    "In a 20-second high-density ASMR whirlwind, a rogue masked alchemist chef violently dismantles a translucent Game Boy Color, batter-fries its circuit boards into golden tempura, wraps them into a searing cheesy crunch pocket, and serves it with an iconic nod and thumbs-up.";

  const premise =
    "A 20-second kinetic ASMR culinary masterwork designed for maximum viral retention (Bayashi 2X pacing). Packing 3 to 4 micro-actions per 4-second clip and 90% ingredient framing, the chef transforms a vintage handheld gaming relic into a sizzling gourmet tempura wrap, saving 60% of generation credits while delivering hyper-crisp acoustic satisfaction.";

  const synopsis = `Act I: The 4-Beat Rapid Disassembly Hook (0:00 - 0:04)
Inside a shadowy cyberpunk kitchen, The Shadow Alchemist Chef violently slams a vintage translucent purple Game Boy Color onto his walnut cutting board. In a split-second 2X flourish, his thumb ejects the golden Pokémon cartridge with a razor whip-snap, spins the tri-wing screws with a mini-driver, and plucks the rubber D-pad and magenta buttons into a brass dish.

Act II: Fracture, Slicing, Batter & Explosive Tempura Fry (0:04 - 0:12)
The chef snaps the emerald motherboard in two like crisp chocolate, rapid-chops flat ribbon cables into ramen noodles in staccato rhythm, dunks the PCB into thick golden glaze, and coats it in panko resistor breadcrumbs. Plunged into a pot of bubbling hot tempura oil, the hardware sizzles with violent foaming fury before being lifted with brass chopsticks onto a crackling wire cooling rack.

Act III: 4-Quadrant Wrap Fold, Knife Crunch & The Hero Thumbs-Up (0:12 - 0:20)
On a flat tortilla, the chef loads four quadrants with PCB tempura, yellow cheddar, diced vegetables, and coiled copper bacon. In the viral 4-fold technique, he snaps the tortilla into a triangle, sears it on a smoking ribbed grill pan, and cleaves it diagonally with an echoing acoustic crunch. Pulling the steaming halves apart to reveal a mouthwatering melted cheese and crispy tempura cross-section, the chef looks directly into the lens, nods with quiet mastery, and flashes a sharp, confident thumbs-up to camera.`;

  const screenplayJson = {
    title: "The Vintage Game Boy Tempura (ASMR)",
    targetRuntimeSeconds: 20,
    scenes: scenes.map((s) => ({
      sceneNumber: s.sceneNumber,
      heading: s.heading,
      location: s.location,
      timeOfDay: s.timeOfDay,
      action: s.action,
      dialogue: s.dialogue,
      voiceover: s.voiceover,
      audioScript: s.audioScript,
      estimatedDurationSeconds: s.estimatedDurationSeconds,
    })),
  };

  const artifactUpdates = [
    { type: "LOGLINE", content: logline },
    { type: "PREMISE", content: premise },
    { type: "SYNOPSIS", content: synopsis },
    { type: "SCREENPLAY", content: JSON.stringify(screenplayJson, null, 2) },
  ];

  for (const art of artifactUpdates) {
    const existing = await prisma.storyArtifact.findFirst({
      where: { projectId, artifactType: art.type as any },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });
    if (existing) {
      const nextVer = (existing.versions[0]?.versionNumber || 0) + 1;
      const newVersion = await prisma.artifactVersion.create({
        data: {
          artifactId: existing.id,
          versionNumber: nextVer,
          contentText: art.content,
          source: "AI",
        },
      });
      await prisma.storyArtifact.update({
        where: { id: existing.id },
        data: { currentVersionId: newVersion.id, updatedAt: new Date() },
      });
    } else {
      const newArt = await prisma.storyArtifact.create({
        data: {
          projectId,
          artifactType: art.type as any,
          approvalStatus: "APPROVED",
          versions: {
            create: {
              versionNumber: 1,
              contentText: art.content,
              source: "AI",
            },
          },
        },
        include: { versions: true },
      });
      await prisma.storyArtifact.update({
        where: { id: newArt.id },
        data: { currentVersionId: newArt.versions[0].id },
      });
    }
  }
  console.log("Updated story artifacts (LOGLINE, PREMISE, SYNOPSIS, SCREENPLAY).");

  // 4. Delete old 12 scenes and shots
  await prisma.scene.deleteMany({
    where: { projectId },
  });
  console.log("Cleared old scenes.");

  // 5. Create the 5 High-Density Scenes and Compiled Shots
  for (const sc of scenes) {
    const createdScene = await prisma.scene.create({
      data: {
        projectId,
        sceneNumber: sc.sceneNumber,
        heading: sc.heading,
        location: sc.location,
        timeOfDay: sc.timeOfDay,
        actionSummary: sc.action,
        estimatedDurationSeconds: sc.estimatedDurationSeconds,
        approvalStatus: "APPROVED",
      },
    });

    const bundle = compileCinematicPrompt({
      actionDescription: sc.action,
      shotSize: sc.shotSize,
      cameraMovement: sc.cameraMovement,
      heroObject: "Vintage Translucent Purple Game Boy Color",
      heroPropLock: "Translucent Purple Game Boy Color and Golden Pokémon Cartridge",
      visualStyle: "CULINARY_MACRO_ASMR",
      targetDurationSeconds: sc.estimatedDurationSeconds,
      characterName: "The Shadow Alchemist Chef",
      characterDescription: "Vintage brass tinker goggles, sleek matte-black half-mask with gold cheek vents, black textured grip gloves, heavy distressed leather cross-back apron",
      wardrobeLock: "vintage brass tinker goggles, matte-black half-mask with gold cheek vents, black grip gloves, leather apron",
      aspectRatio: "PORTRAIT_9_16",
      audioPrompt: sc.audioScript,
      dialogue: sc.dialogue,
      voiceover: sc.voiceover,
    });

    const negativeArray = [bundle.universalNegativePrompt];

    await prisma.shot.create({
      data: {
        sceneId: createdScene.id,
        projectId,
        shotNumber: sc.sceneNumber,
        actionDescription: sc.action,
        shotSize: sc.shotSize,
        cameraAngle: "Macro Angle",
        cameraMovement: sc.cameraMovement,
        lighting: "Moody Cyberpunk Cyan and Amber Neon",
        mood: "Satisfying, Crisp & Hypnotic",
        imagePrompt: bundle.fluxStillPrompt,
        videoPrompt: bundle.googleFlowPrompt,
        negativeConstraints: JSON.stringify(negativeArray),
        targetDurationSeconds: sc.estimatedDurationSeconds,
      },
    });

    console.log(`Created Scene ${sc.sceneNumber}: ${sc.heading} (Duration: ${sc.estimatedDurationSeconds}s)`);
  }

  console.log("Successfully transformed Episode 2 to the 20s Bayashi Rapid ASMR Standard!");
}

main()
  .catch((e) => {
    console.error("Migration error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
