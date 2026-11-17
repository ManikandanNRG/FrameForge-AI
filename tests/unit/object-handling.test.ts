import { describe, it, expect } from "vitest";
import {
  detectPhysicalEntities,
  resolveObjectComponentSpecs,
  groundActionComponentScale,
  OBJECT_COMPONENT_REGISTRY,
} from "../../src/lib/story/world-engine";
import { compileCinematicPrompt } from "../../src/lib/story/prompt-compiler";
import { generateInediblePipelineScenes } from "../../src/lib/story/inedible-pipeline";

describe("Universal Physical Object Registry & Scaling Engine", () => {
  it("resolves bicycle dimensional anchors and bans car/truck tires and heavy tow chains", () => {
    const specs = resolveObjectComponentSpecs("Bicycle", "slender road bike with tire and chain");
    expect(specs.category).toBe("BICYCLE_VEHICLE");
    expect(specs.isLargeObject).toBe(true);
    expect(specs.defaultVessel).toContain("oversized industrial steel catering tawa");
    expect(specs.defaultVessel).toContain("giant high-capacity catering kadai");

    // Must compile negative tokens banning automotive scale drift
    expect(specs.negativeTokens).toContain("car tire");
    expect(specs.negativeTokens).toContain("truck tire");
    expect(specs.negativeTokens).toContain("tractor tire");
    expect(specs.negativeTokens).toContain("heavy tow chain");
    expect(specs.negativeTokens).toContain("anchor chain");
  });

  it("grounds unanchored tire and chain nouns to bike-proportional scale", () => {
    const grounded = groundActionComponentScale(
      "Two vintage steel tire levers wedge firmly under the rubber tire bead on the spoked wheel rim and unseat the tire.",
      "Bicycle"
    );

    expect(grounded.groundedText).toContain("slender 28mm narrow road bike rubber tire");
    expect(grounded.negativeTokens).toContain("car tire");
    expect(grounded.negativeTokens).toContain("truck tire");
    expect(grounded.negativeTokens).toContain("tractor tire");
  });

  it("resolves mechanical keyboard, watch, and camera with proportional anchors", () => {
    const keyboardSpecs = resolveObjectComponentSpecs("Mechanical Keyboard", "keycap puller switch");
    expect(keyboardSpecs.category).toBe("MECHANICAL_KEYBOARD");
    expect(keyboardSpecs.extractionTools).toContain("wire keycap puller");
    expect(keyboardSpecs.negativeTokens).toContain("typewriter keys");
    expect(keyboardSpecs.negativeTokens).toContain("piano keys");

    const watchSpecs = resolveObjectComponentSpecs("Luxury Watch", "watch escapement gear balance wheel");
    expect(watchSpecs.category).toBe("WATCH_HOROLOGY");
    expect(watchSpecs.negativeTokens).toContain("grandfather clock gear");
    expect(watchSpecs.negativeTokens).toContain("clock tower cog");

    const cameraSpecs = resolveObjectComponentSpecs("Vintage Camera", "50mm lens element iris");
    expect(cameraSpecs.category).toBe("CAMERA_OPTICS");
    expect(cameraSpecs.negativeTokens).toContain("drinking glass");
    expect(cameraSpecs.negativeTokens).toContain("magnifying glass");
  });
});

describe("Entity Detection Robustness (Anti-Stop-Word Bug)", () => {
  it("detects Vintage Bicycle from colloquial Indian English descriptions without capturing stop words", () => {
    const detected = detectPhysicalEntities(
      "Episode 3: The Vintage Bicycle Gourmet Feast (ASMR)",
      "This time we are going to cook the one cycle. the complete bycycle that we use chain, tier, and seat sponch as incrediants. we just not to cut in the table. we can do all type of cooking prepartions like dicing, graiding, etc...."
    );

    expect(detected.isInedibleCooking).toBe(true);
    expect(detected.inedibleHeroObject).toBe("Vintage Bicycle");
    expect(detected.inedibleHeroObject).not.toBe("The");
    expect(detected.inedibleHeroObject).not.toBe("One");
  });

  it("detects keyboards, walkmans, watches, and custom objects accurately", () => {
    expect(
      detectPhysicalEntities("Keyboard Feast", "cooks a vintage mechanical keyboard").inedibleHeroObject
    ).toBe("Mechanical Keyboard");

    expect(
      detectPhysicalEntities("Walkman Stir-Fry", "cooks a vintage Sony Walkman cassette player").inedibleHeroObject
    ).toBe("Vintage Audio Player");

    expect(
      detectPhysicalEntities("Watch Sizzle", "cooks a luxury mechanical watch").inedibleHeroObject
    ).toBe("Mechanical Watch");

    expect(
      detectPhysicalEntities("Drone Sear", "cooks a titanium quadcopter drone").inedibleHeroObject
    ).toBe("Titanium quadcopter drone");
  });
});

