import { describe, it, expect } from "vitest";
import { generateSocialLaunchKit } from "@/lib/story/launch-kit";

describe("Social Launch Kit & Thumbnail Engine", () => {
  const sampleProject = {
    id: "cmwg5nczz0001u88sld5gnrmd",
    title: "The Mechanical Keyboard Stir-Fry",
    description: "An artisan chef cooks a mechanical keyboard in a wok.",
    visualStyle: "CULINARY_ASMR",
    aspectRatio: "PORTRAIT_9_16",
    productionAssets: [
      {
        assetType: "CHARACTER",
        name: "The Shadow Alchemist",
        description: "Artisan chef with vintage brass goggles and black half-mask",
      },
    ],
  };

  it("compiles verified high-CTR thumbnail prompts for both 16:9 and 9:16", () => {
    const kit = generateSocialLaunchKit(sampleProject);

    // 16:9 Landscape (Ref 3: Alchemist Feast with Sizzling Wok)
    expect(kit.thumbnailPrompts.landscape16x9).toContain("@TheShadowAlchemist");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("fractured, severed rectangular chunk");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("raw green PCB circuit board backing");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("seasoned black carbon-steel culinary wok sits sizzling");
    expect(kit.thumbnailPrompts.landscape16x9).not.toContain("white ceramic dinner plate");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("NO username on image");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("Viral Text Header Directive");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("DO NOT EAT THIS!");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("heavy bold YouTube action display font");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("rich fiery sunset gradient");
    expect(kit.thumbnailPrompts.landscape16x9).not.toContain("NO text");
    expect(kit.thumbnailPrompts.landscape16x9).not.toContain("NO font overlay");

    // 9:16 Vertical (Ref 3: Alchemist Feast with Sizzling Wok)
    expect(kit.thumbnailPrompts.portrait9x16).toContain("@TheShadowAlchemist");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("athletic male artisan culinary alchemist chef");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("fractured, severed rectangular chunk");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("seasoned black carbon-steel culinary wok sits sizzling");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("white ceramic dinner plate");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("crimson-red ESC keycap");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("Viral Text Header Directive");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("DO NOT EAT THIS!");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("heavy bold YouTube action display font");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("rich fiery sunset gradient");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("NO text");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("NO typography");

    // Invariant Viral Headline Directives for Text-Capable AI Generators (Google Flow / Imagen 3)
    expect(kit.thumbnailPrompts.portrait9x16WithHeadline).toContain("Viral Text Header Directive");
    expect(kit.thumbnailPrompts.portrait9x16WithHeadline).toContain("DO NOT EAT THIS!");
    expect(kit.thumbnailPrompts.landscape16x9WithHeadline).toContain("Viral Text Header Directive");
    expect(kit.thumbnailPrompts.landscape16x9WithHeadline).toContain("DO NOT EAT THIS!");

    // Hero Food Crack / Pull (Ref 4 Money Shot + Ref 3 Feast Plate Hybrid)
    expect(kit.thumbnailPrompts.heroFoodCrack).toBeDefined();
    expect(kit.thumbnailPrompts.heroFoodCrack16x9).toBeDefined();
    expect(kit.thumbnailPrompts.heroFoodCrack).toContain("DO NOT EAT THIS!");
    expect(kit.thumbnailPrompts.heroFoodCrack).toContain("Character Asset Reference: @TheShadowAlchemist");
    expect(kit.thumbnailPrompts.heroFoodCrack).toContain("Two black-gloved hands cracking open");
    expect(kit.thumbnailPrompts.heroFoodCrack).toContain("wide circular clean white ceramic dinner plate");
    expect(kit.thumbnailPrompts.heroFoodCrack).toContain("raw fractured rectangular chunk");

    // Dual 3-Second Opening Hook Prompts (Pre-Scene Hooks)
    expect(kit.hookPrompts).toBeDefined();
    expect(kit.hookPrompts.optionA_cleaverSlam.title).toContain("Hook Option 1: Acoustic Cleaver Spark Slam");
    expect(kit.hookPrompts.optionA_cleaverSlam.googleFlowPrompt).toContain("0:00 - 0:03");
    expect(kit.hookPrompts.optionA_cleaverSlam.googleFlowPrompt).toContain("violently slam");
    expect(kit.hookPrompts.optionA_cleaverSlam.googleFlowPrompt).toContain("Damascus steel kitchen cleaver");
    expect(kit.hookPrompts.optionB_sizzleDrop.title).toContain("Hook Option 2: Sizzling Pan Drop Teaser");
    expect(kit.hookPrompts.optionB_sizzleDrop.googleFlowPrompt).toContain("0:00 - 0:03");
    expect(kit.hookPrompts.optionB_sizzleDrop.googleFlowPrompt).toContain("scorching-hot");
    expect(kit.thumbnailPrompts.hookOptionA_cleaverSlam).toBeDefined();
    expect(kit.thumbnailPrompts.hookOptionB_sizzleDrop).toBeDefined();
  });

  it("generates YouTube launch suite with high-CTR titles, safety disclaimer and foley notes", () => {
    const kit = generateSocialLaunchKit(sampleProject);

    expect(kit.youtube.titles.length).toBeGreaterThanOrEqual(3);
    expect(kit.youtube.titles[0]).toContain("Mechanical Keyboard");
    expect(kit.youtube.description).toContain(kit.safetyDisclaimer);
    expect(kit.youtube.description).toContain("TIMESTAMPS");
    expect(kit.youtube.description).toContain("SOUND & FOLEY");
    expect(kit.youtube.tags).toContain("Mechanical Keyboard");
    expect(kit.youtube.hashtags).toContain("#ASMR");
  });

  it("generates Instagram Reels launch package with engagement CTA and pinned comment", () => {
    const kit = generateSocialLaunchKit(sampleProject);

    expect(kit.instagram.caption).toContain("Who said mechanical keyboards are only for typing?");
    expect(kit.instagram.caption).toContain(kit.safetyDisclaimer);
    expect(kit.instagram.audioRecommendation).toContain("ASMR");
    expect(kit.instagram.hashtags).toContain("#reels");
    expect(kit.instagram.hashtags).toContain("#asmrfood");
    expect(kit.instagram.pinnedComment).toContain("MENU POLL");
  });

  it("dynamically generates Game Boy Tempura launch kit with authentic retro gaming props and foley", () => {
    const gameboyProject = {
      id: "cmwja2y3t0001u8qgfh5w3gtj",
      title: "The Vintage Game Boy Tempura (ASMR)",
      description: "Episode 2 of Inedible Gourmet ASMR: 20s Viral Rapid ASMR Masterpiece.",
      sourceIdea: "A rogue masked alchemist chef transforms a vintage translucent Game Boy Color into an acoustic tempura masterwork.",
      visualStyle: "CULINARY_MACRO_ASMR",
      aspectRatio: "PORTRAIT_9_16",
      productionAssets: [
        {
          assetType: "CHARACTER",
          name: "The Shadow Alchemist Chef",
          description: "Vintage brass tinker goggles, sleek matte-black half-mask",
        },
      ],
    };

    const kit = generateSocialLaunchKit(gameboyProject);

    expect(kit.thumbnailPrompts.portrait9x16).toContain("@TheShadowAlchemist");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("translucent purple Game Boy Color");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("golden Pokémon 8-bit cartridge slot");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("golden tempura-battered emerald circuit board chips");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("magenta A/B buttons");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("Cherry MX");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("mechanical keyboard");

    expect(kit.youtube.titles[0]).toContain("Vintage Game Boy");
    expect(kit.youtube.description).toContain("1x Vintage Translucent Purple Game Boy Color");
    expect(kit.youtube.description).toContain("Pokémon Cartridge");
    expect(kit.youtube.hashtags).toContain("#GameBoy");
    expect(kit.youtube.hashtags).toContain("#Tempura");

    expect(kit.instagram.caption).toContain("Who said a vintage Game Boy is only for gaming?");
    expect(kit.instagram.audioRecommendation).toContain("Game Boy Snap");
  });

  it("dynamically generates Vintage Bicycle launch kit with giant Indian catering kadai and jhara skimmer", () => {
    const bicycleProject = {
      id: "cmwk9xl1n0001u8q004v0ob0z",
      title: "Episode 3: The Vintage Bicycle Gourmet Feast (ASMR)",
      description: "60s Gourmet ASMR Masterclass.",
      sourceIdea: "This time we are going to cook the one cycle. the complete bicycle that we use chain, tire, and seat sponge as ingredients. we do all types of cooking preparations like dicing, grating, deep-fry in huge catering kadai.",
      visualStyle: "CULINARY_MACRO_ASMR",
      aspectRatio: "PORTRAIT_9_16",
      productionAssets: [
        {
          assetType: "CHARACTER",
          name: "The Shadow Alchemist Chef",
          description: "Vintage brass tinker goggles, sleek matte-black half-mask",
        },
      ],
    };

    const kit = generateSocialLaunchKit(bicycleProject);

    expect(kit.thumbnailPrompts.portrait9x16).toContain("@TheShadowAlchemist");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("dismantled vintage bicycle");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("colossal 4-foot Indian wedding catering iron kadai");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("colossal 3-foot Indian wedding catering iron perforated skimmer (jhara)");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("golden-crispy deep-fried bicycle chain tempura noodles");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("Cherry MX");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("mechanical keyboard");

    expect(kit.youtube.titles[0]).toContain("Vintage Bicycle");
    expect(kit.youtube.titles[0]).toContain("Indian Catering Cauldron");
    expect(kit.youtube.description).toContain("1x Vintage Steel Road Bicycle");
    expect(kit.youtube.description).toContain("Colossal Indian Catering Kadai Oil Bath");
    expect(kit.youtube.hashtags).toContain("#Bicycle");
    expect(kit.youtube.hashtags).toContain("#GiantKadai");

    expect(kit.instagram.caption).toContain("Who said a vintage bicycle is only for riding?");
    expect(kit.instagram.caption).toContain("colossal 4-foot Indian wedding catering iron kadai");
    expect(kit.instagram.audioRecommendation).toContain("Giant Kadai Oil Sizzle");
  });

  it("dynamically generates Mountain Quartz & Granite Idiyappam launch kit without keyboard leakage", () => {
    const stoneProject = {
      id: "cmwu6g84a0001u8skiihv186r",
      title: "Episode 7: The Mountain Quartz & Granite Stones Idiyappam Feast (ASMR)",
      description: "60s ASMR Masterclass: Transforming raw quarry stones into South Indian Idiyappam.",
      sourceIdea: "Sourcing raw mountain quartz boulders and granite rocks, crushing with edge-runner mill, scalding mineral flour, extruding with brass flywheel press, and steaming idiyappam.",
      visualStyle: "CULINARY_MACRO_ASMR",
      aspectRatio: "16:9",
      productionAssets: [
        {
          assetType: "CHARACTER",
          name: "The Shadow Alchemist Chef",
          description: "Vintage brass tinker goggles, sleek matte-black half-mask",
        },
      ],
    };

    const kit = generateSocialLaunchKit(stoneProject);

    expect(kit.thumbnailPrompts.landscape16x9).toContain("@TheShadowAlchemist");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("sparkling white mountain quartz crystal boulder");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("translucent optical-quartz silica glass noodle threads");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("tiered polished brass idiyappam steamer pot");
    expect(kit.thumbnailPrompts.landscape16x9).not.toContain("white ceramic dinner plate");
    expect(kit.thumbnailPrompts.landscape16x9).not.toContain("Cherry MX");
    expect(kit.thumbnailPrompts.landscape16x9).not.toContain("mechanical keyboard");
    expect(kit.thumbnailPrompts.heroFoodCrack).toBeDefined();
    expect(kit.thumbnailPrompts.heroFoodCrack).toContain("nest of translucent optical-quartz silica glass noodle threads");
    expect(kit.thumbnailPrompts.heroFoodCrack).toContain("sleek matte-black ceramic serving platter");
    expect(kit.thumbnailPrompts.heroFoodCrack).toContain("raw, jagged sparkling white mountain quartz crystal boulder");

    expect(kit.youtube.titles[0]).toContain("Mountain Quartz & Granite Stones into Idiyappam");
    expect(kit.youtube.titles[1]).toContain("Steamed String Hoppers");
    expect(kit.youtube.titles.join(" ")).not.toContain("Mechanical Keyboard");
    expect(kit.youtube.titles.join(" ")).not.toContain("keyboard");
    expect(kit.youtube.description).toContain("50kg Raw Mountain White Quartz Crystal Boulders");
    expect(kit.youtube.description).toContain("Cast-Brass Extruder Press");
    expect(kit.youtube.hashtags).toContain("#Idiyappam");
    expect(kit.youtube.hashtags).toContain("#QuartzCooking");

    expect(kit.instagram.caption).toContain("Who said mountain quartz and granite stones can't be steamed into delicate idiyappam string hoppers?");
    expect(kit.instagram.caption).not.toContain("mechanical keyboard");
  });

  it("dynamically generates launch kit for an unpredictable future object (Quadcopter Drone Biryani) from storyboard scenes", () => {
    const droneProject = {
      id: "cmw-unpredictable-drone-001",
      title: "Episode 8: The Quadcopter Drone Biryani Feast (ASMR)",
      description: "Harvesting carbon-fiber drone frames and copper brushless motors into Dum Biryani.",
      sourceIdea: "We dismantle a drone in a hangar, slice carbon-fiber propeller blades into saffron basmati rice, sauté motor stators, and layer into a sealed brass handi.",
      visualStyle: "CULINARY_MACRO_ASMR",
      aspectRatio: "16:9",
      scenes: [
        {
          sceneNumber: 1,
          heading: "INT. HANGAR - DAY - HOOK",
          actionSummary: "Slamming quadcopter drone onto steel workbench and snapping rotor arm with sparks.",
          estimatedDurationSeconds: 8,
        },
        {
          sceneNumber: 2,
          heading: "INT. WORKSHOP - DAY - MOTOR DISASSEMBLY",
          actionSummary: "Unscrewing four brushless copper motors and prying neodymium magnet bells.",
          estimatedDurationSeconds: 8,
        },
        {
          sceneNumber: 3,
          heading: "INT. KITCHEN - NIGHT - PROPELLER RICE SHRED",
          actionSummary: "Shaving carbon-fiber propeller blades into paper-thin saffron long-grain rice threads.",
          estimatedDurationSeconds: 8,
        },
        {
          sceneNumber: 4,
          heading: "INT. KITCHEN - NIGHT - MOTOR MASALA SAUTE",
          actionSummary: "Searing copper motor coils and golden capacitor spices in ghee.",
          estimatedDurationSeconds: 8,
        },
        {
          sceneNumber: 5,
          heading: "INT. KITCHEN - NIGHT - DUM HANDI SEAL",
          actionSummary: "Layering carbon rice and copper motors in sealed brass handi pot over glowing coals.",
          estimatedDurationSeconds: 8,
        },
        {
          sceneNumber: 6,
          heading: "INT. KITCHEN - NIGHT - DUM STEAM BREAK",
          actionSummary: "Cutting through flour dough seal on brass handi releasing aromatic cloud of culinary steam.",
          estimatedDurationSeconds: 8,
        },
        {
          sceneNumber: 7,
          heading: "INT. KITCHEN - NIGHT - ROYAL THALI PLATING",
          actionSummary: "Scooping steaming carbon propeller saffron rice and copper motors onto banana leaf thali.",
          estimatedDurationSeconds: 8,
        },
        {
          sceneNumber: 8,
          heading: "INT. KITCHEN - NIGHT - HERO BITE & SPOON LIFT",
          actionSummary: "Lifting brass spoon with steaming drone biryani into camera with chef thumbs-up.",
          estimatedDurationSeconds: 8,
        },
      ],
      productionAssets: [
        {
          assetType: "CHARACTER",
          name: "The Shadow Alchemist Chef",
          description: "Vintage brass tinker goggles, sleek matte-black half-mask",
        },
      ],
    };

    const kit = generateSocialLaunchKit(droneProject);

    // 1. Verifies dynamic object & dish extraction
    expect(kit.youtube.titles[0]).toContain("Quadcopter Drone into Biryani");
    expect(kit.youtube.titles.join(" ")).not.toContain("Mechanical Keyboard");
    expect(kit.youtube.titles.join(" ")).not.toContain("keyboard");

    // 2. Verifies dynamic storyboard timestamps extracted from the 8 scenes
    expect(kit.youtube.description).toContain("0:00 - HANGAR");
    expect(kit.youtube.description).toContain("0:08 - WORKSHOP");
    expect(kit.youtube.description).toContain("0:16 - KITCHEN");
    expect(kit.youtube.description).toContain("0:48 - KITCHEN");

    // 3. Verifies thumbnail prompts reflect drone materials without leakage
    expect(kit.thumbnailPrompts.landscape16x9).toContain("Quadcopter Drone");
    expect(kit.thumbnailPrompts.landscape16x9).not.toContain("Cherry MX");
    expect(kit.thumbnailPrompts.landscape16x9).not.toContain("mechanical keyboard");

    // 4. Verifies dynamic social caption
    expect(kit.instagram.caption).toContain("quadcopter drone");
    expect(kit.instagram.caption).toContain("biryani");
  });

  it("dynamically generates Bulk Vintage Nokia Phones launch kit with authentic street dosa tawa and banana-leaf thali without quartz leakage", () => {
    const nokiaProject = {
      id: "cmwj-nokia-004",
      title: "Episode 4: Bulk Vintage Nokia Mobile Phones Feast (ASMR)",
      description: "60s ASMR Masterclass: Sautéing 15 indestructible Nokia phones on a street dosa tawa into copper ribbon noodles and keypad paneer.",
      sourceIdea: "Dumping 15 vintage Nokia phones, pulverizing PCBs into emerald mixie powder, sautéing copper ribbon noodles on a street dosa tawa, and plating onto banana leaf thali.",
      visualStyle: "CULINARY_MACRO_ASMR",
      aspectRatio: "PORTRAIT_9_16",
      productionAssets: [
        {
          assetType: "CHARACTER",
          name: "The Shadow Alchemist Chef",
          description: "Vintage brass tinker goggles, sleek matte-black half-mask",
        },
      ],
    };

    const kit = generateSocialLaunchKit(nokiaProject);

    // Ref 3: Alchemist Feast features the authentic street dosa tawa from scenes 4-6
    expect(kit.thumbnailPrompts.portrait9x16).toContain("seasoned black iron street dosa tawa sits sizzling");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("white ceramic dinner plate");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("quartz");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("granite");

    // Ref 4: Hero Food Crack features the contrasting banana-leaf lined brass thali from scenes 7-8
    expect(kit.thumbnailPrompts.heroFoodCrack).toContain("traditional Indian embossed brass serving thali platter lined with a vibrant fresh green banana leaf");
    expect(kit.thumbnailPrompts.heroFoodCrack).toContain("copper ribbon noodles");
    expect(kit.thumbnailPrompts.heroFoodCrack).not.toContain("quartz");
    expect(kit.thumbnailPrompts.heroFoodCrack).not.toContain("granite");

    expect(kit.youtube.titles[0]).toContain("Nokia");
  });
});
