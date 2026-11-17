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
    expect(kit.thumbnailPrompts.portrait9x16).toContain("athletic male artisan culinary alchemist chef");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("fractured, severed rectangular chunk");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("seasoned black carbon-steel wok");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("crimson-red ESC keycap");

    // Optional Headline Directives for Text-Capable AI Generators (Google Flow / Imagen 3)
    expect(kit.thumbnailPrompts.portrait9x16WithHeadline).toContain("Viral Text Header Directive");
    expect(kit.thumbnailPrompts.portrait9x16WithHeadline).toContain("DO NOT EAT THIS!");
    expect(kit.thumbnailPrompts.landscape16x9WithHeadline).toContain("Viral Text Header Directive");
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

  it("dynamically generates Game Boy Tempura launch kit with authentic retro gaming props and foley", () => {
    const gameboyProject = {
      id: "cmwja2y3t0001u8qgfh5w3gtj",
      title: "The Vintage Game Boy Tempura (ASMR)",
      description: "Episode 2 of Inedible Gourmet ASMR: 20s Viral Rapid ASMR Masterpiece.",
      sourceIdea: "A rogue masked alchemist chef transforms a vintage translucent Game Boy Color into an acoustic tempura masterwork.",
      visualStyle: "CULINARY_MACRO_ASMR",
      aspectRatio: "PORTRAIT_9_16",
      productionAssets: [
        {
          assetType: "CHARACTER",
          name: "The Shadow Alchemist Chef",
          description: "Vintage brass tinker goggles, sleek matte-black half-mask",
        },
      ],
    };

    const kit = generateSocialLaunchKit(gameboyProject);

    expect(kit.thumbnailPrompts.portrait9x16).toContain("@TheShadowAlchemist");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("translucent purple Game Boy Color");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("golden Pokémon 8-bit cartridge slot");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("golden tempura-battered emerald circuit board chips");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("magenta A/B buttons");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("Cherry MX");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("mechanical keyboard");

    expect(kit.youtube.titles[0]).toContain("Vintage Game Boy");
    expect(kit.youtube.description).toContain("1x Vintage Translucent Purple Game Boy Color");
    expect(kit.youtube.description).toContain("Pokémon Cartridge");
    expect(kit.youtube.hashtags).toContain("#GameBoy");
    expect(kit.youtube.hashtags).toContain("#Tempura");

    expect(kit.instagram.caption).toContain("Who said a vintage Game Boy is only for gaming?");
    expect(kit.instagram.audioRecommendation).toContain("Game Boy Snap");
  });

  it("dynamically generates Vintage Bicycle launch kit with giant Indian catering kadai and jhara skimmer", () => {
    const bicycleProject = {
      id: "cmwk9xl1n0001u8q004v0ob0z",
      title: "Episode 3: The Vintage Bicycle Gourmet Feast (ASMR)",
      description: "60s Gourmet ASMR Masterclass.",
      sourceIdea: "This time we are going to cook the one cycle. the complete bicycle that we use chain, tire, and seat sponge as ingredients. we do all types of cooking preparations like dicing, grating, deep-fry in huge catering kadai.",
      visualStyle: "CULINARY_MACRO_ASMR",
      aspectRatio: "PORTRAIT_9_16",
      productionAssets: [
        {
          assetType: "CHARACTER",
          name: "The Shadow Alchemist Chef",
          description: "Vintage brass tinker goggles, sleek matte-black half-mask",
        },
      ],
    };

    const kit = generateSocialLaunchKit(bicycleProject);

    expect(kit.thumbnailPrompts.portrait9x16).toContain("@TheShadowAlchemist");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("dismantled vintage bicycle");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("colossal 4-foot Indian wedding catering iron kadai");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("colossal 3-foot Indian wedding catering iron perforated skimmer (jhara)");
    expect(kit.thumbnailPrompts.portrait9x16).toContain("golden-crispy deep-fried bicycle chain tempura noodles");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("Cherry MX");
    expect(kit.thumbnailPrompts.portrait9x16).not.toContain("mechanical keyboard");

    expect(kit.youtube.titles[0]).toContain("Vintage Bicycle");
    expect(kit.youtube.titles[0]).toContain("Indian Catering Cauldron");
    expect(kit.youtube.description).toContain("1x Vintage Steel Road Bicycle");
    expect(kit.youtube.description).toContain("Colossal Indian Catering Kadai Oil Bath");
    expect(kit.youtube.hashtags).toContain("#Bicycle");
    expect(kit.youtube.hashtags).toContain("#GiantKadai");

    expect(kit.instagram.caption).toContain("Who said a vintage bicycle is only for riding?");
    expect(kit.instagram.caption).toContain("colossal 4-foot Indian wedding catering iron kadai");
    expect(kit.instagram.audioRecommendation).toContain("Giant Kadai Oil Sizzle");
  });
});
