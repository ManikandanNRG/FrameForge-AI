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
});

