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
}): InediblePipelineResult {
  const {
    heroObject,
    sourceIdea,
    studioEnvironment,
    targetRuntime,
    episodeNumber = 1,
    seriesTitle = "The Shadow Alchemist — Inedible ASMR",
  } = params;

  const specs = resolveObjectComponentSpecs(heroObject, sourceIdea);
  const isBicycle = specs.category === "BICYCLE_VEHICLE";
  const isNokia =
    specs.category === "BULK_NOKIA_PHONES" ||
    /\b(nokia|3310|1100|brick phones?|feature phones?|keypad phones?|bulk phones?)\b/i.test(`${heroObject} ${sourceIdea}`);
  const isLargeObject = Boolean(specs.isLargeObject);

  const totalScenes = targetRuntime >= 55 ? 8 : targetRuntime >= 40 ? 6 : 5;
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
        action: `[0:00-0:02] In a moody workshop, black-gloved hands violently slam a heavy Damascus meat cleaver straight into the rubber sidewall of a vintage road bicycle wheel on the butcher block (*LOUD ACOUSTIC THUD-CRACK*). [0:02-0:05] With forceful alchemist leverage, chef forcefully whips and peels the slender 28mm black rubber road tire clean off the spoked wire rim in one continuous spiral whip pull (*SKRRR-SNAP*), sending brass spoke nipples scattering across the wood. [0:05-0:08] Cleaver immediately descends in high-speed 2X staccato chopping: slices the rubber tire into thick squid-ink calamari rings (*thwack-thwack-thwack*) while oily steel chain links rattle onto the board. 90% screen real estate locked on bicycle parts; extreme close-up macro.`,
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
        action: `[0:15-0:19] On the dark walnut butcher block, a razor-sharp Damascus cleaver rapidly dices the dense yellow seat sponge into uniform 1-inch golden 'tofu' cubes in high-speed staccato (*thwack-thwack-thwack*). [0:19-0:23] Heavy utility blade slices the slender 28mm bicycle rubber tire crosswise into thick squid-ink-black 'calamari rings' and scores fine cross-hatch diamond grooves into the rubber sidewall. 90% camera fill; 2X rapid tempo.`,
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
        action: `[0:00-0:02] In a rustic outdoor hearth workshop, black-gloved hands tip a large wicker crate, dumping 15 authentic vintage Nokia 3310 & 1100 phones onto the dark butcher block with a loud chaotic acoustic clatter (*CLATTER-CLACK-THUD*). [0:02-0:04] With sudden theatrical force, chef violently slams a heavy Damascus meat cleaver straight down onto a blue Nokia phone — the cleaver bounces straight off the indestructible plastic shell with an ear-ringing metallic clang (*CLANGGGGG*). [0:04-0:08] Chef sets aside the cleaver, grabs a chrome spudger lever, and in rapid 2X staccato snaps, unlatches all 15 back shells (*SNAP-POP-CLICK*), harvesting green motherboards, rubber keypads, copper cables, screws, and LCD screens into 5 sorted copper prep trays! 90% camera fill; extreme macro focus.`,
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
        action: `[0:15-0:19] On the dark walnut butcher block, a razor-sharp Damascus cleaver rapidly dices 15 stacked rubber silicone keypad matrices into uniform 1cm translucent cyan and grey 'paneer / jelly cubes' in high-speed staccato (*thwack-thwack-thwack*). [0:19-0:23] Gloved hands slide a heap of silver micro-screws and SMD resistors into a heavy cast-iron mechanical crunch press; chef cranks the heavy lever down (*CRRRRUUUNCH-CLACK*), cracking them into coarse metallic tempering flakes that rattle into a brass cup. 90% camera fill; 2X rapid tempo.`,
        shotSize: "Top-Down Flat Lay Lock",
        cameraMovement: "Top-Down Flat Lay Lock",
        foley: "Binaural ASMR Foley: Rapid rhythmic knife thwacks on dense silicone (*thwack-thwack*), heavy cast-iron crunch press groaning and crushing metal (*CRRRUUUNCH*), cascading metallic rattle.",
        estimatedDurationSeconds: 8,
      },
      {
        num: 4,
        heading: `INT. COOK STATION - SCORCHING STREET DOSA TAWA COPPER NOODLE SAUTÉ (0:23 - 0:30)`,
        action: `[0:23-0:26] Over roaring blue burner flames, chef ladles golden rosin butter onto a massive scorching cast-iron street dosa tawa; sizzling oil foams violently (*TZZZZZZ*). [0:26-0:30] Black-gloved hands drop the tangled mass of copper ribbon cables and antenna wires onto the screaming iron. With two wide stainless steel street-food spatulas, chef rhythmically tosses and chops the copper ribbon noodles in high-speed street style (*CLANG-CLACK-CLANG*), blistering them into crispy, golden-brown lachha noodles.`,
        shotSize: "Macro Close-Up 45-Degree",
        cameraMovement: "Dynamic Macro Glide",
        foley: "Binaural ASMR Foley: Roaring hot griddle sizzle (*TZZZZZZ*), rhythmic metallic street-spatula clatter against iron tawa (*CLANG-CLACK-CLANG*), sizzling butter crackle.",
        estimatedDurationSeconds: 7,
      },
      {
        num: 5,
        heading: `INT. COOK STATION - SMOKING BRASS LADLE TADKA SPLUTTER (0:30 - 0:38)`,
        action: `[0:30-0:34] Over an open flame, chef holds a long-handled heavy brass tadka ladle filled with smoking mustard oil. Into the shimmering hot oil, gloved fingers drop the crushed silver screws, brass contact pins, and micro-resistors: they instantly splutter and pop violently like mustard seeds (*POP-SPLAT-TCHRRRRR*), releasing fragrant wisps of vapor. [0:34-0:38] Chef pours the smoking sputtering ladle oil directly over the seared copper noodles on the tawa, creating an explosive acoustic hiss (*TCHRRRRRR*)! Hot oil crackles fiercely.`,
        shotSize: "Macro Close-Up 45-Degree",
        cameraMovement: "Low Angle Oil Surface Push",
        foley: "Binaural ASMR Foley: Shimmering oil sizzle, rapid explosive popping of micro-resistors (*POP-POP-SPLAT*), violent searing hiss as hot tadka hits the iron tawa (*TCHRRRRRR*).",
        estimatedDurationSeconds: 8,
      },
      {
        num: 6,
        heading: `INT. COOK STATION - BRASS HANDI POT LUMINOUS LCD CHUTNEY REDUCTION (0:38 - 0:45)`,
        action: `[0:38-0:42] In a traditional heavy brass handi pot simmering over low coals, chef stirs the 15 monochrome LCD glass panels into thick golden rosin flux and electric blue nectar. As a carved wooden ladle swirls the mixture, the LCD glass melts into a thick, glossy, bubbling neon-cyan and amber reduction glaze (*GLOOP-GLOOP*). [0:42-0:45] Steam rises; ladle lifts and thick, caramelized, translucent chutney ribbons pour back into the bubbling pot in hypnotic slow motion.`,
        shotSize: "Macro Close-Up",
        cameraMovement: "Macro Tracking Orbit",
        foley: "Binaural ASMR Foley: Heavy thick viscous bubbling (*GLOOP-GLOOP*), wooden spoon scraping brass pot bottom, smooth slow-motion syrup drip sound.",
        estimatedDurationSeconds: 7,
      },
      {
        num: 7,
        heading: `INT. BUTCHER BLOCK - BANANA-LEAF BRASS THALI VILLAGE FEAST ASSEMBLY & CLEAVER CRUNCH (0:45 - 0:53)`,
        action: `[0:45-0:49] On a colossal traditional Indian brass thali lined with fresh green banana leaves, black-gloved hands rapidly assemble the village banquet: first, a towering mountain of crispy sizzling copper ribbon noodles; second, a generous topping of the diced translucent silicone keypad paneer cubes; third, a heavy snowfall dusting of the emerald-green PCB mixie powder; fourth, a steaming pour of the sizzling hot screw tadka; and fifth, a deep brass katori bowl placed alongside, overflowing with glowing, bubbling LCD chutney! [0:49-0:53] Heavy Damascus cleaver strikes down in rapid staccato: slices diagonally straight through a crispy folded phone-casing crunch parcel with an ear-splitting razor acoustic *CRUNCH*, revealing overflowing glistening hardware layers!`,
        shotSize: "Top-Down Flat Lay",
        cameraMovement: "Rapid Dynamic Macro Pan",
        foley: "Binaural ASMR Foley: Crisp banana leaf rustle, metallic plate clink, fragrant sizzle as hot tadka touches powder (*TSSSS*), razor-sharp acoustic crust cut (*CRUNCH*).",
        estimatedDurationSeconds: 8,
      },
      {
        num: 8,
        heading: `INT. HERO SHOWCASE - LUMINOUS CHUTNEY DIP, CARAMELIZED STRETCH & CHEF THUMBS-UP (0:53 - 1:00)`,
        action: `[0:53-0:57] Extreme macro close-up. Black-gloved hands use brass tongs to lift a steaming bite of crispy copper noodles and keypad cubes, dipping it deep into the luminous LCD chutney and pulling upward: thick, glowing cyan-gold caramelized glaze stretches in luscious strands as fragrant steam billows. Wide banquet view shows the magnificent feast on the banana-leaf thali with scattered Nokia shells and brass bowls. [0:57-1:00] Camera tilts up smoothly to [@TheShadowAlchemist] in brass tinker goggles and matte-black tactical mask overlooking the grand village feast. Chef looks directly into the lens, gives an appreciative slow nod, and flashes a sharp, confident thumbs-up to camera!`,
        shotSize: "Extreme Close-Up to Medium Up-Tilt",
        cameraMovement: "Macro Pull and Slow Tilt Up",
        foley: "Binaural ASMR Foley: Tactile acoustic crunch pull, soft viscous sauce stretch and drip, soft exhalation through mask cheekline slit vents, ending on pure silence.",
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
        heading: `INT. COOK STATION - STREET DOSA TAWA SAUTÉ & BRASS LADLE TADKA (0:08 - 0:12)`,
        action: `[0:08-0:10] On an oversized scorching cast-iron street dosa tawa, copper ribbon cables sizzle in foaming rosin butter as dual spatulas toss them into crispy golden lachha noodles (*CLANG-CLACK*). [0:10-0:12] Chef pours smoking brass ladle mustard oil loaded with popping micro-resistors and screws directly over the noodles with a violent acoustic hiss (*TCHRRRRRR*)!`,
        shotSize: "Macro Close-Up 45-Degree",
        cameraMovement: "Low Angle Oil Surface Push",
        foley: "Binaural ASMR Foley: Roaring street tawa sizzle (*TZZZZZZ*), metallic spatula clatter, explosive resistor popping and violent tadka hiss (*TCHRRRRRR*).",
        estimatedDurationSeconds: 4,
      },
      {
        num: 4,
        heading: `INT. COOK STATION - BRASS HANDI LCD CHUTNEY & CLEAVER CRUNCH SLICE (0:12 - 0:16)`,
        action: `[0:12-0:14] In a simmering brass handi pot, 15 LCD glass panels melt into thick, bubbling neon-cyan glaze chutney (*GLOOP-GLOOP*). [0:14-0:16] Chef folds a crispy Nokia casing crunch pocket and slices diagonally straight through with a heavy cleaver with an ear-splitting razor acoustic *CRUNCH*. 90% camera fill; 2X hyper-tempo.`,
        shotSize: "Top-Down Flat Lay",
        cameraMovement: "Rapid Dynamic Macro Pan",
        foley: "Binaural ASMR Foley: Thick viscous glaze bubbling (*GLOOP-GLOOP*), razor-sharp acoustic crust cleavage (*CRUNCH*).",
        estimatedDurationSeconds: 4,
      },
      {
        num: 5,
        heading: `INT. HERO SHOWCASE - BANANA-LEAF THALI CHUTNEY DIP & CHEF THUMBS-UP (0:16 - 0:20)`,
        action: `[0:16-0:18] Extreme macro close-up. Black-gloved hands dip crispy copper noodles and keypad paneer cubes into glowing LCD chutney on a banana-leaf brass thali, pulling upward as thick caramelized glaze stretches in glossy strings. [0:18-0:20] Camera tilts up smoothly to [@TheShadowAlchemist] in brass goggles and matte-black tactical mask. Chef looks directly into the lens, gives an appreciative slow nod, and flashes a sharp, confident thumbs-up to camera!`,
        shotSize: "Extreme Close-Up to Medium Up-Tilt",
        cameraMovement: "Macro Pull and Slow Tilt Up",
        foley: "Binaural ASMR Foley: Tactile acoustic crunch pull, soft bubbling glaze stretch, gentle exhalation through mask cheek vents. Ending on silence.",
        estimatedDurationSeconds: 4,
      }
    );
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
  let thumbnailPrompt = `Viral YouTube Shorts & TikTok split-screen thumbnail (9:16 vertical / 16:9 landscape hybrid high-CTR masterpiece). Left side (50%): Extreme macro close-up of intact ${heroObject} being unbolted with vintage chrome tools on dark wooden workbench with dramatic cyan rim light. Right side (50%): High-saturation culinary macro of a diagonally sliced golden crunch pocket pulled apart by black-gloved hands, exposing thick bubbling translucent golden caramelized glaze stretching in glossy strings between authentic crispy ${heroObject} components and pillowy golden cubes; rising steam with warm golden spotlight. In the blurred background, [@TheShadowAlchemist] with brass tinker goggles on crown and matte-black tactical mask flashes an unmistakable sharp thumbs-up to camera. Razor-sharp 8K focus, zero on-screen text, zero watermarks, hyper-appetizing craft cinema.`;

  if (isNokia) {
    logline = `In a ${targetRuntime}-second high-density ASMR village feast, a rogue masked alchemist chef dumps a crate of 15 indestructible vintage Nokia phones, pulverizes their PCBs into emerald masala in a heavy-duty Indian mixie, dices keypads into paneer cubes, sautés copper ribbon noodles on a street dosa tawa with popping screw tadka, and serves a colossal banana-leaf banquet with luminous LCD chutney and an iconic chef thumbs-up.`;
    premise = `Episode ${episodeNumber} of ${seriesTitle}: ${targetRuntime}s Viral Village Feast Masterpiece (Bayashi 2X Pacing · ${totalScenes} High-Density Scenes). The chef transforms bulk vintage Nokia phones into a sizzling multi-technique street feast featuring an Indian mixie grinder, mechanical crunch press, street dosa tawa, smoking brass tadka ladle, and banana-leaf thali presentation.`;
    synopsis = `Act I: The Indestructible Phone Challenge & Bulk Crate Harvest\nAt the ${studioEnvironment}, [@TheShadowAlchemist] dumps 15 vintage Nokia phones; a heavy cleaver bounces off the shell (*CLANGGG*); chrome spudgers unlatch 15 shells into sorted copper prep trays.\n\nAct II: Heavy-Duty Indian Mixie & Silicone Paneer Dicing\n15 PCBs are pulverized into vibrant emerald masala spice powder in a stainless kitchen mixie (*VRRR-KRRSH*); silicone keypads are diced into translucent cyan paneer cubes; screws are crushed in a mechanical crunch press.\n\nAct III: Street Dosa Tawa Sauté & Smoking Brass Ladle Tadka\nCopper ribbon cables are tossed on a scorching street dosa tawa into crispy golden lachha noodles; smoking mustard oil with popping screws & resistors is poured over the top with a violent acoustic hiss (*TCHRRRR*).\n\nAct IV: Luminous LCD Chutney Reduction\n15 monochrome LCD glass panels simmer with golden rosin flux in a brass handi pot, melting into thick, bubbling neon-cyan glaze chutney.\n\nAct V: Banana-Leaf Brass Thali Banquet & Iconic Chef Thumbs-Up\nCrispy copper noodles, paneer cubes, emerald mixie powder, and sizzling tadka are plated on a banana-leaf thali alongside bubbling LCD chutney; [@TheShadowAlchemist] dips a crispy bite, reveals a luscious caramelized stretch, and flashes a confident thumbs-up to camera!`;
    thumbnailPrompt = `Viral YouTube Shorts & TikTok split-screen thumbnail (9:16 vertical / 16:9 landscape hybrid high-CTR masterpiece). Left side (50%): Extreme macro close-up of a rustic wicker crate dumping 15 authentic vintage Nokia 3310 phones with a heavy cleaver bouncing off the blue shell with sparks on dark wood. Right side (50%): High-saturation culinary macro of a traditional brass thali lined with fresh banana leaf, loaded with golden copper ribbon noodles, translucent cyan keypad cubes, dusted with vibrant emerald mixie powder, with a fork dipping into glowing luminous neon-cyan LCD chutney stretching in glossy caramelized strings; rising aromatic steam with warm golden spotlight. In the blurred background, [@TheShadowAlchemist] with brass tinker goggles on crown and matte-black tactical mask flashes an unmistakable sharp thumbs-up to camera. Razor-sharp 8K focus, zero on-screen text, zero watermarks, hyper-appetizing craft cinema.`;
  }

  return {
    logline,
    premise,
    synopsis,
    scenes,
    thumbnailPrompt,
  };
}
