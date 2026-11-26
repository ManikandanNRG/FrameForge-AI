/**
 * Universal Inedible Craft-Culinary Pipeline Generator (spec §8, §15, ADR-005)
 *
 * Generates physically grounded, chronologically ordered 4-stage episodic scenes
 * for ANY physical/inedible hero object (Bicycles, Keyboards, Watches, Cameras,
 * Walkmans, Smartphones, etc.) across any runtime (20s, 30s, 60s, 90s).
 */

import { resolveObjectComponentSpecs } from "./world-engine";

export interface InedibleSceneTemplate {
  num: number;
  heading: string;
  action: string;
  shotSize: string;
  cameraMovement: string;
  foley: string;
  estimatedDurationSeconds: number;
}

export interface InedibleComparisonRow {
  realElement: string;
  inedibleCounterpart: string;
  cookingMethod: string;
}

export interface InediblePipelineResult {
  logline: string;
  premise: string;
  synopsis: string;
  scenes: InedibleSceneTemplate[];
  thumbnailPrompt: string;
}

export function generateInediblePipelineScenes(params: {
  heroObject: string;
  sourceIdea: string;
  studioEnvironment: string;
  targetRuntime: number;
  episodeNumber?: number;
  seriesTitle?: string;
  dishName?: string;
  comparisonTable?: InedibleComparisonRow[];
  sceneCount?: number;
}): InediblePipelineResult {
  const {
    heroObject,
    sourceIdea,
    studioEnvironment,
    targetRuntime,
    episodeNumber = 1,
    seriesTitle = "The Shadow Alchemist — Inedible ASMR",
    dishName,
    comparisonTable,
    sceneCount,
  } = params;

  const specs = resolveObjectComponentSpecs(heroObject, sourceIdea);
  const isBicycle = specs.category === "BICYCLE_VEHICLE";
  const isNokia =
    specs.category === "BULK_NOKIA_PHONES" ||
    /\b(nokia|3310|1100|brick phones?|feature phones?|keypad phones?|bulk phones?)\b/i.test(`${heroObject} ${sourceIdea}`);
  const isLargeObject = Boolean(specs.isLargeObject);

  const totalScenes = sceneCount
    ? Math.min(8, Math.max(5, Math.round(sceneCount)))
    : targetRuntime >= 55
    ? 8
    : targetRuntime >= 40
    ? 6
    : 5;
  const sceneDuration = Math.round(targetRuntime / totalScenes);

  const vesselName = isLargeObject
    ? "oversized industrial steel catering tawa & giant high-capacity catering kadai"
    : "scorching flat-top griddle & seasoned cast-iron skillet";

  const timecodeFor = (index: number) => {
    const startSec = Math.round(index * (targetRuntime / totalScenes));
    const endSec = index === totalScenes - 1
      ? targetRuntime
      : Math.round((index + 1) * (targetRuntime / totalScenes));

    const fmt = (s: number) => {
      const m = Math.floor(s / 60);
      const rem = s % 60;
      return `${m}:${rem.toString().padStart(2, "0")}`;
    };
    return {
      label: `(${fmt(startSec)} - ${fmt(endSec)})`,
      start: fmt(startSec),
      end: fmt(endSec),
      duration: endSec - startSec,
    };
  };

  const scenes: InedibleSceneTemplate[] = [];

  if (isBicycle && totalScenes === 8) {
    // 60-second 8-scene Epic Bicycle Catering Experience
    scenes.push(
      {
        num: 1,
        heading: `INT. ${studioEnvironment.toUpperCase()} - RAW BICYCLE HOOK & CLEAVER TIRE STRIKE (0:00 - 0:08)`,
        action: `[0:00-0:02] In a brightly lit open-daylight workshop, black-gloved hands violently slam a heavy Damascus meat cleaver straight into the rubber sidewall of a vintage road bicycle wheel on the natural oak butcher block (*LOUD ACOUSTIC THUD-CRACK*). [0:02-0:05] With forceful alchemist leverage, chef forcefully whips and peels the slender 28mm black rubber road tire clean off the spoked wire rim in one continuous spiral whip pull (*SKRRR-SNAP*), sending brass spoke nipples scattering across the wood. [0:05-0:08] Cleaver immediately descends in high-speed 2X staccato chopping: slices the rubber tire into thick squid-ink calamari rings (*thwack-thwack-thwack*) while oily steel chain links rattle onto the board. 90% screen real estate locked on bicycle parts; extreme close-up macro.`,
        shotSize: "Extreme Close-Up",
        cameraMovement: "Rapid Top-Down Macro Snap",
        foley: "Binaural ASMR Foley: Heavy steel cleaver striking rubber and end-grain wood (*THUD-CRACK*), violent rubber whip peel (*SKRRR-SNAP*), brass spoke nipples rattling like dice, rapid staccato knife chops (*thwack-thwack*). Zero music, pure acoustic Foley.",
        estimatedDurationSeconds: 8,
      },
      {
        num: 2,
        heading: `INT. ${studioEnvironment.toUpperCase()} - CHAIN BREAKER PIN POP & SADDLE FOAM EXTRACTION (0:08 - 0:15)`,
        action: `[0:08-0:11] Compact screw-driven bicycle chain breaker tool engages the steel roller chain link: rotating the chrome tee-handle punches the rivet pin straight through (*SNAP-CLICK*), and chef unthreads the oily steel chain like metallic linguine. [0:11-0:15] Hex allen wrench unbolts the vintage saddle clamp; gloved hands strip the leather skin and rip out a dense rectangular block of bright yellow seat cushion sponge foam (*FWUMP*). Extreme close-up macro on mechanical harvest.`,
        shotSize: "Extreme Close-Up Macro",
        cameraMovement: "Macro Tracking Orbit",
        foley: "Binaural ASMR Foley: Crisp mechanical pin pop (*SNAP-CLICK*), oily chain slithering with metallic rattle (*CLINK-CLATTER*), heavy foam extraction thump (*FWUMP*).",
        estimatedDurationSeconds: 7,
      },
      {
        num: 3,
        heading: `INT. BUTCHER BLOCK - FOAM TOFU DICING & TIRE CALAMARI RINGS (0:15 - 0:23)`,
        action: `[0:15-0:19] On the bright natural-grain oak butcher block, a razor-sharp Damascus cleaver rapidly dices the dense yellow seat sponge into uniform 1-inch golden 'tofu' cubes in high-speed staccato (*thwack-thwack-thwack*). [0:19-0:23] Heavy utility blade slices the slender 28mm bicycle rubber tire crosswise into thick squid-ink-black 'calamari rings' and scores fine cross-hatch diamond grooves into the rubber sidewall. 90% camera fill; 2X rapid tempo.`,
        shotSize: "Top-Down Flat Lay Lock",
        cameraMovement: "Top-Down Flat Lay Lock",
        foley: "Binaural ASMR Foley: Rapid rhythmic knife thwacks on dense foam (*thwack-thwack*), clean slicing through rubber tread, acoustic wood resonance.",
        estimatedDurationSeconds: 8,
      },
      {
        num: 4,
        heading: `INT. PREP STATION - STAINLESS BOX GRATER TIRE SHAVINGS & ROSIN MARINADE (0:23 - 0:30)`,
        action: `[0:23-0:27] On a large stainless four-sided box grater, gloved hand vigorously rasps the outer tread of the bicycle tire into a fine aromatic mound of black rubber 'truffle shavings' (*SHRRR-SHRRR*). [0:27-0:30] Coiled steel bicycle chain plunges into a shallow bowl of thick golden rosin glaze; gloved chopsticks toss the links until glistening and scatter silver spoke nipples like crunchy sesame seeds.`,
        shotSize: "Macro Close-Up 45-Degree",
        cameraMovement: "Dynamic Macro Glide",
        foley: "Binaural ASMR Foley: Rough rhythmic rasping sound of rubber grated on stainless steel (*SHRRR-SHRRR*), wet viscous splash of golden glaze, metallic chopstick clinks.",
        estimatedDurationSeconds: 7,
      },
      {
        num: 5,
        heading: `INT. COOK STATION - MASSIVE INDIAN CATERING KADAI DEEP-FRY (0:30 - 0:38)`,
        action: `[0:30-0:34] Over a roaring blue industrial gas burner, black-gloved hands lower the glazed bicycle chain links into a massive high-capacity catering kadai of bubbling hot sesame oil (*TZZZZZZZZ*). Intense golden micro-bubbles foam violently around the steel links. [0:34-0:38] Long brass cooking chopsticks quickly agitate and separate the crispy chain noodles as hot oil foams; brass tongs lift the steaming golden-crusted chain onto an elevated wire cooling rack. Hot oil crackles fiercely. 90% camera fill; extreme macro 45° angle.`,
        shotSize: "Macro Close-Up 45-Degree",
        cameraMovement: "Low Angle Oil Surface Push",
        foley: "Binaural ASMR Foley: Explosive high-heat oil roar (*TZZZZZZZZ*), vigorous foaming sizzle, brass chopstick clinks against giant kadai rim, sizzling oil droplets crackling on wire rack.",
        estimatedDurationSeconds: 8,
      },
      {
        num: 6,
        heading: `INT. COOK STATION - OVERSIZED CATERING TAWA SEAR & CARAMELIZED GLAZE LIFT (0:38 - 0:45)`,
        action: `[0:38-0:42] On a scorching oversized commercial catering flat-top steel tawa, stainless steel tongs press the rubber tire calamari rings and diced yellow sponge cubes firmly onto smoking oil (*CHHHHH*), searing deep charred grill marks. [0:42-0:45] Dual spatulas scrape underneath and lift the sizzling hardware cluster; thick caramelized molten glaze stretches in viscous golden strings and drips back onto the screaming griddle in slow motion.`,
        shotSize: "Macro Close-Up",
        cameraMovement: "Macro Tracking Orbit",
        foley: "Binaural ASMR Foley: Screaming flat-top griddle sear (*CHHHHH*), spatula scraping steel rhythm, thick viscous sauce bubbling and dripping.",
        estimatedDurationSeconds: 7,
      },
      {
        num: 7,
        heading: `INT. BUTCHER BLOCK - COLOSSAL CATERING BANQUET ASSEMBLY & DIAGONAL CLEAVER CRUNCH (0:45 - 0:53)`,
        action: `[0:45-0:49] On the expansive butcher block, black-gloved hands rapidly assemble a colossal catering banquet feast: multiple large parchment sheets loaded with mountain-heaps of golden-crisped bicycle chain noodles, sizzling tire calamari rings, charred golden sponge tofu cubes, and brimming brass bowls of molten rosin glaze and toasted spoke-nipple crunch. Hands fold multiple oversized triangular crunch pockets in rapid succession. [0:49-0:53] Heavy Damascus cleaver strikes down in rapid staccato: slices diagonally straight through the golden crunch pockets with an ear-splitting razor acoustic *CRUNCH*, revealing brimming overflowing layers of steaming, glistening hardware fillings!`,
        shotSize: "Top-Down Flat Lay",
        cameraMovement: "Rapid Dynamic Macro Pan",
        foley: "Binaural ASMR Foley: Fast paper rustle, razor-sharp crust cleavage, ear-splitting acoustic *CRUNCH*.",
        estimatedDurationSeconds: 8,
      },
      {
        num: 8,
        heading: `INT. HERO SHOWCASE - MASSIVE CATERING BANQUET SPREAD, MOLTEN GLAZE PULL & CHEF THUMBS-UP (0:53 - 1:00)`,
        action: `[0:53-0:57] Extreme macro close-up. Two black-gloved hands grip a diagonally sliced golden bicycle crunch pocket and pull it slowly apart: thick strands of bubbling, melted caramelized golden glaze stretch between crispy steel chain links, seared rubber tire rings, and pillowy yellow sponge cubes as aromatic steam billows outward. The table is laden with a lavish Indian wedding banquet spread of multiple stacked platters, bowls of sizzling chain chips, and golden bicycle sprockets. [0:57-1:00] Camera tilts up smoothly to [@TheShadowAlchemist] in brass tinker goggles and matte-black tactical mask overlooking the grand feast. Chef looks directly into the lens, gives an appreciative slow nod, and flashes a sharp, confident thumbs-up to camera!`,
        shotSize: "Extreme Close-Up to Medium Up-Tilt",
        cameraMovement: "Macro Pull and Slow Tilt Up",
        foley: "Binaural ASMR Foley: Tactile acoustic crunch pull, soft bubbling caramelized glaze stretch, gentle ceramic plate contact, soft deep breath from mask cheek vents. Ending on silence.",
        estimatedDurationSeconds: 7,
      }
    );
  } else if (isBicycle && totalScenes === 5) {
    // 20-second 5-scene Rapid Bicycle Experience
    scenes.push(
      {
        num: 1,
        heading: `INT. ${studioEnvironment.toUpperCase()} - BICYCLE DISASSEMBLY HOOK (0:00 - 0:04)`,
        action: `[0:00-0:01] Black-gloved hands violently slam a vintage steel bicycle wheel and crankset onto the ${studioEnvironment} (*HEAVY CLANG*). [0:01-0:02] In a split-second whip motion, fingers forcefully yank the oily steel bicycle chain off the teeth with a rapid metallic rattle (*CLINK-CLATTER*). [0:02-0:03] Stainless wrench unbolts the bicycle saddle and strips the leather cover, ripping out a thick rectangular block of dense yellow seat sponge foam (*FWUMP*). [0:03-0:04] Steel tire levers wedge under the rim, popping the slender 28mm rubber tire off into a prep tray. 90% screen real estate locked on bicycle parts; extreme close-up macro. 2X fast-forward tempo.`,
        shotSize: "Extreme Close-Up",
        cameraMovement: "Rapid Top-Down Macro Snap",
        foley: "Binaural ASMR Foley: Heavy steel wheel clang on wood (*CLANG*), fast oily bicycle chain whip and rattle (*CLINK-CLATTER*), rubber tire peel snap (*ZIP*), rhythmic tool clicks. Zero music, pure acoustic Foley.",
        estimatedDurationSeconds: 4,
      },
      {
        num: 2,
        heading: `INT. BUTCHER BLOCK - DICING SPONGE TOFU, TIRE GRATING & CHAIN MARINADE (0:04 - 0:08)`,
        action: `[0:04-0:05] Heavy Damascus cleaver rapidly dices the dense yellow seat sponge into bouncy 1-inch golden 'tofu' cubes in high-speed staccato (*thwack-thwack-thwack*). [0:05-0:06] Gloved hand slices the slender 28mm rubber tire crosswise into thick black 'calamari rings'. [0:06-0:07] On a stainless four-sided box grater, gloved hand vigorously grates tire tread into fine aromatic black rubber shavings (*SHRRR-SHRRR*). [0:07-0:08] Plunges the coiled steel bicycle chain into thick golden rosin glaze and tosses with silver spoke nipples like crunchy sesame seeds. 90% camera fill; 2X rapid tempo.`,
        shotSize: "Extreme Close-Up Macro",
        cameraMovement: "Top-Down Flat Lay Lock",
        foley: "Binaural ASMR Foley: Rapid staccato knife chops on sponge (*thwack-thwack*), rhythmic rough rasping sound of rubber grated on stainless steel (*SHRRR-SHRRR*), wet suction splash of thick glaze marinade.",
        estimatedDurationSeconds: 4,
      },
      {
        num: 3,
        heading: `INT. COOK STATION - MASSIVE KADAI CHAIN DEEP-FRY & TAWA TIRE SEAR (0:08 - 0:12)`,
        action: `[0:08-0:10] Black-gloved hands lower the glazed bicycle chain into a massive catering kadai of bubbling hot sesame oil with an explosive, foaming sizzle (*TZZZZZZZZ*). Golden micro-bubbles boil vigorously around the steel links. [0:10-0:11] On an oversized commercial catering steel tawa, stainless tongs press the rubber tire calamari rings and diced yellow sponge cubes onto hot oil (*CHHHHH*), scorching crisp dark grill lines. [0:11-0:12] Brass tongs lift the golden-crusted crispy chain out onto an elevated wire rack; hot oil crackles fiercely. 90% camera fill; extreme macro 45° angle.`,
        shotSize: "Macro Close-Up 45-Degree",
        cameraMovement: "Low Angle Oil Surface Push",
        foley: "Binaural ASMR Foley: Violent explosive oil sizzle and high-heat roar (*TZZZZZZZZ*), loud griddle pan sear (*CHHHHH*), hot droplets crackling on wire cooling rack.",
        estimatedDurationSeconds: 4,
      },
      {
        num: 4,
        heading: `INT. BUTCHER BLOCK - 4-QUADRANT FOLD & CLEAVER CRUNCH SLICE (0:12 - 0:16)`,
        action: `[0:12-0:13] On a flat sheet, black-gloved hands rapidly arrange 4 quadrants: crispy golden bicycle chain links, seared rubber tire calamari rings, golden diced sponge cubes, and a heavy snowfall of freshly grated rubber shavings. [0:13-0:14] In a fast 4-fold sequence, gloved hands fold the sheet clockwise into a tight triangular crunch pocket. [0:14-0:15] Hands press the pocket onto a hot ridged cast-iron grill pan (*CHHHHH*), searing dark lines. [0:15-0:16] Heavy Damascus knife slices diagonally straight through the pocket with an acoustic razor-loud *CRUNCH*. 90% camera fill; 2X hyper-tempo.`,
        shotSize: "Top-Down Flat Lay",
        cameraMovement: "Rapid Dynamic Macro Pan",
        foley: "Binaural ASMR Foley: Rapid paper rustle, loud grill pan sear sizzle (*CHHHHH*), razor-sharp acoustic crust crunch as heavy cleaver slices diagonally straight through toasted pocket (*CRUNCH*).",
        estimatedDurationSeconds: 4,
      },
      {
        num: 5,
        heading: `INT. HERO SHOWCASE - BICYCLE CRUNCH PULL & CHEF THUMBS-UP (0:16 - 0:20)`,
        action: `[0:16-0:18] Extreme macro close-up. Two black-gloved hands grip the two halves of the diagonally sliced bicycle crunch pocket and pull them slowly apart: thick strands of bubbling golden rosin glaze stretch between crispy steel chain links, seared rubber tire rings, and pillowy yellow sponge cubes as aromatic steam billows outward. [0:18-0:19] Plated on a pristine bright white coupe plate crowned with a polished bicycle gear sprocket. Camera tilts up smoothly to [@TheShadowAlchemist] in brass goggles and matte-black mask. [0:19-0:20] Chef looks directly into the lens, gives an appreciative slow nod, and flashes a sharp, confident thumbs-up to camera!`,
        shotSize: "Extreme Close-Up to Medium Up-Tilt",
        cameraMovement: "Macro Pull and Slow Tilt Up",
        foley: "Binaural ASMR Foley: Tactile acoustic crunch pull, soft bubbling glaze stretch, gentle ceramic plate contact, soft deep breath from mask cheek vents. Ending on silence.",
        estimatedDurationSeconds: 4,
      }
    );
  } else if (isNokia && totalScenes === 8) {
    // 60-second 8-scene Bulk Nokia Phones Village Feast Experience
    scenes.push(
      {
        num: 1,
        heading: `INT. ${studioEnvironment.toUpperCase()} - BULK NOKIA CRATE DUMP & CLEAVER BOUNCE HOOK (0:00 - 0:08)`,
        action: `[0:00-0:02] In a brightly sunlit outdoor hearth workshop, black-gloved hands tip a large wicker crate, dumping 15 authentic vintage Nokia 3310 & 1100 phones onto the clean natural oak butcher block with a loud chaotic acoustic clatter (*CLATTER-CLACK-THUD*). [0:02-0:04] With sudden theatrical force, chef violently slams a heavy Damascus meat cleaver straight down onto a blue Nokia phone — the cleaver bounces straight off the indestructible plastic shell with an ear-ringing metallic clang (*CLANGGGGG*). [0:04-0:08] Chef sets aside the cleaver, grabs a chrome spudger lever, and in rapid 2X staccato snaps, unlatches all 15 back shells (*SNAP-POP-CLICK*), harvesting green motherboards, rubber keypads, copper cables, screws, and LCD screens into 5 sorted copper prep trays! 90% camera fill; extreme macro focus.`,
        shotSize: "Extreme Close-Up",
        cameraMovement: "Rapid Top-Down Macro Snap",
        foley: "Binaural ASMR Foley: Heavy wicker crate dump clatter (*CLATTER-CLACK-THUD*), acoustic cleaver bounce clang (*CLANGGG*), rapid plastic snap-pops (*SNAP-POP*), clinking brass bowls. Pure acoustic Foley, zero speech, zero music.",
        estimatedDurationSeconds: 8,
      },
      {
        num: 2,
        heading: `INT. PREP STATION - HEAVY-DUTY INDIAN MIXIE PCB MASALA POWDER (0:08 - 0:15)`,
        action: `[0:08-0:11] Black-gloved hands dump the stack of 15 green printed circuit motherboards straight into a heavy-duty stainless steel Indian kitchen mixie / mixer-grinder jar. Snaps down the rubber gasket dome lid (*CLICK*). [0:11-0:15] Dial twists to High: the motor roars and high-speed steel blades violently pulverize the rigid fiberglass circuit boards into a fine, swirling cloud of emerald-green aromatic spice powder (*VRRRRRR-KRRRSHHHH*). Chef lifts the lid; glowing emerald green PCB masala powder billows soft aromatic dust. Extreme macro close-up.`,
        shotSize: "Extreme Close-Up Macro",
        cameraMovement: "Macro Tracking Orbit",
        foley: "Binaural ASMR Foley: Heavy stainless jar locking click, violent high-torque grinder roar (*VRRRRRR*), brutal acoustic crushing of fiberglass circuit boards (*KRRRSHHHH*), soft lid unseal whoosh.",
        estimatedDurationSeconds: 7,
      },
      {
        num: 3,
        heading: `INT. BUTCHER BLOCK - KEYPAD SILICONE PANEER DICING & MECHANICAL CRUNCH PRESS (0:15 - 0:23)`,
        action: `[0:15-0:19] On the bright natural-grain oak butcher block, a razor-sharp Damascus cleaver rapidly dices 15 stacked rubber silicone keypad matrices into uniform 1cm translucent cyan and grey 'paneer / jelly cubes' in high-speed staccato (*thwack-thwack-thwack*). [0:19-0:23] Gloved hands slide a heap of silver micro-screws and SMD resistors into a heavy cast-iron mechanical crunch press; chef cranks the heavy lever down (*CRRRRUUUNCH-CLACK*), cracking them into coarse metallic tempering flakes that rattle into a brass cup. 90% camera fill; 2X rapid tempo.`,
        shotSize: "Top-Down Flat Lay Lock",
        cameraMovement: "Top-Down Flat Lay Lock",
        foley: "Binaural ASMR Foley: Rapid rhythmic knife thwacks on dense silicone (*thwack-thwack*), heavy cast-iron crunch press groaning and crushing metal (*CRRRUUUNCH*), cascading metallic rattle.",
        estimatedDurationSeconds: 8,
      },
      {
        num: 4,
        heading: `INT. COOK STATION - SCORCHING STREET DOSA TAWA SAUTÉ & PANEER SEAR (0:23 - 0:30)`,
        action: `[0:23-0:26] Over roaring blue burner flames, chef ladles golden rosin butter onto a massive scorching cast-iron street dosa tawa; sizzling oil foams violently (*TZZZZZZ*). [0:26-0:30] Black-gloved hands drop BOTH the copper ribbon cables (noodles) AND the diced silicone keypad paneer cubes directly onto the screaming iron. With two wide stainless steel street-food spatulas, chef rhythmically tosses and chops them together in high-speed street style (*CLANG-CLACK-CLANG*), blistering the noodles and searing crisp golden-brown charred edges onto the paneer cubes!`,
        shotSize: "Macro Close-Up 45-Degree",
        cameraMovement: "Dynamic Macro Glide",
        foley: "Binaural ASMR Foley: Roaring hot tawa sizzle (*TZZZZZZ*), rhythmic metallic street-spatula clatter (*CLANG-CLACK-CLANG*), sizzling butter crackle.",
        estimatedDurationSeconds: 7,
      },
      {
        num: 5,
        heading: `INT. COOK STATION - SMOKING BRASS TADKA SPLUTTER & EMERALD PCB MASALA MERGE (0:30 - 0:38)`,
        action: `[0:30-0:34] Over an open flame, chef holds a smoking brass tadka ladle of mustard oil loaded with crushed screws and SMD resistors: they splutter and pop violently (*POP-SPLAT-TCHRRRR*). Chef pours the smoking tadka directly over the sizzling noodles and paneer on the tawa with a violent acoustic hiss (*TCHRRRRRR*)! [0:34-0:38] Chef immediately dumps heaping brass spoonfuls of the vibrant emerald-green PCB mixie powder straight into the sizzling tawa; dual spatulas toss vigorously (*CLANG-CLACK*), infusing every strand of copper noodle and paneer cube with the aromatic emerald masala spice coat and rising plumes of fragrant steam!`,
        shotSize: "Macro Close-Up 45-Degree",
        cameraMovement: "Low Angle Oil Surface Push",
        foley: "Binaural ASMR Foley: Shimmering oil crackle, rapid explosive popping of micro-resistors (*POP-POP-SPLAT*), violent searing hiss as hot tadka hits the iron tawa (*TCHRRRRRR*), dual spatula tossing clatter, aromatic steam whoosh (*SHHHHH*).",
        estimatedDurationSeconds: 8,
      },
      {
        num: 6,
        heading: `INT. COOK STATION - BRASS HANDI LCD CHUTNEY POUR & COMPLETE TAWA MERGE (0:38 - 0:45)`,
        action: `[0:38-0:41] In the simmering brass handi pot, 15 LCD glass panels melt into a thick, glowing neon-cyan and amber reduction glaze (*GLOOP-GLOOP*). [0:41-0:45] With two hands, chef lifts the heavy brass pot and pours the thick, bubbling luminous neon-cyan glaze directly over the entire sizzling mixture on the tawa (*SSSSSSHHHH*)! Dual spatulas fold and glaze all 5 merged ingredients together in high heat: thick caramelized sauce coats every noodle, paneer cube, and tadka flake into one glistening, bubbling, cohesive gourmet street dish, lifting in slow motion with gooey sauce strands!`,
        shotSize: "Macro Close-Up",
        cameraMovement: "Macro Tracking Orbit",
        foley: "Binaural ASMR Foley: Heavy viscous bubbling (*GLOOP-GLOOP*), loud searing sizzle as glaze hits the scorching tawa (*SSSSSSHHHH*), spatula scraping iron, thick gooey glaze stretch.",
        estimatedDurationSeconds: 7,
      },
      {
        num: 7,
        heading: `INT. COOK STATION - BANANA-LEAF BRASS THALI VILLAGE FEAST PLATING (0:45 - 0:53)`,
        action: `[0:45-0:49] With swift street-vendor mastery, black-gloved hands use the two wide stainless steel spatulas to scoop the piping-hot, fully merged, glistening tawa dish—glazed copper noodles, seared keypad paneer cubes, infused emerald masala, and crispy tadka screws—and slide it in one continuous theatrical motion directly onto a colossal traditional Indian brass thali lined with fresh green banana leaves! [0:49-0:53] Spatulas tap and fluff the steaming, glistening mound (*CLACK-CLACK*), and chef pours the remaining bubbling caramelized neon-cyan glaze reduction over the apex; a small brass katori bowl of extra dipping chutney is placed beside the mound. Strictly NO cutting boards, NO bread wraps; 100% unified banana-leaf village thali feast! 90% camera fill.`,
        shotSize: "Top-Down Flat Lay",
        cameraMovement: "Rapid Dynamic Macro Pan",
        foley: "Binaural ASMR Foley: Sizzling food sliding from iron tawa onto fresh banana leaf (*SHHHH-SLIDE*), crisp leaf rustle, metallic spatula clacks (*CLACK-CLACK*), fragrant sizzling steam.",
        estimatedDurationSeconds: 8,
      },
      {
        num: 8,
        heading: `INT. HERO SHOWCASE - BANANA-LEAF FEAST BITE PULL, CARAMELIZED STRETCH & CHEF THUMBS-UP (0:53 - 1:00)`,
        action: `[0:53-0:57] Extreme macro close-up. Black-gloved hands use brass tongs to lift a steaming, hefty forkful from the center of the banana-leaf thali: glazed copper noodles, seared keypad paneer cubes, emerald masala specks, and crispy tadka screws lift together in a massive, unified bite as thick, bubbling caramelized neon-cyan and golden glaze stretches in luscious gooey strands! Steam billows in warm golden lighting. [0:57-1:00] Camera tilts up smoothly to [@TheShadowAlchemist] in vintage brass tinker goggles and sleek matte-black tactical mask overlooking the grand village feast on the banana-leaf thali. Chef looks directly into the lens, gives an appreciative slow nod, and flashes a sharp, confident thumbs-up to camera!`,
        shotSize: "Extreme Close-Up to Medium Up-Tilt",
        cameraMovement: "Macro Pull and Slow Tilt Up",
        foley: "Binaural ASMR Foley: Tactile acoustic crunch pull, soft bubbling caramelized glaze stretch and drip, soft exhalation through mask cheekline slit vents, ending on pure silence.",
        estimatedDurationSeconds: 7,
      }
    );
  } else if (isNokia && totalScenes === 5) {
    // 20-second 5-scene Rapid Bulk Nokia Village Feast Experience
    scenes.push(
      {
        num: 1,
        heading: `INT. ${studioEnvironment.toUpperCase()} - BULK NOKIA CRATE DUMP & CLEAVER BOUNCE HOOK (0:00 - 0:04)`,
        action: `[0:00-0:02] Black-gloved hands tip a large wicker crate, dumping 15 authentic vintage Nokia phones onto the butcher block with a loud acoustic clatter (*CLATTER-CLACK-THUD*). Cleaver slams down and bounces straight off the indestructible blue shell with an ear-ringing clang (*CLANGGG*). [0:02-0:04] Chrome spudger pops open the shells in rapid 2X staccato, harvesting green PCBs, keypads, and screens into copper prep dishes. 90% camera fill; extreme macro focus.`,
        shotSize: "Extreme Close-Up",
        cameraMovement: "Rapid Top-Down Macro Snap",
        foley: "Binaural ASMR Foley: Heavy wicker crate dump clatter (*CLATTER-CLACK-THUD*), acoustic cleaver bounce clang (*CLANGGG*), rapid plastic snap-pops (*SNAP-POP*). Zero music.",
        estimatedDurationSeconds: 4,
      },
      {
        num: 2,
        heading: `INT. PREP STATION - INDIAN MIXIE PCB POWDER & KEYPAD PANEER DICING (0:04 - 0:08)`,
        action: `[0:04-0:06] Stack of 15 green printed circuit motherboards plunges into a heavy-duty stainless steel Indian kitchen mixie; motor roars as blades pulverize them into vibrant emerald-green masala spice powder (*VRRRRRR-KRRRSH*). [0:06-0:08] Cleaver rapidly dices rubber silicone keypads into bouncy translucent cyan paneer cubes (*thwack-thwack-thwack*). 90% camera fill; 2X rapid tempo.`,
        shotSize: "Extreme Close-Up Macro",
        cameraMovement: "Top-Down Flat Lay Lock",
        foley: "Binaural ASMR Foley: Violently whirring mixie grinder roar (*VRRRRRR-KRRRSH*), rapid rhythmic knife chops on silicone (*thwack-thwack*).",
        estimatedDurationSeconds: 4,
      },
      {
        num: 3,
        heading: `INT. COOK STATION - STREET DOSA TAWA PANEER NOODLE MERGE & TADKA (0:08 - 0:12)`,
        action: `[0:08-0:10] On an oversized scorching street dosa tawa, copper ribbon noodles and diced keypad paneer cubes sizzle together in foaming butter as dual spatulas toss them vigorously (*CLANG-CLACK*). [0:10-0:12] Chef pours smoking brass ladle mustard oil with popping screws & resistors and dumps emerald PCB mixie powder over the tawa; everything infuses into a sizzling, fragrant emerald-coated mixture with a violent acoustic hiss (*TCHRRRRRR*)!`,
        shotSize: "Macro Close-Up 45-Degree",
        cameraMovement: "Low Angle Oil Surface Push",
        foley: "Binaural ASMR Foley: Roaring street tawa sizzle (*TZZZZZZ*), metallic spatula clatter, explosive resistor popping and violent tadka hiss (*TCHRRRRRR*).",
        estimatedDurationSeconds: 4,
      },
      {
        num: 4,
        heading: `INT. COOK STATION - BRASS HANDI LCD CHUTNEY & COMPLETE TAWA MERGE (0:12 - 0:16)`,
        action: `[0:12-0:14] In a simmering brass handi pot, 15 LCD glass panels melt into thick, bubbling neon-cyan glaze chutney (*GLOOP-GLOOP*). [0:14-0:16] Chef lifts the brass handi and pours the sizzling neon-cyan reduction directly across the scorching street tawa over the copper noodles, keypad paneer, and emerald masala; dual spatulas fold and coat all ingredients into ONE unified glistening street dish (*SSSSSSHHHH*)!`,
        shotSize: "Top-Down Flat Lay",
        cameraMovement: "Rapid Dynamic Macro Pan",
        foley: "Binaural ASMR Foley: Thick viscous glaze bubbling (*GLOOP-GLOOP*), violent acoustic glaze sizzle (*SSSSSHHHH*), rhythmic metal spatula folding (*CLANG-CLACK*).",
        estimatedDurationSeconds: 4,
      },
      {
        num: 5,
        heading: `INT. HERO SHOWCASE - BANANA-LEAF BRASS THALI DIRECT PLATING & CHEF THUMBS-UP (0:16 - 0:20)`,
        action: `[0:16-0:18] Extreme macro close-up. Dual spatulas scoop the steaming merged tawa creation and slide it directly onto a colossal traditional brass thali lined with fresh banana leaves (*SHHHH-SLIDE*). Black-gloved hands pull a steaming bite of glazed copper noodles and keypad paneer, lifting upward as thick caramelized glaze stretches in glossy strings. [0:18-0:20] Camera tilts up smoothly to [@TheShadowAlchemist] in brass goggles and matte-black tactical mask. Chef looks directly into the lens, gives an appreciative slow nod, and flashes a sharp, confident thumbs-up to camera!`,
        shotSize: "Extreme Close-Up to Medium Up-Tilt",
        cameraMovement: "Macro Pull and Slow Tilt Up",
        foley: "Binaural ASMR Foley: Sizzling food sliding onto fresh banana leaf (*SHHH-SLIDE*), soft bubbling caramelized glaze stretch, gentle exhalation through mask cheek vents. Ending on silence.",
        estimatedDurationSeconds: 4,
      }
    );
  } else if (comparisonTable && comparisonTable.length >= 2) {
    // Dish-Authentic Custom Pipeline built directly from the Creator-Approved Comparison Table
    const row0 = comparisonTable[0];
    const row1 = comparisonTable[1];
    const row2 = comparisonTable[2] ?? row1;
    const row3 = comparisonTable[3] ?? comparisonTable[comparisonTable.length - 1];
    const targetDish = dishName?.trim() || `${heroObject} Signature Feast`;
    const isBiryani = /biryani|dum|handi|pulao/i.test(`${targetDish} ${sourceIdea}`);
    const vesselForDish = isBiryani
      ? "heavy-bottomed hammered brass dum handi pot & cast-iron spice tawa"
      : isLargeObject
      ? "oversized industrial steel catering tawa & giant catering kadai"
      : "seasoned cast-iron griddle & copper reduction pot";

    for (let i = 0; i < totalScenes; i++) {
      const tc = timecodeFor(i);
      const sceneNum = i + 1;

      if (sceneNum === 1) {
        scenes.push({
          num: 1,
          heading: `INT. ${studioEnvironment.toUpperCase()} - 0.0S ${heroObject.toUpperCase()} SLAM HOOK & COMPONENT HARVEST ${tc.label}`,
          action: `[${tc.start}] Black-gloved hands violently slam ${heroObject} onto the ${studioEnvironment} (*LOUD ACOUSTIC THUD-CRACK*, 85% screen fill). Zero opening silence. Heavy Damascus cleaver cracks and strips out the core inedible elements for ${targetDish}: ${row0.inedibleCounterpart} alongside ${row1.inedibleCounterpart} (*SNAP-CLACK*). Every raw component is sorted cleanly into hammered brass prep bowls. Extreme macro close-up, 2X rapid tempo.`,
          shotSize: "Extreme Close-Up",
          cameraMovement: "Rapid Top-Down Macro Snap",
          foley: `HIGH-VOLUME CLOSE-MIC ASMR (-1dB peak): Heavy slam on wood (*THUD-CRACK*), violent mechanical strip and cleaver crack (*SNAP-CLACK*), crisp brass bowl clinks. Pure acoustic Foley.`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === 2 && totalScenes >= 7) {
        scenes.push({
          num: 2,
          heading: `INT. SPICE STATION - MIXIE GRINDING & SPICE MILLING FOR ${targetDish.toUpperCase()} ${tc.label}`,
          action: `[${tc.start}] Heavy-duty stainless Indian kitchen mixie & stone mortar-and-pestle: Chef feeds brittle ${row3.inedibleCounterpart} alongside toasted aromatic raw bits and whirs the grinder in violent 2X pulses (*VRRR-KRRSH-KRRSH*) until crushed into vibrant coarse masala powder & paste. Pouring freshly ground masala dust onto a brass thali tray. Extreme 85mm probe macro.`,
          shotSize: "Extreme Close-Up Macro",
          cameraMovement: "Macro Tracking Orbit",
          foley: `HIGH-VOLUME CLOSE-MIC ASMR (-1dB peak): Explosive grinder pulverizing roar (*VRRR-KRRSH*), rhythmic stone pestle crushing (*CRUNCH-GRIND*), crisp metallic masala dust cascade.`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === 2 || (sceneNum === 3 && totalScenes >= 7)) {
        scenes.push({
          num: sceneNum,
          heading: `INT. BUTCHER BLOCK - PRECISION DICING, SHAVING & GRATING (${row0.realElement.toUpperCase()}) ${tc.label}`,
          action: `[${tc.start}] Rapid 2X dicing & shaving station for ${targetDish}: Chef executes "${row0.cookingMethod}" on ${row0.inedibleCounterpart} (acting as ${row0.realElement}), sliding steel blade and four-sided box grater in razor-fast staccato (*thwack-thwack-shrrr*) alongside "${row1.cookingMethod}" on ${row1.inedibleCounterpart}. 90% frame filled with tumbling precision shreds and geometric dice.`,
          shotSize: "Top-Down Flat Lay Lock",
          cameraMovement: "Top-Down Flat Lay Lock",
          foley: `HIGH-VOLUME CLOSE-MIC ASMR (-1dB peak): Rapid staccato blade chops on end-grain wood (*thwack-thwack-thwack*), brisk stainless box-grater friction (*shrrr-shrrr*).`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === 4 && totalScenes >= 7) {
        scenes.push({
          num: 4,
          heading: `INT. BUTCHER BLOCK - CLEAVER CHOPPING & MARINADE COATING (${row2.realElement.toUpperCase()}) ${tc.label}`,
          action: `[${tc.start}] Intense chopping & masala marinade: Heavy Damascus blade rapidly chops and scores ${row2.inedibleCounterpart} into bite-sized masala kofta portions (*CHOP-CHOP-CRACK*), plunging them into a deep hammered mixing bowl with freshly ground masala spice, saffron glaze, and foaming aromatic herb emulsion—tossing aggressively until dripping crimson-gold.`,
          shotSize: "Macro Close-Up 45-Degree",
          cameraMovement: "Dynamic Macro Glide",
          foley: `HIGH-VOLUME CLOSE-MIC ASMR (-1dB peak): Heavy cleaver chop (*CHOP-CRACK*), wet glossy masala squelch and bowl toss, crisp spoon scrape.`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === 5 && totalScenes >= 8) {
        scenes.push({
          num: 5,
          heading: `INT. COOK STATION - WHOLE SPICE TEMPERING TADKA & CRISPY SEAR (${row1.realElement.toUpperCase()}) ${tc.label}`,
          action: `[${tc.start}] Fiery tempering tawa: Smoking spiced butter and ghee explode over hot black iron as whole spices and ${row1.inedibleCounterpart} undergo "${row1.cookingMethod}" (crafting fragrant crisp birista & aromatic spice layer) (*TCHRRRR-TZZZZ*). Spatulas aerate golden crisp ribbons over shimmering heat.`,
          shotSize: "Macro Close-Up 45-Degree",
          cameraMovement: "Low Angle Oil Surface Push",
          foley: `HIGH-VOLUME CLOSE-MIC ASMR (-1dB peak): Explosive tadka oil sputter (*TCHRRRR*), fierce iron tawa sizzle (*TZZZZZZZZ*), crisp golden ribbon rustle.`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === totalScenes - 2) {
        scenes.push({
          num: sceneNum,
          heading: `INT. COOK STATION - ${row2.realElement.toUpperCase()} SEAR & MASALA REDUCTION ${tc.label}`,
          action: `[${tc.start}] High-heat station: inside the ${vesselForDish}, foaming spiced butter/oil roars as ${row2.inedibleCounterpart} undergoes "${row2.cookingMethod}" (crafting ${row2.realElement}) (*TZZZZZZZZ*). Chef pours thick bubbling masala gravy mixed with ${row3.inedibleCounterpart} (${row3.cookingMethod}), simmering into rich concentrated reduction as steam billows from the scorching metal.`,
          shotSize: "Macro Close-Up 45-Degree",
          cameraMovement: "Low Angle Oil Surface Push",
          foley: `HIGH-VOLUME CLOSE-MIC ASMR (-1dB peak): Explosive foaming sear roar (*TZZZZZZZZ*), thick masala bubble (*GLOOP-GLOOP*), metal utensil clatter.`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === totalScenes - 1) {
        const extraRows = comparisonTable
          .map((r) => `${r.inedibleCounterpart} (${r.realElement}) via ${r.cookingMethod}`)
          .join("; ");
        scenes.push({
          num: sceneNum,
          heading: `INT. COOK STATION - ${isBiryani ? "LAYERED DUM POT SEAL & AROMATIC STEAM" : "UNIFIED GLAZE REDUCTION & MERGE"} ${tc.label}`,
          action: `[${tc.start}] Grand assembly of ${targetDish} inside the ${vesselForDish}: Chef rhythmically layers and folds all transformed components together — ${extraRows}. ${
            isBiryani
              ? "Seals the brass dum handi rim with braided foil/dough ring and lifts the heavy lid in a towering burst of fragrant steam (*WHOOSH-HISS*), revealing colorful saffron-stained layers."
              : "Pours thick bubbling translucent glaze reduction over the layered medley, tossing vigorously until every rigid hardware texture gleams (*SSSSSHHHH*)."
          } Extreme 45° macro depth.`,
          shotSize: "Macro Close-Up 45-Degree",
          cameraMovement: "Rapid Dynamic Macro Pan",
          foley: `HIGH-VOLUME CLOSE-MIC ASMR (-1dB peak): Thick simmering bubble (*GLOOP-GLOOP*), violent steam lid release (*WHOOSH-HISS*), crisp layered textures settling inside heavy vessel.`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === totalScenes) {
        scenes.push({
          num: sceneNum,
          heading: `INT. HERO SHOWCASE - ${targetDish.toUpperCase()} PLATING, REVEAL PULL & CHEF THUMBS-UP ${tc.label}`,
          action: `[${tc.start}] Hero plating of ${targetDish}: Black-gloved hands scoop an abundant steaming feast portion (${row0.inedibleCounterpart} & ${row2.inedibleCounterpart}) onto a contrasting wide platter flanked by a raw intact ${heroObject} for visual proof. Chef lifts a dramatic macro fork/spoonful showing tender glazed layers stretching with rising culinary steam (*SHHH-SLIDE*), then camera tilts smoothly to [@TheShadowAlchemist] in brass goggles and matte-black tactical mask giving a calm nod and confident thumbs-up. Seamless kinetic angle back to Scene 1!`,
          shotSize: "Extreme Close-Up to Medium Up-Tilt",
          cameraMovement: "Macro Pull and Slow Tilt Up",
          foley: `HIGH-VOLUME CLOSE-MIC ASMR (-1dB peak): Crisp platter serving contact (*SHHH-SLIDE*), moist tender pull sound, steaming sigh through mask vents. Ending cleanly on loop transition.`,
          estimatedDurationSeconds: tc.duration,
        });
      }
    }
  } else {
    // Generalized Universal 4-Stage Pipeline for ANY Object (Keyboard, Watch, Walkman, Camera, Phone, etc.)
    const primaryTool = specs.extractionTools[0] || "specialized disassembly tool";
    const componentA = specs.matchedComponents[0]?.canonicalName || `${heroObject} primary core`;
    const componentB = specs.matchedComponents[1]?.canonicalName || `${heroObject} sub-component`;

    for (let i = 0; i < totalScenes; i++) {
      const tc = timecodeFor(i);
      const sceneNum = i + 1;

      if (sceneNum === 1) {
        // Stage 1: Disassembly Hook
        scenes.push({
          num: 1,
          heading: `INT. ${studioEnvironment.toUpperCase()} - ${heroObject.toUpperCase()} DISASSEMBLY HOOK ${tc.label}`,
          action: `[${tc.start}] Black-gloved hands violently slam an authentic ${heroObject} onto the ${studioEnvironment} (*THUD*). Thumb forcefully triggers mechanical release with a sharp whip-snap (*SNAP-CLICK*). Precision ${primaryTool} unbolts and unseats the ${componentA} cleanly from the housing (*CLICK-CLACK*). Components are harvested into a brass prep dish. 90% screen real estate locked on ${heroObject}; extreme close-up macro. 2X fast-forward tempo.`,
          shotSize: "Extreme Close-Up",
          cameraMovement: "Rapid Top-Down Macro Snap",
          foley: `Binaural ASMR Foley: Heavy thud on workstation (*THUD*), sharp tactile snap-click, rapid metallic tool clicks, rhythmic brass dish ping. Pure acoustic Foley, zero speech, zero music.`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === 2 && totalScenes >= 6) {
        // Stage 1B: Secondary Extraction & Fracture
        scenes.push({
          num: 2,
          heading: `INT. ${studioEnvironment.toUpperCase()} - TOOL HARVEST & INTERNAL FRACTURE ${tc.label}`,
          action: `[${tc.start}] Specialized extraction tools rapidly unfasten internal fixtures; titanium tweezers cleanly pluck miniature components into a divided wooden tray. Downward palm strike fractures the internal sub-chassis cleanly along the seam with a loud acoustic crack (*CRACK*). 90% camera fill; extreme macro focus.`,
          shotSize: "Extreme Close-Up Macro",
          cameraMovement: "Macro Tracking Orbit",
          foley: `Binaural ASMR Foley: Crisp mechanical tool clicks, high-tension spring release (*TWANG*), clean structural fracture crack (*CRACK*).`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === (totalScenes >= 6 ? 3 : 2)) {
        // Stage 2: Culinary Butchery on Board
        scenes.push({
          num: sceneNum,
          heading: `INT. BUTCHER BLOCK - RAPID CLEAVER DICING & SLICING ${tc.label}`,
          action: `[${tc.start}] On the wooden butcher block, heavy Damascus blade rapidly dices the ${componentA} into delicate geometric pieces in high-speed staccato (*thwack-thwack-thwack*). Gloved hand slices ${componentB} into thin ribbons and scores cross-hatch grooves. 90% camera fill; 2X rapid tempo.`,
          shotSize: "Top-Down Flat Lay Lock",
          cameraMovement: "Top-Down Flat Lay Lock",
          foley: `Binaural ASMR Foley: Rapid staccato knife chops on end-grain wood (*thwack-thwack*), razor slicing acoustics, clean geometric division.`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === (totalScenes >= 6 ? 4 : 2)) {
        // Stage 2B: Grater / Glaze Marinade
        scenes.push({
          num: sceneNum,
          heading: `INT. PREP STATION - BOX GRATER SHAVINGS & THICK ROSIN MARINADE ${tc.label}`,
          action: `[${tc.start}] On a stainless four-sided box grater, gloved hand vigorously rasps outer components into a fine mound of aromatic shavings (*SHRRR-SHRRR*). Components are plunged into a shallow bowl of thick golden rosin glaze and dredged evenly until glistening. 90% camera fill.`,
          shotSize: "Macro Close-Up 45-Degree",
          cameraMovement: "Dynamic Macro Glide",
          foley: `Binaural ASMR Foley: Rough rhythmic rasping sound of hardware grated on stainless steel (*SHRRR-SHRRR*), wet viscous splash of thick glaze marinade.`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === totalScenes - 3 || sceneNum === totalScenes - 2) {
        // Stage 3: High-Heat Cook
        scenes.push({
          num: sceneNum,
          heading: `INT. COOK STATION - ${isLargeObject ? "MASSIVE KADAI & TAWA" : "HOT GRIDDLE"} SEAR & SIZZLE ${tc.label}`,
          action: `[${tc.start}] Black-gloved hands lower the glazed ${heroObject} elements into ${vesselName} with an explosive, foaming sizzle (*TZZZZZZZZ*). Micro-bubbles boil vigorously around the hardware. Long cooking chopsticks quickly flip the golden-crusted components; spatulas lift the hardware cluster letting thick molten glaze stretch and drip in slow motion. 90% camera fill; extreme macro 45° angle.`,
          shotSize: "Macro Close-Up 45-Degree",
          cameraMovement: "Low Angle Oil Surface Push",
          foley: `Binaural ASMR Foley: Violent explosive sizzle and high-heat roar (*TZZZZZZZZ*), loud griddle pan sear (*CHHHHH*), bubbling viscous glaze reduction.`,
          estimatedDurationSeconds: tc.duration,
        });
      } else if (sceneNum === totalScenes - 1) {
        // Stage 4A: 4-Quadrant Crunch Pocket & Cleaver Slice
        scenes.push({
          num: sceneNum,
          heading: `INT. BUTCHER BLOCK - 4-QUADRANT FOLD & DIAGONAL CLEAVER CRUNCH ${tc.label}`,
          action: `[${tc.start}] On a flat parchment sheet, black-gloved hands rapidly arrange 4 quadrants of golden-crisped ${heroObject} hardware chips and savory garnishes. In a fast 4-fold sequence, gloved hands fold the sheet clockwise into a tight triangular crunch pocket, sears crisp dark lines on a grill pan, and slices diagonally straight through with a heavy Damascus blade with a razor-loud acoustic *CRUNCH*. 90% camera fill; 2X hyper-tempo.`,
          shotSize: "Top-Down Flat Lay",
          cameraMovement: "Rapid Dynamic Macro Pan",
          foley: `Binaural ASMR Foley: Rapid parchment paper rustle, loud grill pan sear sizzle (*CHHHHH*), razor-sharp acoustic crust crunch as heavy cleaver slices diagonally through toasted pocket (*CRUNCH*).`,
          estimatedDurationSeconds: tc.duration,
        });
      } else {
        // Stage 4B: Climax Crunch Pull & Thumbs-Up
        scenes.push({
          num: sceneNum,
          heading: `INT. HERO SHOWCASE - MOLTEN GLAZE CRUNCH PULL & CHEF THUMBS-UP ${tc.label}`,
          action: `[${tc.start}] Extreme macro close-up. Two black-gloved hands grip the two diagonally sliced halves of the crispy crunch pocket and pull them slowly apart: thick strands of bubbling, melted caramelized golden glaze stretch between crispy ${heroObject} components as aromatic steam billows outward. Plated on a pristine bright white ceramic coupe plate crowned with a prominent ${heroObject} emblem. Camera tilts up smoothly to [@TheShadowAlchemist] in brass goggles and sleek matte-black mask. Chef looks directly into the lens, gives an appreciative slow nod, and flashes a sharp, confident thumbs-up to camera!`,
          shotSize: "Extreme Close-Up to Medium Up-Tilt",
          cameraMovement: "Macro Pull and Slow Tilt Up",
          foley: `Binaural ASMR Foley: Tactile acoustic crunch pull, soft bubbling caramelized glaze stretch, gentle ceramic plate contact, soft deep breath from mask cheek vents. Ending on silence.`,
          estimatedDurationSeconds: tc.duration,
        });
      }
    }
  }

  let logline = `In a ${targetRuntime}-second high-density ASMR whirlwind, a rogue masked alchemist chef dismantles an authentic ${heroObject}, dices its internal components into golden cubes, deep-fries its mechanical linkages, and serves a steaming crunch wrap with molten caramelized glaze and an iconic chef thumbs-up.`;
  let premise = `Episode ${episodeNumber} of ${seriesTitle}: ${targetRuntime}s Viral Rapid ASMR Masterpiece (Bayashi 2X Pacing · ${totalScenes} High-Density Scenes). The chef transforms an authentic ${heroObject} into a sizzling gourmet creation, packing 3 to 4 micro-actions per clip and 90% ingredient framing across dicing, grating, sizzling, and acoustic crunch.`;
  let synopsis = `Act I: The Mechanical Disassembly Hook\nAt the ${studioEnvironment}, [@TheShadowAlchemist] violently slams the ${heroObject} and harvests its primary sub-components with specialized tools.\n\nAct II: Culinary Butchery & Textural Prep\nComponents are sliced into calamari rings, diced into golden tofu cubes, rasped into fine shavings on a box grater, and dredged in thick golden rosin marinade.\n\nAct III: High-Capacity Cooking in ${vesselName}\nComponents are plunged into foaming hot oil and seared with charred grill lines while spatulas lift viscous molten glaze.\n\nAct IV: 4-Quadrant Assembly & Diagonal Razor Cleaver Cut\nComponents are folded into a tight toasted pocket and sliced diagonally straight through with an acoustic crack.\n\nAct V: Hero Crunch Pull & Confident Chef Thumbs-Up\nSteaming cross-section crunch pull reveals bubbling caramelized molten glaze stretching between crispy authentic hardware pieces; camera tilts up to [@TheShadowAlchemist] who nods and flashes a sharp, confident thumbs-up to camera!`;
  let thumbnailPrompt = `Viral YouTube Shorts & TikTok split-screen thumbnail (9:16 vertical / 16:9 landscape hybrid high-CTR masterpiece). Left side (50%): Extreme macro close-up of intact ${heroObject} being unbolted with vintage chrome tools on a bright natural light-oak workbench under crisp 5600K high-visibility studio daylight. Right side (50%): High-saturation culinary macro of a diagonally sliced golden crunch pocket pulled apart by black-gloved hands, exposing thick bubbling translucent golden caramelized glaze stretching in glossy strings between authentic crispy ${heroObject} components and pillowy golden cubes; rising steam illuminated by bright clear studio daylight fill. In the crisp open background, [@TheShadowAlchemist] with brass tinker goggles on crown and matte-black tactical mask flashes an unmistakable sharp thumbs-up to camera. Razor-sharp 8K focus, zero dark shadows, zero on-screen text, zero watermarks, hyper-appetizing bright craft cinema.`;

  if (isNokia) {
    logline = `In a ${targetRuntime}-second high-density ASMR village feast, a rogue masked alchemist chef dumps a crate of 15 indestructible vintage Nokia phones, pulverizes their PCBs into emerald masala in a heavy-duty Indian mixie, dices keypads into paneer cubes, sautés copper ribbon noodles on a street dosa tawa with popping screw tadka, merges all into a sizzling LCD glaze reduction, and serves a colossal banana-leaf banquet with an iconic chef thumbs-up.`;
    premise = `Episode ${episodeNumber} of ${seriesTitle}: ${targetRuntime}s Viral Village Feast Masterpiece (Bayashi 2X Pacing · ${totalScenes} High-Density Scenes). The chef transforms bulk vintage Nokia phones into a sizzling multi-technique street feast featuring an Indian mixie grinder, mechanical crunch press, street dosa tawa, smoking brass tadka ladle, and banana-leaf thali presentation.`;
    synopsis = `Act I: The Indestructible Phone Challenge & Bulk Crate Harvest\nAt the ${studioEnvironment}, [@TheShadowAlchemist] dumps 15 vintage Nokia phones; a heavy cleaver bounces off the shell (*CLANGGG*); chrome spudgers unlatch 15 shells into sorted copper prep trays.\n\nAct II: Heavy-Duty Indian Mixie & Silicone Paneer Dicing\n15 PCBs are pulverized into vibrant emerald masala spice powder in a stainless kitchen mixie (*VRRR-KRRSH*); silicone keypads are diced into translucent cyan paneer cubes; screws are crushed in a mechanical crunch press.\n\nAct III: Street Dosa Tawa Sauté, Tadka & Emerald Masala Infusion\nOn an oversized scorching street dosa tawa, copper ribbon noodles and diced keypad paneer cubes sear together in foaming butter; smoking mustard oil with popping screws & resistors and heaping emerald PCB mixie powder are poured over the top with a violent acoustic hiss (*TCHRRRR*).\n\nAct IV: Luminous LCD Chutney Reduction & Complete Tawa Merge\n15 monochrome LCD glass panels melt into bubbling neon-cyan chutney in a brass handi pot and are poured directly onto the tawa, folding all 5 harvested components into ONE unified glistening, steaming street creation.\n\nAct V: Banana-Leaf Brass Thali Direct Plating & Iconic Chef Thumbs-Up\nDual spatulas slide the steaming merged dish directly from the tawa onto a colossal brass thali lined with fresh banana leaves (*SHHHH-SLIDE*); [@TheShadowAlchemist] pulls a bite showing luscious caramelized glaze stretch, and flashes a confident thumbs-up to camera!`;
    thumbnailPrompt = `Viral YouTube Shorts & TikTok split-screen thumbnail (9:16 vertical / 16:9 landscape hybrid high-CTR masterpiece). Left side (50%): Extreme macro close-up of a rustic wicker crate dumping 15 authentic vintage Nokia 3310 phones with a heavy cleaver bouncing off the blue shell with bright sparks on natural golden oak wood in crisp daylight. Right side (50%): High-saturation culinary macro of a traditional brass thali lined with fresh banana leaf, loaded with golden copper ribbon noodles, translucent cyan keypad cubes, dusted with vibrant emerald mixie powder, with a fork dipping into glowing luminous neon-cyan LCD chutney stretching in glossy caramelized strings; rising aromatic steam under bright 5600K studio daylight illumination. In the crisp open background, [@TheShadowAlchemist] with brass tinker goggles on crown and matte-black tactical mask flashes an unmistakable sharp thumbs-up to camera. Razor-sharp 8K focus, zero dark shadows, zero on-screen text, zero watermarks, hyper-appetizing bright craft cinema.`;
  }

  return {
    logline,
    premise,
    synopsis,
    scenes,
    thumbnailPrompt,
  };
}
