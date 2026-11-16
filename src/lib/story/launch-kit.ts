/**
 * Social Launch Kit Engine (spec §15, ADR-010, ADR-015, ADR-017, ADR-018)
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
    title.toLowerCase().includes("cook") ||
    title.toLowerCase().includes("keyboard") ||
    title.toLowerCase().includes("asmr") ||
    desc.toLowerCase().includes("cook") ||
    desc.toLowerCase().includes("asmr");

  // Extract character anchor
  const characters = project.productionAssets?.filter((a) => a.assetType === "CHARACTER") || [];
  const leadChar = characters[0];
  const charHandle = leadChar ? `@${leadChar.name.replace(/\s+/g, "")}` : "@TheShadowAlchemist";

  // Detect subject object
  let heroObject = "Mechanical Keyboard";
  let rawObjectHalf = "a fractured, severed rectangular chunk of the matte-black mechanical keyboard, tilted to expose the raw green PCB circuit board backing, severed copper traces, and dangling loose wires, with black keycaps facing front";
  let cookedSpatulaPile = "a tall sticky mound of glossy stir-fried matte-black keycaps and crimson-red Cherry MX switches (including a prominent crimson-red ESC keycap), dripping with long stretching strands of thick, bubbling golden-amber glaze cascading downward";
  let wokContents = "stir-fried black keycaps and crimson Cherry switches bubbling in golden oil, with authentic wisps of white culinary steam curling upward";

  if (title.toLowerCase().includes("earbud")) {
    heroObject = "Wireless Earbuds";
    rawObjectHalf = "the severed charging case and cracked earbud chassis, exposing internal copper inductive charging coils, lithium cell layers, and dangling micro-wires";
    cookedSpatulaPile = "a sticky glistening mound of stir-fried black silicone ear tips, micro dynamic drivers, and gold-plated charging pins dripping with thick golden glaze";
    wokContents = "hundreds of glazed earbud drivers and silicone tips simmering in hot oil with wisps of white steam";
  } else if (title.toLowerCase().includes("phone")) {
    heroObject = "Smartphone";
    rawObjectHalf = "the fractured top half of a flagship smartphone, cleanly severed to expose the layered motherboard, copper heat pipes, and camera module";
    cookedSpatulaPile = "a sticky glistening mound of stir-fried microchips, camera sapphire lenses, and black aluminum frame fragments dripping with thick amber glaze";
    wokContents = "hundreds of glazed chipset parts and camera lenses sizzling in the hot wok with rising steam";
  } else if (title.toLowerCase().includes("watch")) {
    heroObject = "Mechanical Watch";
    rawObjectHalf = "the severed stainless-steel watch chassis, split open to reveal the exposed mechanical escapement, balance spring, and fractured gears";
    cookedSpatulaPile = "a sticky glistening mound of stir-fried miniature brass cogs, balance wheels, and ruby bearing jewels dripping with thick golden glaze";
    wokContents = "hundreds of glazed brass gears and watch wheels sizzling in the wok with rising steam";
  }

  const safetyDisclaimer =
    "⚠️ CONCEPTUAL ARTWORK & ASMR ENTERTAINMENT ONLY — INEDIBLE. DO NOT INGEST OR ATTEMPT AT HOME.";

  // MASTER TEMPLATE PROMPTS (Verified against media_1794762564764_ab5dc0ae.jpg)
  const thumbnailPortrait9x16 = `A viral vertical 9:16 YouTube Shorts and Reels thumbnail, medium close-up shot, straight eye-level frontal perspective, centered symmetrical composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, handsome masculine facial structure, looking directly into the camera lens with intense, locked hazel eyes. Dark wavy hair with vintage brass dual-lens tinker goggles resting on crown. Wearing a sleek matte-black ergonomic tactical half-mask with vertical gold cheekline vents, dark rolled-sleeve work shirt, distressed leather artisan apron, and black textured grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} at chest height.
- Viewer's Right Hand: Thrusts forward a wide angled stainless steel chef's slotted spatula holding ${cookedSpatulaPile}.
- Center Foreground: A large round seasoned black carbon-steel wok sits sizzling at the bottom, packed edge-to-edge with ${wokContents}.

Lighting & Atmosphere: Deep solid dark charcoal studio background with heavy smooth vignette, completely clean, zero clutter, zero tools. Commercial food spotlight on the dripping glaze and textures, subtle warm rim lighting on shoulders.

Strict Constraints: Character visually rendered only. Strictly NO username on image, NO text, NO typography, NO watermarks, NO teeth marks, NO noodles, NO meat, NO real food, NO eating.`;

  const thumbnailPortrait9x16WithHeadline = `A viral vertical 9:16 YouTube Shorts and Reels thumbnail, medium close-up shot, straight eye-level frontal perspective, centered symmetrical composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, handsome masculine facial structure, looking directly into the camera lens with intense, locked hazel eyes. Dark wavy hair with vintage brass dual-lens tinker goggles resting on crown. Wearing a sleek matte-black ergonomic tactical half-mask with vertical gold cheekline vents, dark rolled-sleeve work shirt, distressed leather artisan apron, and black textured grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} at chest height.
- Viewer's Right Hand: Thrusts forward a wide angled stainless steel chef's slotted spatula holding ${cookedSpatulaPile}.
- Center Foreground: A large round seasoned black carbon-steel wok sits sizzling at the bottom, packed edge-to-edge with ${wokContents}.

Viral Text Header Directive: Large bold arched text "DO NOT EAT THIS!" centered across the very top header in heavy YouTube impact font with vibrant fiery yellow-orange-red gradient, thick black outline, and soft white halo glow. Perfectly positioned in the top margin safe zone above goggles without obstructing the character or props.

Lighting & Atmosphere: Deep solid dark charcoal studio background with heavy smooth vignette, completely clean, zero clutter, zero tools. Commercial food spotlight on the dripping glaze and textures, subtle warm rim lighting on shoulders.

Strict Constraints: Character visually rendered only. Strictly NO username on image, NO teeth marks, NO noodles, NO meat, NO real food, NO eating.`;

  const thumbnailLandscape16x9 = `A viral high-contrast 16:9 YouTube video thumbnail, medium close-up framing, straight eye-level frontal perspective, centered composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, centered directly facing camera with an intense direct hazel-eyed gaze. Handsome masculine facial features, dark wavy hair, vintage brass tinker goggles on forehead, sleek matte-black tactical half-mask with gold vents, dark rolled-sleeve shirt, leather apron, black grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} horizontally at chest height.
- Viewer's Right Hand: Extends a wide stainless steel chef's slotted spatula forward close to the lens, piled with ${cookedSpatulaPile}.
- Center Foreground: A large round seasoned black carbon-steel wok filling the lower foreground, loaded with ${wokContents}.

Lighting & Environment: Seamless dark charcoal studio background with deep vignette, clean, zero clutter. High-key commercial food lighting on the dripping amber glaze and textures.

Strict Constraints: Tight framing, large props. Character visually rendered only. Strictly NO username on image, NO text, NO watermarks, NO letters, NO font overlay, NO teeth marks, NO noodles, NO meat, NO real food, NO eating.`;

  const thumbnailLandscape16x9WithHeadline = `A viral high-contrast 16:9 YouTube video thumbnail, medium close-up framing, straight eye-level frontal perspective, centered composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, centered directly facing camera with an intense direct hazel-eyed gaze. Handsome masculine facial features, dark wavy hair, vintage brass tinker goggles on forehead, sleek matte-black tactical half-mask with gold vents, dark rolled-sleeve shirt, leather apron, black grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} horizontally at chest height.
- Viewer's Right Hand: Extends a wide stainless steel chef's slotted spatula forward close to the lens, piled with ${cookedSpatulaPile}.
- Center Foreground: A large round seasoned black carbon-steel wok filling the lower foreground, loaded with ${wokContents}.

Viral Text Header Directive: Large bold arched text "DO NOT EAT THIS!" centered across the very top header in heavy YouTube impact font with vibrant fiery yellow-orange-red gradient, thick black outline, and soft white halo glow. Perfectly positioned in the top margin safe zone above goggles without obstructing character or props.

Lighting & Environment: Seamless dark charcoal studio background with deep vignette, clean, zero clutter. High-key commercial food lighting on the dripping amber glaze and textures.

Strict Constraints: Tight framing, large props. Character visually rendered only. Strictly NO username on image, NO teeth marks, NO noodles, NO meat, NO real food, NO eating.`;

  // YouTube Titles
  const youtubeTitles = isCulinaryAsmr
    ? [
        `I Cooked a ${heroObject} into a 5-Star Meal (Oddly Satisfying ASMR)`,
        `Cooking a ${heroObject}... And It Sizzles! 🍳⌨️ #ASMR`,
        `The Secret Recipe for ${heroObject} Stir-Fry | ASMR Inedible Cooking`,
      ]
    : [
        `${title} | Official AI Cinematic Short Film`,
        `What Happens When You Push AI to the Limit? | ${title}`,
        `${title} — An AI Directorial Showcase`,
      ];

  // YouTube Full Description
  const youtubeDescription = `🎬 "${title}" — An Inedible Gourmet ASMR Experience.

${safetyDisclaimer}

📖 THE CONCEPT:
What if everyday technology could be harvested, prepared, and stir-fried with the precision of a 3-Star Michelin chef? In this episode, The Shadow Alchemist takes an authentic ${heroObject.toLowerCase()} and transforms its components into an oddly satisfying culinary artwork.

🍳 INGREDIENTS ON THE MENU:
- 1x ${heroObject} (Fractured & Harvested)
- 40x PBT Double-Shot Keycaps (WASD & Esc in Crimson Red)
- 20x Cherry MX Mechanical Switches (Crispy Stir-Fried)
- Pure Rosin Flux Chili-Amber Glaze
- Coiled Copper Wire Garnish

🎧 SOUND & FOLEY:
100% Pure ASMR Foley Sound Design. Recorded with binaural micro-textures: crisp keycap snaps, heavy cleaver chops, wok fire crackle, and sizzling oil. Best experienced with headphones.

⏱️ TIMESTAMPS:
0:00 - Sourcing the Object
0:15 - Precision Component Extraction & Harvest
0:35 - The Heavy Cleaver Chop (Fracture & Prep)
0:50 - High-Heat Wok Stir-Fry & Glaze Sizzle
1:10 - The 5-Star Plating Presentation

✨ PRODUCTION CREDITS:
Created with CineFlow AI Studio · Visuals powered by Google Flow & Veo · Sound Design by CineFlow Audio Lab.

#ASMR #Shorts #OddlySatisfying #Cooking #MechanicalKeyboard #SoundDesign #InedibleCooking #Satisfying #ViralCooking`;

  const youtubeTags = `${title}, Inedible Cooking, Keyboard Cooking, ASMR Food, Oddly Satisfying, Mechanical Keyboard, Cherry MX, Keycaps, Cooking ASMR, Sound Design, Food Art, Satisfying Video, CineFlow AI, Google Flow, Veo AI`;

  const youtubeHashtags = [
    "#ASMR",
    "#Shorts",
    "#OddlySatisfying",
    "#Cooking",
    "#MechanicalKeyboard",
    "#SoundDesign",
    "#InedibleCooking",
    "#ViralASMR",
  ];

  // Instagram Reels Package
  const instagramCaption = `Who said mechanical keyboards are only for typing? ⌨️🍳

Watch as we take authentic PBT keycaps and Cherry MX switches, sear them in high-heat amber glaze, and stir-fry them to perfection. 

🎧 WEAR HEADPHONES for the full ASMR experience!

${safetyDisclaimer}

💬 MENU VOTE: What tech gadget should I cook in the wok next?
A) Wireless Earbuds 🎧
B) Smartphone 📱
C) Gaming Mouse 🖱️
Drop your vote below! 👇`;

  const instagramHashtags =
    "#reels #asmr #asmrfood #oddlysatisfying #creativecooking #satisfyingvideos #mechanicalkeyboard #sounddesign #cinematicreels #foodart #viralreels #reelsindia #techart #satisfying #asmrcommunity #chefsofinstagram #modernart";

  const instagramAudio = "Original Audio · ASMR Crisp Wok Sizzle & Switch Clicks";

  const instagramPinnedComment =
    "🔥 MENU POLL: What should be on next week's menu? A) Wireless Earbuds B) Smartphone C) Gaming Mouse? Drop your vote in the comments! 👇";

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
      tags: youtubeTags,
      hashtags: youtubeHashtags,
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
