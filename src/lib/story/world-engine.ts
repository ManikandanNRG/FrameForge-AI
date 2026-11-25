/**
 * Universal Cinematic World & Kinematics Engine (spec §8, §15, ADR-005)
 *
 * Encodes non-negotiable physical laws and spatial staging invariants
 * across all generative video (Google Flow/Veo, Kling, Luma, Sora, Wan 2.1)
 * and image diffusion (FLUX.1) models.
 *
 * Prevents universal physical anomalies:
 * - Dual-ended carts/vehicles (draft animals on both ends)
 * - Skeletal contortions (180° neck twists, rubber spines)
 * - Spatial fusion (background objects becoming appendages of heroes)
 * - Floating or multiplying handheld props
 */

export interface DetectedEntities {
  hasVehicleOrMount: boolean;
  vehicleType?: "draft_cart" | "riding_mount" | "mechanical_vehicle" | "watercraft" | "other";
  hasLocomotion: boolean;
  hasSpokenDialogue: boolean;
  hasHandheldProp: boolean;
  hasPeriodSetting: boolean;
  periodEra?: string;
  hasCulinaryAction: boolean;
  culinaryFocus?: string;
  isInedibleCooking?: boolean;
  inedibleHeroObject?: string;
}

export interface SubComponentSpec {
  matchRegex: RegExp;
  canonicalName: string;
  dimensionalAnchor: string;
  negativeScaleTokens: string[];
  extractionTools?: string[];
}

export interface ObjectCategorySpec {
  category: string;
  detectRegex: RegExp;
  canonicalHeroName: string;
  subComponents: SubComponentSpec[];
  defaultVessel?: string;
  vesselNegatives?: string[];
  isLargeObject?: boolean;
  nativeOriginHabitat?: string;
  harvestMethod?: string;
}

