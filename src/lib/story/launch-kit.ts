/**
 * Universal Storyboard-Driven Social Launch Kit Engine (spec §15, ADR-010, ADR-015, ADR-017, ADR-018, ADR-024, ADR-042)
 *
 * Dynamically synthesizes viral YouTube & Instagram launch metadata, high-CTR titles,
 * SEO tags, Foley audio recommendations, and verified AI thumbnail prompts (16:9 & 9:16)
 * directly from project storyboards, scenes, shots, and world engine invariants.
 *
 * Eliminates brittle hardcoded if-else conditions so that ANY unpredictable object
 * (e.g. Drones, Cameras, Instruments, Rocks, Gadgets, Industrial Machinery) automatically
 * generates custom, authentic launch metadata without code changes.
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

export interface StoryboardSceneInput {
  sceneNumber: number;
  heading: string;
  actionSummary?: string;
  action?: string;
  estimatedDurationSeconds?: number;
  shots?: Array<{
    shotNumber: number;
    actionDescription: string;
    shotSize?: string | null;
    cameraMovement?: string | null;
  }>;
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
  scenes?: StoryboardSceneInput[];
}

interface ParsedSubjectAndDish {
  heroObject: string;
  dishName: string;
  cleanTitle: string;
}

/**
 * Dynamically extracts the target hero object and culinary dish name from
 * project titles, source ideas, descriptions, and storyboard scene texts.
 */
function extractSubjectAndDish(project: ProjectContextInput): ParsedSubjectAndDish {
  const rawTitle = project.title || "The Inedible Kitchen";
  const desc = project.description || "";
  const idea = project.sourceIdea || "";
  const combined = `${rawTitle} ${desc} ${idea}`.toLowerCase();

  // 1. Clean Title (strip episode prefixes and ASMR markers)
  const cleanTitle = rawTitle
    .replace(/^Episode\s*\d+\s*:?\s*/i, "")
    .replace(/\s*\((?:ASMR|4K|Shorts|Viral)\)\s*/gi, "")
    .replace(/\s*\[(?:ASMR|4K|Shorts|Viral)\]\s*/gi, "")
    .trim();

  // 2. Detect Culinary Dish Name
  let dishName = "Gourmet Feast";
  if (/\b(idiyappam|string\s*hoppers?|sevai|rice\s*noodles?)\b/i.test(combined)) {
    dishName = "Idiyappam";
  } else if (/\b(samosas?|singara|pastry\s*cones?)\b/i.test(combined)) {
    dishName = "Samosas";
  } else if (/\b(kothu\s*parotta|kothu|parotta)\b/i.test(combined)) {
    dishName = "Madurai Kothu Parotta";
  } else if (/\b(tempura|deep[\s-]fry)\b/i.test(combined)) {
    dishName = "Tempura";
  } else if (/\b(biryani|dum\s*biryani|pulao)\b/i.test(combined)) {
    dishName = "Biryani";
  } else if (/\b(dosas?|ghee\s*roast)\b/i.test(combined)) {
    dishName = "Dosa";
  } else if (/\b(ramen|noodles?)\b/i.test(combined)) {
    dishName = "Noodles";
  } else if (/\b(idlis?|idly)\b/i.test(combined)) {
    dishName = "Idlis";
  } else if (/\b(halwa|sweet)\b/i.test(combined)) {
    dishName = "Halwa";
  } else if (/\b(sambar|curry|salna|gravy)\b/i.test(combined)) {
    dishName = "Curry";
  } else if (/\b(stir[\s-]fry|stirfry)\b/i.test(combined)) {
    dishName = "Stir-Fry";
  } else if (/\b(steak|roast)\b/i.test(combined)) {
    dishName = "Steak";
  } else if (/\b(soup|broth)\b/i.test(combined)) {
    dishName = "Soup";
  } else if (/\b(burger|patty)\b/i.test(combined)) {
    dishName = "Burger";
  } else if (/\bfeast\b/i.test(cleanTitle)) {
    dishName = "Gourmet Feast";
  }

  // 3. Extract Hero Object from Clean Title & Semantic Context
  let heroObject = cleanTitle;

  // Remove Dish & Feast words from title to isolate the pure object
  const dishRegex = new RegExp(`\\b(?:${dishName}|Feast|Gourmet|Street|Food|The|A|An)\\b`, "gi");
  const candidateObject = heroObject.replace(dishRegex, "").replace(/\s+/g, " ").trim();

  if (candidateObject.length >= 3) {
    heroObject = candidateObject;
  }

  // Semantic refinement for recognized canonical items (ensures rich detail if matched)
  if (/\b(game\s*boy|gameboy|pokemon|nintendo)\b/i.test(combined)) {
    heroObject = "Vintage Game Boy Color";
  } else if (/\b(bicycles?|bycycles?|cycles?|bikes?)\b/i.test(combined)) {
    heroObject = "Vintage Bicycle";
  } else if (/\b(nokia|3310|1100)\b/i.test(combined)) {
    heroObject = "Bulk Vintage Nokia Mobile Phones (15x Nokia 1100 / 3310)";
  } else if (/\b(soap|soaps|laundry\s*bars?)\b/i.test(combined)) {
    heroObject = "Commercial Laundry & Bath Soaps";
  } else if (/\b(bulb|light\s*bulb|serial|fairy|tungsten)\b/i.test(combined)) {
    heroObject = "100 Vintage Light Bulbs & Festival Serial Lights";
  } else if (/\b(stone|stones|quartz|granite|rock|mineral)\b/i.test(combined)) {
    heroObject = "Mountain Quartz & Granite Stones";
  } else if (/\b(keyboard|keycaps?|cherry\s*mx)\b/i.test(combined)) {
    heroObject = "Mechanical Keyboard";
  } else if (/\b(drone|quadcopter)\b/i.test(combined)) {
    heroObject = "Quadcopter Drone";
  } else if (/\b(camera|dslr)\b/i.test(combined)) {
    heroObject = "Vintage DSLR Camera";
  } else if (/\b(guitar|violin)\b/i.test(combined)) {
    heroObject = "Electric Guitar";
  } else if (/\b(shoes?|sneakers?|boots?)\b/i.test(combined)) {
    heroObject = "Vintage Leather Boots";
  }

  return { heroObject, dishName, cleanTitle };
}