describe("Prompt Compiler Chronological Station Precedence", () => {
  it("prioritizes TOOL_DISASSEMBLY over knife cutting when extraction tools are present", () => {
    const compiled = compileCinematicPrompt({
      actionDescription:
        "[0:00-0:03] Two vintage steel tire levers wedge firmly under the rubber tire bead on the spoked wheel rim. [0:03-0:05] Slices rubber crosswise with utility knife into calamari rings.",
      characterName: "The Shadow Alchemist",
      characterDescription: "Artisan alchemist in brass goggles and tactical mask",
      wardrobeLock: "leather apron, black gloves",
      locationDescription: "Dark Walnut End-Grain Butcher Block",
      heroObject: "Bicycle",
      targetDurationSeconds: 8,
      sourceIdea: "Cooking a bicycle with tire and chain",
    });

    // Station classification must prioritize tool disassembly
    expect(compiled.culinaryStation).toBe("TOOL_DISASSEMBLY");

    // Action dynamics must forbid knife cutting on board before extraction completes
    expect(compiled.videoMotionPrompt).toContain(
      "Stage 1 mechanical extraction from host object MUST complete fully before Stage 2 prep, cutting, or grating begins"
    );
    expect(compiled.videoMotionPrompt).toContain("Do NOT begin with cutting on a board or cooking before extraction is complete");

    // Universal negative prompt must ban car/truck tires and heavy scale drift
    expect(compiled.universalNegativePrompt).toContain("car tire");
    expect(compiled.universalNegativePrompt).toContain("truck tire");
    expect(compiled.universalNegativePrompt).toContain("tractor tire");
  });

  it("injects oversized catering tawa and kadai for large objects", () => {
    const compiled = compileCinematicPrompt({
      actionDescription: "Black-gloved hands lower glazed chain into bubbling oil and sear calamari on griddle",
      characterName: "The Shadow Alchemist",
      heroObject: "Bicycle",
      targetDurationSeconds: 8,
      sourceIdea: "cooking a complete cycle",
    });

    expect(compiled.culinaryStation).toBe("STOVE_COOK");
    expect(compiled.videoMotionPrompt).toContain("Oversized commercial catering tawa or giant deep catering kadai");
    expect(compiled.universalNegativePrompt).toContain("tiny domestic frying pan");
    expect(compiled.universalNegativePrompt).toContain("small kitchen skillet");
  });

  it("strictly enforces [@TheShadowAlchemist] handle and bans [@TheShadowAlchemistchef]", () => {
    const compiled = compileCinematicPrompt({
      actionDescription: "Camera tilts up to [@TheShadowAlchemist] who nods and flashes thumbs-up",
      characterName: "The Shadow Alchemist Chef", // Intentional dirty input
      heroObject: "Bicycle",
      targetDurationSeconds: 7,
    });

    expect(compiled.googleFlowPrompt).toContain("[@TheShadowAlchemist]");
    expect(compiled.googleFlowPrompt).not.toContain("[@TheShadowAlchemistchef]");
    expect(compiled.googleFlowPrompt).not.toContain("[@TheShadowAlchemistChef]");
    expect(compiled.googleFlowPrompt).not.toContain("The Shadow Alchemist Chef");
  });
});

describe("Universal 4-Stage Inedible Craft-Culinary Pipeline Generator", () => {
  it("generates 8 chronological scenes for 60s target runtime with catering cookware and molten glaze pull", () => {
    const result = generateInediblePipelineScenes({
      heroObject: "Vintage Bicycle",
      sourceIdea: "cycle cooking with chain and tire",
      studioEnvironment: "Dark Walnut End-Grain Butcher Block",
      targetRuntime: 60,
      episodeNumber: 3,
    });

    expect(result.scenes.length).toBe(8);

    // Scene 1: Disassembly Hook with authentic tools
    expect(result.scenes[0].heading).toContain("RAW BICYCLE HOOK & WHEEL UNBOLT");
    expect(result.scenes[0].action).toContain("vintage steel tire levers");

    // Scene 3: Dicing sponge tofu & calamari rings
    expect(result.scenes[2].heading).toContain("FOAM TOFU DICING & TIRE CALAMARI RINGS");
    expect(result.scenes[2].action).toContain("1-inch golden 'tofu' cubes");
    expect(result.scenes[2].action).toContain("squid-ink-black 'calamari rings'");

    // Scene 4: Four-sided box grater
    expect(result.scenes[3].heading).toContain("STAINLESS BOX GRATER TIRE SHAVINGS");
    expect(result.scenes[3].action).toContain("four-sided box grater");
    expect(result.scenes[3].action).toContain("black rubber 'truffle shavings'");

    // Scene 5: Massive Indian catering kadai
    expect(result.scenes[4].heading).toContain("MASSIVE INDIAN CATERING KADAI DEEP-FRY");
    expect(result.scenes[4].action).toContain("massive high-capacity catering kadai");

    // Scene 6: Oversized steel catering tawa
    expect(result.scenes[5].heading).toContain("OVERSIZED CATERING TAWA SEAR");
    expect(result.scenes[5].action).toContain("oversized commercial catering flat-top steel tawa");
    expect(result.scenes[5].action).toContain("thick caramelized molten glaze stretches");

    // Scene 8: Hero crunch pull with molten caramelized glaze stretch and thumbs-up
    expect(result.scenes[7].heading).toContain("MOLTEN GLAZE CRUNCH PULL & CHEF THUMBS-UP");
    expect(result.scenes[7].action).toContain("melted caramelized golden glaze stretch");
    expect(result.scenes[7].action).toContain("[@TheShadowAlchemist]");
    expect(result.scenes[7].action).toContain("thumbs-up");

    // Thumbnail prompt generated
    expect(result.thumbnailPrompt).toContain("split-screen thumbnail");
    expect(result.thumbnailPrompt).toContain("[@TheShadowAlchemist]");
    expect(result.thumbnailPrompt).toContain("caramelized glaze stretching");
  });
});