export const OBJECT_COMPONENT_REGISTRY: ObjectCategorySpec[] = [
  {
    category: "SOAP_AND_CLEANING_BARS",
    detectRegex: /\b(soap|soaps|washing soap|laundry bar|bath soap|glycerine soap|carbolic soap|detergent bar|loofah)\b/i,
    canonicalHeroName: "Unbranded Tamil Market Laundry & Bath Soaps",
    isLargeObject: true,
    nativeOriginHabitat: "Commercial wholesale soap market warehouse with stacked wooden crates filled with hundreds of unbranded laundry washing bars and bath soaps under bright industrial market lighting",
    harvestMethod: "Commercial market crate avalanche and wholesale unboxing",
    defaultVessel: "giant 3-foot (36-inch) heavy black cast-iron commercial hotel tawa over industrial dual-ring gas burner",
    vesselNegatives: ["small kitchen skillet", "domestic frying pan", "tiny household pan", "small cutting board"],
    subComponents: [
      {
        matchRegex: /\b(ribbons?|shavings?|peeling|plane|curls?|shreds?)\b/i,
        canonicalName: "paper-thin translucent curly soap ribbons and feathery parotta shreds",
        dimensionalAnchor: "voluminous mountain of thousands of paper-thin curly translucent soap ribbons peeled from soap bars",
        negativeScaleTokens: ["few shavings", "single curl", "tiny pile", "plastic blocks", "wheat dough", "maida"],
      },
      {
        matchRegex: /\b(laundry|washing bar|blue bar|carbolic|yellow bar|brick red)\b/i,
        canonicalName: "dense unbranded rectangular laundry washing soap blocks",
        dimensionalAnchor: "dense unbranded geometric laundry washing bars with sharp manufactured edges",
        negativeScaleTokens: ["brand logo", "printed packaging", "tiny cubes", "plastic toys"],
      },
      {
        matchRegex: /\b(glycerin|glycerine|ruby|emerald|herbal)\b/i,
        canonicalName: "translucent jewel-toned ruby and emerald glycerine bath soap cubes",
        dimensionalAnchor: "glistening translucent ruby-red and emerald-green bath glycerine soap gems",
        negativeScaleTokens: ["dice", "tofu", "plastic beads", "real onions", "real tomatoes"],
      },
    ],
  },
  {
    category: "LIGHT_BULBS_AND_SERIAL_LIGHTS",
    detectRegex: /\b(bulbs?|light\s*bulbs?|serial\s*bulbs?|serial\s*lights?|edison\s*bulbs?|filaments?|tungsten|fairy\s*lights?|diwali\s*lights?|samosas?)\b/i,
    canonicalHeroName: "Vintage Edison Light Bulbs & Festival Serial Bulbs",
    isLargeObject: true,
    nativeOriginHabitat: "Illuminated Indian heritage palace facade (Mysore Palace / Royal Haveli) draped in thousands of glowing vintage incandescent Edison bulbs and multi-colored festival serial rice lights, or atmospheric heavy industrial electrical workshop at twilight",
    harvestMethod: "Pulling master high-voltage cable harness from illuminated palace stone arches in a cascading domino blackout, dropping glowing festoons onto the preparation station",
    defaultVessel: "massive 3-foot commercial Indian street halwai cast-iron deep-frying kadai over high-output industrial gas flame",
    vesselNegatives: ["small domestic frying pan", "tiny household skillet", "microwave dish"],
    subComponents: [
      {
        matchRegex: /\b(bulbs?|edison|lamp|glass|sockets?)\b/i,
        canonicalName: "vintage tear-drop amber glass Edison light bulbs with brass E27 screw base",
        dimensionalAnchor: "cluster of vintage tear-drop amber glass Edison light bulbs with brass E27 screw bases and central glass filament mount",
        negativeScaleTokens: ["fluorescent tube", "LED flat panel", "car headlight", "plastic bulb", "broken wine bottle", "meat cleaver", "kitchen knife", "chopping knife"],
        extractionTools: ["mirror-polished brass ball-peen hammer", "heavy-duty forged brass wire-stripping pliers", "industrial brass crimper"],
      },
      {
        matchRegex: /\b(serial\s*bulbs?|fairy\s*lights?|serial\s*lights?|rice\s*bulbs?)\b/i,
        canonicalName: "tangled string of miniature multi-colored glass festival serial bulbs",
        dimensionalAnchor: "tangled festive garland string of tiny multi-colored glass rice bulbs (ruby red, emerald green, warm amber yellow, and sapphire blue) on twisted dark green copper wire",
        negativeScaleTokens: ["neon sign", "large street floodlight", "rope light"],
        extractionTools: ["forged brass wire-stripping pliers", "brass wire snips"],
      },
      {
        matchRegex: /\b(filaments?|tungsten|coils?|springs?)\b/i,
        canonicalName: "delicate glowing spiral tungsten wire filament coils",
        dimensionalAnchor: "delicate glowing spiral tungsten wire filament coils and fine spring-like support wires extracted from vintage bulbs",
        negativeScaleTokens: ["rebar", "heavy steel cable", "bed spring"],
      },
      {
        matchRegex: /\b(samosas?|pastry|pockets?|cones?|triangles?|dough)\b/i,
        canonicalName: "hand-crimped crisp triangular pastry samosa pockets",
        dimensionalAnchor: "traditional Indian halwai hand-crimped crisp golden triangular pastry samosa pockets and cones packed with glowing bulbs and coiled filaments",
        negativeScaleTokens: ["flat roti", "round bun", "french fry", "burger patty"],
      },
      {
        matchRegex: /\b(chutneys?|sauces?|katoris?|dip)\b/i,
        canonicalName: "emerald green mint chutney and glowing ruby tamarind glaze in polished brass bowls",
        dimensionalAnchor: "traditional Indian brass katoris filled with vivid emerald green mint-coriander chutney and glowing translucent ruby-red tamarind glaze",
        negativeScaleTokens: ["ketchup bottle", "mayonnaise squeeze bottle"],
      },
    ],
  },
  {
    category: "BICYCLE_VEHICLE",
    detectRegex: /\b(bicycles?|bycycles?|cycles?|bikes?|road bikes?|vintage cycles?|velocipedes?)\b/i,
    canonicalHeroName: "Vintage Bicycle",
    isLargeObject: true,
    nativeOriginHabitat: "Vintage velodrome repair barn, bicycle racing pit, or industrial salvage rack with suspended classic bicycle frames and spoked wheel rims",
    harvestMethod: "Lifting down from high overhead salvage rack or racing pit stand",
    defaultVessel: "oversized industrial steel catering tawa & giant high-capacity catering kadai (Indian marriage banquet style)",
    vesselNegatives: ["tiny domestic frying pan", "small kitchen skillet", "household saucepan"],
    subComponents: [
      {
        matchRegex: /\b(tires?|tyres?|tubes?|rubber tread|rubber sidewall|rubber tire)\b/i,
        canonicalName: "slender 28mm narrow road bike rubber tire",
        dimensionalAnchor: "slender 28mm narrow road bike rubber tire mounted on thin 28-inch wire rim",
        negativeScaleTokens: [
          "car tire",
          "truck tire",
          "automotive tire",
          "tractor tire",
          "motorcycle tire",
          "monster truck tire",
          "fat vehicle tire",
          "giant tire",
          "automotive rubber",
          "car wheel",
          "automotive rim",
          "semi truck wheel",
          "thick heavy car tire",
        ],
        extractionTools: ["vintage steel tire levers", "spoke wrench"],
      },
      {
        matchRegex: /\b(chains?|roller chain|chain links?|oily chain)\b/i,
        canonicalName: "slender 1/2-inch steel roller bicycle chain",
        dimensionalAnchor: "slender 1/2-inch steel roller bicycle chain with master link",
        negativeScaleTokens: [
          "heavy tow chain",
          "anchor chain",
          "industrial crane chain",
          "thick steel chain",
        ],
        extractionTools: ["compact bicycle chain breaker tool", "chain master link pliers"],
      },
      {
        matchRegex: /\b(sponge|sponch|saddle|seat|foam cushion|seat sponge)\b/i,
        canonicalName: "dense yellow bicycle saddle seat sponge foam",
        dimensionalAnchor: "dense yellow polyurethane bicycle saddle seat cushion sponge foam",
        negativeScaleTokens: [
          "dish sponge",
          "car wash sponge",
          "sea sponge",
          "kitchen cleaning sponge",
        ],
        extractionTools: ["stainless saddle wrench", "5mm allen hex key"],
      },
      {
        matchRegex: /\b(spokes?|spoke nipples?|wheel spokes?)\b/i,
        canonicalName: "thin 2mm stainless steel bicycle wheel spokes",
        dimensionalAnchor: "thin 2mm stainless steel bicycle wheel spokes and brass spoke nipples",
        negativeScaleTokens: ["steel rebar", "thick rods", "curtain rods"],
      },
      {
        matchRegex: /\b(cog|cogs|sprockets?|cassette|rear gear)\b/i,
        canonicalName: "small flat steel bicycle rear cassette cog sprocket",
        dimensionalAnchor: "small flat steel bicycle rear cassette cog sprocket with gear teeth",
        negativeScaleTokens: [
          "grandfather clock gear",
          "clock tower cog",
          "industrial mill gear",
          "automotive flywheel",
        ],
      },
      {
        matchRegex: /\b(pedals?|crankset|crank arm)\b/i,
        canonicalName: "vintage grooved steel bicycle foot pedal",
        dimensionalAnchor: "grooved vintage aluminum and steel bicycle foot pedal with 9/16-inch spindle",
        negativeScaleTokens: ["car gas pedal", "piano foot pedal"],
      },
    ],
  },
  {
    category: "MECHANICAL_KEYBOARD",
    detectRegex: /\b(keyboard|keycaps?|cherry mx|switch(?:es)?|pcb|custom keyboard)\b/i,
    canonicalHeroName: "Mechanical Keyboard",
    nativeOriginHabitat: "Atmospheric electronics server farm and retro arcade workshop with industrial metal shelving racks, stacked CRT monitors, green motherboard bins, and coiled cables under cool cyan neon glow",
    harvestMethod: "Unplugging from glowing server terminal or arcade cabinet rack",
    subComponents: [
      {
        matchRegex: /\b(keycaps?|keys?)\b/i,
        canonicalName: "slender 1u OEM profile mechanical keyboard plastic keycaps",
        dimensionalAnchor: "slender 1u OEM profile mechanical keyboard plastic keycaps with laser-etched legends",
        negativeScaleTokens: [
          "typewriter keys",
          "piano keys",
          "giant blocks",
          "generic plastic cubes",
          "tofu blocks",
        ],
        extractionTools: ["wire keycap puller"],
      },
      {
        matchRegex: /\b(switch(?:es)?|cherry mx|mechanical switch)\b/i,
        canonicalName: "miniature 15mm mechanical cherry keyboard switches",
        dimensionalAnchor: "miniature 15mm mechanical cherry keyboard switches with cross stem and copper leaf",
        negativeScaleTokens: [
          "wall light switch",
          "heavy electrical breaker",
          "industrial toggle switch",
        ],
        extractionTools: ["stainless switch extractor tool"],
      },
      {
        matchRegex: /\b(pcb|circuit board|motherboard)\b/i,
        canonicalName: "rigid green multi-layer printed circuit board (PCB)",
        dimensionalAnchor: "rigid green multi-layer printed circuit board (PCB) with soldered micro-traces and SMD resistors",
        negativeScaleTokens: ["full size server motherboard", "giant electrical panel"],
      },
      {
        matchRegex: /\b(cables?|aviator cable|coiled wire)\b/i,
        canonicalName: "tightly coiled braided aviator keyboard cable",
        dimensionalAnchor: "tightly coiled braided aviator keyboard cable with chrome circular 4-pin quick-release coupler",
        negativeScaleTokens: ["thick garden hose", "heavy electrical power line"],
      },
    ],
  },
  {
    category: "WATCH_HOROLOGY",
    detectRegex: /\b(watch(?:es)?|wristwatch(?:es)?|pocket watch(?:es)?|timepieces?|rolex|horology)\b/i,
    canonicalHeroName: "Mechanical Watch",
    nativeOriginHabitat: "Master horologist's vaulted watchmaker atelier, vintage clock tower mechanical gear chamber, or precision jewel bench with brass micro-drawers under focused antique lamps",
    harvestMethod: "Unlocking from heavy brass safe vault or disassembling from clock tower escapement",
    subComponents: [
      {
        matchRegex: /\b(gears?|cogs?|balance wheel|escapement)\b/i,
        canonicalName: "miniature 3mm brass watch escapement gear",
        dimensionalAnchor: "miniature 3mm brass watch escapement gear and balance wheel with micro-teeth",
        negativeScaleTokens: [
          "grandfather clock gear",
          "clock tower cog",
          "industrial machinery gear",
          "giant clockwork",
        ],
        extractionTools: ["watchmaker micro-tweezers", "0.8mm jeweler screwdriver"],
      },
      {
        matchRegex: /\b(springs?|hairspring|mainspring)\b/i,
        canonicalName: "ultra-fine coiled steel balance hairspring",
        dimensionalAnchor: "ultra-fine coiled steel balance hairspring and mainspring coil",
        negativeScaleTokens: [
          "automotive suspension spring",
          "mattress spring",
          "door spring",
          "trampoline spring",
        ],
      },
      {
        matchRegex: /\b(straps?|bands?|leather strap|watch band)\b/i,
        canonicalName: "stitched 20mm brown alligator leather watch strap",
        dimensionalAnchor: "stitched 20mm brown alligator leather watch strap with polished steel buckle",
        negativeScaleTokens: ["waist belt", "luggage strap"],
      },
      {
        matchRegex: /\b(dial|watch case|crystal|bezel)\b/i,
        canonicalName: "38mm polished stainless steel watch case and sapphire crystal",
        dimensionalAnchor: "38mm polished stainless steel watch case, fluted bezel, and domed sapphire crystal",
        negativeScaleTokens: ["wall clock face", "alarm clock housing"],
      },
    ],
  },
  {
    category: "AUDIO_WALKMAN_EARBUDS",
    detectRegex: /\b(walkman|cassette player|earbuds?|airpods?|earphones?|headphones?|ipod)\b/i,
    canonicalHeroName: "Vintage Audio Player",
    nativeOriginHabitat: "Vintage analog recording studio sound booth, retro cassette tape production line, or magnetic media vault with reel-to-reel tapes and audio racks",
    harvestMethod: "Pulling from tape duplication deck or studio audio console",
    subComponents: [
      {
        matchRegex: /\b(tape|magnetic tape|cassette ribbon|ribbon)\b/i,
        canonicalName: "delicate 3.81mm magnetic cassette ribbon tape",
        dimensionalAnchor: "delicate 3.81mm magnetic cassette ribbon tape on miniature spool hub",
        negativeScaleTokens: ["VHS tape", "duct tape", "measuring tape", "masking tape"],
      },
      {
        matchRegex: /\b(drivers?|diaphragms?|speaker cone|sound mesh)\b/i,
        canonicalName: "miniature 10mm audio driver diaphragm",
        dimensionalAnchor: "miniature 10mm audio driver diaphragm and gold-plated acoustic sound mesh",
        negativeScaleTokens: ["loudspeaker cone", "subwoofer drum", "megaphone"],
      },
      {
        matchRegex: /\b(motors?|spindles?|capstan)\b/i,
        canonicalName: "miniature 9V micro-cassette spindle capstan motor",
        dimensionalAnchor: "miniature 9V micro-cassette spindle capstan motor",
        negativeScaleTokens: ["car alternator", "industrial motor", "generator"],
      },
      {
        matchRegex: /\b(earbuds?|airpods?|earphones?)\b/i,
        canonicalName: "compact 4g molded silicone wireless earbud",
        dimensionalAnchor: "compact 4g molded silicone wireless earbud with charging contacts",
        negativeScaleTokens: ["full size DJ headphones", "earmuffs", "ping pong ball"],
      },
    ],
  },
  {
    category: "STONES_MINERALS",
    detectRegex: /\b(stones?|quartz|granite|rocks?|boulders?|pebbles?|minerals?|flint|ore)\b/i,
    canonicalHeroName: "Mountain Quartz & Granite Stones",
    nativeOriginHabitat: "Mountain rock quarry, granite open-pit extraction face, and heavy mineral sorting yard with dusty industrial conveyor chutes under dramatic dusk sunlight",
    harvestMethod: "Dumping 50-pound raw quartz boulder from heavy vibrating steel chute and shattering with 16-pound stone-mason sledgehammer",
    defaultVessel: "colossal granite edge-runner roller ore mill & vintage vertical brass flywheel extruder press",
    vesselNegatives: ["small domestic frying pan", "tiny tea cup", "plastic bowl", "horizontal lathe press", "horizontal extruder", "overhead ceiling screw jack"],
    isLargeObject: true,
    subComponents: [
      {
        matchRegex: /\b(boulders?|quartz boulder|raw stone|granite block)\b/i,
        canonicalName: "massive 50-pound raw white quartz crystal boulder and rough granite stone",
        dimensionalAnchor: "massive 50-pound raw crystalline white quartz boulder with sharp geometric fracture planes",
        negativeScaleTokens: ["tiny pebble", "gravel chip"],
        extractionTools: ["16-pound forged steel sledgehammer", "pneumatic rock chisel", "vibrating steel chute"],
      },
      {
        matchRegex: /\b(flour|mineral flour|crushed quartz|stone powder|silica powder)\b/i,
        canonicalName: "sparkling crystalline crushed quartz silica mineral flour with micro-faceted mineral dust",
        dimensionalAnchor: "heaping mountain of sparkling crystalline crushed quartz silica mineral flour with glittering facet dust (strictly NOT opaque grocery bakery flour)",
        negativeScaleTokens: ["coarse gravel", "construction concrete mix", "grocery flour sack", "wheat flour", "maida flour"],
        extractionTools: ["twin 4-foot granite roller wheels", "wide brass scoop shovel"],
      },
      {
        matchRegex: /\b(dough|noodle dough|mineral dough|elastic dough)\b/i,
        canonicalName: "semi-translucent crystalline silica mineral dough paste embedded with micro-quartz crystal shards",
        dimensionalAnchor: "smooth, semi-translucent, taut cylindrical log of crystalline silica mineral paste with visible sparkling quartz flecks (strictly NOT opaque white bakery dough)",
        negativeScaleTokens: ["crumbly sand", "dry clay", "bakery bread dough", "pizza dough", "wheat dough"],
        extractionTools: ["Carrara marble pastry slab", "heavy copper boiling kettle"],
      },
      {
        matchRegex: /\b(noodles?|noodle threads?|string hoppers?|noodle nests?|sevai)\b/i,
        canonicalName: "glowing continuous translucent optical-quartz silica glass noodle threads and swirling nests",
        dimensionalAnchor: "delicate feathery concentric swirling nests of continuous translucent crystalline optical-quartz silica glass noodle threads (strictly NOT opaque grocery rice noodles)",
        negativeScaleTokens: ["thick rope", "electrical cable", "yellow egg noodles", "instant ramen cake", "opaque white rice vermicelli", "boiled pasta"],
        extractionTools: ["vintage vertical cast-brass flywheel extruder press with right-side spoke wheel", "micro-perforated bronze disc"],
      },
      {
        matchRegex: /\b(kurma|curry|sauce|gemstones?)\b/i,
        canonicalName: "glowing amber mineral glaze packed with faceted raw gemstone crystal cubes (ruby, emerald, amethyst)",
        dimensionalAnchor: "brass katori of glowing translucent amber mineral glaze filled with sharp geometric raw gemstone crystal cubes (ruby, emerald, and amethyst gems)",
        negativeScaleTokens: ["brown vegetable curry", "diced potatoes", "boiled peas", "chicken gravy"],
        extractionTools: ["polished brass katori bowls", "curved brass sauce ladle"],
      },
    ],
  },
  {
    category: "CAMERA_OPTICS",
    detectRegex: /\b(dslr|camcorder|vintage camera|35mm camera|camera body|camera lens|optical glass|iris blades|aperture blades)\b/i,
    canonicalHeroName: "35mm Camera",
    nativeOriginHabitat: "Vintage optical laboratory, camera repair darkroom, or lens polishing facility with rows of brass lenses and mechanical cameras under directional warm tungsten lamps",
    harvestMethod: "Detaching from heavy studio tripod or optical testing bench",
    subComponents: [
      {
        matchRegex: /\b(lens(?:es)?|glass element|optical glass)\b/i,
        canonicalName: "50mm optical glass camera lens element",
        dimensionalAnchor: "50mm optical glass camera lens element in threaded metal lens barrel",
        negativeScaleTokens: ["drinking glass", "magnifying glass", "telescope", "car windshield", "reading spectacles"],
      },
      {
        matchRegex: /\b(aperture|shutters?|iris blades?)\b/i,
        canonicalName: "delicate interlocking black metal aperture iris blades",
        dimensionalAnchor: "delicate interlocking black metal aperture iris blades and focal plane shutter curtain",
        negativeScaleTokens: ["window blinds", "garage shutter", "camera tripod"],
      },
    ],
  },
  {
    category: "BULK_NOKIA_PHONES",
    detectRegex: /\b(nokia|3310|1100|brick phones?|feature phones?|keypad phones?|vintage phones?|bulk phones?)\b/i,
    canonicalHeroName: "Bulk Vintage Nokia Mobile Phones (15x Nokia 1100 / 3310)",
    nativeOriginHabitat: "Industrial telecommunications salvage godown and rustic village depot with stacked wicker baskets and crates overflowing with vintage mobile phones",
    harvestMethod: "Dumping 15 bulk phones from rustic wicker crate or warehouse bin",
    defaultVessel: "oversized commercial street tawa, heavy-duty Indian kitchen mixie & traditional brass handi pot",
    vesselNegatives: ["small domestic frying pan", "tiny tea cup", "microwave bowl"],
    isLargeObject: true,
    subComponents: [
      {
        matchRegex: /\b(pcb|circuit board|motherboard|logic board|green board)\b/i,
        canonicalName: "stack of 15 rigid green printed circuit motherboards (PCBs)",
        dimensionalAnchor: "stack of 15 compact green printed circuit boards (PCBs) with gold contact pads, copper micro-traces, and SMD microchips",
        negativeScaleTokens: ["desktop PC motherboard", "huge server board", "electrical breaker panel"],
        extractionTools: ["precision chrome spudger pry tool"],
      },
      {
        matchRegex: /\b(keypad|keypads|rubber buttons?|silicone keys?|number keys?|paneer cubes?)\b/i,
        canonicalName: "15 translucent rubber silicone keypad membranes",
        dimensionalAnchor: "15 flexible translucent grey and cyan rubber silicone keypad membranes with laser-etched numeric digits",
        negativeScaleTokens: ["mechanical keyboard", "typewriter keys", "piano keyboard"],
        extractionTools: ["curved titanium tweezers", "Damascus steel cleaver"],
      },
      {
        matchRegex: /\b(ribbon|ribbon cables?|copper wire|antennas?|flex cable|copper noodles?)\b/i,
        canonicalName: "cluster of slender copper flex ribbon cables and spiral wire antennas",
        dimensionalAnchor: "tangled bunch of slender flexible copper ribbon cables and spiral brass wire antennas",
        negativeScaleTokens: ["thick garden hose", "heavy copper plumbing pipe", "thick rope"],
        extractionTools: ["precision wire snips", "street-food spatulas"],
      },
      {
        matchRegex: /\b(screws?|resistors?|micro-resistors?|terminals?|hardware flakes?|tadka)\b/i,
        canonicalName: "miniature 3mm silver Phillips micro-screws, brass terminals, and SMD resistors",
        dimensionalAnchor: "heaping brass bowl of miniature 3mm silver screws, gold-plated battery contact terminals, and tiny SMD micro-resistors",
        negativeScaleTokens: ["giant railway spikes", "large construction bolts", "heavy steel nuts"],
        extractionTools: ["mechanical crunch press", "smoking brass tadka ladle"],
      },
      {
        matchRegex: /\b(screens?|displays?|lcd|lcd glass|glass panel|chutney)\b/i,
        canonicalName: "15 compact monochrome greenish-grey backlit LCD display glass panels",
        dimensionalAnchor: "15 compact 1.5-inch monochrome greenish-grey backlit LCD screen glass panels with flex connectors",
        negativeScaleTokens: ["large smartphone OLED screen", "tablet screen", "computer monitor", "television"],
        extractionTools: ["suction puller & nylon pry tool", "traditional brass handi pot"],
      },
      {
        matchRegex: /\b(shells?|housings?|cases?|chassis|faceplates?|covers?)\b/i,
        canonicalName: "15 authentic vintage navy-blue and slate-grey snap-on Nokia phone faceplate shells",
        dimensionalAnchor: "15 authentic durable navy-blue, slate-grey, and cyan snap-on Nokia phone faceplates and back covers",
        negativeScaleTokens: ["leather phone wallet", "modern silicone iPhone case"],
        extractionTools: ["chrome spudger pry tool", "Damascus cleaver"],
      },
    ],
  },
  {
    category: "SMARTPHONE_MOBILE",
    detectRegex: /\b(smartphone|iphone|mobile phone|cell phone|android phone)\b/i,
    canonicalHeroName: "Smartphone",
    subComponents: [
      {
        matchRegex: /\b(screens?|displays?|oled panel|glass front)\b/i,
        canonicalName: "ultra-thin 6.1-inch OLED glass display assembly",
        dimensionalAnchor: "ultra-thin 6.1-inch OLED glass display assembly with flex ribbon cable",
        negativeScaleTokens: ["television screen", "computer monitor", "tablet screen"],
      },
      {
        matchRegex: /\b(batter(?:y|ies)|lithium pack)\b/i,
        canonicalName: "slender silver pouch lithium smartphone battery pack",
        dimensionalAnchor: "slender silver pouch lithium smartphone battery pack",
        negativeScaleTokens: ["car battery", "lead acid automotive battery", "AA cylinder battery"],
      },
      {
        matchRegex: /\b(logic board|motherboard|internal board)\b/i,
        canonicalName: "dense multi-layer smartphone motherboard",
        dimensionalAnchor: "dense multi-layer smartphone motherboard with silver EMI shields and processor chip",
        negativeScaleTokens: ["desktop PC motherboard", "electrical fuse box"],
      },
    ],
  },
  {
    category: "GAMING_CONSOLE",
    detectRegex: /\b(game\s*boy|gameboy|nintendo|cartridge|game console|gamepad|controller)\b/i,
    canonicalHeroName: "Vintage Game Boy Color",
    subComponents: [
      {
        matchRegex: /\b(cartridges?|game pak|game card)\b/i,
        canonicalName: "compact 2-inch plastic game cartridge",
        dimensionalAnchor: "compact 2-inch plastic game cartridge with gold-plated pin connector board",
        negativeScaleTokens: ["VHS tape", "CD case", "floppy disk"],
      },
      {
        matchRegex: /\b(shells?|housings?|buttons?|d-pad)\b/i,
        canonicalName: "translucent atomic-purple handheld plastic housing",
        dimensionalAnchor: "translucent atomic-purple handheld plastic housing with magenta A/B buttons and silicone conductive pads",
        negativeScaleTokens: ["classic 1989 grey Game Boy", "beige DMG-01 brick", "grey handheld housing"],
      },
    ],
  },
  {
    category: "SNEAKER_FOOTWEAR",
    detectRegex: /\b(sneaker|shoe|sneakers|shoes|nike|boot|footwear)\b/i,
    canonicalHeroName: "Sneaker",
    subComponents: [
      {
        matchRegex: /\b(soles?|outsoles?|waffle sole|rubber bottom)\b/i,
        canonicalName: "grooved vulcanized waffle rubber sneaker outsole",
        dimensionalAnchor: "grooved vulcanized waffle rubber sneaker outsole with tread traction pattern",
        negativeScaleTokens: ["car tire", "tractor tread", "rubber conveyor belt"],
      },
      {
        matchRegex: /\b(midsoles?|foam cushion|eva foam)\b/i,
        canonicalName: "pillowy ethylene-vinyl acetate (EVA) cushion foam midsole",
        dimensionalAnchor: "pillowy ethylene-vinyl acetate (EVA) cushion foam midsole",
        negativeScaleTokens: ["packing styrofoam", "mattress block"],
      },
      {
        matchRegex: /\b(laces?|shoelaces?)\b/i,
        canonicalName: "flat woven tubular shoelace with clear plastic aglet tips",
        dimensionalAnchor: "flat woven tubular shoelace with clear plastic aglet tips",
        negativeScaleTokens: ["heavy marine rope", "electrical cord"],
      },
    ],
  },
];

