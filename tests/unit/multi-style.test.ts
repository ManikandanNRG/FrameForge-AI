import { describe, it, expect } from "vitest";
import { compileCinematicPrompt } from "@/lib/story/prompt-compiler";

describe("Multi-Style Visual Integrity & Negative Prompt Safety", () => {
  it("compiles Studio Ghibli prompts without banning anime or cartoon", () => {
    const bundle = compileCinematicPrompt({
      actionDescription: "Children and animal friends sprint across a blooming meadow",
      shotSize: "Wide Shot",
      cameraMovement: "Slow majestic jib descent",
      visualStyle: "GHIBLI_ANIME",
      sourceIdea: "Kids sports day in Ghibli meadow",
    });

    // Positive directives must include Ghibli cues
    expect(bundle.googleFlowPrompt).toContain("Studio Ghibli");
    expect(bundle.fluxStillPrompt).toContain("Studio Ghibli");

    // Negative prompt must NOT ban anime or cartoon
    expect(bundle.universalNegativePrompt).not.toContain("cartoon");
    expect(bundle.universalNegativePrompt).not.toContain("anime");

    // Must ban live action
    expect(bundle.universalNegativePrompt).toContain("photorealistic live action");
  });

  it("compiles 2D Storybook Cartoon prompts safely", () => {
    const bundle = compileCinematicPrompt({
      actionDescription: "A cheerful bear and bunny high-five at the finish line",
      shotSize: "Medium Shot",
      cameraMovement: "Playful tracking pan",
      visualStyle: "CARTOON_2D",
    });

    expect(bundle.googleFlowPrompt).toContain("2D storybook kids cartoon");
    expect(bundle.universalNegativePrompt).not.toContain("cartoon");
    expect(bundle.universalNegativePrompt).toContain("photorealistic live action");
  });

  it("compiles Culinary ASMR with station locks and bans cartoon/CGI", () => {
    const bundle = compileCinematicPrompt({
      actionDescription: "Chef deftly slices seasoned ribeye steak on walnut cutting board",
      shotSize: "Close-Up",
      cameraMovement: "Slow lateral tracking pan",
      visualStyle: "CULINARY_MACRO_ASMR",
    });

    expect(bundle.googleFlowPrompt).toContain("macro culinary cinema");
    expect(bundle.universalNegativePrompt).toContain("cartoon");
    expect(bundle.universalNegativePrompt).toContain("CGI");
    expect(bundle.universalNegativePrompt).toContain("phantom hand");
  });

  it("compiles Stop-Motion Claymation safely", () => {
    const bundle = compileCinematicPrompt({
      actionDescription: "A clay puppy waddles through a miniature cardboard village",
      shotSize: "Medium Shot",
      visualStyle: "STOP_MOTION",
    });

    expect(bundle.googleFlowPrompt).toContain("stop-motion");
    expect(bundle.universalNegativePrompt).not.toContain("cartoon");
    expect(bundle.universalNegativePrompt).toContain("photorealistic live action");
    expect(bundle.universalNegativePrompt).toContain("smooth digital CGI");
  });

  it("compiles Vintage 1900s Film and bans modern apparel", () => {
    const bundle = compileCinematicPrompt({
      actionDescription: "Villagers gather at the temple courtyard during festival",
      shotSize: "Wide Shot",
      visualStyle: "VINTAGE_FILM",
      sourceIdea: "1900s Chettinad village festival",
    });

    expect(bundle.googleFlowPrompt).toContain("1900s vintage 35mm archival");
    expect(bundle.universalNegativePrompt).toContain("modern collared shirt");
    expect(bundle.universalNegativePrompt).toContain("t-shirt");
    expect(bundle.universalNegativePrompt).toContain("sneakers");
  });

  it("compiles Comic Book Graphic Novel style safely", () => {
    const bundle = compileCinematicPrompt({
      actionDescription: "The masked hero leaps from a rooftop against dramatic lightning",
      shotSize: "Low-Angle Hero Shot",
      visualStyle: "COMIC_BOOK",
    });

    expect(bundle.googleFlowPrompt).toContain("graphic novel");
    expect(bundle.universalNegativePrompt).not.toContain("cartoon");
    expect(bundle.universalNegativePrompt).toContain("photorealistic live action");
  });
});
