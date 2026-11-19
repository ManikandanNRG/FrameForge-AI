import { PrismaClient } from "@prisma/client";
import { compileCinematicPrompt } from "../src/lib/story/prompt-compiler";

const prisma = new PrismaClient();

async function main() {
  const projectId = "cmwn17qi30001u8i4fd1pgibh";

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) throw new Error("Project not found");

  // Update Project Source Idea to emphasize commercial hotel cooking scale
  await prisma.project.update({
    where: { id: projectId },
    data: {
      sourceIdea: "Commercial restaurant street hotel bulk scale ASMR inedible cooking: Authentic Madurai Kothu Parotta crafted in massive commercial hotel volume entirely from over 60 unbranded Tamil Nadu market washing soaps and bath bars. Sourced from wholesale crates across a massive 4-foot prep counter; continuous blizzard of thousands of paper-thin soap ribbons from stacked blocks; massive hotel mise-en-place with mounds of hundreds of diced ruby, emerald, and ultramarine cubes; sizzling violently across a giant 3-foot commercial cast-iron hotel tawa over industrial roaring blue burner; drenched in a 5-liter cascade of boiling amber salna; rhythmically minced and tossed by dual 8-inch commercial steel kothu blades in furious Madurai street tempo; plated as a towering colossal mountain on a 24-inch brass feast thali lined with a whole giant banana leaf. Pure binaural ASMR sound design, zero spoken dialogue, high-speed robotic linear camera kinematics.",
    },
  });

  // 9 Commercial Hotel Level Scenes
  const scenesUpgrade = [
    {
      sceneNumber: 1,
      heading: "INT. COMMERCIAL HOTEL KITCHEN - MASSIVE 60-SOAP WHOLESALE CRATE AVALANCHE (HOTEL SCALE HOOK) - DAY (0:00 - 0:08)",
      location: "High-volume commercial restaurant kitchen, 4-foot heavy industrial stainless steel and dark walnut prep counter",
      actionSummary: "COMMERCIAL HOTEL SCALE HOOK: High-energy restaurant volume! The video opens with gloved chef hands hoisting two heavy wooden market crates and violently avalanche-dumping a colossal wholesale mountain of over 60 unbranded Tamil market washing soaps and bath blocks across the massive 4-foot prep counter! A vast, colorful sea of 25 ultramarine-blue laundry bars, 15 rustic yellow carbolic washing bricks, 12 dense brick-red laundry blocks, 10 grooved white detergent cakes, and 12 translucent ruby and emerald glycerine bars crashes and tumbles toward the camera. Instantly, the chef slams a massive heavy carbon-steel commercial cleaver directly into a towering stacked pyramid of washing bars, splitting them with a thunderous acoustic crack as dual 8-inch stainless steel kothu blades clatter onto the metal counter!",
      shotSize: "WIDE_TO_EXTREME_CLOSE_UP",
      cameraMovement: "High-speed precision robotic motion control arm (Bolt rig / motorized linear slider), 60fps high-speed linear probe plunge rushing toward the tumbling 60-soap avalanche, zero handheld camera shake",
      lighting: "Dramatic commercial restaurant overhead spotlight casting sharp edge highlights across the vast 60-soap mountain, gleaming stainless steel reflections",
      targetDurationSeconds: 8,
      audioPrompt: "Thunderous double wooden crate thud, deafening massive cascade of 60+ dense soap blocks crashing and clattering across the commercial counter (CRASH-CLATTER-THUD!), sharp metallic cleaver strike biting into wood with clean acoustic bite (THWACK!)",
    },
    {
      sceneNumber: 2,
      heading: "INT. COMMERCIAL PREP STATION - MASSIVE WOOD-PLANE SOAP BLIZZARD (HOTEL PAROTTA SHREDS) - DAY (0:08 - 0:17)",
      location: "Massive 4-foot commercial hardwood butcher block counter in restaurant kitchen",
      actionSummary: "HOTEL-LEVEL MASSIVE VOLUME: To prep parotta shreds for 10 commercial hotel portions, the chef aligns a stacked row of 6 heavy unbranded ivory bath bars and yellow carbolic laundry blocks side by side. An ultra-sharp Japanese wood plane sweeps rapidly and continuously back and forth, releasing a GIGANTIC, VOLUMINOUS BLIZZARD of thousands of paper-thin, curly translucent soap ribbons that billow into the air and cascade down, piling into an enormous 2-foot high towering mountain of feathery 'parotta shreds' that overflows the commercial counter!",
      shotSize: "EXTREME_CLOSE_UP",
      cameraMovement: "Extreme macro 85mm probe lens push-in, motorized linear rail glide tracking the curling ribbon shavings, zero shake",
      lighting: "Razor-sharp directional side spotlight catching translucent light refraction through the vast mountain of thousands of thin soap shavings",
      targetDurationSeconds: 9,
      audioPrompt: "Continuous rapid hypnotic shhh-shhh-shhh wood-plane slicing, loud billowing rustle of thousands of feathery soap ribbons cascading into a giant mountain",
    },
    {
      sceneNumber: 3,
      heading: "INT. COMMERCIAL PREP STATION - HOTEL MISE-EN-PLACE BULK JEWEL DICING - DAY (0:17 - 0:26)",
      location: "Commercial stainless steel restaurant prep counter with overflowing commercial stainless steel bowls",
      actionSummary: "COMMERCIAL RESTAURANT BULK MISE-EN-PLACE: Chef operating at professional hotel speed! Two heavy cleavers rapidly dice across rows of soap blocks: a towering mound of HUNDREDS of glistening ruby glycerine cubes (red onions), massive overflowing bowls of thinly sliced emerald herbal rings (green chillies), a mountain of diced ultramarine blue laundry blocks (capsicum), and giant heaps of shredded dried loofah fibers covering the entire commercial counter. Professional high-volume street hotel prep scale!",
      shotSize: "CLOSE_UP",
      cameraMovement: "High-speed robotic 45-degree angle linear slider glide sweeping across the massive rows of overflowing diced soap jewel mounds, zero shake",
      lighting: "Crisp overhead commercial kitchen fluorescent and warm spotlight illumination, vibrant jewel-toned reflections across hundreds of glistening cubes",
      targetDurationSeconds: 9,
      audioPrompt: "Furious rapid-fire rhythmic thud-thud-thud-thud of heavy cleaver on commercial board, crisp cleavage of dense soap bars, dry fibrous loofah tearing",
    },
    {
      sceneNumber: 4,
      heading: "INT. COMMERCIAL COOKING STATION - MASSIVE 3-FOOT HOTEL TAWA OIL TEMPERING - DAY (0:26 - 0:34)",
      location: "Giant 3-foot (36-inch) heavy black cast-iron commercial hotel tawa over a roaring dual-flame industrial gas burner",
      actionSummary: "3-FOOT COMMERCIAL HOTEL TAWA: Over an intense roaring commercial burner flame, the chef splashes a generous, wide ladleful of clear golden virgin coconut oil across the giant 3-foot circular cast-iron hotel tawa. Using two wide 10-inch stainless steel bench scrapers, the chef sweeps an AVALANCHE OF HUNDREDS of diced ruby, emerald, and ultramarine blue soap jewels along with giant bundles of shredded loofah onto the iron surface. The entire 3-foot tawa erupts in a roaring, violent sea of sizzling hot oil and bubbling micro-lather!",
      shotSize: "CLOSE_UP",
      cameraMovement: "Motorized linear probe push-in descending toward the sizzling 3-foot tawa surface, perfectly stable linear trajectory",
      lighting: "Warm commercial kitchen spotlight with roaring blue-and-orange industrial burner flame reflections in the wide sea of sizzling oil",
      targetDurationSeconds: 8,
      audioPrompt: "Deafening explosive oil sizzle (CHHHHHHH!), roaring industrial burner hiss, crackling micro-lather bubbles across the 3-foot iron surface, dual metallic scraper scrape",
    },
    {
      sceneNumber: 5,
      heading: "INT. COMMERCIAL COOKING STATION - 30-CHUNK MARBLED BINDING & GLYCERIN RIVER - DAY (0:34 - 0:43)",
      location: "Giant 3-foot cast-iron hotel tawa station over roaring industrial burner",
      actionSummary: "COMMERCIAL BULK BINDING: The chef dumps over 30 dense, rustic chunks of brick-red carbolic washing soap and white detergent blocks across the sizzling 3-foot tawa. From a large 2-liter glass jug, a wide, cascading river of golden liquid glycerin soap is poured across the entire tawa. The chef uses two wide industrial hotel spatulas to aggressively fold, crush, and scramble the melting mass into an enormous, bubbling, glistening emulsion spanning the entire cast-iron surface!",
      shotSize: "CLOSE_UP",
      cameraMovement: "High-speed robotic overhead tracking plunge following the wide spatulas aggressively folding the massive bubbling emulsion, zero tilt shake",
      lighting: "Focused overhead commercial spotlight capturing vast glossy liquid reflections and foaming lather edges across the 3-foot cast iron tawa",
      targetDurationSeconds: 9,
      audioPrompt: "Heavy viscous liquid cascade glug, aggressive dual-spatula folding and scraping on cast iron, boiling emulsion sizzle, massive steam hiss",
    },
    {
      sceneNumber: 6,
      heading: "INT. COMMERCIAL COOKING STATION - GIGANTIC PAROTTA MOUNTAIN & AMBER SALNA CASCADE - DAY (0:43 - 0:52)",
      location: "Giant 3-foot cast-iron hotel tawa station",
      actionSummary: "COLOSSAL HOTEL PAROTTA MOUNTAIN & SALNA DELUGE: The chef dumps the entire COLOSSAL 2-FOOT HIGH TOWERING MOUNTAIN OF THOUSANDS OF SOAP RIBBONS directly onto the sizzling 3-foot tawa, completely burying the base under an enormous fluffy golden mound. From a giant 5-liter traditional brass urn with two handles, the chef pours a TORRENTIAL DELUGE of boiling, steaming golden-amber liquid castile salna reduction over the mountain. An immense, room-filling explosion of white steam erupts toward the ceiling as the amber salna saturates the giant ribbon mountain!",
      shotSize: "MEDIUM_CLOSE_UP",
      cameraMovement: "Motorized vertical crane-up tracking the giant room-filling steam plume rising through the commercial kitchen spotlights",
      lighting: "High-contrast theatrical rim lighting piercing through the thick billowing clouds of white steam, golden-amber liquid glistening over the giant soap mound",
      targetDurationSeconds: 9,
      audioPrompt: "Deafening explosive steam eruption (TSSSSSSSHHHHHHH!), boiling reduction cascade, crackling 3-foot tawa heat, deep resonant brass urn pour",
    },
    {
      sceneNumber: 7,
      heading: "INT. COMMERCIAL COOKING STATION - THE MADURAI HOTEL MASTER KOTHU CLATTER (THE CLIMAX) - DAY (0:52 - 1:04)",
      location: "Giant 3-foot cast-iron hotel tawa station - The Climax",
      actionSummary: "THE MADURAI HOTEL MASTER KOTHU CLATTER: Full commercial street-food spectacle! Chef wields two heavy 8-inch hotel-grade rectangular steel kothu blades, furiously beating, cross-cutting, mincing, and tossing the ENORMOUS 10-PORTION BATCH across the 3-foot iron tawa in lightning Madurai cadence (CLACK-CLACK-CHOP-CLANG!). High-energy commercial street food theatre: blades rhythmically ringing on the tawa, sparks, flying iridescent soap flakes, and steam filling the frame as the mountain merges into a unified, glistening, shredded gourmet soap kothu!",
      shotSize: "CLOSE_UP",
      cameraMovement: "High-speed robotic linear probe tracking rapidly in sync with the blades, razor-sharp focus on the cutting edges and flying iridescent soap flakes, zero shake",
      lighting: "Intense dramatic rim lighting highlighting the flashing steel blades, flying soap flecks, and shimmering golden glaze",
      targetDurationSeconds: 12,
      audioPrompt: "Ear-tingling hypnotic Madurai street percussion: rapid dual-blade steel-on-iron ringing (CLACK-CLACK-CHOP-CLANG!), wet chopping squelches, resonant 3-foot tawa clatter reverberating through the kitchen",
    },
    {
      sceneNumber: 8,
      heading: "INT. COMMERCIAL COOKING STATION - CHARCOAL DREDGE & MONUMENTAL TAWA MOUND - DAY (1:04 - 1:12)",
      location: "Giant 3-foot cast-iron hotel tawa station",
      actionSummary: "COMMERCIAL CHARCOAL DREDGING & GIANT CENTER MOUND: A large commercial stainless steel perforated dredger showers a wide cloud of matte-black activated charcoal dust over the steaming mountain (mimicking coarse black pepper). With two massive sweeping strokes of the 8-inch hotel kothu blades, the chef scoops and gathers the giant 10-portion steaming mixture into a towering, monumental central mound on the 3-foot tawa.",
      shotSize: "MEDIUM_CLOSE_UP",
      cameraMovement: "Smooth horizontal motorized linear slider glide capturing the wide charcoal dust cloud settling over the giant mound in the spotlight beam",
      lighting: "Focused side spotlight capturing the matte black charcoal dusting settling over the high-gloss amber soap mountain",
      targetDurationSeconds: 8,
      audioPrompt: "Soft metallic powder shaker whisper, deep resonant scrape of dual 8-inch steel blades sliding across cast iron, heavy solid cohesive mountain thud",
    },
    {
      sceneNumber: 9,
      heading: "INT. PLATING STUDIO - GRAND HOTEL WEDDING FEAST THALI PRESENTATION - DAY (1:12 - 1:22)",
      location: "Minimalist restaurant studio table with pure black velvet background",
      actionSummary: "GRAND HOTEL FEAST BANANA LEAF PLATING: The chef scoops the steaming, glistening soap kothu parotta into an ENORMOUS, TOWERING GOURMET MOUNTAIN onto a giant fresh green banana leaf set inside a massive 24-inch antique brass wedding/hotel feast thali plate! Flanking the giant mound are three large polished brass bowls: one filled with dense velvety white shaving-soap 'onion raita' with ruby confetti, a second overflowing with simmering amber salna, and a third with crispy fried loofah garnish. The chef places a final golden loofah crown on top with long plating tweezers and steps back.",
      shotSize: "WIDE_TO_EXTREME_CLOSE_UP",
      cameraMovement: "Cinematic 360-degree rotating linear macro probe glide around the colossal steaming, glistening plated thali feast with creamy black velvet background bokeh, zero shake",
      lighting: "Pristine overhead spotlight illuminating the glistening textures on the giant vibrant green banana leaf against deep black velvet",
      targetDurationSeconds: 10,
      audioPrompt: "Heavy resonant brass thali clank on wood, soft banana leaf rustle, gentle dying sizzle, quiet satisfying breath",
    },
  ];

  for (const s of scenesUpgrade) {
    const scene = await prisma.scene.findFirst({
      where: { projectId, sceneNumber: s.sceneNumber },
      include: { shots: true },
    });

    if (!scene) continue;

    const compiled = compileCinematicPrompt({
      actionDescription: s.actionSummary,
      shotSize: s.shotSize,
      cameraMovement: s.cameraMovement,
      lighting: s.lighting,
      dialogue: "PURE_ASMR_FOLEY",
      voiceover: undefined,
      audioPrompt: s.audioPrompt,
      characterName: "The Master Artisan Chef",
      characterDescription: "Elite avant-garde chef in heavy dark leather butcher apron and black textured nitrile gloves, high-speed authority and surgical precision",
      wardrobeLock: "dark leather butcher apron, rolled black linen sleeves, black nitrile gloves",
      locationDescription: s.location,
      aspectRatio: "PORTRAIT_9_16",
      storyLanguage: "Tamil",
      targetDurationSeconds: s.targetDurationSeconds,
      visualStyle: "CULINARY_MACRO_ASMR",
      sourceIdea: project.sourceIdea,
      genre: "CULINARY",
      tone: "ASMR Sensory Feast & Hypnotic Street Food Theatre",
    });

    await prisma.scene.update({
      where: { id: scene.id },
      data: {
        heading: s.heading,
        location: s.location,
        actionSummary: s.actionSummary,
      },
    });

    if (scene.shots.length > 0) {
      await prisma.shot.update({
        where: { id: scene.shots[0].id },
        data: {
          actionDescription: s.actionSummary,
          imagePrompt: compiled.fluxStillPrompt,
          videoPrompt: compiled.googleFlowPrompt,
          cameraMovement: s.cameraMovement,
          lighting: s.lighting,
          targetDurationSeconds: s.targetDurationSeconds,
        },
      });
    }

    console.log(`Updated Scene ${s.sceneNumber} to HOTEL COOKING LEVEL!`);
  }

  // Update ProductionAsset description
  const asset = await prisma.productionAsset.findFirst({
    where: { projectId, name: "Artisan Tamil Market Soap Ensemble" },
  });

  if (asset) {
    await prisma.productionAsset.update({
      where: { id: asset.id },
      data: {
        description: "Massive commercial hotel wholesale haul of over 60 unbranded authentic Tamil Nadu market washing soaps and bath blocks: 25 ultramarine-blue laundry washing bars, 15 rustic yellow carbolic washing bricks, 12 dense brick-red washing blocks, 10 grooved white detergent cakes, 12 translucent ruby and emerald glycerine soap bars, and dried natural loofah fibers.",
        attributes: JSON.stringify({
          category: "INEDIBLE_CULINARY_HERO_OBJECT",
          scale: "Commercial Hotel Bulk Batch (10 portions on a 3-foot cast-iron tawa)",
          quantity: "Colossal 60+ unit wholesale commercial haul",
          appearance: "Vast mountain of unbranded geometric soap blocks with sharp manufactured corners and dense waxy textures. 25x ultramarine blue, 15x carbolic yellow, 12x brick red, 10x grooved white, 12x translucent ruby and emerald. Zero brand logos, zero on-screen text.",
          consistencyAnchor: "Vast commercial mountain of 60+ unbranded Tamil market laundry bars and bath soap blocks (blue, yellow, red, white, ruby, emerald)",
        }),
      },
    });
  }

  console.log("\nALL 9 SCENES SUCCESSFULLY UPGRADED TO HOTEL COOKING LEVEL!");
}

main().finally(() => prisma.$disconnect());