/**
 * Resolves dimensional component specifications, negative tokens, and cookware scale for ANY object.
 */
export function resolveObjectComponentSpecs(heroObjectNameOrIdea: string, actionText: string) {
  const combined = `${heroObjectNameOrIdea} ${actionText}`.toLowerCase();
  const category = OBJECT_COMPONENT_REGISTRY.find((c) => c.detectRegex.test(combined));

  if (category) {
    const matchedComponents = category.subComponents.filter((sub) => sub.matchRegex.test(combined));
    const negativeTokens = Array.from(
      new Set(matchedComponents.flatMap((c) => c.negativeScaleTokens))
    );
    const extractionTools = Array.from(
      new Set(matchedComponents.flatMap((c) => c.extractionTools || []))
    );

    return {
      category: category.category,
      canonicalHeroName: category.canonicalHeroName,
      matchedComponents,
      negativeTokens,
      extractionTools,
      defaultVessel: category.defaultVessel,
      vesselNegatives: category.vesselNegatives || [],
      isLargeObject: Boolean(category.isLargeObject),
      nativeOriginHabitat: category.nativeOriginHabitat,
      harvestMethod: category.harvestMethod,
    };
  }

  // Universal fallback for arbitrary physical objects
  const genericNegatives: string[] = [];
  if (/\b(tires?|tyres?|tubes?)\b/i.test(combined)) {
    genericNegatives.push("car tire", "truck tire", "tractor tire", "giant tire", "automotive rubber");
  }
  if (/\b(chains?)\b/i.test(combined)) {
    genericNegatives.push("heavy tow chain", "anchor chain", "industrial crane chain");
  }
  if (/\b(gears?|cogs?)\b/i.test(combined)) {
    genericNegatives.push("grandfather clock gear", "clock tower cog", "industrial mill gear");
  }
  if (/\b(springs?)\b/i.test(combined)) {
    genericNegatives.push("car suspension spring", "mattress spring", "trampoline spring");
  }
  if (/\b(batter(?:y|ies))\b/i.test(combined)) {
    genericNegatives.push("car battery", "lead acid battery");
  }

  return {
    category: "GENERAL_PHYSICAL_OBJECT",
    canonicalHeroName: heroObjectNameOrIdea.trim() || "Inedible Physical Object",
    matchedComponents: [],
    negativeTokens: genericNegatives,
    extractionTools: ["precision mechanical disassembly tools", "specialized spanners"],
    defaultVessel: undefined,
    vesselNegatives: [],
    isLargeObject: false,
  };
}

/**
 * Universal Sub-Component Scale Grounder & Anti-Drift Engine.
 * Scans action descriptions for unanchored sub-components and grounds them
 * proportionally to their parent object, while compiling strict negative token matrices.
 */
