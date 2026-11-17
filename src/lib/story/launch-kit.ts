/**
 * Social Launch Kit Engine (spec §15, ADR-010, ADR-015, ADR-017, ADR-018, ADR-024)
 * Generates viral YouTube & Instagram publishing metadata, SEO tags,
 * safety disclaimers, and verified high-CTR AI thumbnail prompts (16:9 & 9:16).
 * 
 * MASTER TEMPLATE BASE (Verified against media_1794762564764_ab5dc0ae.jpg):
 * - Viewer's Left Hand: Grips the severed/fractured raw object chunk exposing internal green PCB, wires & chassis.
 * - Viewer's Right Hand: Thrusts forward a wide stainless slotted spatula with a sticky glistening mound of cooked parts.
 * - Center Foreground: Deep round seasoned black carbon-steel wok packed with simmering components and steam.
 * - Center Midground: @TheShadowAlchemist facing camera directly with intense eye contact, goggles & gold-vented mask.
 * - Background: Seamless dark charcoal studio vignette, completely clean with zero clutter.
 */

export interface SocialLaunchKit {
  projectTitle: string;
  visualStyle: string;
  aspectRatio: string;
  thumbnailPrompts: {
    landscape16x9: string;
    portrait9x16: string;
    landscape16x9WithHeadline?: string;
    portrait9x16WithHeadline?: string;
  };
  youtube: {
    titles: string[];
    description: string;
    tags: string;
    hashtags: string[];
  };
  instagram: {
    caption: string;
    hashtags: string;
    audioRecommendation: string;
    pinnedComment: string;
  };
  safetyDisclaimer: string;
}

export interface ProjectContextInput {
  id?: string;
  title: string;
  description?: string | null;
  sourceIdea?: string | null;
  visualStyle?: string | null;
  aspectRatio?: string | null;
  storyLanguage?: string | null;
  productionAssets?: Array<{
    assetType: string;
    name: string;
    description: string;
    attributes?: string | null;
  }>;
}

/**
 * Builds the complete YouTube and Instagram launch package for a project.
 */
