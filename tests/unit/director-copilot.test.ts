import { describe, it, expect } from "vitest";
import { getDirectorSuggestions, extractDialogueDelivery } from "@/lib/story/director-copilot";

describe("director-copilot", () => {
  describe("getDirectorSuggestions", () => {
    it("generates culinary ASMR pills and foley placeholders for culinary projects", () => {
      const suggestions = getDirectorSuggestions({
        visualStyle: "CULINARY_MACRO_ASMR",
        title: "The Mechanical Keyboard Stir-Fry",
        sourceIdea: "A rogue alchemist chef stir-fries a mechanical keyboard in a wok.",
      });

      expect(suggestions.pills).toContain("Intensify sizzling pan contact");
      expect(suggestions.pills).toContain("Enhance ASMR crunch & snap acoustics");
      expect(suggestions.pills).toContain("Focus extreme macro on sauce glaze");
      expect(suggestions.placeholder).toContain("sizzle");

      // Verify no generic elephant or Karthi strings leak into culinary
      const pillsJoined = suggestions.pills.join(" ");
      expect(pillsJoined.toLowerCase()).not.toContain("elephant");
      expect(pillsJoined.toLowerCase()).not.toContain("karthi");
      expect(suggestions.placeholder.toLowerCase()).not.toContain("elephant");
      expect(suggestions.placeholder.toLowerCase()).not.toContain("karthi");
    });

    it("generates playful whimsical suggestions for Studio Ghibli or Kids animation", () => {
      const suggestions = getDirectorSuggestions({
        visualStyle: "GHIBLI_ANIME",
        genre: "Children & Animation",
        sourceIdea: "Animal friends having a relay race in a sunny meadow.",
      });

      expect(suggestions.pills).toContain("Make dialogue more cheerful & playful");
      expect(suggestions.pills).toContain("Add whimsical giggle & laughter");
      expect(suggestions.placeholder).toContain("cheer");

      const pillsJoined = suggestions.pills.join(" ");
      expect(pillsJoined.toLowerCase()).not.toContain("elephant");
      expect(pillsJoined.toLowerCase()).not.toContain("karthi");
    });

    it("generates authentic period suggestions for vintage historical projects", () => {
      const suggestions = getDirectorSuggestions({
        visualStyle: "VINTAGE_FILM",
        sourceIdea: "1900s Vintage Pudukkottai city with antique wooden bullock carts.",
      });

      expect(suggestions.pills).toContain("Deepen authentic period atmosphere");
      expect(suggestions.pills).toContain("Add traditional street foley & chimes");
      expect(suggestions.placeholder).toContain("wooden wheels");
    });

    it("generates sci-fi cyber tech suggestions for cyberpunk/sci-fi projects", () => {
      const suggestions = getDirectorSuggestions({
        visualStyle: "PHOTOREALISTIC_CINEMATIC",
        genre: "Sci-Fi / Futuristic",
        sourceIdea: "Autonomous cyber hypercar in neon megacity.",
      });

      expect(suggestions.pills).toContain("Increase cyber neon glow & smoke");
      expect(suggestions.pills).toContain("Add futuristic tech humming foley");
    });
  });

  describe("extractDialogueDelivery", () => {
    it("extracts character name and speech text from [@Name] tag", () => {
      const res = extractDialogueDelivery('[@Alchemist] speaks: "This keycap needs more heat!"', "English");
      expect(res.speaker).toBe("Alchemist");
      expect(res.text).toBe("This keycap needs more heat!");
      expect(res.delivery).toBe("Energetic and dramatic");
    });

    it("extracts delivery cue inside leading parentheses", () => {
      const res = extractDialogueDelivery('[@Karthi] speaks: "(அதிர்ச்சியுடன்) அங்கே பாருடா!"', "Tamil");
      expect(res.speaker).toBe("Karthi");
      expect(res.delivery).toBe("அதிர்ச்சியுடன்");
      expect(res.text).toBe("அங்கே பாருடா!");
    });
  });
});