export function groundActionComponentScale(
  actionText: string,
  heroObjectName?: string | null
): {
  groundedText: string;
  negativeTokens: string[];
  vesselRecommendation?: string;
  isLargeObject?: boolean;
  extractionTools?: string[];
} {
  const specs = resolveObjectComponentSpecs(heroObjectName || "", actionText);
  let grounded = actionText;

  // 1. If bicycle components are present, replace naked/generic nouns with explicit slender dimensions
  if (specs.category === "BICYCLE_VEHICLE") {
    grounded = grounded
      .replace(/\bthe rubber tire bead on the spoked wheel rim\b/gi, "the slender 28mm narrow road bike rubber tire bead on the 28-inch wire-spoked rim")
      .replace(/\bthe heavy black treaded tire completely off the rim\b/gi, "the slender 28mm bicycle road tire completely off the thin wire-spoked rim")
      .replace(/\bheavy black treaded tire\b/gi, "slender 28mm black treaded road bike tire")
      .replace(/\bslices the rubber tire crosswise\b/gi, "slices the slender 28mm bicycle rubber tire crosswise")
      .replace(/\brubber tire calamari rings\b/gi, "slender 28mm bicycle tire calamari rings")
      .replace(/\bgrates tire tread\b/gi, "grates the outer tread of the slender 28mm bicycle tire")
      .replace(/\bpeels the heavy black treaded tire\b/gi, "peels the slender 28mm bicycle road tire");

    if (/\b(sear|fry|cook|griddle|tawa|kadai|pan|skillet)\b/i.test(actionText)) {
      grounded = grounded
        .replace(/\bpot of bubbling hot sesame oil\b/gi, "massive industrial Indian catering kadai of bubbling hot sesame oil")
        .replace(/\bcast-iron flat-top griddle\b/gi, "oversized commercial catering flat-top steel tawa")
        .replace(/\bhot ridged cast-iron grill pan\b/gi, "oversized commercial catering flat-top steel tawa");
    }
  }

  // 2. If keyboard components are present
  if (specs.category === "MECHANICAL_KEYBOARD") {
    grounded = grounded
      .replace(/\bkeycaps?\b/gi, "slender 1u mechanical keycaps")
      .replace(/\bswitches?\b/gi, "miniature 15mm mechanical switches");
  }

  // 3. If watch components are present
  if (specs.category === "WATCH_HOROLOGY") {
    grounded = grounded
      .replace(/\bgears?\b/gi, "miniature 3mm brass watch gears")
      .replace(/\bsprings?\b/gi, "ultra-fine coiled balance hairsprings");
  }

  // 4. If bulk Nokia phone components are present
  if (specs.category === "BULK_NOKIA_PHONES") {
    grounded = grounded
      .replace(/\bthe circuit boards?\b/gi, "the stack of 15 compact green printed circuit boards (PCBs)")
      .replace(/\bthe keypads?\b/gi, "15 flexible translucent rubber silicone keypad membranes")
      .replace(/\bthe copper ribbon\b/gi, "slender flexible copper ribbon cables and antenna wires")
      .replace(/\bthe screws\b/gi, "miniature 3mm silver screws and SMD micro-resistors")
      .replace(/\bthe lcd screens?\b/gi, "15 compact monochrome greenish-grey LCD display glass panels");
  }

  return {
    groundedText: grounded,
    negativeTokens: specs.negativeTokens,
    vesselRecommendation: specs.defaultVessel,
    isLargeObject: specs.isLargeObject,
    extractionTools: specs.extractionTools,
  };
}

