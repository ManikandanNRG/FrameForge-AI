import { describe, it, expect } from "vitest";
import { quickAuditScript, polishScreenplayWithAI, type RawSceneInput } from "@/lib/story/script-doctor";
import type { TextGenerationProvider } from "@/lib/providers/types";

describe("Script Doctor & Senior Director QC", () => {
  it("rewards kinetic, scroll-stopping visual hooks in Scene 1", () => {
    const scenes: RawSceneInput[] = [
      {
        sceneNumber: 1,
        heading: "EXT. COUNTRYSIDE MEADOW - DAY",
        location: "Meadow",
        timeOfDay: "DAY",
        action: "The camera swoops dynamically low over lush green hills as young children sprint and leap over colorful flags.",
        dialogue: "வேகமா ஓடுங்க! நாம்தான் ஜெயிக்கணும்!",
        estimatedDurationSeconds: 8,
      },
      {
        sceneNumber: 2,
        heading: "EXT. COUNTRYSIDE MEADOW - DAY",
        location: "Meadow",
        timeOfDay: "DAY",
        action: "A mischievous fluffy rabbit darts ahead, kicking up soft dandelion seeds as children giggle.",
        dialogue: "அடேய் முயல் குட்டி! நில்லு!",
        estimatedDurationSeconds: 8,
      },
    ];

    const report = quickAuditScript(scenes, {
      genre: "Kids & Family",
      visualStyle: "GHIBLI_ANIME",
      storyLanguage: "Tamil",
      dialogueMode: "DIALOGUE",
    });

    expect(report.overallScore).toBeGreaterThanOrEqual(85);
    expect(report.breakdown.hookStrength).toBeGreaterThanOrEqual(90);
    expect(report.sceneAudits[0].issues).toHaveLength(0);
  });

  it("flags passive openings that cause 3-second viewer drop-off", () => {
    const scenes: RawSceneInput[] = [
      {
        sceneNumber: 1,
        heading: "EXT. MEADOW - DAY",
        location: "Meadow",
        timeOfDay: "DAY",
        action: "The young boy is standing slowly and looking at the distant clouds, pondering quietly.",
        dialogue: "",
        estimatedDurationSeconds: 8,
      },
    ];

    const report = quickAuditScript(scenes, {
      genre: "Kids",
      visualStyle: "GHIBLI_ANIME",
      storyLanguage: "English",
      dialogueMode: "DIALOGUE",
    });

    expect(report.breakdown.hookStrength).toBeLessThan(75);
    expect(report.sceneAudits[0].issues.some((issue) => issue.includes("passive"))).toBe(true);
    expect(report.sceneAudits[0].directorRecommendation).toContain("Start immediately in media res");
  });

  it("detects machine-translated or bookish Tamil dialogue in kids content", () => {
    const scenes: RawSceneInput[] = [
      {
        sceneNumber: 1,
        heading: "EXT. MEADOW - DAY",
        location: "Meadow",
        timeOfDay: "DAY",
        action: "Children sprint forward with boundless joy.",
        dialogue: "நாங்கள் இப்போது வெற்றி பெறும் செயலை பதிவு செய்யும் நேரம் இது.", // overly formal/bookish
        estimatedDurationSeconds: 8,
      },
    ];

    const report = quickAuditScript(scenes, {
      genre: "Kids",
      visualStyle: "GHIBLI_ANIME",
      storyLanguage: "Tamil",
      dialogueMode: "DIALOGUE",
    });

    expect(report.sceneAudits[0].issues.some((issue) => issue.includes("formal or machine-translated"))).toBe(true);
    expect(report.breakdown.dialogueNaturalness).toBeLessThan(80);
  });

  it("detects bizarre literal idiom translations like 'குருதி' (blood) in Tamil kids content", () => {
    const scenes: RawSceneInput[] = [
      {
        sceneNumber: 1,
        heading: "EXT. MEADOW - DAY",
        location: "Meadow",
        timeOfDay: "DAY",
        action: "Children race forward.",
        voiceover: "குருவி, உன் நேரம் வந்தது! எங்க குருதியில் உன் வேகம் காட்டு!",
        estimatedDurationSeconds: 8,
      },
    ];

    const report = quickAuditScript(scenes, {
      genre: "Kids",
      visualStyle: "GHIBLI_ANIME",
      storyLanguage: "Tamil",
      dialogueMode: "VOICEOVER",
    });

    expect(report.sceneAudits[0].issues.some((issue) => issue.includes("Literal translation hallucination"))).toBe(true);
    expect(report.sceneAudits[0].issues.some((issue) => issue.includes("Entity hallucination"))).toBe(true);
    expect(report.breakdown.dialogueNaturalness).toBeLessThan(60);
  });

  it("detects kitchen station collision (cutting board prep + stove cook) in culinary videos", () => {
    const scenes: RawSceneInput[] = [
      {
        sceneNumber: 1,
        heading: "INT. KITCHEN - NIGHT",
        location: "Kitchen",
        timeOfDay: "NIGHT",
        action: "The chef quickly chops ribeye on cutting board and drops it into sizzling hot cast iron pan on stove.",
        dialogue: "",
        estimatedDurationSeconds: 8,
      },
    ];

    const report = quickAuditScript(scenes, {
      genre: "Culinary",
      visualStyle: "CULINARY_MACRO_ASMR",
      storyLanguage: "English",
      dialogueMode: "PURE_ASMR_FOLEY",
    });

    expect(report.sceneAudits[0].issues.some((issue) => issue.includes("Station collision"))).toBe(true);
    expect(report.sceneAudits[0].directorRecommendation).toContain("Isolate into two separate shots");
  });

  it("verifies polishScreenplayWithAI integrates with provider structured generation", async () => {
    const mockProvider: TextGenerationProvider = {
      id: "mock-director",
      listModels: async () => [{ id: "test-model", displayName: "Test Model" }],
      getCapabilities: async () => ({ structuredOutput: true, contextLimit: 8192 }),
      generateStructured: async <S extends any>(): Promise<any> => ({
        data: {
          polishedScenes: [
            {
              sceneNumber: 1,
              heading: "EXT. SUNLIT MEADOW - DAY",
              location: "Meadow",
              timeOfDay: "DAY",
              action: "Dynamic low-angle camera swoops as enthusiastic children burst into a spirited sprint.",
              dialogue: "அக்கா! வேகமாக ஓடு!",
              voiceover: "",
              audioScript: "Lively footsteps and cheerful children laughter",
              estimatedDurationSeconds: 8,
            },
          ],
        },
        providerJobId: "mock-2",
        usage: { promptTokens: 20, completionTokens: 30, totalTokens: 50 },
      }),
    };

    const initialScenes: RawSceneInput[] = [
      {
        sceneNumber: 1,
        heading: "EXT. MEADOW - DAY",
        location: "Meadow",
        timeOfDay: "DAY",
        action: "Children start running.",
        dialogue: "ஓடுங்கள்.",
        estimatedDurationSeconds: 8,
      },
    ];

    const auditReport = quickAuditScript(initialScenes, {
      genre: "Kids",
      visualStyle: "GHIBLI_ANIME",
      storyLanguage: "Tamil",
    });

    const polished = await polishScreenplayWithAI(
      mockProvider,
      "test-model",
      initialScenes,
      {
        title: "The Relay of Dreams",
        genre: "Kids",
        visualStyle: "GHIBLI_ANIME",
        storyLanguage: "Tamil",
      },
      auditReport
    );

    expect(polished).toHaveLength(1);
    expect(polished[0].action).toContain("Dynamic low-angle");
    expect(polished[0].dialogue).toBe("அக்கா! வேகமாக ஓடு!");
  });
});
