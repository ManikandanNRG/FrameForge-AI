import { describe, it, expect } from "vitest";
import { getShotAudioData } from "@/lib/shots/audio-defaults";

describe("getShotAudioData", () => {
  it("safely extracts audio when negativeConstraints is valid JSON", () => {
    const json = JSON.stringify({
      voiceover: "Welcome to the future.",
      dialogue: "",
      audioPrompt: "Futuristic city hum and neon buzz.",
      characterTag: "@CyberRider",
      characterName: "CyberRider",
    });

    const result = getShotAudioData(json, 1, 1, "CyberRider speeds past neon billboards.");
    expect(result.voiceover).toBe("Welcome to the future.");
    expect(result.dialogue).toBe("");
    expect(result.audioPrompt).toBe("Futuristic city hum and neon buzz.");
    expect(result.characterTag).toBe("@CyberRider");
    expect(result.characterName).toBe("CyberRider");
  });

  it("respects intentional empty dialogue and voiceover for ASMR / silent projects", () => {
    const asmrJson = JSON.stringify({
      voiceover: "",
      dialogue: "",
      audioPrompt: "Oil sizzle and knife chopping clicks on wooden board.",
      characterTag: "@Chef",
      characterName: "Chef",
    });

    const result = getShotAudioData(asmrJson, 1, 1, "Chef slices fresh garlic on cutting board.");
    expect(result.voiceover).toBe("");
    expect(result.dialogue).toBe("");
    expect(result.audioPrompt).toBe("Oil sizzle and knife chopping clicks on wooden board.");
    expect(result.characterTag).toBe("@Chef");
    expect(result.characterName).toBe("Chef");
  });

  it("does not crash or inject Murugan when negativeConstraints is a raw negative prompt string", () => {
    const rawNegativePrompt = "plastic skin, distorted anatomy, extra fingers, cartoon, 3D render, generic cubes";
    const result = getShotAudioData(rawNegativePrompt, 2, 1, "A chef tossing keycaps in hot smoking wok.");

    // Must NOT contain Murugan or Tamil farmer dialogue
    expect(result.voiceover).toBe("");
    expect(result.dialogue).toBe("");
    expect(result.audioPrompt).toBe("Ambient soundscape, natural room tone, and subtle environmental foley.");
  });

  it("extracts character tag from action description when negativeConstraints is empty or not JSON", () => {
    const result = getShotAudioData("", 3, 1, "Low-angle tracking shot as [@Karthi] sprints across the finish line.");
    expect(result.characterTag).toBe("[@Karthi]");
    expect(result.characterName).toBe("Karthi");
    expect(result.voiceover).toBe("");
    expect(result.dialogue).toBe("");
  });

  it("enforces mutual exclusivity: character dialogue suppresses voiceover", () => {
    const json = JSON.stringify({
      voiceover: "Narrator voice speaking here.",
      dialogue: 'Hero speaks: "Watch out!"',
      audioPrompt: "Explosion sound.",
    });

    const result = getShotAudioData(json, 1, 1, "Hero turns around.");
    expect(result.dialogue).toBe('Hero speaks: "Watch out!"');
    expect(result.voiceover).toBe(""); // Suppressed by dialogue!
  });

  it("preserves Murugan demo lines when action description explicitly mentions Murugan / Potter's Clay", () => {
    const result = getShotAudioData("", 1, 1, "Murugan stands beside red soil and palm trees in மண் வாசம்.");
    expect(result.voiceover).toContain("கிழக்கு பனைமரங்களுக்கு மேல்");
  });
});