export const UNIVERSAL_PHYSICAL_LAWS = {
  // Law 1: Mechanical & Draft Kinematics
  MECHANICAL_PROPULSION:
    "Vehicular & Animal Harness Physics: For any cart, wagon, carriage, or apparatus, draft animals (bullocks, oxen, horses) must be hitched strictly and exclusively to the FRONT wooden yoke pole facing forward in the direction of travel. Strictly prohibit draft animals tied to the rear or back of the vehicle; strictly prohibit animals appearing on both front and back ends of the same vehicle; strictly prohibit two-headed or bidirectional carts, floating animals, detached wheels, or duplicate harnesses.",

  // Law 2: Skeletal & Anatomical Alignment
  SKELETAL_ALIGNMENT:
    "Anatomical Integrity & Locomotion Alignment: Strict forward physiological alignment of chest, torso, neck, and face in the direction of movement. Explicitly prohibit backward-twisted neck, 180-degree head rotation, contorted spine, unnatural body collapse, or mismatched locomotion direction. When a character speaks while moving, the camera must track backward smoothly ahead of them, facing their front torso and facial expression.",

  // Law 3: Spatial Depth Layering & Entity Separation
  SPATIAL_DEPTH_SEPARATION:
    "Spatial Depth Staging & Entity Clearance: Clear three-plane depth separation (Foreground hero action, Midground grounded props/vehicles, Background environmental perspective). Midground vehicles, carts, and stalls must remain firmly anchored to the ground with physical clearance from moving heroes; midground objects must never merge, fuse, or become attached to hero characters.",

  // Law 4: Handheld Prop Grip & Mass Conservation
  PROP_MANIPULATION:
    "Prop Grip & Rigid Mass Conservation: Handheld items (lanterns, tools, weapons, vessels, scrolls) must be firmly gripped by a single designated hand with fingers wrapped around the handle. Strictly prohibit floating props, duplicated objects, morphing materials, or items spontaneously shifting between hands.",

  // Law 5: Culinary Kinematics & ASMR Food Physics
  CULINARY_ASMR_PHYSICS:
    "Culinary Kinematics & Food Invariants: Hand Anatomical Rigidity: Strictly maximum two hands visible in frame at any moment (one designated hand gripping knife handle with fingers wrapped firmly around the grip, one hand in curled protective claw-grip holding the ingredient). Strictly PROHIBIT phantom third hands, extra floating arms entering from edges, or hands protruding from unnatural angles. Knife & Tool Anchor: Knife blade must be rigidly continuous with its handle; fingers wrapped securely around handle. Strictly PROHIBIT floating knives, knives cutting without a gripping hand, or detached blades. Rigid Workstation Stability: Cutting board must rest flat and immovable on the countertop. Cookware (skillet, pot, pan) must remain firmly seated on the induction burner or stovetop flame; strictly PROHIBIT cookware tilting or floating into mid-air without being held. Mass Conservation & Clean Slicing: When a knife slices an ingredient, the ingredient divides cleanly into geometrically sound slices that remain on the cutting board. Strictly PROHIBIT food morphing into different ingredients, vegetables liquifying before contact, or spontaneous material transformations. Fluid & Heat Dynamics: Hot oil must sizzle with realistic micro-droplets confined to pan; steam and smoke must rise naturally upward; boiling liquids must stay contained within cookware.",

  // Law 6: Inedible Object Cooking & Material Invariants (Universal for ANY physical object)
  INEDIBLE_OBJECT_PHYSICS:
    "Inedible Object Cooking & Material Invariants: Handled non-food items (technical hardware, luxury accessories, apparel, tools, stones, glass, mechanical parts, instruments, or raw materials) maintain rigid physical geometry as real authentic physical objects. Distinct components must preserve their true physical characteristics, material textures (brushed metal, polished glass, grain leather, vulcanized rubber, carved wood, mineral stone), and authentic labels. Strictly PROHIBIT dissolving into generic cubes, plain plastic blocks, dice, tofu cubes, or morphing into grocery food/meat/dough. Plated dishes and stir-fries must be composed 80% of the authentic hero object components glistening under translucent culinary glaze or sauce. Macro camera distance is mandatory during small component manipulation to preserve fine physical details.",

  // Law 7: Viral Rapid ASMR & Bayashi Pacing Invariants (Shorts / Reels <= 30s)
  VIRAL_RAPID_ASMR_PACING:
    "Viral Rapid ASMR Pacing & Framing Invariants: 90% Screen Ingredient Fill: The camera must remain tightly locked onto the culinary workstation, cutting board, skillet, or plate in extreme macro close-up or top-down 90-degree flat lay; strictly PROHIBIT distant scenic establishing shots or slow walking shots. 2X Kinetic Tempo: Actions are executed at 2X fast tempo, packing 3 to 4 rapid sequential micro-actions per 4-second clip with rapid staccato cuts. Strict Chronological Flow: Actions must progress strictly in physical linear sequence (Sourcing/Disassembly -> Coating/Batter -> High-Heat Cook/Fry -> Seared Pocket & Diagonal Knife Cut -> Cross-Section Crunch Pull & Chef Thumbs-Up); strictly PROHIBIT showing the cut/finished dish before preparation. Pure Binaural Acoustics: Strictly zero spoken dialogue and zero voiceover; all audio must be close-mic tactile Foley (razor knife chops, crisp breadcrumb crunches, violent sizzle hiss, plastic clicks). Climax Resolution: The sequence concludes with a hero cross-section crunch pull & confident chef nod / thumbs-up to camera. Strictly NO on-screen text or burned-in subtitles.",

  // Law 8: Progressive Culinary Fusion & Merged Form Invariant (Universal for ALL Culinary Episodes)
  PROGRESSIVE_CULINARY_FUSION:
    "Progressive Culinary Fusion & Merged Form: Cooking is the transformative process of combining distinct harvested ingredients into ONE unified, cooked creation. In cooking stages (sauté, wok toss, deep fry, boil, simmer, tawa, kadai), all harvested components must interact and blend together: liquid glazes, sauces, tadkas, and reductions MUST pour over and coat the solid components; powders and spices MUST toss and infuse into the mixture with rising steam. In plating and presentation stages (plate, thali, bowl, platter), the plated dish MUST be the completely merged, glistening, cooked final fusion of all ingredients, strictly NOT separate raw untouched piles sitting side by side. Plating shots strictly focus on the plated vessel and PROHIBIT background cutting boards, background knife chopping, or contradictory secondary dishes.",

  // Law 9: High-Speed Robotic Motion Control Camera Kinematics (Bolt Cinema Rig / Motorized Linear Rail Slider)
  ROBOTIC_LINEAR_CAMERA_KINEMATICS:
    "Robotic Motion Control Camera Kinematics: Camera movement must be executed with high-speed precision robotic motion control (Bolt cinema arm / motorized linear rail slider). Every camera move must be strictly linear, constant-velocity, and mechanically stabilized: perfectly linear push-in, motorized horizontal tracking slide, or precision mechanical pedestal tilt. Strictly PROHIBIT organic handheld camera float, handheld breathing sway, casual handheld camera shake, amateur camera bump, or traditional slow shaky handheld cooking video style. The frame must feel like a multi-million-dollar high-speed commercial / craft cinema studio with probe lens mechanics locked on motorized tracks.",

  // Law 10: Zero-Second Acoustic Slam & Instant Visual Dominance (The 0.0s Retention Invariant)
  ZERO_SECOND_ACOUSTIC_SLAM:
    "Zero-Second Acoustic Slam & Instant Visual Dominance: The very first frame (0:00 - 0:02) must start with an immediate high-energy acoustic impact (SLAM, CRASH, CLANG, SPARK BURST) and 80% screen prop fill. Audio MUST be mixed at HIGH VOLUME and recorded close-mic at maximum gain (peaking between -1.0dB and -0.5dB with zero silence, zero muffled sound, zero quiet lull). Transients must be 10dB–15dB louder than conversational audio to punch through phone speakers and earbuds instantly. Strictly PROHIBIT silence, fade-in, slow camera pans across empty countertops, walking intros, or casual establishing shots. The acoustic and visual shock must occur at second 0.0 to prevent viewer thumb scroll-away in the critical first 1.5 seconds.",

  // Law 11: Hero Prop Viral Affinity & Nostalgia Invariant (Manufactured Tech vs. Raw Nature)
  HERO_PROP_NOSTALGIA_AFFINITY:
    "Hero Prop Viral Affinity & Nostalgia Invariant: For inedible cooking virality, hero objects are ranked by audience emotional recognition. Manufactured consumer hardware, retro technology, and iconic everyday gadgets (Nokia phones, mechanical keyboards, Game Boys, cameras, light bulbs, bicycles, luxury watches) carry instant 0.1-second global recognition, driving >75% 'Stayed to Watch' retention. Natural raw minerals, unworked stone, or plain consumables lack immediate emotional connection and require 2X more aggressive acoustic impact and mechanical processing to prevent >35% swipe-away.",

  // Law 12: Seamless Loop Engineering & Infinite APVD (The 120% Retention Multiplier)
  SEAMLESS_LOOP_ENGINEERING:
    "Seamless Loop Engineering & Infinite APVD: The final shot (presentation/lift/thumbs-up) must be kinetically aligned with the opening frame (e.g. chef slides plate forward or raises prop into the exact entry angle of Scene 1). This creates a seamless, frictionless visual loop that restarts instantly before the viewer realizes the Short ended, driving Average Percentage Viewed (APVD) above 100%–120% and triggering YouTube Shorts Wave 2 & Wave 3 viral surges.",

  getInedibleObjectPhysics: (heroObjectName?: string | null): string => {
    const target = heroObjectName || "the inedible physical hero object";
    return `Inedible Object Cooking & Material Invariants: Handled non-food items (${target}) maintain rigid physical material geometry as real authentic physical objects (metal, glass, leather, rubber, wood, stone, plastic, or mechanical elements). Distinct components must retain their authentic physical characteristics, surface textures, labels, and contours; strictly PROHIBIT dissolving into generic cubes, plain plastic blocks, dice, tofu cubes, or morphing into grocery food/meat/dough. Progressive Culinary Fusion: Multiple harvested components must progressively merge during cooking—searing together, coated with liquid glazes, infused with spice powders, and plated as ONE cohesive, glistening, steaming creation rather than isolated untouched piles. Plated dishes and stir-fries must be composed 80% of the authentic components of ${target} glistening under translucent culinary glaze. Strictly PROHIBIT real grocery food, pork bacon, fresh tomatoes, diced onions, cheese slices, or fast food; all culinary elements must use authentic inedible hardware counterparts. Macro camera distance is mandatory during small component manipulation to preserve fine physical details. Strictly PROHIBIT tasting, chewing, biting, eating, or putting in mouth; the completed creation is conceptual artwork and entertainment presentation only. Strictly INEDIBLE. Strictly NO on-screen text, NO subtitles, NO captions, and NO burned-in watermarks. Zero-Second Hook: Frame 1 must start with an immediate physical acoustic slam (*THUD/CRASH*) and 80% prop screen fill with zero silence. Seamless Loop: Ending presentation must kinetically align with the opening frame to foster seamless loop replays.`;
  },

  // Dynamic Rendering Integrity Generator based on User Visual Style & Era
  getRenderingIntegrity: (visualStyle?: string | null, sourceIdea?: string | null, isPeriod = false, heroObjectName?: string | null): string => {
    const styleUpper = (visualStyle || "").toUpperCase();
    const ideaLower = (sourceIdea || "").toLowerCase();

    const isCookingAction =
      styleUpper === "CULINARY_MACRO_ASMR" ||
      ideaLower.includes("cooking") ||
      ideaLower.includes("cook") ||
      ideaLower.includes("asmr") ||
      ideaLower.includes("culinary") ||
      ideaLower.includes("recipe") ||
      ideaLower.includes("kitchen") ||
      ideaLower.includes("stir-fry") ||
      ideaLower.includes("fry") ||
      ideaLower.includes("fried") ||
      ideaLower.includes("soup") ||
      ideaLower.includes("stew") ||
      ideaLower.includes("saute") ||
      ideaLower.includes("sizzle");

    // Dynamic non-food object detection: detect when ANY non-food object, tech, tool, mineral, or luxury item is being cooked
    const hasNonFoodObject =
      Boolean(heroObjectName) ||
      ideaLower.includes("inedible") ||
      ideaLower.includes("non-food") ||
      ideaLower.includes("odd object") ||
      ideaLower.includes("unimaginable") ||
      /\b(keyboard|keycap|airpod|airbud|earphone|headphone|phone|smartphone|circuit board|motherboard|pcb|resistor|hardware|e-waste|scrap|gadget|watch|clock|shoe|sneaker|boot|nike|leather|rubber|engine|spark plug|gear|bearing|battery|screw|bolt|nail|wire|cable|stone|granite|rock|pebble|glass|marble|crystal|gem|diamond|wood|chess|violin|guitar|camera|lens|bulb|coin|card|metal|plastic|carbon fiber)\b/i.test(ideaLower);

    const isInedible = isCookingAction && hasNonFoodObject;

    if (isInedible) {
      const targetLabel = heroObjectName ? `authentic ${heroObjectName} textures` : "authentic physical object textures (brushed metal, polished glass, textured leather, rubber, mineral stone, mechanical elements)";
      return `Aesthetic Realism: Ultra-high-definition macro craft-culinary cinema, 50mm and 85mm probe macro optics, razor-sharp focus on ${targetLabel} and glistening translucent culinary glaze, f/1.8 creamy bokeh background, 60fps high-speed fluid and spark physics. Progressive Culinary Fusion: All harvested components progressively merge during cooking into one unified glistening creation. Strictly NO generic cubes, NO plain plastic blocks, NO dice, NO tofu, NO wheat noodles, NO pasta, NO real grocery food, NO meat, NO pork bacon, NO tomatoes, NO onions, NO cheese slices, NO fast food, NO separate unmerged raw piles, NO on-screen text, NO subtitles, NO watermarks, NO CGI, NO 3D render, NO cartoon.`;
    }

    const isCulinary =
      styleUpper === "CULINARY_MACRO_ASMR" ||
      ideaLower.includes("cooking") ||
      ideaLower.includes("cook") ||
      ideaLower.includes("asmr") ||
      ideaLower.includes("culinary") ||
      ideaLower.includes("recipe") ||
      ideaLower.includes("kitchen");

    if (isCulinary) {
      return "Aesthetic & Culinary Realism: Ultra-high-definition macro culinary cinema, 50mm and 85mm probe macro lens optics, razor-sharp focus on ingredient textures and knife edge, f/1.8 creamy bokeh background, glistening natural oil sheens, 60fps high-speed fluid and rising steam physics, vibrant true-to-life food colors. Strictly NO phantom hands, NO extra limbs, NO floating knives, NO morphing food, NO plastic or artificial-looking ingredients, NO CGI, NO 3D animation, NO cartoon, NO anime.";
    }

    const isVintage = styleUpper === "VINTAGE_FILM" || isPeriod || ideaLower.includes("1900") || ideaLower.includes("vintage") || ideaLower.includes("old years") || ideaLower.includes("period");

    if (isVintage) {
      return "Aesthetic & Period Realism: Authentic vintage 35mm archival film aesthetic, natural cellulose film grain, soft warm sepia and muted earth-tone palette, period-accurate historical atmosphere, gentle optical bloom and organic 24fps motion blur. Strictly NO modern 4K digital crispness, NO synthetic bright modern dyes, NO modern machine-stitched collared shirts, NO modern trousers or sneakers, NO modern concrete buildings or asphalt roads, NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic skin.";
    }

    const isGhibli =
      styleUpper === "GHIBLI_ANIME" ||
      styleUpper === "GHIBLI" ||
      ideaLower.includes("ghibli") ||
      ideaLower.includes("zibly");

    if (isGhibli) {
      return "Aesthetic & Animation Realism: Enchanting Studio Ghibli hand-painted feature animation aesthetic, lush watercolor landscapes, vibrant rolling green hills, fluffy clouds in azure skies, warm whimsical character design with expressive eyes and fluid hand-drawn motion, nostalgic and uplifting atmosphere, rich pastoral details. Strictly NO live-action film, NO photorealistic live humans, NO sterile CGI, NO uncanny 3D plastics.";
    }

    const isCartoon = styleUpper === "CARTOON_2D" || styleUpper === "CARTOON";
    if (isCartoon) {
      return "Aesthetic Realism: Classic whimsical 2D storybook cartoon animation, crisp expressive outlines, playful bouncy character animation, charming colorful scenery, joyful children's picture-book illustration style. Strictly NO photorealism, NO live-action.";
    }

    const is3DAnim = styleUpper === "ANIMATION_3D" || styleUpper === "KIDS_3D_ANIMATION" || styleUpper === "3D_ANIMATION";
    if (is3DAnim) {
      return "Aesthetic Realism: Vibrant Pixar/Disney-quality 3D kids animation, soft warm global illumination, expressive stylized character models, bouncy playful physics, vibrant saturated color palette, clean child-friendly aesthetics. Strictly NO dark horror, NO uncanny valley, NO photorealistic live-action.";
    }

    if (styleUpper === "ANIME") {
      return "Aesthetic Realism: High-end Japanese anime cinematic feature style, hand-drawn keyframe animation feel, expressive dynamic lighting, painterly background art, 24fps cinema pace. Strictly NO CGI 3D uncanny plastic, NO live-action film artifacts.";
    }

    if (styleUpper === "BLACK_AND_WHITE" || styleUpper === "FILM_NOIR") {
      return "Aesthetic Realism: Classic high-contrast black-and-white 35mm film photography, rich silver-halide tonal gradation, deep dramatic shadows, soft highlights, vintage optical grain at 24fps.";
    }

    if (styleUpper === "DOCUMENTARY") {
      return "Aesthetic Realism: Grounded documentary cinema realism, natural ambient lighting, true-to-life color grading, authentic human skin pores, natural textile cloth physics, 24fps motion blur. Strictly NO CGI, NO 3D animation, NO plastic skin.";
    }

    if (styleUpper === "STOP_MOTION" || styleUpper === "CLAYMATION") {
      return "Aesthetic Realism: Handcrafted tactile stop-motion animation, physical clay and miniature articulated puppet textures, subtle 12fps tactile frame cadence, miniature studio set lighting with shallow macro depth of field. Strictly NO smooth CGI, NO 3D digital gloss, NO live-action photorealism.";
    }

    if (styleUpper === "COMIC_BOOK" || styleUpper === "GRAPHIC_NOVEL") {
      return "Aesthetic Realism: Bold graphic novel and comic-book illustration aesthetic, rich halftone dot printing patterns, dramatic ink cross-hatching, high-contrast dynamic line work, vibrant superhero palette, expressive comic framing. Strictly NO photographic realism, NO bland lighting.";
    }

    if (styleUpper === "WATERCOLOR") {
      return "Aesthetic Realism: Expressive hand-painted watercolor illustration, soft pigment washes on textured cold-press cotton paper, luminous bleeding edges, gentle pastel and luminous color palette, fluid artistic movement. Strictly NO harsh digital lines, NO glossy 3D plastic, NO live-action film.";
    }

    if (styleUpper === "FANTASY_CONCEPT_ART" || styleUpper === "FANTASY") {
      return "Aesthetic Realism: Epic digital matte painting and fantasy concept art, sweeping atmospheric volumetric lighting, ethereal god-rays, grand cinematic scale, rich mystical detailing, legendary heroic atmosphere. Strictly NO mundane modern elements, NO digital compression artifacts.";
    }

    if (styleUpper === "LIVE_ACTION_AD" || styleUpper === "COMMERCIAL") {
      return "Aesthetic Realism: Premium high-end commercial advertising cinematography, vibrant pristine color grading, Arri Alexa 65mm sensor clarity, glamorous commercial studio lighting, razor-sharp product and talent focus. Strictly NO amateur home-video grain, NO washed-out lighting, NO deformed hands.";
    }

    return "Aesthetic Realism: Ultra-cinematic film masterpiece, authentic human skin pores, natural textile cloth physics, grounded physical weight, 24fps motion blur, realistic optical depth of field. Strictly NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic skin, NO distorted limbs.";
  },

  // Backwards compatibility constant
  RENDERING_INTEGRITY:
    "Aesthetic Realism: Ultra-photorealistic documentary cinema masterpiece, authentic human skin pores, natural textile cloth physics, grounded physical weight, 24fps motion blur, realistic optical depth of field. Strictly NO CGI, NO 3D animation, NO cartoon, NO anime, NO plastic skin, NO distorted limbs, NO modern artifacts in period films.",
} as const;

/**
 * Scans descriptive text and user source idea to identify physical entities, vehicles, locomotion, props, and historical era.
 */