/**
 * Builds the complete YouTube and Instagram launch package dynamically
 * derived from the project and storyboard scenes.
 */
export function generateSocialLaunchKit(project: ProjectContextInput): SocialLaunchKit {
  const { heroObject, dishName, cleanTitle } = extractSubjectAndDish(project);
  const visualStyle = project.visualStyle || "CULINARY_ASMR";
  const title = project.title || cleanTitle;
  const scenes = project.scenes || [];
  const combinedText = `${title} ${project.description || ""} ${project.sourceIdea || ""}`.toLowerCase();

  // Character Anchor
  const characters = project.productionAssets?.filter((a) => a.assetType === "CHARACTER") || [];
  const leadChar = characters[0];
  const rawHandle = leadChar ? `@${leadChar.name.replace(/\s+/g, "")}` : "@TheShadowAlchemist";
  const charHandle = /Shadow\s*Alchemist/i.test(rawHandle) ? "@TheShadowAlchemist" : rawHandle;

  const safetyDisclaimer =
    "⚠️ CONCEPTUAL ARTWORK & ASMR ENTERTAINMENT ONLY — INEDIBLE. DO NOT INGEST OR ATTEMPT AT HOME.";

  // --------------------------------------------------------------------------
  // 1. STORYBOARD-DRIVEN PROPS & STAGING
  // --------------------------------------------------------------------------
  const scene1Text = (scenes[0]?.actionSummary || scenes[0]?.action || "").toLowerCase();
  const sceneMiddleText = scenes
    .slice(2, 6)
    .map((s) => s.actionSummary || s.action || "")
    .join(" ")
    .toLowerCase();
  const sceneEndText = scenes
    .slice(6)
    .map((s) => s.actionSummary || s.action || "")
    .join(" ")
    .toLowerCase();

  // A. Left Hand: Raw Object Chunk (Scene 1 / Sourcing)
  let rawObjectHalf = `a cleanly fractured, raw unworked chunk of the ${heroObject}, held firmly with black-gloved hands at chest height exposing authentic raw internal materials, components, and textures`;

  if (/game\s*boy|gameboy/i.test(heroObject)) {
    rawObjectHalf =
      "the cleanly fractured, severed translucent purple Game Boy Color with the golden Pokémon 8-bit cartridge slot, raw emerald PCB circuit board backing, and dangling colorful ribbon cables";
  } else if (/bicycle/i.test(heroObject)) {
    rawObjectHalf =
      "the raw stripped chrome fork and spoked wheel rim of the dismantled vintage bicycle, leaning upright";
  } else if (/quartz|granite|stone/i.test(heroObject)) {
    rawObjectHalf =
      "a fractured, raw sparkling white mountain quartz crystal boulder and raw speckled grey granite rock with sharp crystalline facets, held with black-gloved hands at chest height";
  } else if (/bulb|serial/i.test(heroObject)) {
    rawObjectHalf =
      "a wooden crate overflowing with vintage amber teardrop Edison light bulbs with brass screw bases and a tangled, glowing garland of multi-colored festival serial fairy lights held with black-gloved hands at chest height";
  } else if (/soap/i.test(heroObject)) {
    rawObjectHalf =
      "a bundle of 4-5 authentic unbranded Tamil market soap bars wrapped in colorful retro paper wrappers, with two wrappers partially torn open to expose the raw ultramarine-blue laundry soap and glowing radiant ruby glycerine bar inside, crowned with delicate frothy white soap lather bubbles";
  } else if (/nokia/i.test(heroObject)) {
    rawObjectHalf =
      "a rustic wicker crate overflowing with 15 authentic vintage navy-blue and grey Nokia 3310 phones, held with black-gloved hands at chest height, exposing unlatched snap-on shells and green circuit boards";
  } else if (/keyboard/i.test(heroObject)) {
    rawObjectHalf =
      "a fractured, severed rectangular chunk of the matte-black mechanical keyboard, tilted to expose the raw green PCB circuit board backing, severed copper traces, and dangling loose wires, with black keycaps facing front";
  }

  // B. Center Foreground: Cooking Vessel (Middle Scenes 3-6)
  let centerForegroundDescription = `A large round seasoned black carbon-steel wok sits sizzling at the bottom, packed edge-to-edge with seared ${heroObject} components and rising culinary steam`;

  if (/steamer|steam|idiyappam/i.test(combinedText) || /steamer|steam/i.test(sceneMiddleText)) {
    centerForegroundDescription =
      "A traditional high-pressure tiered brass idiyappam steamer sits at the bottom whistling with pressurized plumes of white culinary steam, flanked by fresh green banana leaves and brass katoris of glowing gemstone kurma";
  } else if (/kadai|cauldron|catering/i.test(combinedText) || /kadai|deep-fry/i.test(sceneMiddleText)) {
    centerForegroundDescription =
      "A colossal 4-foot Indian wedding catering iron kadai (cauldron) sits boiling furiously at the bottom with bubbling golden oil, with roaring amber flames licking the curved base and plumes of culinary steam";
  } else if (/tawa|street tawa|flat iron/i.test(combinedText) || /tawa/i.test(sceneMiddleText)) {
    centerForegroundDescription =
      "A wide circular 3-foot seasoned black iron street tawa sits sizzling at the bottom, packed with glistening seared ribbons and cubes bubbling in golden oil, with authentic plumes of white culinary steam curling upward";
  }

  // C. Right Hand Tool (Final Scenes 7-8)
  let rightHandTool = "a wide angled stainless steel chef's slotted spatula";
  if (/bicycle|cycle/i.test(combinedText) || /jhara|skimmer/i.test(combinedText) || /jhara|skimmer/i.test(sceneEndText)) {
    rightHandTool = "a colossal 3-foot Indian wedding catering iron perforated skimmer (jhara)";
  } else if (/chopsticks?/i.test(combinedText) || /chopsticks?/i.test(sceneEndText)) {
    rightHandTool = "a pair of polished South Indian brass chopsticks or serving spatula";
  } else if (/thali|platter|bulb|samosa/i.test(combinedText) || /thali|platter/i.test(sceneEndText)) {
    rightHandTool = "a traditional Indian embossed brass serving thali platter";
  }

  // D. Cooked Food Pile on Tool (Final Scenes 7-8)
  let cookedSpatulaPile = `a tall sticky mound of glossy seared ${heroObject} ${dishName} components dripping with long stretching strands of thick, bubbling golden-amber glaze cascading downward`;

  if (/quartz|granite|stone|idiyappam/i.test(combinedText)) {
    cookedSpatulaPile =
      "a delicate steaming nest of continuous, translucent optical-quartz silica glass noodle threads glistening with pearly silica glaze drip and accompanied by glowing amber gemstone kurma with faceted ruby and emerald cubes, lifted with polished brass chopsticks";
  } else if (/samosa/i.test(dishName) || /bulb/i.test(heroObject)) {
    cookedSpatulaPile =
      "a traditional Indian embossed brass serving thali holding three blistering-hot, golden-crispy triangular samosas; one samosa is cracked in half revealing a steaming, glowing interior packed with tangled incandescent tungsten coils and jewel-like red, green, and yellow serial bulbs, accompanied by brass katoris of glowing mint and tamarind chutneys";
  } else if (/bicycle/i.test(heroObject)) {
    cookedSpatulaPile =
      "a monumental, sizzling mound of golden-crispy deep-fried bicycle chain tempura noodles and seared black rubber tire calamari rings, dripping with long stretching strands of thick, bubbling golden-amber glaze cascading downward, held on a colossal Indian wedding catering iron perforated skimmer (jhara)";
  } else if (/game\s*boy|gameboy/i.test(heroObject)) {
    cookedSpatulaPile =
      "a tall sticky mound of golden tempura-battered emerald circuit board chips, golden Pokémon cartridge wafers, and glossy magenta A/B buttons, dripping with long stretching strands of thick, bubbling golden-amber tempura glaze cascading downward";
  } else if (/soap/i.test(heroObject)) {
    cookedSpatulaPile =
      "a towering, sticky, glistening mound of minced soap kothu parotta (translucent ivory soap ribbon curls, seared ultramarine blue laundry cubes, glowing ruby glycerine gems, and bright emerald rings), dripping with long stretching strands of thick, bubbling golden-amber glycerin salna glaze cascading downward";
  } else if (/nokia/i.test(heroObject)) {
    cookedSpatulaPile =
      "a traditional Indian brass thali lined with fresh green banana leaf, loaded with golden copper ribbon noodles, translucent cyan keypad paneer cubes, and dusted with emerald-green mixie PCB spice powder, with a fork dipping into glowing luminous neon-cyan LCD chutney with stretching caramelized strands";
  } else if (/keyboard/i.test(heroObject)) {
    cookedSpatulaPile =
      "a tall sticky mound of glossy stir-fried matte-black keycaps and crimson-red Cherry MX switches (including a prominent crimson-red ESC keycap), dripping with long stretching strands of thick, bubbling golden-amber glaze cascading downward";
  }

  // E. Atmospheric Lighting Matching Staging
  let thumbnailLighting =
    "Deep solid dark charcoal studio background with heavy smooth vignette, completely clean, zero clutter, zero tools. Commercial food spotlight on the dripping glaze and textures, subtle warm rim lighting on shoulders.";

  if (/quartz|granite|stone|idiyappam/i.test(combinedText)) {
    thumbnailLighting =
      "Deep dark moody alchemist kitchen workshop background with warm directional golden-amber spotlights illuminating the sparkling crystalline facet dust, translucent glass noodle clarity, and jewel-toned gemstone kurma, heavy dramatic vignette, completely clean, zero clutter. Commercial food cinema spotlight on the glistening silica threads and pearly glaze drip.";
  } else if (/kadai|cauldron|bicycle/i.test(combinedText)) {
    thumbnailLighting =
      "Deep solid dark charcoal catering workshop background with warm fiery under-glow from the hearth burner, heavy dramatic vignette, completely clean, zero clutter. Commercial food spotlight on the dripping glaze and textures, subtle warm rim lighting on shoulders.";
  } else if (/bulb|samosa/i.test(combinedText)) {
    thumbnailLighting =
      "Deep dark moody street halwai workshop background with warm fiery under-glow from the giant kadai burners, incandescent amber light from glowing Edison filaments, and vibrant fairy light reflections, heavy dramatic vignette, completely clean, zero clutter. Commercial food cinema spotlight on the blistered pastry crust and jewel-like serial bulbs.";
  } else if (/soap|tawa/i.test(combinedText)) {
    thumbnailLighting =
      "Deep dark moody commercial kitchen studio background with warm directional golden-amber spotlights illuminating the glistening textures and jewel-toned soap clarity, heavy dramatic vignette, completely clean, zero clutter. Commercial food cinema spotlight on the dripping glaze and textures, subtle warm rim lighting on shoulders.";
  }

  // --------------------------------------------------------------------------
  // 2. MASTER AI THUMBNAIL PROMPTS (16:9 & 9:16)
  // --------------------------------------------------------------------------
  const thumbnailLandscape16x9 = `A viral high-contrast 16:9 YouTube video thumbnail, medium close-up framing, straight eye-level frontal perspective, centered composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, centered directly facing camera with an intense direct hazel-eyed gaze. Handsome masculine facial features, dark wavy hair, vintage brass tinker goggles on forehead, sleek matte-black tactical half-mask with gold vents, dark rolled-sleeve shirt, leather apron, black grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} horizontally at chest height.
- Viewer's Right Hand: Extends ${rightHandTool} forward close to the lens, piled with ${cookedSpatulaPile}.
- Center Foreground: ${centerForegroundDescription}.

Lighting & Environment: ${thumbnailLighting}

Strict Constraints: Tight framing, large props. Character visually rendered only. Strictly NO username on image, NO text, NO watermarks, NO letters, NO font overlay, NO teeth marks, NO meat, NO real grocery food, NO eating.`;

  const thumbnailLandscape16x9WithHeadline = `A viral high-contrast 16:9 YouTube video thumbnail, medium close-up framing, straight eye-level frontal perspective, centered composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, centered directly facing camera with an intense direct hazel-eyed gaze. Handsome masculine facial features, dark wavy hair, vintage brass tinker goggles on forehead, sleek matte-black tactical half-mask with gold vents, dark rolled-sleeve shirt, leather apron, black grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} horizontally at chest height.
- Viewer's Right Hand: Extends ${rightHandTool} forward close to the lens, piled with ${cookedSpatulaPile}.
- Center Foreground: ${centerForegroundDescription}.

Viral Text Header Directive: Large bold arched text "DO NOT EAT THIS!" centered across the very top header in heavy YouTube impact font with vibrant fiery yellow-orange-red gradient, thick black outline, and soft white halo glow. Perfectly positioned in the top margin safe zone above goggles without obstructing character or props.

Lighting & Environment: ${thumbnailLighting}

Strict Constraints: Tight framing, large props. Character visually rendered only. Strictly NO username on image, NO teeth marks, NO meat, NO real grocery food, NO eating.`;

  const thumbnailPortrait9x16 = `A viral vertical 9:16 YouTube Shorts and Reels thumbnail, medium close-up shot, straight eye-level frontal perspective, centered symmetrical composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, handsome masculine facial structure, looking directly into the camera lens with intense, locked hazel eyes. Dark wavy hair with vintage brass dual-lens tinker goggles resting on crown. Wearing a sleek matte-black ergonomic tactical half-mask with vertical gold cheekline vents, dark rolled-sleeve work shirt, distressed leather artisan apron, and black textured grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} at chest height.
- Viewer's Right Hand: Thrusts forward ${rightHandTool} holding ${cookedSpatulaPile}.
- Center Foreground: ${centerForegroundDescription}.

Lighting & Atmosphere: ${thumbnailLighting}

Strict Constraints: Character visually rendered only. Strictly NO username on image, NO text, NO typography, NO watermarks, NO teeth marks, NO meat, NO real grocery food, NO eating.`;

  const thumbnailPortrait9x16WithHeadline = `A viral vertical 9:16 YouTube Shorts and Reels thumbnail, medium close-up shot, straight eye-level frontal perspective, centered symmetrical composition.

Subject: ${charHandle}, an athletic male artisan culinary alchemist chef, handsome masculine facial structure, looking directly into the camera lens with intense, locked hazel eyes. Dark wavy hair with vintage brass dual-lens tinker goggles resting on crown. Wearing a sleek matte-black ergonomic tactical half-mask with vertical gold cheekline vents, dark rolled-sleeve work shirt, distressed leather artisan apron, and black textured grip gloves.

Dual-Handed Props & Invariant Composition:
- Viewer's Left Hand: Grips ${rawObjectHalf} at chest height.
- Viewer's Right Hand: Thrusts forward ${rightHandTool} holding ${cookedSpatulaPile}.
- Center Foreground: ${centerForegroundDescription}.

Viral Text Header Directive: Large bold arched text "DO NOT EAT THIS!" centered across the very top header in heavy YouTube impact font with vibrant fiery yellow-orange-red gradient, thick black outline, and soft white halo glow. Perfectly positioned in the top margin safe zone above goggles without obstructing the character or props.

Lighting & Atmosphere: ${thumbnailLighting}

Strict Constraints: Character visually rendered only. Strictly NO username on image, NO teeth marks, NO meat, NO real grocery food, NO eating.`;

  // --------------------------------------------------------------------------
  // 3. DYNAMIC HIGH-CTR YOUTUBE TITLES
  // --------------------------------------------------------------------------
  const youtubeTitles: string[] = [
    `I Cooked ${heroObject} into ${dishName}! (Oddly Satisfying ASMR)`,
    `Cooking ${heroObject}... And It Sizzles! 🔥 #shorts #asmr`,
    `The Secret Recipe for ${heroObject} ${dishName} | ASMR Inedible Cooking`,
    `The ${heroObject} ${dishName} Feast | ASMR Inedible Cooking`,
    `Turning ${heroObject} into a 5-Star Feast (Extreme ASMR)`,
  ];

  // Tailored title overrides for specific celebrated styles
  if (/quartz|granite|stone|idiyappam/i.test(combinedText)) {
    youtubeTitles[0] = `I Cooked Mountain Quartz & Granite Stones into Idiyappam! 🪨🍜 (Oddly Satisfying ASMR)`;
    youtubeTitles[1] = `Cooking Raw Quartz Stones into Steamed String Hoppers! 💎🔥 #shorts #asmr`;
    youtubeTitles[2] = `The Mountain Quartz & Granite Idiyappam Feast | ASMR Inedible Cooking`;
  } else if (/bulb|samosa/i.test(combinedText)) {
    youtubeTitles[0] = `I Cooked 100 Vintage Light Bulbs into Samosas! 💡🥟 (Oddly Satisfying ASMR)`;
    youtubeTitles[1] = `Cooking 100 Vintage Light Bulbs into Indian Street Samosas! 💡🔥 #shorts #asmr`;
    youtubeTitles[2] = `The 100 Vintage Light Bulb Samosa Feast | ASMR Inedible Cooking`;
  } else if (/bicycle/i.test(combinedText)) {
    youtubeTitles[0] = `I Cooked a Vintage Bicycle in a Giant Indian Catering Cauldron! (Oddly Satisfying ASMR)`;
    youtubeTitles[1] = `Cooking a Full Bicycle in a 4-Foot Wedding Feast Kadai! 🚲🔥 #ASMR`;
    youtubeTitles[2] = `The Secret Recipe for Vintage Bicycle Stir-Fry & Tempura | ASMR Inedible Cooking`;
  } else if (/game\s*boy|gameboy/i.test(combinedText)) {
    youtubeTitles[0] = `I Cooked a Vintage Game Boy into a 5-Star Tempura! (Oddly Satisfying ASMR)`;
    youtubeTitles[1] = `Cooking a Vintage Game Boy Color... And It Sizzles! 🎮🍤 #ASMR`;
    youtubeTitles[2] = `The Secret Recipe for Game Boy Tempura | ASMR Inedible Cooking`;
  } else if (/soap|kothu/i.test(combinedText)) {
    youtubeTitles[0] = `I Cooked 60 Tamil Market Soaps into Street Food! (Oddly Satisfying ASMR)`;
    youtubeTitles[1] = `Cooking Commercial Laundry & Bath Soaps on a Street Tawa! 🧼🔥 #ASMR #InedibleCooking`;
    youtubeTitles[2] = `The Madurai Soap Kothu Parotta Street Food Feast | ASMR Inedible Cooking`;
  } else if (/nokia/i.test(combinedText)) {
    youtubeTitles[0] = `I Cooked 15 Vintage Nokia Phones on a Street Dosa Tawa! (Village Cooking ASMR)`;
    youtubeTitles[1] = `Cooking 15 Indestructible Nokia Phones in Bulk! 📱🔥 #ASMR #VillageCooking`;
    youtubeTitles[2] = `The Indestructible Vintage Nokia Village Feast | ASMR Inedible Cooking`;
  }

  // --------------------------------------------------------------------------
  // 4. STORYBOARD-DRIVEN TIMESTAMPS & INGREDIENTS
  // --------------------------------------------------------------------------
  let timestampsSection = "";
  if (scenes.length > 0) {
    let cumulative = 0;
    const lines = scenes.map((s) => {
      const mins = Math.floor(cumulative / 60);
      const secs = (cumulative % 60).toString().padStart(2, "0");
      cumulative += s.estimatedDurationSeconds || 8;
      const cleanH = s.heading
        .replace(/^(INT\.|EXT\.)\s*/i, "")
        .replace(/-\s*(DAY|NIGHT|EVENING|HOOK)\s*$/i, "")
        .trim();
      const snippet = (s.actionSummary || s.action || "")
        .slice(0, 50)
        .replace(/\s+/g, " ")
        .trim();
      return `${mins}:${secs} - ${cleanH} (${snippet}...)`;
    });
    timestampsSection = `⏱️ TIMESTAMPS:\n${lines.join("\n")}`;
  } else {
    timestampsSection = `⏱️ TIMESTAMPS:
0:00 - Sourcing the Raw ${heroObject} (Hook)
0:08 - Precision Component Disassembly & Sledgehammer Fracture
0:16 - Ingredient Prep & Texture Grinding
0:24 - Seasoning, Scalding & Dough Forming
0:32 - Primary Shaping & Transformation
0:40 - High-Heat Sizzle & Cooking
0:48 - Grand Masterpiece Plating
0:54 - Hero Acoustic Crunch & Final Reveal`;
  }

  let ingredientsSection = `🍳 INGREDIENTS ON THE MENU:
- 1x ${heroObject} (Sourced & Harvested from Authentic Habitat)
- Precision Artisan Component Disassembly & Fracture
- Specialized Processing Machine / Ore Mill / Extruder Press
- Signature Alchemist Glaze Drizzle & Bubbling Sizzle
- Masterpiece Plating with Pure Acoustic Foley Sound Design`;

  if (/quartz|granite|stone|idiyappam/i.test(combinedText)) {
    ingredientsSection = `🍜 INGREDIENTS ON THE MENU:
- 50kg Raw Mountain White Quartz Crystal Boulders & High-Grade Quarry Granite Rocks
- 1x 16lb Steel Sledgehammer & Hardened Anvil Counter (Spark-Explosion Fracture)
- 1x Colossal Twin-Wheel Granite Edge-Runner Mill (Pulverizing Quartz into Pure Crystalline Silica Mineral Flour)
- Scalding 100°C Mineral Spring Water from Copper Kettle (Elastic Crystalline Paste)
- 1x Floor-Mounted Solid Cast-Brass Extruder Press with 6-Spoke Flywheel (Continuous Glowing Translucent Optical-Quartz Silica Glass Noodle Threads)
- 1x High-Pressure Tiered Brass Idiyappam Steamer (Whistling Pressurized Steam)
- Plating on Fresh Green Banana Leaf with Pearly Silica Glaze & Amber Gemstone Kurma (Faceted Ruby, Emerald & Amethyst Cubes)`;
  } else if (/bulb|samosa/i.test(combinedText)) {
    ingredientsSection = `🥟 INGREDIENTS ON THE MENU:
- 100x Vintage Teardrop Edison Light Bulbs (Brass E27 Screw Bases & Spiraling Tungsten Filaments)
- 1x 10-Meter String of Multi-Colored Festival Serial Lights (Ruby Red, Emerald Green & Amber Rice Bulbs)
- Smashed Amber Edison Glass Shards & Tangled Tungsten Coils (Spiced Masala Aloo Filling)
- Snipped Green Copper Wires & Miniature Brass Contact Pins (Kasuri Methi & Whole Cumin Tadka)
- Semi-Translucent Amber Mica Dough Sheets (Hand-Crimped Triangular Samosa Cones)
- 300°C Golden Transformer Mineral Oil (Deep-Fried in a Massive 3-Foot Cast-Iron Kadai)
- Glowing Emerald Mint Chutney & Ruby Tamarind Glaze (Served in Polished Brass Katoris)`;
  } else if (/bicycle/i.test(combinedText)) {
    ingredientsSection = `🍳 INGREDIENTS ON THE MENU:
- 1x Vintage Steel Road Bicycle (Stripped & Harvested)
- 1x 116-Link Oily Steel Bicycle Chain (Deep-Fried into Acoustic Tempura)
- 1x Dense Yellow Saddle Sponge Foam (Diced into Golden Tofu)
- 1x Heavy Black Rubber Tire (Sliced into Calamari Rings & Grated Truffle Shavings)
- 8x Snapped Steel Wheel Spokes & Spoke-Nipple Panko
- Colossal Indian Catering Kadai Oil Bath & Pure Rosin Flux Glaze`;
  } else if (/game\s*boy|gameboy/i.test(combinedText)) {
    ingredientsSection = `🍳 INGREDIENTS ON THE MENU:
- 1x Vintage Translucent Purple Game Boy Color (Cleanly Fractured)
- 1x Golden 8-Bit Pokémon Cartridge (Wafer Slice)
- 4x Magenta & Rubber Buttons (D-Pad & A/B Candies)
- Golden Rosin Flux Tempura Batter & Panko Resistors
- Coiled Copper Ribbon Noodles`;
  } else if (/soap/i.test(heroObject)) {
    ingredientsSection = `🍳 INGREDIENTS ON THE MENU:
- 60x Raw Unbranded Tamil Nadu Market Soaps (Ultramarine Blue Laundry Bars, Carbolic Yellow, Brick Red, Grooved White & Emerald Glycerine)
- 1x Japanese Wood Planer (Kanna) Shaving Ultra-Thin Translucent Soap Ribbon Parotta
- 5x Translucent Blue Laundry Bars & Ruby Bath Glycerine (Diced into Hotel Jewel Cubes)
- 1x Commercial Shaving Cream Canister (Whipped into Glossy Onion Raita with Ruby Gems)
- 1x Liquid Golden Glycerin Flask (Simmered into Bubbling Golden Salna Broth)
- 1x Dried Loofah Gourd Sponge (Shredded into Crispy Fried Onions)`;
  } else if (/keyboard/i.test(heroObject)) {
    ingredientsSection = `🍳 INGREDIENTS ON THE MENU:
- 1x Mechanical Keyboard (Fractured & Harvested)
- 40x PBT Double-Shot Keycaps (WASD & Esc in Crimson Red)
- 20x Cherry MX Mechanical Switches (Crispy Stir-Fried)
- Pure Rosin Flux Chili-Amber Glaze
- Coiled Copper Wire Garnish`;
  }

  // --------------------------------------------------------------------------
  // 5. DYNAMIC SEO TAGS & HASHTAGS
  // --------------------------------------------------------------------------
  const cleanHeroTag = heroObject.replace(/[^a-zA-Z0-9]/g, "");
  const cleanDishTag = dishName.replace(/[^a-zA-Z0-9]/g, "");

  const hashtagsList = [
    "#ASMR",
    "#Shorts",
    `#${cleanDishTag}`,
    `#${cleanHeroTag}`,
    "#InedibleCooking",
    "#OddlySatisfying",
    "#FoodIllusion",
    "#TheShadowAlchemist",
  ];

  if (/game\s*boy|gameboy/i.test(combinedText)) {
    if (!hashtagsList.includes("#GameBoy")) hashtagsList.push("#GameBoy");
    if (!hashtagsList.includes("#Tempura")) hashtagsList.push("#Tempura");
  } else if (/bicycle|cycle/i.test(combinedText)) {
    if (!hashtagsList.includes("#Bicycle")) hashtagsList.push("#Bicycle");
    if (!hashtagsList.includes("#GiantKadai")) hashtagsList.push("#GiantKadai");
  } else if (/quartz|granite|stone|idiyappam/i.test(combinedText)) {
    if (!hashtagsList.includes("#Idiyappam")) hashtagsList.push("#Idiyappam");
    if (!hashtagsList.includes("#QuartzCooking")) hashtagsList.push("#QuartzCooking");
  } else if (/keyboard/i.test(combinedText)) {
    if (!hashtagsList.includes("#MechanicalKeyboard")) hashtagsList.push("#MechanicalKeyboard");
  }

  const tagsString = `${heroObject}, ${dishName}, ${title}, Inedible Cooking, ASMR Cooking, Oddly Satisfying, The Shadow Alchemist, Food Illusion, Bayashi ASMR, Zach Choi ASMR, Satisfying ASMR, Sound Design, Food Art`;

  // --------------------------------------------------------------------------
  // 6. INSTAGRAM SOCIAL PACKAGE & AUDIO
  // --------------------------------------------------------------------------
  let instagramCaption = `Who said ${heroObject.toLowerCase()} can't be cooked into ${dishName.toLowerCase()}? 🔥

Watch @TheShadowAlchemist transform raw ${heroObject.toLowerCase()} into an impossible culinary masterwork! 

🎧 WEAR HEADPHONES for the full ASMR Foley experience!

${safetyDisclaimer}

💬 MENU VOTE: What impossible object should I cook next? Drop your vote below! 👇`;

  if (/keyboard/i.test(heroObject)) {
    instagramCaption = `Who said mechanical keyboards are only for typing? ⌨️🍳

Watch as we take authentic PBT keycaps and Cherry MX switches, sear them in high-heat amber glaze, and stir-fry them to perfection. 

🎧 WEAR HEADPHONES for the full ASMR experience!

${safetyDisclaimer}

💬 MENU VOTE: What tech gadget should I cook in the wok next?
A) Wireless Earbuds 🎧
B) Smartphone 📱
C) Gaming Mouse 🖱️
Drop your vote below! 👇`;
  } else if (/game\s*boy|gameboy/i.test(heroObject)) {
    instagramCaption = `Who said a vintage Game Boy is only for gaming? 🎮🍤

Watch as we take authentic translucent purple Game Boy Color circuit boards, golden Pokémon cartridges, and magenta buttons, batter-fry them into sizzling golden tempura, and serve with an acoustic crunch!

🎧 WEAR HEADPHONES for the full ASMR experience!

${safetyDisclaimer}

💬 MENU VOTE: What retro gadget should I cook in the wok next?
A) Nintendo 64 Controller 🕹️
B) Sony Walkman Cassette 📼
C) Tamagotchi 🐣
Drop your vote below! 👇`;
  } else if (/bicycle/i.test(heroObject)) {
    instagramCaption = `Who said a vintage bicycle is only for riding? 🚲🔥

Watch as we take an authentic vintage steel bicycle, unbolt the wheels, de-link the chain, slice the rubber tires into calamari rings, dice the seat sponge into golden tofu, and deep-fry it in a colossal 4-foot Indian wedding catering iron kadai!

🎧 WEAR HEADPHONES for the full ASMR experience!

${safetyDisclaimer}

💬 MENU VOTE: What giant mechanical object should I cook next in the catering cauldron?
A) Motorcycle Engine 🏍️
B) Vintage Typewriter ⌨️
C) Acoustic Guitar 🎸
Drop your vote below! 👇`;
  } else if (/quartz|granite|stone|idiyappam/i.test(combinedText)) {
    instagramCaption = `Who said mountain quartz and granite stones can't be steamed into delicate idiyappam string hoppers? 🪨✨

Watch @TheShadowAlchemist crush raw mountain quartz boulders in a colossal granite edge-runner mill, scald the sparkling mineral flour, extrude translucent optical-quartz silica glass noodle threads through a vertical brass flywheel press, and steam them to perfection!

🎧 WEAR HEADPHONES for the full ASMR Foley experience!

${safetyDisclaimer}

💬 MENU VOTE: What impossible mineral or object should I cook next?
A) Amethyst Crystals 🔮
B) Vintage Typewriter ⌨️
C) Brass Wall Clock 🕰️
Drop your vote below! 👇`;
  }

  const instagramHashtags = `#reels #asmr #asmrfood #oddlysatisfying #${cleanDishTag.toLowerCase()} #${cleanHeroTag.toLowerCase()} #creativecooking #satisfyingvideos #sounddesign #cinematicreels #foodart #viralreels #techart #satisfying #asmrcommunity #chefsofinstagram`;

  let instagramAudio = `Original Audio · 100% Pure ASMR Foley Sound Design (${heroObject} crunch & sizzle)`;
  if (/game\s*boy|gameboy/i.test(heroObject)) {
    instagramAudio = "Original Audio · ASMR Game Boy Snap & Tempura Oil Sizzle";
  } else if (/bicycle/i.test(heroObject)) {
    instagramAudio = "Original Audio · ASMR Bicycle Chain Snap & Giant Kadai Oil Sizzle";
  } else if (/quartz|granite|stone|idiyappam/i.test(combinedText)) {
    instagramAudio = "Original Audio · ASMR Granite Roller Mill & Whistling Tiered Brass Steamer";
  }

  const instagramPinnedComment = `🔥 MENU POLL: What impossible object should I cook next in the studio? Drop your vote in the comments! 👇`;

  // --------------------------------------------------------------------------
  // 7. YOUTUBE FULL DESCRIPTION
  // --------------------------------------------------------------------------
  const youtubeDescription = `🎬 "${title}" — An Inedible Gourmet ASMR Experience.

${safetyDisclaimer}

📖 THE CONCEPT:
What if everyday objects and impossible materials could be harvested, prepared, and cooked with the precision of a 3-Star Michelin chef? In this episode, The Shadow Alchemist takes raw ${heroObject.toLowerCase()} and transforms its components into an oddly satisfying ${dishName.toLowerCase()} culinary artwork.

${ingredientsSection}

🎧 SOUND & FOLEY:
100% Pure ASMR Foley Sound Design. Recorded with binaural micro-textures: crisp fractures, acoustic snaps, heavy cleaver chops, pressurized steam hiss, and bubbling oil. Best experienced with headphones.

${timestampsSection}

✨ PRODUCTION CREDITS:
Created with CineFlow AI Studio · Visuals powered by Google Flow & Veo · Sound Design by CineFlow Audio Lab.

${hashtagsList.join(" ")}`;

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
