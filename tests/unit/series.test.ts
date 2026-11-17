import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db/client";

describe("Series & Episodic Architecture Engine", () => {
  it("verifies Inedible ASMR series exists with linked episodes", async () => {
    const series = await prisma.series.findFirst({
      where: { slug: "inedible-tech-asmr" },
      include: {
        episodes: {
          orderBy: { episodeNumber: "asc" },
        },
      },
    });

    expect(series).toBeDefined();
    expect(series?.slug).toBe("inedible-tech-asmr");
    expect(series?.visualStyle).toBe("CULINARY_MACRO_ASMR");
    expect(series?.dialogueMode).toBe("PURE_ASMR_FOLEY");
    expect(series?.aspectRatio).toBe("PORTRAIT_9_16");
    expect(series?.targetRuntime).toBe(20);

    // Should have linked Episode 1 & Episode 2
    expect(series?.episodes.length).toBeGreaterThanOrEqual(2);

    const ep1 = series?.episodes.find((e) => e.episodeNumber === 1);
    expect(ep1?.title).toContain("Mechanical Keyboard");
    expect(ep1?.studioEnvironment).toBe("Dark Cyberpunk Scrapyard & Industrial Wok Burner");

    const ep2 = series?.episodes.find((e) => e.episodeNumber === 2);
    expect(ep2?.title).toContain("Vintage Game Boy");
    expect(ep2?.studioEnvironment).toBe("Dark Walnut Butcher Block & Tempura Oil Pot");
  });

  it("creates and inherits series DNA for a new episode with custom studio environment", async () => {
    const series = await prisma.series.findFirst({
      where: { slug: "inedible-tech-asmr" },
    });
    expect(series).toBeDefined();

    const user = await prisma.user.findFirst();
    expect(user).toBeDefined();

    // Simulate creating Episode 3 with Teppanyaki Studio Override
    const customStudio = "Japanese Teppanyaki Flat-Top Griddle & Dual Steel Spatulas";
    const ep3 = await prisma.project.create({
      data: {
        ownerId: user!.id,
        seriesId: series!.id,
        episodeNumber: 3,
        title: "Episode 3: The Sony Walkman Teppanyaki (ASMR)",
        sourceIdea: "A rogue masked chef cooks a vintage Sony Walkman cassette player into acoustic yakisoba noodles on a scorching hot teppanyaki flat-top grill.",
        visualStyle: series!.visualStyle,
        genre: series!.genre,
        tone: series!.tone,
        dialogueMode: series!.dialogueMode,
        aspectRatio: series!.aspectRatio,
        targetRuntime: series!.targetRuntime,
        storyLanguage: series!.storyLanguage,
        studioEnvironment: customStudio,
      },
      include: {
        series: true,
      },
    });

    try {
      expect(ep3.episodeNumber).toBe(3);
      expect(ep3.series?.slug).toBe("inedible-tech-asmr");
      expect(ep3.visualStyle).toBe("CULINARY_MACRO_ASMR");
      expect(ep3.aspectRatio).toBe("PORTRAIT_9_16");
      expect(ep3.dialogueMode).toBe("PURE_ASMR_FOLEY");
      expect(ep3.targetRuntime).toBe(20);
      expect(ep3.studioEnvironment).toBe(customStudio);
    } finally {
      // Clean up test episode
      await prisma.project.delete({ where: { id: ep3.id } });
    }
  });
});