export function detectPhysicalEntities(text: string, sourceIdea?: string | null): DetectedEntities {
  const combined = `${text} ${sourceIdea || ""}`.toLowerCase();

  const isDraftCart = /\b(cart|wagon|carriage|chariot|bullock|bullocks|oxen|ox|horse-drawn|yoke)\b/i.test(combined);
  const isMount = /\b(riding a horse|on horseback|mounted on|elephant back|riding an elephant)\b/i.test(combined);
  const isMechanical = /\b(car|truck|train|locomotive|bicycle|bycycle|cycle|bike|motorcycle|scooter|bus)\b/i.test(combined);
  const isWatercraft = /\b(boat|canoe|ship|vessel|ferry|raft|oar|rowing)\b/i.test(combined);

  const hasVehicleOrMount = isDraftCart || isMount || isMechanical || isWatercraft;
  let vehicleType: DetectedEntities["vehicleType"] = undefined;
  if (isDraftCart) vehicleType = "draft_cart";
  else if (isMount) vehicleType = "riding_mount";
  else if (isMechanical) vehicleType = "mechanical_vehicle";
  else if (isWatercraft) vehicleType = "watercraft";
  else if (hasVehicleOrMount) vehicleType = "other";

  const hasLocomotion = /\b(run|running|sprint|sprinting|walk|walking|flee|fleeing|chase|chasing|track|tracking|stride|striding|rush|rushing)\b/i.test(combined);
  const hasSpokenDialogue = /\b(speaks:|speak:|dialogue|shout|shouts|cries|yells|says|said)\b/i.test(combined) || combined.includes('"');
  const hasHandheldProp = /\b(holding|holds|carries|carrying|gripping|torch|lantern|lamp|sword|knife|stick|staff|map|book|scroll|coin|vessel|pitcher|pot|basket)\b/i.test(combined);

  const has1900s = /\b(1900|1900s|early 1900|early 20th century|1910|1920)\b/i.test(combined);
  const hasGeneralPeriod = /\b(vintage|old years|ancient|kingdom|dynasty|pre-independence|colonial|period piece|historical era)\b/i.test(combined);
  const hasPeriodSetting = has1900s || hasGeneralPeriod;
  const periodEra = has1900s ? "1900s" : hasGeneralPeriod ? "historical_vintage" : undefined;

  const hasCulinaryAction = /\b(chop|chopping|slice|slicing|dice|dicing|diced|grate|grating|graiding|peel|peeling|sear|searing|sizzle|sizzling|pan-fry|stir-fry|deep-fry|fry|fried|simmer|simmering|saut[eé]|whisk|whisking|knead|kneading|cutting board|chopping board|skillet|saucepan|stovetop burner|raw meat|ribeye|garlic clove|olive oil drizzle|tawa|kadai|wok|cleaver|marinade|marinating|batter|breadcrumbs?|panko)\b/i.test(combined);
  let culinaryFocus: string | undefined = undefined;
  if (hasCulinaryAction) {
    if (/\b(chop|slice|dice|knife|cutting board|grate|peel)\b/i.test(combined)) culinaryFocus = "knife_prep";
    else if (/\b(sear|sizzle|fry|skillet|pan|flame|tawa|kadai|wok)\b/i.test(combined)) culinaryFocus = "pan_sizzle";
    else if (/\b(simmer|boil|sauce|pot)\b/i.test(combined)) culinaryFocus = "simmer_reduction";
    else if (/\b(plate|plating|garnish|serve)\b/i.test(combined)) culinaryFocus = "plating_presentation";
    else culinaryFocus = "general_cooking";
  }

  // Universal Inedible / Non-Food Object Discovery:
  const isCookingContext =
    hasCulinaryAction ||
    /\b(chef|chefs|cooks?|cooked|cooking|stir-fry|stir-fried|pan-fry|fry|fries|fried|frying|deep-fry|sizzle|sizzles|sizzling|sear|sears|searing|recipe|recipes|soup|soups|stew|stews|saute|masala|curry|roast|roasts|roasting|bake|bakes|baking|braise|braising|butcher block|cutting board|chopping board|board|wok|woks|skillet|skillets|pan|pans|kitchen|marinade|marinate|marinating|plating|garnish|garnishes|tweezers?|cleaver|cleavers|tawa|kadai)\b/i.test(combined);

  const hasExplicitNonFood =
    /\b(inedible|non-food|hardware|scrap|e-waste|tech|gadget|odd object|unimaginable|mechanical)\b/i.test(combined) ||
    /\b(bicycles?|bycycles?|cycles?|bikes?|motorcycles?|scooters?|skateboards?|chains?|tires?|tyres?|tiers?|sponge|sponch|wheels?|pedals?|spokes?|saddles?|seats?|handlebars?)\b/i.test(combined) ||
    /\b(walkman|cassette(?:s)?|cassette player|tape player|game\s*boy|gameboy|nintendo|cartridges?|pokemon|keyboards?|keycaps?|cherry mx|switch(?:es)?|pcb|circuit boards?|motherboards?|resistors?|capacitors?|airbuds?|airpods?|earphones?|headphones?|smartphones?|mobile phones?|cellphones?|nokia|3310|1100|batter(?:y|ies)|screws?|bolts?|copper wire|wires?|cables?|stones?|granite|rocks?|pebbles?|glass|marbles?|crystals?|gems?|diamonds?|watch(?:es)?|clock|gears?|bearings?|spark plugs?|engines?|motors?|sneakers?|shoes?|boots?|rubber|leather|chess|violins?|guitars?|cameras?|lens(?:es)?|light bulbs?|coins?|cards?|billiards?|drones?|tools?|cricket(?:\s+bat|\s+ball)?|baseball bat|tennis racket)\b/i.test(combined);

  const isInedibleCooking = isCookingContext && hasExplicitNonFood;

  let inedibleHeroObject: string | undefined = undefined;
  if (isInedibleCooking) {
    // 1. First priority: Check OBJECT_COMPONENT_REGISTRY for precise match
    for (const entry of OBJECT_COMPONENT_REGISTRY) {
      if (entry.category !== "GENERAL_PHYSICAL_OBJECT" && entry.detectRegex.test(combined)) {
        inedibleHeroObject = entry.canonicalHeroName;
        break;
      }
    }

    // 2. Second priority: Dynamic extraction for custom objects from phrases like "cooks a [object]" or "stir-fry [object]"
    if (!inedibleHeroObject) {
      const verbObjMatch = combined.match(/\b(?:cook(?:s|ing)?|fr(?:y|ies|ying)|stir-fr(?:y|ies|ying)|prepar(?:e|es|ing)|sizzl(?:e|es|ing)|roast(?:s|ing)?)\s+(?:a|an|the|some)?\s*([a-z0-9\s-]+?)(?:\s+(?:in|with|on|onto|into|for|inside|dish|masala|stir-fry|soup|fry|sauce)\b|$)/i);
      if (verbObjMatch && verbObjMatch[1]) {
        const candidate = verbObjMatch[1].trim().replace(/^(a|an|the|one|some)\s+/i, "").trim();
        const stopWords = new Set(["the", "a", "an", "one", "some", "this", "that", "it", "all", "its", "each", "these", "those"]);
        if (candidate.length > 2 && !stopWords.has(candidate.toLowerCase()) && !candidate.toLowerCase().includes("gourmet") && !candidate.toLowerCase().includes("hero object") && !candidate.toLowerCase().includes("inedible")) {
          inedibleHeroObject = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        }
      }
    }

    // 3. Fallback to specialized keyword detector
    if (!inedibleHeroObject) {
      if (/\b(bicycles?|bycycles?|cycles?|bikes?)\b/i.test(combined)) inedibleHeroObject = "Vintage Bicycle";
      else if (/\b(game\s*boy|gameboy|nintendo|cartridge|pokemon)\b/i.test(combined)) inedibleHeroObject = "Vintage Game Boy Color";
      else if (/\b(keyboard|keycaps?)\b/i.test(combined)) inedibleHeroObject = "Mechanical Keyboard";
      else if (/\b(walkman|cassette player)\b/i.test(combined)) inedibleHeroObject = "Vintage Sony Walkman";
      else if (/\b(nokia|3310|1100)\b/i.test(combined)) inedibleHeroObject = "Bulk Vintage Nokia Mobile Phones (15x Nokia 1100 / 3310)";
      else if (/\b(airbuds?|airpods?|earphones?)\b/i.test(combined)) inedibleHeroObject = "Wireless Earbuds";
      else if (/\b(smartphones?|mobile phone|phone)\b/i.test(combined)) inedibleHeroObject = "Smartphone";
      else if (/\b(sneakers?|shoes?|boots?)\b/i.test(combined)) inedibleHeroObject = "Sneaker";
      else if (/\b(watch|watches?|clock)\b/i.test(combined)) inedibleHeroObject = "Mechanical Watch";
      else if (/\b(stones?|granite|rocks?)\b/i.test(combined)) inedibleHeroObject = "Granite River Stones";
      else if (/\b(circuit board|pcb)\b/i.test(combined)) inedibleHeroObject = "Circuit Board";
      else if (/\b(dslr|vintage camera|35mm camera|camera body)\b/i.test(combined)) inedibleHeroObject = "Camera";
      else if (/\b(cricket)\b/i.test(combined)) inedibleHeroObject = "Vintage English Willow Cricket Bat & Leather Cricket Ball";
      else if (/\b(violin|guitar)\b/i.test(combined)) inedibleHeroObject = "Musical Instrument";
      else if (/\b(glass|marbles?|crystals?)\b/i.test(combined)) inedibleHeroObject = "Crystal Glass";
      else inedibleHeroObject = "Artisan Mechanical Hardware";
    }
  }

  return {
    hasVehicleOrMount,
    vehicleType,
    hasLocomotion,
    hasSpokenDialogue,
    hasHandheldProp,
    hasPeriodSetting,
    periodEra,
    hasCulinaryAction,
    culinaryFocus,
    isInedibleCooking,
    inedibleHeroObject,
  };
}

/**
 * Formats a clean 3-plane spatial staging block.
 */
