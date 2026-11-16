import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ownerId = "cmvmarofu0000u84obgt10o6q";

  console.log("Creating Episode 2: The Vintage Game Boy Tempura (ASMR)...");

  // Clean up any previous failed attempt
  await prisma.project.deleteMany({
    where: { title: "The Vintage Game Boy Tempura (ASMR)" }
  });

  // 1. Create Project
  const project = await prisma.project.create({
    data: {
      ownerId,
      title: "The Vintage Game Boy Tempura (ASMR)",
      sourceIdea:
        "A rogue masked alchemist chef inside a moody cyberpunk scrapyard transforms a vintage translucent Game Boy Color into an acoustic gourmet tempura masterwork. He pops out the golden Pokémon cartridge wafer with an echoing plastic snap, extracts rubber D-pad and magenta A/B buttons with precision tweezers, slices multi-colored flat ribbon cables into ramen noodles, snaps the green circuit board down the center like chocolate, tosses and glazes them over roaring wok flames, and plates a 3-star Michelin fine-dining artwork on a pure white ceramic coupe plate crowned with a golden cartridge chip.",
      description:
        "Episode 2 of Inedible Gourmet ASMR: The Shadow Alchemist transforms a retro translucent Game Boy Color and 8-bit cartridge into a sizzling wok tempura with 12 deliberate, high-retention tactile craft scenes.",
      genre: "Culinary & Cooking ASMR",
      tone: "Satisfying, Crisp & Hypnotic",
      visualStyle: "CULINARY_MACRO_ASMR",
      dialogueMode: "NO_DIALOGUE",
      targetRuntime: 90,
      aspectRatio: "PORTRAIT_9_16",
      storyLanguage: "English",
      currentStage: "STORYBOARD",
      status: "ACTIVE",
    },
  });

  const projectId = project.id;
  console.log(`Created Project with ID: ${projectId}`);

  // 2. Create Master Character Asset
  const chefAttributes = {
    role: "Master Alchemist Chef",
    age: 32,
    wardrobe:
      "Vintage brass tinker goggles pushed up on tousled dark hair, sleek matte-black half-mask with gold cheek vents, black textured grip gloves, heavy distressed leather cross-back apron over dark canvas workshirt",
    googleFlowCharacterPrompt:
      "Photorealistic character portrait of The Shadow Alchemist Chef, wearing vintage brass tinker goggles pushed up on dark tousled hair, sleek matte-black half-mask with gold cheek vents covering lower face, piercing hazel eyes, heavy distressed leather cross-back apron, black textured grip gloves, moody cyan and amber cyberpunk e-waste bokeh lighting, 35mm film still.",
    voiceProfile: "Pure ambient culinary Foley (no spoken dialogue).",
  };

  await prisma.productionAsset.create({
    data: {
      projectId,
      name: "The Shadow Alchemist Chef",
      assetType: "CHARACTER",
      description: "A mysterious masked rogue culinary master who transforms vintage tech scrap into 3-star Michelin inedible gastronomic sculptures.",
      attributes: JSON.stringify(chefAttributes),
      approvalStatus: "APPROVED",
    },
  });

  // 3. Define 12 Screenplay Scenes (Strictly ADR-017, ADR-019, ADR-020 compliant)
  const scenesData = [
    {
      sceneNumber: 1,
      heading: "EXT. E-WASTE SCRAPYARD - NIGHT",
      location: "E-Waste Scrapyard",
      timeOfDay: "NIGHT",
      action:
        "Low-angle cinematic tracking shot through misty e-waste scrap piles illuminated by cool cyan and warm amber neon shop signage. The Shadow Alchemist Chef (wearing vintage brass tinker goggles on tousled dark hair, sleek matte-black half-mask with gold cheek vents, black grip gloves, heavy leather cross-back apron) walks deliberately through towering stacks of retro CRT monitors and circuit boards. He spots a pristine vintage translucent purple Game Boy Color perched high on an industrial metal shelf, his piercing hazel eyes locking onto it with calculating focus.",
      audioScript:
        "Binaural Foley: Atmospheric hum of vintage CRT monitors and distant electric neon buzzing, gravel crunching under heavy leather combat boots, soft night breeze through metal scrap.",
      soundEffects: "Boot footsteps on gravel, ambient neon hum, wind through metal",
      estimatedDurationSeconds: 8,
      shotSize: "WIDE",
      cameraAngle: "LOW_ANGLE",
      cameraMovement: "SLOW_TRACKING_FORWARD",
    },
    {
      sceneNumber: 2,
      heading: "EXT. E-WASTE SCRAPYARD - NIGHT",
      location: "E-Waste Scrapyard",
      timeOfDay: "NIGHT",
      action:
        "Medium dynamic action shot. The chef reaches up with his black-gloved hands and firmly grasps the vintage translucent Game Boy Color. With a sudden flick of his thumb, he violently ejects the golden Pokémon 8-bit cartridge from the back slot with an echoing, hollow plastic snap. He spins the golden cartridge in mid-air, catches it cleanly in his leather-gloved palm, and casts a sly, confident smirk directly into the camera lens.",
      audioScript:
        "Binaural Foley: Violent whip-snap of plastic cartridge latch releasing (*CLACK-POP!*), metallic whoosh of cartridge spinning in air, solid crisp slap as it is caught in leather-gloved palm.",
      soundEffects: "Cartridge eject snap, air spin whoosh, heavy catch slap",
      estimatedDurationSeconds: 7,
      shotSize: "MEDIUM",
      cameraAngle: "EYE_LEVEL",
      cameraMovement: "DYNAMIC_HANDHELD_GLIDE",
    },
    {
      sceneNumber: 3,
      heading: "INT. TECH WORKBENCH - NIGHT",
      location: "Tech Workbench",
      timeOfDay: "NIGHT",
      action:
        "Macro 90-degree top-down flat lay over the dark walnut end-grain butcher block. The translucent Game Boy Color rests in the center under focused directional spotlighting. The chef holds a miniature brass electronics screwdriver in his black-gloved hand. In rapid, rhythmic motion, he unfastens the tri-wing casing screws with crisp metallic clicks. He lifts and unclips the translucent purple casing with a satisfying plastic pop, exposing the pristine emerald-green motherboard inside.",
      audioScript:
        "Binaural Foley: Tiny brass screwdriver squeaks, crisp mechanical thread turns, satisfying plastic shell latch pop (*SNAP-CLACK*), resonant wood contact.",
      soundEffects: "Screwdriver clicks, plastic shell pop, casing separation",
      estimatedDurationSeconds: 8,
      shotSize: "TOP_DOWN",
      cameraAngle: "90_DEGREE_OVERHEAD",
      cameraMovement: "STATIC_OVERHEAD_MACRO",
    },
    {
      sceneNumber: 4,
      heading: "INT. TECH WORKBENCH - NIGHT",
      location: "Tech Workbench",
      timeOfDay: "NIGHT",
      action:
        "Extreme close-up 45-degree macro shot. The Game Boy now has its front casing removed. The chef uses surgical angled stainless steel tweezers in his black-gloved hand to gently peel off the black rubber D-pad and magenta A/B buttons from the silicone membrane. One by one, he plucks them cleanly and drops them into a hammered brass bowl like vibrant gourmet candies, bouncing with resonant acoustic clicks.",
      audioScript:
        "Binaural Foley: Soft silicone suction release (*SHLICK-POP*), tweezers metallic ping, vibrant hollow bouncing clatter as rubber buttons rain inside the hammered brass bowl (*PING-TINK-CLACK*).",
      soundEffects: "Silicone peel, tweezers ping, brass bowl clatter",
      estimatedDurationSeconds: 7,
      shotSize: "EXTREME_CLOSE_UP",
      cameraAngle: "45_DEGREE_CANT",
      cameraMovement: "SLOW_PUSH_IN_MACRO",
    },
    {
      sceneNumber: 5,
      heading: "INT. TECH WORKBENCH - NIGHT",
      location: "Tech Workbench",
      timeOfDay: "NIGHT",
      action:
        "Medium close-up shot. The chef picks up the stripped emerald-green Game Boy motherboard with both black-gloved hands. He braces it firmly between thumbs and fingers, then snaps the multi-layered fiberglass board clean down the center with raw authority—fracturing cleanly like crisp artisan chocolate, revealing gleaming golden copper trace lines along the fracture edge.",
      audioScript:
        "Binaural Foley: Sharp, explosive fracture crack of rigid multi-layer fiberglass (*CRUNCH-SNAP!*), tiny microscopic metallic chimes as copper traces shear, solid thud of both halves resting on walnut wood.",
      soundEffects: "Motherboard fracture snap, copper shear ping, wood thud",
      estimatedDurationSeconds: 7,
      shotSize: "MEDIUM_CLOSE_UP",
      cameraAngle: "EYE_LEVEL",
      cameraMovement: "STATIC_LOCKED",
    },
    {
      sceneNumber: 6,
      heading: "INT. TECH WORKBENCH - NIGHT",
      location: "Tech Workbench",
      timeOfDay: "NIGHT",
      action:
        "Macro 90-degree top-down flat lay. The colorful flat ribbon cable connecting the Game Boy LCD screen is stretched taut across the walnut cutting board. The chef grips a heavy, razor-sharp Japanese santoku knife. In rapid, hypnotic rhythm, he chops cleanly through the ribbon cable, slicing it into thin, vibrant translucent ribbons like delicate tempura noodles.",
      audioScript:
        "Binaural Foley: Rapid, heavy rhythmic knife thuds on hardwood end-grain (*THWACK-THWACK-THWACK*), crisp plastic shearing acoustics, chef rhythmic breathing.",
      soundEffects: "Rapid hardwood knife chops, crisp ribbon shear",
      estimatedDurationSeconds: 8,
      shotSize: "TOP_DOWN",
      cameraAngle: "90_DEGREE_OVERHEAD",
      cameraMovement: "STATIC_OVERHEAD_MACRO",
    },
    {
      sceneNumber: 7,
      heading: "INT. TECH WORKBENCH - NIGHT",
      location: "Tech Workbench",
      timeOfDay: "NIGHT",
      action:
        "Tight 45-degree macro shot. A heavy cast-iron mortar and pestle sits on the butcher block. The chef drops a handful of tiny cylindrical ceramic capacitors and colorful resistors into the mortar. With firm circular pestle twists, he aggressively pulverizes the components into a shimmering, fine iridescent seasoning dust that catches the spotlight.",
      audioScript:
        "Binaural Foley: Harsh abrasive grinding of heavy iron on ceramic components (*SCREEECH-CRUNCH-GRIND*), fine metallic powder rustle, heavy stone resonance.",
      soundEffects: "Heavy mortar grinding, ceramic crunches, powder rustle",
      estimatedDurationSeconds: 7,
      shotSize: "MACRO_CLOSE_UP",
      cameraAngle: "45_DEGREE",
      cameraMovement: "SLOW_ROTATION_MACRO",
    },
    {
      sceneNumber: 8,
      heading: "INT. TECH WORKBENCH - NIGHT",
      location: "Tech Workbench",
      timeOfDay: "NIGHT",
      action:
        "Medium shot. The chef picks up a vintage dark amber glass bottle with a brass pour spout. In a steady, golden stream, he drizzles thick translucent glaze over the hammered brass bowl containing the buttons, ribbon noodles, and circuit board shards. He dusts the freshly ground capacitor spice over the top, then vigorously tosses the bowl with deft wrist flicks, coating every piece in a shimmering gloss.",
      audioScript:
        "Binaural Foley: Viscous oil pouring in thick continuous stream (*GLUG-GLUG-GLOUP*), gentle dusting powder sprinkle, wet heavy clattering of glazed components tossing inside the brass bowl.",
      soundEffects: "Oil pour stream, powder sprinkle, wet brass toss clatter",
      estimatedDurationSeconds: 8,
      shotSize: "MEDIUM",
      cameraAngle: "EYE_LEVEL",
      cameraMovement: "DYNAMIC_HANDHELD",
    },
    {
      sceneNumber: 9,
      heading: "INT. SCRAPYARD WOK STATION - NIGHT",
      location: "Scrapyard Wok Station",
      timeOfDay: "NIGHT",
      action:
        "Low-angle close-up at the industrial wok station. The chef's black-gloved hand twists a heavy brass gas valve and strikes a vintage flint lighter—a roaring, intense cone of vivid blue flame ignites beneath a hand-hammered 14-inch carbon steel wok. He places the wok over the flame; within seconds, faint white heat plumes swirl off the seasoned blackened iron.",
      audioScript:
        "Binaural Foley: Metallic brass valve squeak, flint striker spark (*CHICK-CHICK*), roaring rush of ignited blue gas flame (*FWOOOOOSH*), ambient thermal hum of heating iron.",
      soundEffects: "Flint spark, roaring blue flame ignition, heating iron hum",
      estimatedDurationSeconds: 7,
      shotSize: "MEDIUM",
      cameraAngle: "LOW_ANGLE",
      cameraMovement: "SLOW_PUSH_IN",
    },
    {
      sceneNumber: 10,
      heading: "INT. SCRAPYARD WOK STATION - NIGHT",
      location: "Scrapyard Wok Station",
      timeOfDay: "NIGHT",
      action:
        "Dynamic action tracking shot. With a swift, powerful motion, the chef dumps the bowl of marinated Game Boy buttons, ribbon noodles, and PCB shards into the smoking wok. A dramatic burst of golden sparks and white aromatic steam billows upward as he aggressively tosses the wok with one black-gloved hand, sending magenta buttons and rainbow noodles soaring in an arc over the blue flames before catching them back in the sizzling wok.",
      audioScript:
        "Binaural Foley: Explosive initial sear crackle (*TZZZZZZZZ-CRACKLE*), loud hollow clattering of Game Boy buttons and circuit fragments ricocheting off smoking carbon steel (*CLINK-CLACK-CLANG*), roaring wok fire whooshes.",
      soundEffects: "Explosive sizzle crackle, rhythmic wok toss clatter, fire whoosh",
      estimatedDurationSeconds: 8,
      shotSize: "MEDIUM_ACTION",
      cameraAngle: "DYNAMIC_45_DEGREE",
      cameraMovement: "DYNAMIC_WOK_TRACKING",
    },
    {
      sceneNumber: 11,
      heading: "INT. WOK STATION - END OF COOKING & SAUCE CONSISTENCY (1:20 - 1:26)",
      location: "Wok Station",
      timeOfDay: "NIGHT",
      action:
        "Tight macro eye-level shot inside the smoking carbon-steel wok at the end of cooking. The sauce has fully reduced into a thick, glossy, bubbling amber-caramel glaze coating the hardware. A single black-gloved hand lifts a stainless steel spatula upward, scooping a glistening cluster of stir-fried magenta A/B buttons, rubber D-pad, and golden cartridge pins. Thick, translucent, stretchable strings of golden glaze drip slowly back into the bubbling pan, showcasing the rich, sticky cooked consistency under intense culinary lighting. Aromatic white steam billows upward. Pure ASMR sound of thick bubbling glaze and sticky saucy stretch.",
      audioScript:
        "Binaural Foley: Thick bubbling glaze simmer (*gloop-bubble-sizzle*), followed by the slow, sticky saucy stretch sound as the spatula lifts (*shhhk-gloooop*), accompanied by delicate buttons clicking in heavy glaze, gentle steam hiss.",
      soundEffects: "Glaze bubble simmer, sticky sauce stretch, steam hiss",
      estimatedDurationSeconds: 8,
      shotSize: "MACRO_CLOSE_UP",
      cameraAngle: "EYE_LEVEL",
      cameraMovement: "SLOW_HORIZONTAL_SLIDER",
      audio:
        "Thick bubbling glaze simmer (*gloop-bubble-sizzle*), followed by the slow, sticky saucy stretch sound as the spatula lifts (*shhhk-gloooop*), accompanied by delicate buttons clicking in heavy glaze.",
    },
    {
      sceneNumber: 12,
      heading: "INT. PLATING TABLE - 3-STAR MICHELIN WHITE PLATE ARTWORK (1:26 - 1:30)",
      location: "Plating Table",
      timeOfDay: "NIGHT",
      action:
        "High-contrast 3-star Michelin fine-dining presentation on a pristine, bright white ceramic coupe plate under a warm, focused culinary spotlight. Across the gleaming white porcelain, a bold, artistic curved swoosh of dark translucent amber glaze arcs smoothly. In the center, caramelized stir-fried magenta Game Boy buttons and glistening rainbow ribbon noodles are arranged into a sleek geometric gourmet mound, glistening with rich glossy sauce. Delicate spiral copper wire curls are draped elegantly like micro ribbons, accented by wafer-thin emerald PCB chips fanned along the side and tiny golden sauce droplets piped in a delicate arc along the plate curve. A single golden Pokémon cartridge chip gleams at the pinnacle. Delicate wisps of culinary steam curl upward against a clean, dark shadowed background. Maximum visual contrast between the pure white plate, magenta buttons, emerald chips, and golden glaze. Pure visual treat. Pure ASMR sound design.",
      audioScript:
        "Binaural Foley: Dying whispers of steam dissipation, distant melodic chimes of scrap metal in night wind, subtle low-frequency cinematic drone echoing with quiet triumph.",
      soundEffects: "Steam dissipation, subtle atmospheric chime drone",
      estimatedDurationSeconds: 8,
      shotSize: "HERO_CLOSE_UP",
      cameraAngle: "EYE_LEVEL",
      cameraMovement: "SLOW_PULL_BACK_HERO",
      audio:
        "Pure Binaural ASMR: Soft, gentle whisper of fading steam, subtle reverberant clink of fine ceramic, ambient low hum.",
    },
  ];

  // 4. Save Story Artifacts
  const logline =
    "Episode 2 of Inedible Gourmet ASMR (60s-90s Master Edition): The Shadow Alchemist transforms a retro translucent Game Boy Color into a sizzling street-food tempura with 12 deliberate, high-retention tactile craft scenes.";

  const premise =
    "Inside a moody neon-lit e-waste scrapyard, the masked Alchemist Chef hunts for nostalgic gaming relics to transform through haute cuisine. Recovering a vintage translucent Game Boy Color, he extracts its D-pad and magenta action buttons, slices flat ribbon cables into vibrant tempura noodles, snaps the PCB board like artisan chocolate, and tosses them in a roaring wok before artfully plating a 3-star Michelin sculpture.";

  const synopsis =
    "STORY ARC & NARRATIVE SYNOPSIS:\n\n" +
    "ACT 1 (Setup & Hook - Scenes 1-4):\n" +
    "Amid towering stacks of glowing CRT monitors and neon scrap, the chef discovers a vintage translucent purple Game Boy Color. He violently pops the golden cartridge free with an echoing snap, places it on his walnut butcher block, and meticulously extracts the rubber D-pad and magenta A/B buttons with surgical tweezers into a hammered brass bowl.\n\n" +
    "ACT 2 (Escalation & Craft - Scenes 5-9):\n" +
    "The chef uses a heavy Japanese santoku knife to slice wide rainbow ribbon cables into delicate noodles, fractures the green motherboard clean down the middle like crisp chocolate, grinds ceramic capacitors into seasoned spice powder, and ignites a roaring 14-inch wok over intense blue flame.\n\n" +
    "ACT 3 (Climax & Viral Payoff - Scenes 10-12):\n" +
    "He dumps the seasoned Game Boy hardware into the smoking wok, tossing them vigorously as golden sparks and steam billow. The glaze reduces into a thick, stretchable caramel consistency coating the glossy buttons and circuitry. He artfully plates the dish onto a pristine white ceramic coupe plate with a bold glaze swoosh, fanned circuit chips, and golden cartridge crown, before stepping back with calm culinary triumph.";

  const screenplayJson = {
    title: "The Vintage Game Boy Tempura (ASMR)",
    scenes: scenesData,
    totalEstimatedDurationSeconds: 90,
  };

  const artifactsToCreate = [
    { type: "LOGLINE", content: logline },
    { type: "PREMISE", content: premise },
    { type: "SYNOPSIS", content: synopsis },
    { type: "SCREENPLAY", content: JSON.stringify(screenplayJson, null, 2) },
  ];

  for (const art of artifactsToCreate) {
    const artifact = await prisma.storyArtifact.create({
      data: {
        projectId,
        artifactType: art.type,
        approvalStatus: "APPROVED",
        versions: {
          create: {
            versionNumber: 1,
            contentText: art.content,
            source: "AI",
            createdByUserId: ownerId,
          },
        },
      },
      include: { versions: true },
    });

    await prisma.storyArtifact.update({
      where: { id: artifact.id },
      data: { currentVersionId: artifact.versions[0]?.id },
    });
  }

  // 5. Create Database Scenes & Shots for Storyboard Studio
  for (const sc of scenesData) {
    const dbScene = await prisma.scene.create({
      data: {
        projectId,
        sceneNumber: sc.sceneNumber,
        heading: sc.heading,
        location: sc.location,
        timeOfDay: sc.timeOfDay,
        actionSummary: sc.action,
        estimatedDurationSeconds: sc.estimatedDurationSeconds,
      },
    });

    const negativeConstraintsJson = JSON.stringify({
      dialogue: "",
      voiceover: "",
      audioPrompt: sc.audioScript,
    });

    await prisma.shot.create({
      data: {
        projectId,
        sceneId: dbScene.id,
        shotNumber: sc.sceneNumber,
        actionDescription: sc.action,
        shotSize: sc.shotSize,
        cameraAngle: sc.cameraAngle,
        cameraMovement: sc.cameraMovement,
        targetDurationSeconds: sc.estimatedDurationSeconds,
        negativeConstraints: negativeConstraintsJson,
        videoPrompt: sc.action,
        aspectRatio: "9:16",
        approvalStatus: "APPROVED",
      },
    });
  }

  console.log(`Episode 2 successfully created with 12 scenes and full story artifacts!`);
  console.log(`URL: http://localhost:3000/projects/${projectId}/story`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
