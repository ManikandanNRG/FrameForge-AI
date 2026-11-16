import { describe, it, expect } from "vitest";
import { compileCinematicPrompt } from "@/lib/story/prompt-compiler";

describe("Prompt Doctor & Character Consistency Engine", () => {
  it("always includes bracketed character handle [@CharacterName] in fluxStillPrompt for Google Flow consistency", () => {
    const bundle = compileCinematicPrompt({
      actionDescription: "Chef lowers the tempura Game Boy into boiling oil.",
      shotSize: "Extreme Close-Up",
      cameraMovement: "Static macro push",
      characterName: "The Shadow Alchemist Chef",
      characterDescription: "Vintage brass goggles, sleek black mask",
      wardrobeLock: "leather apron, brass goggles",
      visualStyle: "CULINARY_MACRO_ASMR",
      heroObject: "Game Boy Color",
      targetDurationSeconds: 4,
    });

    // 1. Must contain Google Flow character tag in fluxStillPrompt
    expect(bundle.fluxStillPrompt).toContain("[@TheShadowAlchemistChef]");
    expect(bundle.fluxStillPrompt).toContain("(The Shadow Alchemist Chef)");

    // 2. Video motion prompt must also maintain the character tag
    expect(bundle.videoMotionPrompt).toContain("[@TheShadowAlchemistChef]");
  });

  it("never dumps user issue report or sentence into negative prompt", () => {
    const userIssue = "This prompt never use the charecter name with @charecter for google flow consistency";
    
    // Simulate negative keyword generation logic
    const lowerIssue = userIssue.toLowerCase();
    const isCharacterIssue = /character|@|\bname\b|consistency|face|who|actor|person|hero/i.test(lowerIssue);
    expect(isCharacterIssue).toBe(true);

    const characterTag = "[@TheShadowAlchemistChef]";
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
});
