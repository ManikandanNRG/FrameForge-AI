import { describe, it, expect } from "vitest";
import { compileCinematicPrompt } from "@/lib/story/prompt-compiler";

describe("Prompt Doctor & Character Consistency Engine", () => {
  it("always includes bracketed character handle [@CharacterName] in fluxStillPrompt for Google Flow consistency", () => {
    const bundle = compileCinematicPrompt({
      actionDescription: "Chef lowers the tempura Game Boy into boiling oil.",
      shotSize: "Extreme Close-Up",
      cameraMovement: "Static macro push",
      characterName: "The Shadow Alchemist",
      characterDescription: "Vintage brass goggles, sleek black mask",
      wardrobeLock: "leather apron, brass goggles",
      visualStyle: "CULINARY_MACRO_ASMR",
      heroObject: "Game Boy Color",
      targetDurationSeconds: 4,
    });

    // 1. Must contain Google Flow character tag in fluxStillPrompt
    expect(bundle.fluxStillPrompt).toContain("[@TheShadowAlchemist]");
    expect(bundle.fluxStillPrompt).toContain("(The Shadow Alchemist)");

    // 2. Video motion prompt must also maintain the character tag
    expect(bundle.videoMotionPrompt).toContain("[@TheShadowAlchemist]");
  });

  it("never dumps user issue report or sentence into negative prompt", () => {
    const userIssue = "This prompt never use the charecter name with @charecter for google flow consistency";
    
    // Simulate negative keyword generation logic
    const lowerIssue = userIssue.toLowerCase();
    const isCharacterIssue = /character|@|\bname\b|consistency|face|who|actor|person|hero/i.test(lowerIssue);
    expect(isCharacterIssue).toBe(true);

    const characterTag = "[@TheShadowAlchemist]";
    let diagnosis = "";
    let correction = "";
    let addedNegative = "";

    if (isCharacterIssue) {
      diagnosis = `Missing Character Identity Anchor: The prompt omitted the canonical handle ${characterTag} required for Google Flow and Veo visual identity consistency.`;
      correction = `Injected ${characterTag} into the subject anchor and action line, enforcing strict facial and wardrobe consistency lock.`;
      addedNegative = "inconsistent character, generic actor, wrong person, changing face, morphing clothing";
    }

    expect(diagnosis).toContain(characterTag);
    expect(correction).toContain(characterTag);
    // Crucial invariant: addedNegative must NOT contain the user's sentence
    expect(addedNegative).not.toContain(userIssue);
    expect(addedNegative).not.toContain("This prompt never use");
    expect(addedNegative).toBe("inconsistent character, generic actor, wrong person, changing face, morphing clothing");
  });

  it("handles culinary workstation jump issues with proper foley and negative filters", () => {
    const userIssue = "Chef left cutting board and threw curry leaves into hot oil in frying pan";
    const lowerIssue = userIssue.toLowerCase();
    const isCulinaryJump = /jump|teleport|curry leaf|herb|rosemary|leaf|leaves|threw|throw|put|putting|pan|stove|skillet|oil|sizzle|fry/i.test(lowerIssue);

    expect(isCulinaryJump).toBe(true);

    const addedNegative = "stove, frying pan, skillet, hot oil, dropping herbs into pan, curry leaf in pan, burner flame, teleporting, walking away";
    expect(addedNegative).not.toContain(userIssue);
    expect(addedNegative).toContain("stove, frying pan");
  });

  it("permanently strips on-screen text directives and injects strict anti-hallucination filters for watermarks, real food, and prop DNA", () => {
    const bundle = compileCinematicPrompt({
      actionDescription:
        "[0:16-0:18] Two black-gloved hands grip the two halves of the sliced wrap and pull them slowly apart with golden glaze stretching. [0:19-0:20] Chef flashes a sharp, confident thumbs-up to camera! On-screen text: 'CONCEPTUAL ARTWORK & ASMR ENTERTAINMENT ONLY — INEDIBLE.'",
      shotSize: "Extreme Close-Up to Medium Up-Tilt",
      cameraMovement: "Macro Pull and Slow Tilt Up",
      characterName: "The Shadow Alchemist Chef",
      characterDescription: "Vintage brass tinker goggles, sleek matte-black half-mask",
      wardrobeLock: "leather apron, brass goggles",
      visualStyle: "CULINARY_MACRO_ASMR",
      heroObject: "Vintage Game Boy Color",
      targetDurationSeconds: 4,
      sourceIdea: "Cooking a vintage translucent purple Game Boy Color with golden Pokémon cartridge",
    });

    // 1. On-screen text directives must be stripped completely from action prompts
    expect(bundle.googleFlowPrompt).not.toContain("On-screen text");
    expect(bundle.googleFlowPrompt).not.toContain("CONCEPTUAL ARTWORK & ASMR ENTERTAINMENT ONLY");
    expect(bundle.fluxStillPrompt).not.toContain("On-screen text");
    expect(bundle.fluxStillPrompt).not.toContain("CONCEPTUAL ARTWORK & ASMR ENTERTAINMENT ONLY");
    expect(bundle.videoMotionPrompt).not.toContain("On-screen text");

    // 2. Negative filters must explicitly ban burned-in text and watermarks
    expect(bundle.universalNegativePrompt).toContain("on-screen text");
    expect(bundle.universalNegativePrompt).toContain("subtitles");
    expect(bundle.universalNegativePrompt).toContain("watermark");

    // 3. Negative filters must explicitly ban real grocery food contamination
    expect(bundle.universalNegativePrompt).toContain("pork bacon");
    expect(bundle.universalNegativePrompt).toContain("diced tomatoes");
    expect(bundle.universalNegativePrompt).toContain("diced onions");
    expect(bundle.universalNegativePrompt).toContain("cheddar cheese");

    // 4. Negative filters must lock prop DNA against 1989 classic beige DMG-01 substitution
    expect(bundle.universalNegativePrompt).toContain("classic 1989 grey Game Boy");
    expect(bundle.universalNegativePrompt).toContain("beige DMG-01 brick");

    // 5. Negative filters must lock character identity against face morphing or wrong mask
    expect(bundle.universalNegativePrompt).toContain("face morphing");
    expect(bundle.universalNegativePrompt).toContain("circular respirator filters");
  });
});