export function generateSocialLaunchKit(project: ProjectContextInput): SocialLaunchKit {
  const title = project.title || "The Inedible Kitchen";
  const desc = project.description || project.sourceIdea || "";
  const visualStyle = project.visualStyle || "CULINARY_ASMR";
  const isCulinaryAsmr =
    visualStyle === "CULINARY_ASMR" ||
    visualStyle === "CULINARY_MACRO_ASMR" ||
    title.toLowerCase().includes("cook") ||
    title.toLowerCase().includes("keyboard") ||
    title.toLowerCase().includes("game boy") ||
    title.toLowerCase().includes("tempura") ||
    title.toLowerCase().includes("asmr") ||
    desc.toLowerCase().includes("cook") ||
    desc.toLowerCase().includes("asmr");

  // Extract character anchor
  const characters = project.productionAssets?.filter((a) => a.assetType === "CHARACTER") || [];
  const leadChar = characters[0];
  const rawHandle = leadChar ? `@${leadChar.name.replace(/\s+/g, "")}` : "@TheShadowAlchemist";
  const charHandle = /Shadow\s*Alchemist/i.test(rawHandle) ? "@TheShadowAlchemist" : rawHandle;

  const combinedText = `${title} ${desc} ${project.sourceIdea || ""}`.toLowerCase();
  const isGameBoy = /game\s*boy|gameboy|pokemon|nintendo|handheld/i.test(combinedText);
  const isBicycle = /bicycle|bycycle|cycle|bike|tire|chain|pedal|spoke/i.test(combinedText);
  const isEarbud = /earbud|airpod/i.test(combinedText);
  const isPhone = /phone|smartphone/i.test(combinedText);
  const isWatch = /watch|clock/i.test(combinedText);

  // Detect subject object
  let heroObject = "Mechanical Keyboard";
  let rawObjectHalf =
    "a fractured, severed rectangular chunk of the matte-black mechanical keyboard, tilted to expose the raw green PCB circuit board backing, severed copper traces, and dangling loose wires, with black keycaps facing front";
  let cookedSpatulaPile =
    "a tall sticky mound of glossy stir-fried matte-black keycaps and crimson-red Cherry MX switches (including a prominent crimson-red ESC keycap), dripping with long stretching strands of thick, bubbling golden-amber glaze cascading downward";
  let wokContents =
    "stir-fried black keycaps and crimson Cherry switches bubbling in golden oil, with authentic wisps of white culinary steam curling upward";

  if (isBicycle) {
    heroObject = "Vintage Bicycle";
    rawObjectHalf =
      "the raw stripped chrome fork and spoked wheel rim of the dismantled vintage bicycle, leaning upright at chest height";
    cookedSpatulaPile =
      "a monumental, sizzling mound of golden-crispy deep-fried bicycle chain tempura noodles and seared black rubber tire calamari rings, dripping with long stretching strands of thick, bubbling golden-amber glaze cascading downward, held on a colossal Indian wedding catering iron perforated skimmer (jhara)";
    wokContents =
      "a colossal 4-foot Indian wedding catering iron kadai (cauldron) bubbling furiously with golden oil and diced yellow seat sponge tofu cubes, with roaring amber flames licking the curved cast-iron base and dramatic plumes of culinary steam";
  } else if (isGameBoy) {
    heroObject = "Vintage Game Boy Color";
    heroObject = "Vintage Game Boy Color";
    rawObjectHalf =
      "the cleanly fractured, severed translucent purple Game Boy Color with the golden Pokémon 8-bit cartridge slot, raw emerald PCB circuit board backing, and dangling colorful ribbon cables";
    cookedSpatulaPile =
      "a tall sticky mound of golden tempura-battered emerald circuit board chips, golden Pokémon cartridge wafers, and glossy magenta A/B buttons, dripping with long stretching strands of thick, bubbling golden-amber tempura glaze cascading downward";
    wokContents =
      "golden tempura-crusted circuit boards and magenta buttons bubbling furiously in golden oil, with authentic wisps of white culinary steam curling upward";
  } else if (isEarbud) {
    heroObject = "Wireless Earbuds";
    rawObjectHalf =
      "the severed charging case and cracked earbud chassis, exposing internal copper inductive charging coils, lithium cell layers, and dangling micro-wires";
    cookedSpatulaPile =
      "a sticky glistening mound of stir-fried black silicone ear tips, micro dynamic drivers, and gold-plated charging pins dripping with thick golden glaze";
    wokContents =
      "hundreds of glazed earbud drivers and silicone tips simmering in hot oil with wisps of white steam";
  } else if (isPhone) {
    heroObject = "Smartphone";
    rawObjectHalf =
      "the fractured top half of a flagship smartphone, cleanly severed to expose the layered motherboard, copper heat pipes, and camera module";
    cookedSpatulaPile =
      "a sticky glistening mound of stir-fried microchips, camera sapphire lenses, and black aluminum frame fragments dripping with thick amber glaze";
    wokContents =
      "hundreds of glazed chipset parts and camera lenses sizzling in the hot wok with rising steam";
  } else if (isWatch) {
    heroObject = "Mechanical Watch";
    rawObjectHalf =
      "the severed stainless-steel watch chassis, split open to reveal the exposed mechanical escapement, balance spring, and fractured gears";
    cookedSpatulaPile =
      "a sticky glistening mound of stir-fried miniature brass cogs, balance wheels, and ruby bearing jewels dripping with thick golden glaze";
    wokContents =
      "hundreds of glazed brass gears and watch wheels sizzling in the wok with rising steam";
  }

  const safetyDisclaimer =
    "⚠️ CONCEPTUAL ARTWORK & ASMR ENTERTAINMENT ONLY — INEDIBLE. DO NOT INGEST OR ATTEMPT AT HOME.";

  const centerForegroundDescription = isBicycle
    ? wokContents
    : `A large round seasoned black carbon-steel wok sits sizzling at the bottom, packed edge-to-edge with ${wokContents}`;

  const rightHandTool = isBicycle
    ? "a colossal 3-foot Indian wedding catering iron perforated skimmer (jhara)"
    : "a wide angled stainless steel chef's slotted spatula";

  const thumbnailLighting = isBicycle
    ? "Deep solid dark charcoal catering workshop background with warm fiery under-glow from the hearth burner, heavy dramatic vignette, completely clean, zero clutter. Commercial food spotlight on the dripping glaze and textures, subtle warm rim lighting on shoulders."
    : "Deep solid dark charcoal studio background with heavy smooth vignette, completely clean, zero clutter, zero tools. Commercial food spotlight on the dripping glaze and textures, subtle warm rim lighting on shoulders.";

  // MASTER TEMPLATE PROMPTS (Verified against media_1794762564764_ab5dc0ae.jpg)
  const thumbnailPortrait9x16 = `A viral vertical 9:16 YouTube Shorts and Reels thumbnail, medium close-up shot, straight eye-level frontal perspective, centered symmetrical composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, handsome masculine facial structure, looking directly into the camera lens with intense, locked hazel eyes. Dark wavy hair with vintage brass dual-lens tinker goggles resting on crown. Wearing a sleek matte-black ergonomic tactical half-mask with vertical gold cheekline vents, dark rolled-sleeve work shirt, distressed leather artisan apron, and black textured grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} at chest height.
- Viewer's Right Hand: Thrusts forward ${rightHandTool} holding ${cookedSpatulaPile}.
- Center Foreground: ${centerForegroundDescription}.

Lighting & Atmosphere: ${thumbnailLighting}

Strict Constraints: Character visually rendered only. Strictly NO username on image, NO text, NO typography, NO watermarks, NO teeth marks, NO noodles, NO meat, NO real food, NO eating.`;

  const thumbnailPortrait9x16WithHeadline = `A viral vertical 9:16 YouTube Shorts and Reels thumbnail, medium close-up shot, straight eye-level frontal perspective, centered symmetrical composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, handsome masculine facial structure, looking directly into the camera lens with intense, locked hazel eyes. Dark wavy hair with vintage brass dual-lens tinker goggles resting on crown. Wearing a sleek matte-black ergonomic tactical half-mask with vertical gold cheekline vents, dark rolled-sleeve work shirt, distressed leather artisan apron, and black textured grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} at chest height.
- Viewer's Right Hand: Thrusts forward ${rightHandTool} holding ${cookedSpatulaPile}.
- Center Foreground: ${centerForegroundDescription}.

Viral Text Header Directive: Large bold arched text "DO NOT EAT THIS!" centered across the very top header in heavy YouTube impact font with vibrant fiery yellow-orange-red gradient, thick black outline, and soft white halo glow. Perfectly positioned in the top margin safe zone above goggles without obstructing the character or props.

Lighting & Atmosphere: ${thumbnailLighting}

Strict Constraints: Character visually rendered only. Strictly NO username on image, NO teeth marks, NO noodles, NO meat, NO real food, NO eating.`;

  const thumbnailLandscape16x9 = `A viral high-contrast 16:9 YouTube video thumbnail, medium close-up framing, straight eye-level frontal perspective, centered composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, centered directly facing camera with an intense direct hazel-eyed gaze. Handsome masculine facial features, dark wavy hair, vintage brass tinker goggles on forehead, sleek matte-black tactical half-mask with gold vents, dark rolled-sleeve shirt, leather apron, black grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} horizontally at chest height.
- Viewer's Right Hand: Extends ${rightHandTool} forward close to the lens, piled with ${cookedSpatulaPile}.
- Center Foreground: ${centerForegroundDescription}.

Lighting & Environment: ${thumbnailLighting}

Strict Constraints: Tight framing, large props. Character visually rendered only. Strictly NO username on image, NO text, NO watermarks, NO letters, NO font overlay, NO teeth marks, NO noodles, NO meat, NO real food, NO eating.`;

  const thumbnailLandscape16x9WithHeadline = `A viral high-contrast 16:9 YouTube video thumbnail, medium close-up framing, straight eye-level frontal perspective, centered composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, centered directly facing camera with an intense direct hazel-eyed gaze. Handsome masculine facial features, dark wavy hair, vintage brass tinker goggles on forehead, sleek matte-black tactical half-mask with gold vents, dark rolled-sleeve shirt, leather apron, black grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} horizontally at chest height.
- Viewer's Right Hand: Extends ${rightHandTool} forward close to the lens, piled with ${cookedSpatulaPile}.
- Center Foreground: ${centerForegroundDescription}.

Viral Text Header Directive: Large bold arched text "DO NOT EAT THIS!" centered across the very top header in heavy YouTube impact font with vibrant fiery yellow-orange-red gradient, thick black outline, and soft white halo glow. Perfectly positioned in the top margin safe zone above goggles without obstructing character or props.

Lighting & Environment: ${thumbnailLighting}

Strict Constraints: Tight framing, large props. Character visually rendered only. Strictly NO username on image, NO teeth marks, NO noodles, NO meat, NO real food, NO eating.`;

  // YouTube Titles
  let youtubeTitles: string[] = [];
  if (isBicycle) {
    youtubeTitles = [
      `I Cooked a Vintage Bicycle in a Giant Indian Catering Cauldron! (Oddly Satisfying ASMR)`,
      `Cooking a Full Bicycle in a 4-Foot Wedding Feast Kadai! 🚲🔥 #ASMR`,
      `The Secret Recipe for Vintage Bicycle Stir-Fry & Tempura | ASMR Inedible Cooking`,
    ];
  } else if (isGameBoy) {
    youtubeTitles = [
      `I Cooked a Vintage Game Boy into a 5-Star Tempura! (Oddly Satisfying ASMR)`,
      `Cooking a Vintage Game Boy Color... And It Sizzles! 🎮🍤 #ASMR`,
      `The Secret Recipe for Game Boy Tempura | ASMR Inedible Cooking`,
    ];
  } else if (isCulinaryAsmr) {
    youtubeTitles = [
      `I Cooked a ${heroObject} into a 5-Star Meal (Oddly Satisfying ASMR)`,
      `Cooking a ${heroObject}... And It Sizzles! 🍳⌨️ #ASMR`,
      `The Secret Recipe for ${heroObject} Stir-Fry | ASMR Inedible Cooking`,
    ];
  } else {
    youtubeTitles = [
      `${title} | Official AI Cinematic Short Film`,
      `What Happens When You Push AI to the Limit? | ${title}`,
      `${title} — An AI Directorial Showcase`,
    ];
  }

  // YouTube Ingredients and Timestamps
  let ingredientsSection = "";
  let timestampsSection = "";
  let hashtagsList: string[] = [];
  let tagsString = "";
  let instagramCaption = "";
  let instagramHashtags = "";

  if (isBicycle) {
    ingredientsSection = `🍳 INGREDIENTS ON THE MENU:
- 1x Vintage Steel Road Bicycle (Stripped & Harvested)
- 1x 116-Link Oily Steel Bicycle Chain (Deep-Fried into Acoustic Tempura)
- 1x Dense Yellow Saddle Sponge Foam (Diced into Golden Tofu)
- 1x Heavy Black Rubber Tire (Sliced into Calamari Rings & Grated Truffle Shavings)
- 8x Snapped Steel Wheel Spokes & Spoke-Nipple Panko
- Pure Rosin Flux Glaze & Colossal Indian Catering Kadai Oil Bath`;

    timestampsSection = `⏱️ TIMESTAMPS:
0:00 - Bicycle Wheel Axle Unbolt & Fork Extraction
0:08 - Chain Tool De-Linking & Effervescent Citrus Wash
0:15 - Seatpost Pull, Saddle Peel & Sponge Tofu Dicing
0:22 - Tire Lever Rim Pry, Calamari Slicing & Box Grating
0:30 - Spoke Wire Snip & Rosin Flux Panko Batter
0:37 - Colossal Indian Catering Kadai Foaming Deep-Fry & Wok Sear
0:45 - Grand Slate Plating & Sizzling Rosin Glaze Drizzle
0:53 - Hero Acoustic Cleaver Crunch, Glaze Pull & Confident Thumbs-Up`;

    hashtagsList = [
      "#ASMR",
      "#Shorts",
      "#OddlySatisfying",
      "#Cooking",
      "#Bicycle",
      "#IndianCatering",
      "#GiantKadai",
      "#SoundDesign",
      "#InedibleCooking",
      "#ViralASMR",
    ];

    tagsString = `${title}, Inedible Cooking, Bicycle Cooking, Indian Catering Cauldron, Giant Kadai, ASMR Food, Oddly Satisfying, Bicycle Chain Tempura, Tire Calamari, Cooking ASMR, Sound Design, Food Art, Satisfying Video, CineFlow AI, Google Flow, Veo AI`;

    instagramCaption = `Who said a vintage bicycle is only for riding? 🚲🔥

Watch as we take an authentic vintage steel bicycle, unbolt the wheels, de-link the chain, slice the rubber tires into calamari rings, dice the seat sponge into golden tofu, and deep-fry it in a colossal 4-foot Indian wedding catering iron kadai!

🎧 WEAR HEADPHONES for the full ASMR experience!

${safetyDisclaimer}

💬 MENU VOTE: What giant mechanical object should I cook next in the catering cauldron?
A) Motorcycle Engine 🏍️
B) Vintage Typewriter ⌨️
C) Acoustic Guitar 🎸
Drop your vote below! 👇`;

    instagramHashtags =
      "#reels #asmr #asmrfood #oddlysatisfying #bicycle #catering #giantkadai #deepfry #tempura #creativecooking #satisfyingvideos #sounddesign #cinematicreels #foodart #viralreels #techart #satisfying #asmrcommunity #chefsofinstagram";
  } else if (isGameBoy) {
    ingredientsSection = `🍳 INGREDIENTS ON THE MENU:
- 1x Vintage Translucent Purple Game Boy Color (Cleanly Fractured)
- 1x Golden 8-Bit Pokémon Cartridge (Wafer Slice)
- 4x Magenta & Rubber Buttons (D-Pad & A/B Candies)
- Golden Rosin Flux Tempura Batter & Panko Resistors
- Coiled Copper Ribbon Noodles`;

    timestampsSection = `⏱️ TIMESTAMPS:
0:00 - Rapid 4-Beat Sourcing & Disassembly Hook
0:04 - Motherboard Snap, Cable Noodle Chop & Batter Dip
0:08 - Violent Foaming Tempura Deep-Fry & Sizzle
0:12 - 4-Quadrant Wrap Assembly & Crisp Knife Slice
0:16 - The Hero Crunch Pull & Confident Chef Thumbs-Up`;

    hashtagsList = [
      "#ASMR",
      "#Shorts",
      "#OddlySatisfying",
      "#Cooking",
      "#GameBoy",
      "#Tempura",
      "#Nintendo",
      "#SoundDesign",
      "#InedibleCooking",
      "#ViralASMR",
    ];

    tagsString = `${title}, Inedible Cooking, Game Boy Cooking, Nintendo ASMR, ASMR Food, Oddly Satisfying, Game Boy Color, Pokémon Cartridge, Tempura, Cooking ASMR, Sound Design, Food Art, Satisfying Video, CineFlow AI, Google Flow, Veo AI`;

    instagramCaption = `Who said a vintage Game Boy is only for gaming? 🎮🍤

Watch as we take authentic translucent purple Game Boy Color circuit boards, golden Pokémon cartridges, and magenta buttons, batter-fry them into sizzling golden tempura, and serve with an acoustic crunch!

🎧 WEAR HEADPHONES for the full ASMR experience!

${safetyDisclaimer}

💬 MENU VOTE: What retro gadget should I cook in the wok next?
A) Nintendo 64 Controller 🕹️
B) Sony Walkman Cassette 📼
C) Tamagotchi 🐣
Drop your vote below! 👇`;

    instagramHashtags =
      "#reels #asmr #asmrfood #oddlysatisfying #gameboy #retrogaming #nintendo #tempura #creativecooking #satisfyingvideos #sounddesign #cinematicreels #foodart #viralreels #techart #satisfying #asmrcommunity #chefsofinstagram";
  } else {
    // Standard Mechanical Keyboard defaults
    ingredientsSection = `🍳 INGREDIENTS ON THE MENU:
- 1x ${heroObject} (Fractured & Harvested)
- 40x PBT Double-Shot Keycaps (WASD & Esc in Crimson Red)
- 20x Cherry MX Mechanical Switches (Crispy Stir-Fried)
- Pure Rosin Flux Chili-Amber Glaze
- Coiled Copper Wire Garnish`;

    timestampsSection = `⏱️ TIMESTAMPS:
0:00 - Sourcing the Object
0:15 - Precision Component Extraction & Harvest
0:35 - The Heavy Cleaver Chop (Fracture & Prep)
0:50 - High-Heat Wok Stir-Fry & Glaze Sizzle
1:10 - End of Cooking & Sauce Consistency (Pan Lift)
1:20 - 3-Star Michelin White Plate Artwork Showcase`;

    hashtagsList = [
      "#ASMR",
      "#Shorts",
      "#OddlySatisfying",
      "#Cooking",
      "#MechanicalKeyboard",
      "#SoundDesign",
      "#InedibleCooking",
      "#ViralASMR",
    ];

    tagsString = `${title}, Inedible Cooking, Keyboard Cooking, ASMR Food, Oddly Satisfying, Mechanical Keyboard, Cherry MX, Keycaps, Cooking ASMR, Sound Design, Food Art, Satisfying Video, CineFlow AI, Google Flow, Veo AI`;

    instagramCaption = `Who said mechanical keyboards are only for typing? ⌨️🍳

Watch as we take authentic PBT keycaps and Cherry MX switches, sear them in high-heat amber glaze, and stir-fry them to perfection. 

🎧 WEAR HEADPHONES for the full ASMR experience!

${safetyDisclaimer}

💬 MENU VOTE: What tech gadget should I cook in the wok next?
A) Wireless Earbuds 🎧
B) Smartphone 📱
C) Gaming Mouse 🖱️
Drop your vote below! 👇`;

    instagramHashtags =
      "#reels #asmr #asmrfood #oddlysatisfying #creativecooking #satisfyingvideos #mechanicalkeyboard #sounddesign #cinematicreels #foodart #viralreels #reelsindia #techart #satisfying #asmrcommunity #chefsofinstagram #modernart";
  }

  // YouTube Full Description
  const youtubeDescription = `🎬 "${title}" — An Inedible Gourmet ASMR Experience.

${safetyDisclaimer}

📖 THE CONCEPT:
What if everyday technology could be harvested, prepared, and stir-fried with the precision of a 3-Star Michelin chef? In this episode, The Shadow Alchemist takes an authentic ${heroObject.toLowerCase()} and transforms its components into an oddly satisfying culinary artwork.

${ingredientsSection}

🎧 SOUND & FOLEY:
100% Pure ASMR Foley Sound Design. Recorded with binaural micro-textures: crisp keycap snaps, heavy cleaver chops, wok fire crackle, and sizzling oil. Best experienced with headphones.

${timestampsSection}

✨ PRODUCTION CREDITS:
Created with CineFlow AI Studio · Visuals powered by Google Flow & Veo · Sound Design by CineFlow Audio Lab.

${hashtagsList.join(" ")}`;

  const instagramAudio = isBicycle
    ? "Original Audio · ASMR Bicycle Chain Snap & Giant Kadai Oil Sizzle"
    : isGameBoy
    ? "Original Audio · ASMR Game Boy Snap & Tempura Oil Sizzle"
    : "Original Audio · ASMR Crisp Wok Sizzle & Switch Clicks";

  const instagramPinnedComment = isBicycle
    ? "🔥 MENU POLL: What giant mechanical object should I cook next in the 4-foot catering cauldron? A) Motorcycle Engine B) Vintage Typewriter C) Acoustic Guitar? Drop your vote in the comments! 👇"
    : isGameBoy
    ? "🔥 RETRO MENU POLL: What should be on next week's menu? A) Nintendo 64 Controller B) Sony Walkman Cassette C) Tamagotchi? Drop your vote in the comments! 👇"
    : "🔥 MENU POLL: What should be on next week's menu? A) Wireless Earbuds B) Smartphone C) Gaming Mouse? Drop your vote in the comments! 👇";

  return {
    projectTitle: title,
    visualStyle,
    aspectRatio: project.aspectRatio || "PORTRAIT_9_16",
    thumbnailPrompts: {
      landscape16x9: thumbnailLandscape16x9,
      portrait9x16: thumbnailPortrait9x16,
      landscape16x9WithHeadline: thumbnailLandscape16x9WithHeadline,
      portrait9x16WithHeadline: thumbnailPortrait9x16WithHeadline,
    },
    youtube: {
      titles: youtubeTitles,
      description: youtubeDescription,
      tags: tagsString,
      hashtags: hashtagsList,
    },
    instagram: {
      caption: instagramCaption,
      hashtags: instagramHashtags,
      audioRecommendation: instagramAudio,
      pinnedComment: instagramPinnedComment,
    },
    safetyDisclaimer,
  };
}
