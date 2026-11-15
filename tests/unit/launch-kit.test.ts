import { describe, it, expect } from "vitest";
import { generateSocialLaunchKit } from "@/lib/story/launch-kit";

describe("Social Launch Kit & Thumbnail Engine", () => {
  const sampleProject = {
    id: "cmwg5nczz0001u88sld5gnrmd",
    title: "The Mechanical Keyboard Stir-Fry",
    description: "An artisan chef cooks a mechanical keyboard in a wok.",
    visualStyle: "CULINARY_ASMR",
    aspectRatio: "PORTRAIT_9_16",
    productionAssets: [
      {
        assetType: "CHARACTER",
        name: "The Shadow Alchemist",
        description: "Artisan chef with vintage brass goggles and black half-mask",
      },
    ],
  };

  it("compiles verified high-CTR thumbnail prompts for both 16:9 and 9:16", () => {
    const kit = generateSocialLaunchKit(sampleProject);

    // 16:9 Landscape
    expect(kit.thumbnailPrompts.landscape16x9).toContain("@TheShadowAlchemist");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("fractured, severed rectangular chunk");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("raw green PCB circuit board backing");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("seasoned black carbon-steel wok");
    expect(kit.thumbnailPrompts.landscape16x9).toContain("NO username on image");

    // 9:16 Vertical
    expect(kit.thumbnailPrompts.portrait9x16).toContain("@TheShadowAlchemist");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("fractured, severed rectangular chunk");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("seasoned black carbon-steel wok");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("crimson-red ESC keycap");
  });

  it("generates YouTube launch suite with high-CTR titles, safety disclaimer and foley notes", () => {
    const kit = generateSocialLaunchKit(sampleProject);

    expect(kit.youtube.titles.length).toBeGreaterThanOrEqual(3);
    expect(kit.youtube.titles[0]).toContain("Mechanical Keyboard");
    expect(kit.youtube.description).toContain(kit.safetyDisclaimer);
    expect(kit.youtube.description).toContain("TIMESTAMPS");
    expect(kit.youtube.description).toContain("SOUND & FOLEY");
    expect(kit.youtube.tags).toContain("Mechanical Keyboard");
    expect(kit.youtube.hashtags).toContain("#ASMR");
  });

  it("generates Instagram Reels launch package with engagement CTA and pinned comment", () => {
    const kit = generateSocialLaunchKit(sampleProject);

    expect(kit.instagram.caption).toContain("Who said mechanical keyboards are only for typing?");
    expect(kit.instagram.caption).toContain(kit.safetyDisclaimer);
    expect(kit.instagram.audioRecommendation).toContain("ASMR");
    expect(kit.instagram.hashtags).toContain("#reels");
    expect(kit.instagram.hashtags).toContain("#asmrfood");
    expect(kit.instagram.pinnedComment).toContain("MENU POLL");
  });
});
