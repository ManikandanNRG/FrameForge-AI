import { describe, it, expect } from "vitest";
import {
  detectPhysicalEntities,
  UNIVERSAL_PHYSICAL_LAWS,
} from "@/lib/story/world-engine";
import { compileCinematicPrompt } from "@/lib/story/prompt-compiler";

describe("Culinary ASMR & Dynamic Camera Engine", () => {
  it("accurately detects culinary actions and focal types", () => {
    const knifePrep = detectPhysicalEntities("Chef slices crisp scallions and garlic on a wooden cutting board");
    expect(knifePrep.hasCulinaryAction).toBe(true);
    expect(knifePrep.culinaryFocus).toBe("knife_prep");

    const panSizzle = detectPhysicalEntities("Butter melts and sizzles vigorously in a hot cast-iron skillet");
    expect(panSizzle.hasCulinaryAction).toBe(true);
    expect(panSizzle.culinaryFocus).toBe("pan_sizzle");

    const nonCulinary = detectPhysicalEntities("A young boy sprints down a dusty road chasing a kite");
    expect(nonCulinary.hasCulinaryAction).toBe(false);
    expect(nonCulinary.culinaryFocus).toBeUndefined();
  });

  it("compiles master culinary prompt with workstation lock and ASMR Foley", () => {
    const bundle = compileCinematicPrompt({
      actionDescription: "Chef slices seasoned Wagyu beef ribeye into thick succulent medallions on the walnut cutting board.",
      shotSize: "Extreme Close-Up",
      cameraMovement: "Macro probe tracking forward at 60fps",
      visualStyle: "CULINARY_MACRO_ASMR",
      sourceIdea: "Satisfying Japanese Wagyu steak and garlic butter mushroom cooking with intense sizzling and knife chop ASMR",
      characterName: "Chef",
      characterDescription: "Trained chef hands with clean trimmed nails and rolled-up linen shirt sleeves",
      wardrobeLock: "rolled-up linen shirt sleeves, clean hands",
      aspectRatio: "PORTRAIT_9_16",
    });

    // 1. Google Flow master prompt verification
    expect(bundle.googleFlowPrompt).toContain("Master Workstation Continuity");
    expect(bundle.googleFlowPrompt).toContain("85mm probe macro lens");
    expect(bundle.googleFlowPrompt).toContain("Culinary Kinematics & Food Invariants");
    expect(bundle.googleFlowPrompt).toContain("Pure Binaural ASMR Culinary Foley");
    expect(bundle.googleFlowPrompt).toContain("Strictly ZERO spoken dialogue");

    // 2. Anti-hallucination negative matrix verification
    expect(bundle.universalNegativePrompt).toContain("phantom hand");
    expect(bundle.universalNegativePrompt).toContain("floating knife");
    expect(bundle.universalNegativePrompt).toContain("morphing vegetable");
    expect(bundle.universalNegativePrompt).toContain("talking");

    // 3. Kling prompt verification
    expect(bundle.klingPrompt).toContain("macro culinary ASMR");
    expect(bundle.klingPrompt).toContain("Culinary Invariant: Max two hands in frame");
    expect(bundle.klingPrompt).toContain("Pure binaural ASMR culinary Foley");

    // 4. FLUX still verification
    expect(bundle.fluxStillPrompt).toContain("macro culinary food photography");
    expect(bundle.fluxStillPrompt).toContain("Master food photography award winner");

    // 5. I2V Motion prompt verification (Google Flow, Kling, Runway, Luma)
    expect(bundle.videoMotionPrompt).toContain("Start Frame Consistency");
    expect(bundle.videoMotionPrompt).toContain("Google Flow");
    expect(bundle.videoMotionPrompt).toContain("Kling");
    expect(bundle.videoMotionPrompt).toContain("Kinematic Invariant: Max two hands in frame");
  });

  it("handles dynamic top-down flat lay camera framing", () => {
    const bundle = compileCinematicPrompt({
      actionDescription: "Organizing fresh garlic cloves, thyme sprigs, and cubed butter neatly beside the steak.",
      shotSize: "Top-Down Flat Lay",
      visualStyle: "CULINARY_MACRO_ASMR",
    });

    expect(bundle.googleFlowPrompt).toContain("90-degree overhead bird's-eye flat lay perspective");
  });

  it("renders specialized culinary rendering integrity", () => {
    const integrity = UNIVERSAL_PHYSICAL_LAWS.getRenderingIntegrity("CULINARY_MACRO_ASMR");
    expect(integrity).toContain("Ultra-high-definition macro culinary cinema");
    expect(integrity).toContain("50mm and 85mm probe macro lens optics");
    expect(integrity).toContain("Strictly NO phantom hands");
    expect(integrity).toContain("NO floating knives");
    expect(integrity).toContain("NO morphing food");
  });

  it("detects and compiles inedible technical object cooking with Macro lock and anti-cube negative matrix", () => {
    const entities = detectPhysicalEntities("Chef uses keycap puller to pop mechanical keycaps off custom keyboard onto butcher block");
    expect(entities.isInedibleCooking).toBe(true);
    expect(entities.inedibleHeroObject).toBe("Mechanical Keyboard");

    const bundle = compileCinematicPrompt({
      actionDescription: "Chef uses wire keycap puller to pop matte-black keycaps off the keyboard plate into a stainless bowl.",
      shotSize: "Medium Shot",
      sourceIdea: "Rogue chef cooks a gourmet stir-fry from a custom mechanical keyboard",
      visualStyle: "CULINARY_MACRO_ASMR",
      heroPropLock: "Custom Matte-Black Mechanical Keyboard with red ESC key",
      aspectRatio: "PORTRAIT_9_16",
    });

    // 1. Inedible hardware continuity and Prop Lock
    expect(bundle.googleFlowPrompt).toContain("Inedible Craft-Culinary Continuity");
    expect(bundle.googleFlowPrompt).toContain("Custom Matte-Black Mechanical Keyboard with red ESC key");
    expect(bundle.googleFlowPrompt).toContain("Inedible Object Cooking & Material Invariants");

    // 2. Macro Framing upgrade for small components
    expect(bundle.googleFlowPrompt).toContain("Macro Close-Up Shot");
    expect(bundle.googleFlowPrompt).toContain("85mm probe macro lens");

    // 3. Strict anti-cube, anti-tofu, anti-food negative matrix
    expect(bundle.universalNegativePrompt).toContain("generic cubes");
    expect(bundle.universalNegativePrompt).toContain("plain plastic blocks");
    expect(bundle.universalNegativePrompt).toContain("tofu");
    expect(bundle.universalNegativePrompt).toContain("dice");
    expect(bundle.universalNegativePrompt).toContain("wheat noodles");
    expect(bundle.universalNegativePrompt).toContain("pasta");

    // 4. Inedible rendering integrity
    const integrity = UNIVERSAL_PHYSICAL_LAWS.getRenderingIntegrity("CULINARY_MACRO_ASMR", "Mechanical keyboard cooking ASMR");
    expect(integrity).toContain("Ultra-high-definition macro craft-culinary cinema");
    expect(integrity).toContain("Strictly NO generic cubes");
    expect(integrity).toContain("NO tofu");
    expect(integrity).toContain("NO wheat noodles");
  });

  it("dynamically adapts to ANY arbitrary non-food object (e.g. Luxury Mechanical Watch, Sneaker, Stones)", () => {
    // 1. Dynamic Watch Cooking
    const watchEntities = detectPhysicalEntities("Chef unclasps a luxury mechanical watch, disassembles the brass gears and mainspring onto the board");
    expect(watchEntities.isInedibleCooking).toBe(true);
    expect(watchEntities.inedibleHeroObject).toBe("Mechanical Watch");

    const watchBundle = compileCinematicPrompt({
      actionDescription: "Chef uses precision watchmaker tweezers to arrange golden gears and rubies on the dark slate.",
      heroObject: "Vintage Rolex Submariner Watch",
      heroPropLock: "Vintage Rolex Submariner with gold balance wheel and exposed tourbillon",
      visualStyle: "CULINARY_MACRO_ASMR",
    });

    expect(watchBundle.googleFlowPrompt).toContain("Vintage Rolex Submariner Watch");
    expect(watchBundle.googleFlowPrompt).toContain("Vintage Rolex Submariner with gold balance wheel");
    expect(watchBundle.googleFlowPrompt).toContain("Inedible Object Cooking & Material Invariants");
    expect(watchBundle.googleFlowPrompt).toContain("Macro Close-Up Shot");
    expect(watchBundle.universalNegativePrompt).toContain("generic cubes");
    expect(watchBundle.universalNegativePrompt).toContain("tofu");

    // 2. Dynamic Sneaker Cooking
    const sneakerEntities = detectPhysicalEntities("Chef slices a Nike Air Max sneaker waffle sole into crispy cubes and marinates in hot chili oil");
    expect(sneakerEntities.isInedibleCooking).toBe(true);
    expect(sneakerEntities.inedibleHeroObject).toBe("Sneaker");

    const sneakerBundle = compileCinematicPrompt({
      actionDescription: "Chef cleaves the rubber waffle sole into bite-sized nuggets on the butcher block.",
      heroObject: "Nike Air Max Sneaker",
      heroPropLock: "Nike Air Max 90 with vibrant infrared heel tab and waffle rubber outsole",
      visualStyle: "CULINARY_MACRO_ASMR",
    });

    expect(sneakerBundle.googleFlowPrompt).toContain("Nike Air Max Sneaker");
    expect(sneakerBundle.googleFlowPrompt).toContain("Nike Air Max 90 with vibrant infrared heel tab");
    expect(sneakerBundle.googleFlowPrompt).toContain("Inedible Object Cooking & Material Invariants");
  });

  it("strictly prevents I2V hallucinations with precision stage detection & mass conservation", () => {
    // 1. Scene 2 Stage: OBJECT_SOURCING (Shelf retrieval)
    const shelfBundle = compileCinematicPrompt({
      actionDescription: "The chef reaches up with black-gloved hands and firmly rips a sleek, modern matte-black mechanical keyboard free from an industrial shelf. The thick black coiled braided aviator cable with chrome coupler snaps free with an echoing crack. He catches the black keyboard cleanly by its aluminum bezel.",
      heroObject: "Mechanical Keyboard",
      visualStyle: "CULINARY_MACRO_ASMR",
      genre: "ASMR",
      dialogue: "",
    });

    expect(shelfBundle.videoMotionPrompt).toContain("Station Lock: Industrial shelving only");
    expect(shelfBundle.videoMotionPrompt).toContain("Focused retrieval motion");
    expect(shelfBundle.videoMotionPrompt).toContain("remains 100% whole, rigid, and fully assembled");
    expect(shelfBundle.videoMotionPrompt).not.toContain("kitchen knives");
    expect(shelfBundle.videoMotionPrompt).not.toContain("cutting boards");
    expect(shelfBundle.videoMotionPrompt).not.toContain("stovetops");
    expect(shelfBundle.googleFlowPrompt).not.toContain("Plated dish must be 80%");
    expect(shelfBundle.universalNegativePrompt).toContain("cutting board");
    expect(shelfBundle.universalNegativePrompt).toContain("loose keys on table");

    // 2. Scene 6 Stage: CULINARY_CUTTING (Cleaver dicing)
    const cuttingBundle = compileCinematicPrompt({
      actionDescription: "Chef wields a heavy Damascus steel cleaver: THWACK! In rapid culinary rhythm, he dices the circuit board into 1-inch squares.",
      heroObject: "Mechanical Keyboard",
      visualStyle: "CULINARY_MACRO_ASMR",
      genre: "ASMR",
      dialogue: "",
    });

    expect(cuttingBundle.videoMotionPrompt).toContain("Conservation of Mass & Rigid Body Persistence");
    expect(cuttingBundle.videoMotionPrompt).toContain("uncut remaining portion of the chassis remains solidly anchored and fully visible on the board without disappearing");
    expect(cuttingBundle.universalNegativePrompt).toContain("vanishing chassis");
    expect(cuttingBundle.universalNegativePrompt).toContain("disappearing object");
  });

  it("enforces Bayashi 2X rapid ASMR pacing and 90% screen ingredient fill for short-form clips (<= 5s)", () => {
    const rapidBundle = compileCinematicPrompt({
      actionDescription: "Chef punches Game Boy with pin spoon, dips into golden batter, flips and coats in panko breadcrumbs.",
      heroObject: "Game Boy Color",
      visualStyle: "CULINARY_MACRO_ASMR",
      targetDurationSeconds: 4,
      aspectRatio: "PORTRAIT_9_16",
    });

    expect(rapidBundle.googleFlowPrompt).toContain("Viral Rapid ASMR Pacing & Framing Invariants");
    expect(rapidBundle.googleFlowPrompt).toContain("90% Screen Ingredient Fill");
    expect(rapidBundle.googleFlowPrompt).toContain("2X Kinetic Tempo");
    expect(rapidBundle.googleFlowPrompt).toContain("hero cross-section crunch pull & confident chef nod / thumbs-up to camera");
  });
});