export function formatThreePlaneStaging(params: {
  foreground: string;
  midground?: string;
  background?: string;
}): string {
  const lines: string[] = [];
  lines.push(`- Foreground Action: ${params.foreground.trim()}`);
  if (params.midground && params.midground.trim().length > 0) {
    lines.push(`- Midground Staging (firmly grounded, separated from foreground): ${params.midground.trim()}`);
  }
  if (params.background && params.background.trim().length > 0) {
    lines.push(`- Background Depth & Architecture: ${params.background.trim()}`);
  }
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentic Culinary Dish Recipe Registry & Mandatory Comparison Table (ADR-037, ADR-038)
// ─────────────────────────────────────────────────────────────────────────────

export interface CulinaryStepMapping {
  stepNumber: number;
  stageName: string;
  realCulinaryAction: string;
  inedibleObjectEquivalent: string;
  foleySound: string;
  toolsUsed: string[];
  forbiddenTools: string[];
}

export interface CulinaryDishBlueprint {
  dishKey: string;
  displayName: string;
  cuisine: string;
  cookingMethod: string;
  comparisonTable: CulinaryStepMapping[];
}

export const AUTHENTIC_DISH_REGISTRY: Record<string, CulinaryDishBlueprint> = {
  SAMOSA: {
    dishKey: "SAMOSA",
    displayName: "Indian Street Halwai Samosa",
    cuisine: "Indian Street Food",
    cookingMethod: "Deep-Fried Pastry",
    comparisonTable: [
      {
        stepNumber: 1,
        stageName: "SOURCING_AND_HOOK",
        realCulinaryAction: "Wholesale sacks of maida flour, whole potatoes, peas, spices",
        inedibleObjectEquivalent: "Massive cluster of vintage Edison bulbs, tangled festival serial lights, raw dough slab",
        foleySound: "Heavy brass hammer strike on bulb socket (CLANG-CRACK), glass rattle, dough thud",
        toolsUsed: ["solid brass ball-peen hammer", "dark steel workbench", "heavy rolling pin"],
        forbiddenTools: ["frying ladle", "skimmer spoon", "cooking stove", "boiling oil", "kadai"],
      },
      {
        stepNumber: 2,
        stageName: "DOUGH_KNEAD_AND_REST",
        realCulinaryAction: "Maida flour, ajwain carom seeds, and oil kneaded into stiff dough on marble slab, rested under bowl",
        inedibleObjectEquivalent: "Translucent amber mica-glass dough kneaded on Carrara marble slab, rested under inverted brass bowl",
        foleySound: "Heavy marble slab slap (THWACK), rhythmic palm kneading, brass bowl clang",
        toolsUsed: ["marble pastry slab", "inverted brass bowl"],
        forbiddenTools: ["frying ladle", "cutting knife", "open flame", "cooking pan"],
      },
      {
        stepNumber: 3,
        stageName: "DRY_FILLING_PREP",
        realCulinaryAction: "Boiled potatoes crushed, green peas, spices mixed into dry spiced filling (STRICTLY NO LIQUID/OIL POURING)",
        inedibleObjectEquivalent: "Wire shears snip serial lights like peas; brass pestle crushes amber glass & tungsten coils into dry spiced bulb masala",
        foleySound: "Sharp wire shears snip (SNIP-SNIP), heavy brass pestle crunch (CRUNCH-GRIND), screw rattle",
        toolsUsed: ["forged wire shears", "solid brass pestle", "hammered brass mixing bowl"],
        forbiddenTools: ["frying ladle", "oil pouring", "cooking stove", "skimmer spoon", "kadai"],
      },
      {
        stepNumber: 4,
        stageName: "PASTRY_ROLL_AND_CUT",
        realCulinaryAction: "Dough rolled flat with rolling pin into oval sheet; sliced in half with blade into two semicircles",
        inedibleObjectEquivalent: "Ultra-heavy steel rolling pin rolls paper-thin amber sheet; brass pastry wheel cuts 2 semicircles",
        foleySound: "Tactile rolling pin stroke, smooth pastry wheel slice (SHHH-ZIP)",
        toolsUsed: ["heavy steel rolling pin", "brass pastry cutting wheel", "marble pastry slab"],
        forbiddenTools: ["meat cleaver", "frying pan", "stove", "ladle"],
      },
      {
        stepNumber: 5,
        stageName: "CONE_SHAPING_AND_PLEAT",
        realCulinaryAction: "Semicircle folded into cone, stuffed tightly with aloo filling, back pleat pinched, base crimped shut",
        inedibleObjectEquivalent: "Black-gloved hands fold cone, spoon bulb masala inside, pinch halwai back pleat, crimp base to stand upright",
        foleySound: "Tactile paper-thin pastry fold, spoon scrape, rapid thumb crimp clicks (TAK-TAK)",
        toolsUsed: ["curved brass spoon", "pastry cone"],
        forbiddenTools: ["meat cleaver", "frying ladle", "cooking flame", "kadai"],
      },
      {
        stepNumber: 6,
        stageName: "HALWAI_KADAI_DEEP_FRY",
        realCulinaryAction: "Stuffed raw samosas lowered on spider skimmer into bubbling oil in massive street kadai; fried slow until golden",
        inedibleObjectEquivalent: "Samosas on brass jhara plunged into 300°C bubbling golden oil in 3-foot iron kadai; filaments glow through crust",
        foleySound: "Violent foaming roar of bubbling oil, tong clatter, crackling golden blister effervescence",
        toolsUsed: ["massive 3-foot cast-iron street halwai kadai", "brass jhara spider skimmer", "forged steel tongs"],
        forbiddenTools: ["small domestic frying pan", "cutting board", "rolling pin"],
      },
      {
        stepNumber: 7,
        stageName: "OIL_DRAIN_AND_PLATING",
        realCulinaryAction: "Lifted with perforated skimmer, hot oil drains, plated on banana-leaf brass thali with mint & tamarind chutneys",
        inedibleObjectEquivalent: "Sizzling golden oil streams through jhara holes in roaring cascade; slides onto royal brass thali with side chutneys",
        foleySound: "Roaring oil cascade through skimmer holes, thali slide (SHHH-SLIDE), metallic katori clink",
        toolsUsed: ["perforated brass jhara", "embossed Indian brass thali", "banana leaf", "brass katoris"],
        forbiddenTools: ["cutting board", "rolling pin", "meat cleaver"],
      },
      {
        stepNumber: 8,
        stageName: "HERO_ASMR_CRUNCH_REVEAL",
        realCulinaryAction: "Crack open hot samosa with fingers: crispy blistered crust shatters, hot aromatic filling steams out",
        inedibleObjectEquivalent: "Raw vintage bulbs in foreground proof; gloved hands crack open crispy samosa: CRUNCH! Steam & glowing coils burst out",
        foleySound: "Ear-splitting acoustic crust shatter (CRUNCH!), soft billowing steam exhalation, subtle nod",
        toolsUsed: ["heat-shielded gloves", "raw vintage bulb proof in foreground", "brass thali"],
        forbiddenTools: ["knife cutting", "fork eating", "subtitles"],
      },
    ],
  },

  IDLI_SAMBAR: {
    dishKey: "IDLI_SAMBAR",
    displayName: "South Indian Steamed Idli & Sambar Feast",
    cuisine: "South Indian Street Food",
    cookingMethod: "Steam-Cooked Rice Cakes",
    comparisonTable: [
      {
        stepNumber: 1,
        stageName: "SOURCING_AND_HOOK",
        realCulinaryAction: "Parboiled rice & urad dal white grains sourced in bulk",
        inedibleObjectEquivalent: "High-purity white ceramic electrical insulators and raw quartz mineral crystals",
        foleySound: "Heavy ceramic insulator clatter on granite slab, quartz fracture crack (CRACK)",
        toolsUsed: ["heavy brass mallet", "granite grinding slab"],
        forbiddenTools: ["deep frying kadai", "rolling pin", "meat cleaver"],
      },
      {
        stepNumber: 2,
        stageName: "BATTER_GRIND",
        realCulinaryAction: "Granite stone wet grinder grinding soaked grains into smooth, aerated, fermented white batter",
        inedibleObjectEquivalent: "Motorized heavy stone wet grinder spinning, pulverizing quartz crystals into frothy ivory-white mineral batter",
        foleySound: "Heavy stone grinder rhythmic rumble (CHUG-CHUG-WHIRRR), wet batter slap and aeration",
        toolsUsed: ["traditional granite stone wet grinder", "brass batter ladle"],
        forbiddenTools: ["frying pan", "rolling pin", "knife"],
      },
      {
        stepNumber: 3,
        stageName: "STEAMER_POUR",
        realCulinaryAction: "Polished brass ladle greasing tiered stainless steel Idli plates with gingelly oil and pouring batter",
        inedibleObjectEquivalent: "Brass ladle fills curved circular moulds of a multi-tiered stainless steel idli steamer with frothy white batter",
        foleySound: "Wet batter dollop plop, metallic tier plate clink, sliding steamer stack",
        toolsUsed: ["tiered stainless steel idli steamer rack", "curved brass ladle"],
        forbiddenTools: ["frying tawa", "deep fryer", "chopping board"],
      },
      {
        stepNumber: 4,
        stageName: "PRESSURE_STEAM",
        realCulinaryAction: "Steamer pot locked airtight over high heat, intense high-pressure steam hissing from top whistle",
        inedibleObjectEquivalent: "Heavy brass steamer vessel locked over roaring blue gas flame, whistling plumes of pure white culinary steam",
        foleySound: "High-pressure steam whistle hiss (TCHSSSSSS), bubbling water rumble inside pot",
        toolsUsed: ["heavy commercial brass idli steamer pot", "high-output gas burner"],
        forbiddenTools: ["frying ladle", "rolling pin", "cleaver"],
      },
      {
        stepNumber: 5,
        stageName: "DEMOULDING",
        realCulinaryAction: "Curved wet brass spoon sliding under steamed idlis, popping out flawless pillowy white steamed cakes",
        inedibleObjectEquivalent: "Wet brass spoon smoothly scoops underneath, popping out pristine, ultra-fluffy, steaming white idli cakes",
        foleySound: "Delicate spoon glide, soft pillowy suction pop (SHLUCK-POP)",
        toolsUsed: ["curved wet brass idli spoon", "fresh green banana leaf"],
        forbiddenTools: ["knife", "frying pan", "rolling pin"],
      },
      {
        stepNumber: 6,
        stageName: "SAMBAR_TEMPER",
        realCulinaryAction: "Rich tamarind-lentil sambar simmering in brass handi with mustard seeds & curry leaves tadka",
        inedibleObjectEquivalent: "Simmering amber mineral reduction with popping micro brass screws and copper wire curry leaf splutter",
        foleySound: "Simmering handi bubble (GLOOP-GLOOP), violent tadka sizzle (TCHRRRR)",
        toolsUsed: ["traditional brass handi pot", "brass tadka ladle"],
        forbiddenTools: ["idli steamer plates", "rolling pin"],
      },
      {
        stepNumber: 7,
        stageName: "THALI_PLATING",
        realCulinaryAction: "Four steaming hot idlis arranged on emerald banana leaf with central bowl of piping-hot sambar and chutneys",
        inedibleObjectEquivalent: "Steaming white idli cakes plated on fresh banana leaf with glowing coconut-cyan and chili-ruby chutneys",
        foleySound: "Hot sambar pour into brass katori, gentle plate contact",
        toolsUsed: ["embossed brass thali", "fresh banana leaf", "brass katoris"],
        forbiddenTools: ["frying kadai", "cleaver"],
      },
      {
        stepNumber: 8,
        stageName: "TEXTURE_SQUISH",
        realCulinaryAction: "Two fingers gently press the pillowy steamed idli—ultra-soft bounce back—then dunk deep into steaming sambar",
        inedibleObjectEquivalent: "Raw ceramic insulators in foreground proof; black-gloved fingers press fluffy idli (soft bounce) and dunk in sambar",
        foleySound: "Soft sponge squish, rich viscous sambar dunk splash, chef thumbs-up",
        toolsUsed: ["black-gloved hands", "raw ceramic insulators in foreground"],
        forbiddenTools: ["knife cutting", "fork"],
      },
    ],
  },

  DOSA: {
    dishKey: "DOSA",
    displayName: "Crispy Golden South Indian Street Dosa",
    cuisine: "South Indian Street Food",
    cookingMethod: "Flat-Iron Tawa Griddle Roast",
    comparisonTable: [
      {
        stepNumber: 1,
        stageName: "SOURCING_AND_HOOK",
        realCulinaryAction: "Fermented rice-lentil batter and whole spices sourced",
        inedibleObjectEquivalent: "Silicon micro-wafers, copper ribbon noodles, and brass wire coils",
        foleySound: "Heavy iron tawa slam, copper spool snap (SNAP-TWANG)",
        toolsUsed: ["seasoned 3-foot circular cast-iron street tawa", "brass measuring bowl"],
        forbiddenTools: ["steamer pot", "rolling pin", "meat cleaver"],
      },
      {
        stepNumber: 2,
        stageName: "CIRCULAR_SWIRL",
        realCulinaryAction: "Polished flat-bottom brass ladle pours batter onto screaming hot cast-iron tawa, swirling into paper-thin concentric spiral",
        inedibleObjectEquivalent: "Ladle pours shimmering silver slurry, swirling outward in a flawless, hypnotic paper-thin concentric spiral",
        foleySound: "Loud sizzling contact (SSSSHHHH), rhythmic circular metal scraper swirl",
        toolsUsed: ["flat-bottom brass batter ladle", "scorching cast-iron tawa"],
        forbiddenTools: ["rolling pin", "deep fryer", "steamer"],
      },
      {
        stepNumber: 3,
        stageName: "GHEE_ROAST",
        realCulinaryAction: "Pure desi ghee drizzled around outer lace circumference, blistering golden-crisp perforations",
        inedibleObjectEquivalent: "Golden amber rosin glaze drizzled around outer rim; violent micro-bubbles blister paper-thin edges golden-brown",
        foleySound: "Intense sizzling crackle of foaming ghee (TZZZZZZZZ), billowing white culinary steam",
        toolsUsed: ["brass oil dropper ladle", "cast-iron tawa"],
        forbiddenTools: ["steamer", "rolling pin"],
      },
      {
        stepNumber: 4,
        stageName: "MASALA_SPREAD",
        realCulinaryAction: "Spicy yellow mashed potato filling smeared across inner surface",
        inedibleObjectEquivalent: "Glowing crushed bulb coils & emerald circuit masala spread down the center with broad spatula",
        foleySound: "Spatula pressing filling into golden crust (SHHH-SLAP)",
        toolsUsed: ["wide stainless steel street spatula"],
        forbiddenTools: ["wire shears", "rolling pin"],
      },
      {
        stepNumber: 5,
        stageName: "TACTICAL_ROLL",
        realCulinaryAction: "Thin steel dosa scraper slides under golden crust, folding into a long crispy cylindrical flute or triangle",
        inedibleObjectEquivalent: "Thin steel scraper zips under paper-thin lace edge, rolling it into a massive 2-foot crispy cylindrical roast",
        foleySound: "Razor-sharp metallic scrape on cast iron, ear-splitting crispy paper roll crackle",
        toolsUsed: ["thin stainless steel dosa scraper"],
        forbiddenTools: ["rolling pin", "steamer"],
      },
      {
        stepNumber: 6,
        stageName: "BANANA_LEAF_SERVE",
        realCulinaryAction: "Long 2-foot golden crispy roast served across whole banana leaf with sambar and coconut/tomato chutneys",
        inedibleObjectEquivalent: "Crispy 2-foot golden roast slides onto full-length emerald banana leaf with brass katoris of glowing dips",
        foleySound: "Crispy food sliding onto fresh banana leaf (SHHHH-SLIDE)",
        toolsUsed: ["full-length fresh banana leaf", "brass serving tray", "trio brass katoris"],
        forbiddenTools: ["deep fryer", "rolling pin"],
      },
      {
        stepNumber: 7,
        stageName: "SHATTER_CRUNCH",
        realCulinaryAction: "Fingers snap through the crispy golden paper roast—ear-splitting acoustic CRUNCH!",
        inedibleObjectEquivalent: "Raw silicon & copper spools in foreground proof; gloved fingers snap the golden cylindrical crust: SHATTER-CRUNCH!",
        foleySound: "Deafening acoustic lace crust shatter (KRRRSH-CRUNCH!), fragrant steam puff, chef nod",
        toolsUsed: ["black-gloved hands", "raw materials in foreground proof"],
        forbiddenTools: ["knife and fork", "eating"],
      },
    ],
  },
  IDIYAPPAM: {
    dishKey: "IDIYAPPAM",
    displayName: "South Indian Steamed Idiyappam / String Hopper Feast",
    cuisine: "South Indian & East Asian Steamed Noodle",
    cookingMethod: "Extruded & High-Pressure Steamed Noodle Nests",
    comparisonTable: [
      {
        stepNumber: 1,
        stageName: "QUARRY_HARVEST_AND_HOOK",
        realCulinaryAction: "Sourcing premium raw white rice grains from paddy sacks",
        inedibleObjectEquivalent: "Slamming 50lb raw quartz crystal boulder onto steel anvil block; 16lb sledgehammer shatters boulder with golden sparks; spinning brass flywheel noodles into high-pressure steamer pot; hero chopstick noodle lift with coconut drizzle",
        foleySound: "Earth-shaking boulder slam (THUD), explosive hammer strike (CLANG-CRACK), heavy gear hum (VRRRR), steam hiss (TCHSSSSSS), glaze drip (GLOOP)",
        toolsUsed: ["vibrating industrial steel chute", "16-pound forged steel sledgehammer", "steel anvil counter", "vintage vertical brass flywheel press", "polished brass chopsticks"],
        forbiddenTools: ["frying ladle", "oil pouring", "cooking pan", "skimmer", "kadai", "face zoom"],
      },
      {
        stepNumber: 2,
        stageName: "COLOSSAL_MILL_GRIND",
        realCulinaryAction: "Grinding soaked rice grains into fine, silky white rice flour",
        inedibleObjectEquivalent: "Colossal industrial edge-runner mill with twin 4-foot solid granite roller wheels pulverizes quartz chunks into sparkling crystalline silica mineral flour with glittering facet dust",
        foleySound: "Earth-shaking granite roller rumble (CHUG-CHUG-RUMBLE), intense stone crushing (CRUNCH-GRIND), mineral flour cascade",
        toolsUsed: ["colossal twin 4-foot granite edge-runner mill", "heavy iron bucket", "wide polished brass scoop shovel"],
        forbiddenTools: ["domestic mixer grinder", "frying pan", "cleaver", "oil pouring", "opaque bakery flour"],
      },
      {
        stepNumber: 3,
        stageName: "HOT_WATER_SCALD_AND_KNEAD",
        realCulinaryAction: "Scalding rice flour with boiling salt water, kneading into smooth, pliable warm dough",
        inedibleObjectEquivalent: "Forming volcanic crater in sparkling quartz flour on Carrara marble slab; pouring boiling mineral water from copper kettle; kneading into a semi-translucent crystalline mineral dough paste with visible quartz crystal flecks",
        foleySound: "Boiling water steam hiss (SSSSHHHH), rhythmic palm slap (THWACK-SQUISH), marble counter thud",
        toolsUsed: ["massive Carrara marble pastry slab", "heavy steaming copper kettle", "black grip gloves"],
        forbiddenTools: ["frying pan", "skimmer", "rolling pin", "meat cleaver", "opaque white bakery dough", "bread dough"],
      },
      {
        stepNumber: 4,
        stageName: "FLYWHEEL_EXTRUDER_LOAD",
        realCulinaryAction: "Loading warm dough cylinder into brass Idiyappam press (sevai nazhi) fitted with fine noodle disc",
        inedibleObjectEquivalent: "Loading sparkling semi-translucent crystalline mineral dough cylinder into the VERTICAL brass cylindrical chamber of the upright brass press with right-side spoke flywheel; locking bottom perforated bronze disc",
        foleySound: "Dough slide suction (SHLUCK), bronze disc lock twist (CLINK-LOCK), banana leaf rustle",
        toolsUsed: ["vintage upright vertical brass flywheel press", "micro-perforated bronze disc", "fresh emerald banana leaf"],
        forbiddenTools: ["horizontal lathe press", "horizontal extruder", "overhead screw jack", "frying pan", "kadai", "rolling pin", "meat cleaver"],
      },
      {
        stepNumber: 5,
        stageName: "HYPNOTIC_NOODLE_EXTRUSION",
        realCulinaryAction: "Pressing dough through micro-holes, swirling continuous noodle threads into concentric feathery nests on banana leaf",
        inedibleObjectEquivalent: "Rapidly spinning the right-side spoke flywheel of the same vertical brass press; hundreds of ultra-fine, continuous, TRANSLUCENT CRYSTALLINE SILICA-QUARTZ GLASS NOODLE THREADS cascade downward like optical fibers, coiling into a shimmering swirling nest",
        foleySound: "Heavy bronze gear hum (VRRRR-CLACK), crystalline noodle cascade, brass spatula cut click (SHHH-CLICK)",
        toolsUsed: ["vintage upright vertical brass flywheel press", "massive polished brass spoke flywheel", "perforated brass extrusion nozzle", "brass spatula"],
        forbiddenTools: ["horizontal machine", "opaque white grocery rice noodles", "boiled pasta", "yellow egg noodles", "small plastic hand squeezer", "frying pan", "oil pouring"],
      },
      {
        stepNumber: 6,
        stageName: "TIERED_HIGH_PRESSURE_STEAM",
        realCulinaryAction: "Tiered idiyappam plates placed in steamer pot; steamed with high pressure until feathery and tender",
        inedibleObjectEquivalent: "Three tiered perforated brass trays loaded with shimmering translucent silica noodle nests stacked in heavy brass steamer pot; domed lid clamped shut; high-pressure steam erupts from whistling vent, activating internal crystalline quartz luminescence",
        foleySound: "Brass lid clamp snap (CLACK-CLACK), piercing steam whistle hiss (TCHSSSSSS), bubbling water boil",
        toolsUsed: ["tiered perforated brass idiyappam trays", "heavy commercial brass steamer pot with clamp locks", "high-output gas burner"],
        forbiddenTools: ["deep frying kadai", "frying oil", "rolling pin", "meat cleaver"],
      },
      {
        stepNumber: 7,
        stageName: "ROYAL_THALI_PLATING",
        realCulinaryAction: "Steamed noodle nests slid onto banana leaf, served with sweet coconut milk and spiced vegetable kurma",
        inedibleObjectEquivalent: "Steaming, translucent crystalline quartz noodle nests gently slid onto royal embossed Indian brass thali lined with fresh banana leaf; paired with brass katoris of pearly liquid silica glaze and glowing amber mineral kurma packed with faceted raw gemstone crystal cubes (ruby, emerald, amethyst)",
        foleySound: "Tender noodle nest leaf slide (SHLIP), metallic brass katori clink, gentle steam whisper",
        toolsUsed: ["royal embossed Indian brass thali", "fresh green banana leaf", "pair of polished brass katoris with gemstone kurma"],
        forbiddenTools: ["cooking stove", "cutting knife", "rolling pin", "deep fryer", "opaque grocery noodles", "brown vegetable curry", "diced potatoes"],
      },
      {
        stepNumber: 8,
        stageName: "HERO_NOODLE_LIFT_AND_DRIZZLE",
        realCulinaryAction: "Lifting delicate steaming noodles with fingers/fork and drizzling thick rich coconut milk over nest",
        inedibleObjectEquivalent: "Raw white quartz crystal boulders in foreground proof; black-gloved hands lift steaming translucent optical-quartz glass noodles with polished brass chopsticks; curved brass ladle drizzles pearly liquid silica glaze cascading through light-refracting threads; chef nod with hazel eyes",
        foleySound: "Chopstick clack, delicate noodle thread stretch, viscous glaze drip (GLOOP-DRIP), confident chef nod",
        toolsUsed: ["polished brass chopsticks", "curved brass sauce ladle", "raw quartz crystal boulder proof in foreground"],
        forbiddenTools: ["knife cutting", "fork eating", "subtitles", "voiceover", "opaque white grocery noodles"],
      },
    ],
  },
};

export function resolveDishRecipeBlueprint(
  ideaOrDishName: string,
  heroObjectName: string
): CulinaryDishBlueprint {
  const text = `${ideaOrDishName} ${heroObjectName}`.toLowerCase();

  if (/\b(idiyappam|string hopper|rice noodle|noodle nest|sevai)\b/i.test(text)) {
    return AUTHENTIC_DISH_REGISTRY.IDIYAPPAM;
  }

  if (/\b(samosas?|singara|pastry cone)\b/i.test(text)) {
    return AUTHENTIC_DISH_REGISTRY.SAMOSA;
  }
  if (/\b(idlis?|idly|steamed cakes?)\b/i.test(text)) {
    return AUTHENTIC_DISH_REGISTRY.IDLI_SAMBAR;
  }
  if (/\b(dosas?|ghee roast|masala dosa)\b/i.test(text)) {
    return AUTHENTIC_DISH_REGISTRY.DOSA;
  }

  // Fallback to Samosa blueprint if pastry/triangles, else return SAMOSA as default gold-standard
  return AUTHENTIC_DISH_REGISTRY.SAMOSA;
}


