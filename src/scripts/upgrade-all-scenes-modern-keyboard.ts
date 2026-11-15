import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmwg5nczz0001u88sld5gnrmd';

  console.log('1. Updating Prop Asset to Modern Matte-Black Mechanical Keyboard...');
  const prop = await prisma.productionAsset.findFirst({
    where: { projectId, assetType: 'PROP' },
  });

  if (prop) {
    await prisma.productionAsset.update({
      where: { id: prop.id },
      data: {
        name: 'Custom Matte-Black Mechanical Keyboard & Culinary Tools',
        description: 'A high-end custom mechanical keyboard with an anodized matte-black aluminum chassis, doubleshot matte-black PBT keycaps with crisp laser-etched white lettering (WASD, CTRL, SPACE), accented by an electric-crimson Red ESC key, cyan Enter key, and exposed Cherry MX Red clicky mechanical switches. Paired with a precision stainless steel wire keycap puller, heavy Damascus steel cleaver, titanium plating tweezers, and a seasoned 14-inch carbon steel round-bottom wok.',
        attributes: JSON.stringify({
          chassis: 'Heavy anodized matte-black aluminum 75% mechanical keyboard chassis with bevelled chamfer edges.',
          keycaps: 'Matte-black doubleshot PBT keycaps with crisp white laser-etched typography (WASD, SPACE, SHIFT, CTRL), accented with an iconic neon-crimson Red ESC key, electric-cyan Enter key, and bright yellow arrow keys. Authentic concave ergonomic top profile.',
          switches: 'Exposed Cherry MX Red mechanical switches with vibrant crimson cross-stems and transparent switch housings.',
          cable: 'Thick coiled black braided USB-C aviator cable with high-sheen chrome quick-disconnect coupler.',
          puller: 'Precision dual-loop stainless steel wire keycap puller with textured grip.',
          cleaver: 'Heavy Damascus-patterned steel Chinese kitchen cleaver with polished dark rosewood handle.',
          tweezers: '12-inch precision bent titanium culinary plating tweezers.',
          wok: 'Heavy 14-inch seasoned carbon-steel round-bottom wok with dark patina and heat-treated wooden handle.',
        }),
      },
    });
    console.log('Prop asset updated successfully!');
  }

  console.log('2. Updating 12 Scenes with Modern Black Keyboard & 4-Beat Rapid Hook Architecture...');

  const scenes = await prisma.scene.findMany({
    where: { projectId },
    include: { shots: true },
    orderBy: { sceneNumber: 'asc' },
  });

  const sceneUpdates = [
    {
      sceneNumber: 1,
      heading: 'INT. INDUSTRIAL TECH KITCHEN - WORKBENCH & WOK - 4-BEAT RAPID HOOK (0:00 - 0:05)',
      actionSummary: 'VIRAL HOOK (0:00 - 0:05): Rapid-fire 4-beat sensory teaser. Beat 1: The chef violently slams a sleek matte-black mechanical keyboard onto the walnut butcher block (*THUD*). Beat 2: In a razor-sharp macro snap, his wire puller launches a crimson-red ESC key and black WASD keycaps flying straight into the lens (*POP-CLICK*). Beat 3: A heavy Damascus cleaver cleaves through the chassis with an explosive slow-mo crunch (*CRACK*). Beat 4: A flurry of glistening black and red keycaps shower into a smoking blue-flame wok amidst roaring fire and golden flux sparks (*SIZZLE-ROAR*). The chef locks eyes with the camera with a rogue smirk beneath his matte-black mask.',
      estimatedDurationSeconds: 5,
      shotSize: 'MACRO_CLOSE_UP',
      cameraAngle: 'DYNAMIC_LOW_ANGLE',
      cameraMovement: 'RAPID_4_BEAT_HOOK_MONTAGE',
      targetDurationSeconds: 5,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, extreme high-energy viral cold open hook. The Shadow Alchemist Chef (athletic build, tousled wavy dark hair with vintage brass dual-lens tinker goggles, sleek matte-black ergonomic half-mask with gold cheekline vents, piercing intense hazel eyes, black nitrile grip gloves, distressed leather cross-back apron). Action & Blocking: High-impact macro composite hook. In the razor-sharp foreground, a dense shower of authentic matte-black mechanical keycaps with crisp white laser-etched letters (W, A, S, D, SPACE) and one vibrant ruby-red ESC keycap erupt mid-air out of a seasoned carbon steel wok over roaring blue gas flames, glowing with sizzling translucent amber glaze and flying golden electric flux sparks. On the dark walnut butcher block below rests the cleaved matte-black aluminum keyboard chassis with exposed red mechanical switches. In the background, the chef holds the wok handle, gazing intently into the camera with a mischievous rogue smirk. Cinematography: Dynamic low-angle 35mm lens, f/1.8 shallow depth of field, high-speed shutter freezing flying keycaps and sparks, golden firelight illumination, 1080p full HD, tactile raw textures. Negative Prompt: generic cubes, plain plastic blocks, tofu, dice, wheat noodles, pasta, real food, meat, cartoon, anime, 3d render, bare face, missing goggles.',
      videoPrompt: '[The Shadow Alchemist Chef]. VIRAL HOOK (0:00 - 0:05). Action & Kinematics: Rapid 4-beat sensory teaser. In mid-air slow motion, the chef tosses the heavy carbon steel wok over roaring blue flames. Sizzling matte-black mechanical keycaps (with visible white letters) and glowing ruby-red ESC keys soar toward the camera with flying golden flux sparks, then clatter back into the hot steel. Chef locks eyes with the camera, tilting his head with a confident smirk. Camera Movement: DYNAMIC_PULL_BACK_WHILE_TILT, smooth 24fps motion blur. Physical Invariants: Chef hands remain locked in black grip gloves, fire physics and keycap gravity realistic, zero morphing objects. Setting: High-heat wok station in industrial tech kitchen.',
      audioPrompt: 'Binaural Foley: Massive explosive bass boom followed by roaring whoosh of blue gas flame, high-frequency crackle of solder flux, and a heavy cascade of hard plastic keycaps clattering against hot carbon steel (*TAK-TAK-CLATTER-SSSHHH*).',
      soundEffects: 'Gas flame whoosh, sizzling flux, resonant keycap clatter on steel',
    },
    {
      sceneNumber: 2,
      heading: 'EXT. E-WASTE SCRAPYARD - SHELF - NIGHT (0:05 - 0:12)',
      actionSummary: 'Dynamic action shot. The chef reaches up with black-gloved hands and firmly rips a sleek, modern matte-black mechanical keyboard free from an industrial shelf. The thick black coiled braided aviator cable with chrome coupler snaps free with an echoing crack and tiny electrical sparks. He catches the black keyboard cleanly by its aluminum bezel, his intense hazel eyes locking onto the camera.',
      estimatedDurationSeconds: 7,
      shotSize: 'MEDIUM',
      cameraAngle: 'LOW_ANGLE',
      cameraMovement: 'DYNAMIC_CABLE_SNAP',
      targetDurationSeconds: 7,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still. The Shadow Alchemist Chef (wearing brass tinker goggles on wavy dark hair, sleek matte-black vented half-mask, black grip gloves, heavy leather apron). Action & Blocking: Dynamic medium action shot. The chef reaches up with black-gloved hands and firmly rips a sleek, modern matte-black mechanical keyboard free from an industrial shelf. The thick black coiled braided aviator cable with chrome coupler snaps free with a shower of tiny electrical sparks. He catches the black keyboard cleanly by its aluminum bezel, his intense hazel eyes locking onto the camera. Environment: Cold, atmospheric industrial computer scrapyard. Stacks of retro CRT monitors and green motherboard racks under cool cyan neon fog. No cooking stoves, no fire, cold dormant workshop. Cinematography: Master 35mm lens, f/1.8 shallow depth of field, cool cyan neon backlight spill with warm amber rim light, volumetric dust motes, 1080p full HD.',
      videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Medium dynamic action shot. Chef reaches up with black grip gloves and firmly grasps the modern matte-black mechanical keyboard. With sudden controlled force, he violently rips the coiled black braided aviator cable free with an echoing snap and tiny spark burst. He spins the heavy aluminum keyboard in mid-air and catches it cleanly by the bezel. Camera Movement: FAST_PAN_FOLLOW, smooth 24fps. Physical Invariants: Gloves stay black, keyboard chassis rigid matte black aluminum. Setting: Cold scrapyard shelving.',
      audioPrompt: 'Binaural Foley: Loud electric spark (*ZAP-CRACK*), heavy metallic whoosh of keyboard spinning through air, solid leather glove catch (*CLACK*).',
      soundEffects: 'Cable snap, electric zap, metallic catch',
    },
    {
      sceneNumber: 3,
      heading: 'INT. TECH WORKBENCH - MACRO KEYCAP HARVEST (0:12 - 0:20)',
      actionSummary: 'Macro 90-degree top-down flat lay over walnut butcher block. Sleek matte-black keyboard in center. Chef uses stainless wire keycap puller to rapidly hook and pluck keycaps: POP! CLICK! POP! Crisp matte-black keycaps with white legends (W, A, S, D, SHIFT) and a glowing red ESC key pop off Cherry MX red switches and shower into a stainless steel prep bowl.',
      estimatedDurationSeconds: 8,
      shotSize: 'MACRO_CLOSE_UP',
      cameraAngle: 'TOP_DOWN_90_DEGREE',
      cameraMovement: 'OVERHEAD_STATIC_LOCK',
      targetDurationSeconds: 8,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, extreme macro top-down 90-degree flat lay. Resting on a dark walnut end-grain butcher block is a modern matte-black mechanical gaming keyboard. The black-gloved hand of The Shadow Alchemist Chef uses a stainless steel wire keycap puller to pop keycaps off the board. In razor-sharp macro focus, matte-black PBT keycaps with crisp white laser-etched legends (W, A, S, D, CTRL) and one glowing ruby-red ESC keycap are caught mid-air launching off exposed bright-red Cherry MX mechanical switches, cascading into a brushed stainless steel bowl. Crisp mechanical details, tactile textures, directional warm spotlight, f/2.0 macro depth of field. Negative: generic cubes, plain plastic blocks, blurry keys.',
      videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Macro 90-degree top-down flat lay. Rhythmic, hypnotic keycap pulling. Hand with stainless wire tool hooks under matte-black keycaps and pulls straight up with rapid staccato snaps: POP! POP! POP! Black keys with crisp white letters and red ESC key pop off red switch stems and shower into a stainless bowl. Camera Movement: OVERHEAD_STATIC_LOCK, 24fps. Physical Invariants: Keyboard body remains pinned to wood, individual keys maintain exact legends. Setting: Walnut butcher block prep station.',
      audioPrompt: 'Binaural Foley: Rapid rhythmic keycap popping (*CLICK-POP! CLICK-POP! TINK-TINK-TINK* as plastic keycaps bounce into stainless steel bowl).',
      soundEffects: 'Mechanical switch pull, keycap bounce on metal',
    },
    {
      sceneNumber: 4,
      heading: 'INT. TECH WORKBENCH - SWITCH EXTRACTION (0:20 - 0:27)',
      actionSummary: 'Macro 45-degree angle. Chef uses stainless steel switch puller clips to extract individual Cherry MX Red mechanical switches from the plate. CLICK-POP! Distinct red cross-stems and gold contact pins shine as they land into a separate brass ramekin.',
      estimatedDurationSeconds: 7,
      shotSize: 'MACRO_CLOSE_UP',
      cameraAngle: 'DUTCH_45_DEGREE',
      cameraMovement: 'SLOW_SLIDER_RIGHT',
      targetDurationSeconds: 7,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, extreme macro 45-degree shot. Close-up on the stripped matte-black keyboard plate. The black-gloved hands of the chef use a stainless steel switch extractor to pull individual Cherry MX mechanical switches from the board. In crystal-clear macro focus, a bright red mechanical switch with its distinctive cross-stem and copper contact pins is lifted upward. In the foreground, a brass ramekin is filled with red and blue mechanical switches. Warm directional spotlight catching metallic contacts, f/2.2 macro depth of field. Negative: generic cubes, plain blocks.',
      videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Macro close-up on switch extraction. Stainless steel extractor prongs pinch the switch housing clips. With surgical leverage, the chef pulls straight up: *SNIKT-CLACK!* A Cherry MX red switch lifts smoothly out of the black plate, exposing tiny gold pins. Camera Movement: SLOW_SLIDER_RIGHT, 24fps. Physical Invariants: Switch geometry rigid, tool grip steady. Setting: Tech workbench.',
      audioPrompt: 'Binaural Foley: Crisp tactile metallic latch click (*SNIKT-TAK*), copper pins scraping plate socket.',
      soundEffects: 'Switch extraction snap, metallic ping',
    },
    {
      sceneNumber: 5,
      heading: 'INT. TECH WORKBENCH - CHASSIS FRACTURE (0:27 - 0:35)',
      actionSummary: 'Dynamic medium close-up. Chef takes the stripped black aluminum body and green fiberglass PCB, places it over the edge of the butcher block, and with a swift martial palm strike, SNAPS the board clean in two with a resonant metallic CRACK! Fibers and circuit traces splinter with tactile perfection.',
      estimatedDurationSeconds: 8,
      shotSize: 'MEDIUM_CLOSE_UP',
      cameraAngle: 'EYE_LEVEL',
      cameraMovement: 'DYNAMIC_IMPACT_ZOOM',
      targetDurationSeconds: 8,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, dynamic medium close-up. The Shadow Alchemist Chef in black nitrile gloves violently snaps the green printed circuit board and black aluminum keyboard frame across the edge of the dark walnut butcher block. The board fractures in a clean diagonal break, sending a fine dusting of green resin particles and tiny surface-mount resistors into the warm directional spotlight. Intense focused gaze through his brass goggles and matte-black mask. Tactile gritty textures, 1080p full HD, cinematic lighting.',
      videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Medium close-up action. Chef holds the stripped black aluminum keyboard frame over the butcher block edge. With a sudden downward palm thrust, the board snaps cleanly in half with an explosive visual shudder. Split halves rebound slightly on the wood grain. Camera Movement: QUICK_PUSH_IN on impact, 24fps. Physical Invariants: Gloves stay black, wood grain intact. Setting: Walnut butcher block.',
      audioPrompt: 'Binaural Foley: Heavy resonant wooden thud, sharp fiberglass fracture (*KRRR-SNAP!*), tiny metallic pins skittering.',
      soundEffects: 'Chassis snap, fiberglass crack, surface reverberation',
    },
    {
      sceneNumber: 6,
      heading: 'INT. TECH WORKBENCH - MACRO CLEAVER DICING (0:35 - 0:45)',
      actionSummary: 'Macro 45-degree angle. The fractured PCB halves lie flat. Chef wields a heavy Damascus steel cleaver: THWACK! THWACK! THWACK! In rapid culinary julienne rhythm, he dices the circuit board into bite-sized 1-inch squares, with gold-plated contact traces gleaming on the edges like fat marbling on steak.',
      estimatedDurationSeconds: 10,
      shotSize: 'MACRO_CLOSE_UP',
      cameraAngle: 'DUTCH_45_DEGREE',
      cameraMovement: 'SLOW_PAN_ACROSS_CHOPPING',
      targetDurationSeconds: 10,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, macro 45-degree culinary preparation shot. On the dark walnut butcher block, the heavy Damascus steel cleaver held in a black-gloved hand slices through the green circuit board in rapid culinary motion. In razor-sharp macro focus, neatly diced 1-inch square circuit board cubes lie lined up like gourmet morsels, displaying gold-plated soldered edge traces and microchip components, next to a pile of red mechanical switches. Directional tungsten spotlight, razor-sharp edge focus, f/2.0 macro depth of field. Negative: plain cubes, blurry cuts.',
      videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Macro culinary dicing. Heavy Damascus cleaver rises and falls in rhythmic, rapid cadence: THWACK! THWACK! THWACK! Blade cleanly chops through the circuit board into uniform 1-inch squares. Knife edge gleams under tungsten spotlight. Camera Movement: SLOW_PAN_ACROSS_CHOPPING, 24fps. Physical Invariants: Damascus blade pattern consistent, butcher block unmoving. Setting: Walnut butcher block.',
      audioPrompt: 'Binaural Foley: Rhythmic heavy steel chops into dense hardwood (*THWACK-CHOP! THWACK-CHOP!*), crisp brittle fracture of fiberglass circuit traces.',
      soundEffects: 'Heavy cleaver impact, crisp slicing sounds',
    },
    {
      sceneNumber: 7,
      heading: 'INT. TECH WORKBENCH - COPPER NOODLE CHIFFONADE (0:45 - 0:55)',
      actionSummary: 'Close-up macro. Chef bundles rainbow flat ribbon cables and shimmering raw copper wire coils like a bunch of scallions. With rocking cuts of his Damascus blade, he slices them into fine spiral curly ribbons that spring open like glistening angel-hair noodles.',
      estimatedDurationSeconds: 10,
      shotSize: 'MACRO_CLOSE_UP',
      cameraAngle: 'EYE_LEVEL',
      cameraMovement: 'MACRO_ORBIT_LEFT',
      targetDurationSeconds: 10,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, macro eye-level shot. The chefs black-gloved hand holds a bunch of shiny raw copper wire coils and multicolored ribbon cables on the walnut board. With a Damascus chef knife, he slices them into delicate springy spiral copper ribbons that uncoil across the wood grain like glistening metallic angel-hair noodles. Shimmering warm amber copper reflections, razor-sharp focus on the coiled metallic wire spirals, f/2.0 depth of field. Negative: wheat noodles, real pasta, food dough.',
      videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Macro rolling chiffonade cut. Chef rocks the curved belly of the Damascus knife across tight coils of raw copper wire. As the blade cuts through, springy curls of shiny copper wire peel back and unravel across the butcher block like golden noodles. Camera Movement: SLOW_HORIZONTAL_DOLLY, 24fps. Physical Invariants: Copper wire maintains metallic sheen, blade motion fluid. Setting: Tech prep bench.',
      audioPrompt: 'Binaural Foley: Metallic shearing scrape (*SCHWWING-ZIP*), springy uncoiling of tight copper wire (*BOING-SHRRK*).',
      soundEffects: 'Wire slicing scrape, metallic uncoil',
    },
    {
      sceneNumber: 8,
      heading: 'INT. TECH WORKBENCH - THE FLUX MARINADE (0:55 - 1:03)',
      actionSummary: 'Macro overhead. Inside a stainless steel mixing bowl filled with the matte-black keycaps, red switches, and spiral copper ribbons, the chef uncorks a vintage glass bottle of translucent amber rosin flux. He pours a thick golden stream over the ingredients: SZZZZ! Thick, honey-like amber glaze coats the keycaps.',
      estimatedDurationSeconds: 8,
      shotSize: 'MACRO_CLOSE_UP',
      cameraAngle: 'DUTCH_45_DEGREE',
      cameraMovement: 'SLOW_TILT_DOWN_STREAM',
      targetDurationSeconds: 8,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, macro 45-degree shot. Inside a wide stainless steel mixing bowl, a rich mixture of matte-black mechanical keycaps (with legible white letters), ruby-red ESC keys, red Cherry switches, and spiraling raw copper wire ribbons. From a heavy vintage glass dropper bottle, the chef pours a thick, luminous amber-gold rosin soldering flux glaze in a slow glistening ribbon over the keys. The keys glisten with a mouth-watering honeyed culinary sheen, catching warm amber studio lights. Razor-sharp macro focus, f/2.0 depth of field. Negative: generic cubes, plain plastic blocks.',
      videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Macro pour shot. Thick, viscous golden rosin flux pours in a smooth, continuous amber ribbon from a glass dropper bottle down onto the matte-black keycaps and copper noodles. Amber liquid pools and coats the keycap letters with a glossy, mouth-watering glaze. Camera Movement: SLOW_TILT_DOWN_STREAM, 24fps. Physical Invariants: Liquid viscosity thick and realistic, bowl stationary. Setting: Stainless mixing bowl on bench.',
      audioPrompt: 'Binaural Foley: Glass bottle uncork pop (*PLOP*), thick viscous honeyed drizzle (*GLOOP-GLOOP-SSSS*), keycaps clinking as liquid coats them.',
      soundEffects: 'Viscous drizzle, gentle sizzle, bottle uncork',
    },
    {
      sceneNumber: 9,
      heading: 'INT. WOK STATION - BLUE FLAME IGNITION (1:03 - 1:10)',
      actionSummary: 'Low-angle eye level. Chef turns the heavy brass valve on high-pressure burner. Click-click-WHOOSH! A ferocious, jet-engine blue gas flame roars to life beneath the 14-inch seasoned carbon steel wok. He swirls a ladle of refined conductive heat-sink silicone oil around the scorching wok until it smokes.',
      estimatedDurationSeconds: 7,
      shotSize: 'MEDIUM',
      cameraAngle: 'LOW_ANGLE',
      cameraMovement: 'DYNAMIC_PUSH_IN_ON_FLAME',
      targetDurationSeconds: 7,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, dramatic low-angle shot at the wok station. The Shadow Alchemist Chef stands over a heavy 14-inch seasoned carbon steel wok. Beneath the wok, a ferocious jet-engine ring of electric-blue gas flames roars upward, casting a dramatic blue glow on his dark leather apron and matte-black half-mask. With his black-gloved right hand, he tilts the wok by its wooden handle as wisps of blue-gray smoke rise from the scorching hot steel. Cinematic high contrast, cyan flame glow, warm ambient tungsten backlight.',
      videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Low-angle action shot. Hand turns brass burner valve. Burner ignites with a roaring blast: WHOOSH! Electric-blue gas flame wraps up around the curved steel wok. Chef lifts the wok by its wooden handle, swirling clear oil inside as wisps of gray smoke spiral upward. Camera Movement: DYNAMIC_PUSH_IN_ON_FLAME, 24fps. Physical Invariants: Flame physics turbulent, wok geometry solid. Setting: High-heat wok burner.',
      audioPrompt: 'Binaural Foley: Metallic valve click (*CLINK*), massive explosive gas ignition (*FWHUMP-ROAAAR*), sizzling oil swirl on scorching steel.',
      soundEffects: 'Gas burner whoosh, continuous jet flame roar, oil sizzle',
    },
    {
      sceneNumber: 10,
      heading: 'INT. WOK STATION - MACRO WOK TOSS & FLAME (1:10 - 1:20)',
      actionSummary: 'MACRO / TIGHT CLOSE-UP inside the wok. Chef dumps the marinated black keycaps, red switches, and copper noodles into the smoking wok. A burst of golden flux sparks and aromatic steam billows as he aggressively tosses the wok with one gloved hand. In tight macro view, black keycaps with white letters and red ESC keys leap over blue flames, sizzling violently without morphing!',
      estimatedDurationSeconds: 10,
      shotSize: 'MACRO_CLOSE_UP',
      cameraAngle: 'DYNAMIC_LOW_ANGLE',
      cameraMovement: 'MACRO_WOK_TOSS_SLOW_MO',
      targetDurationSeconds: 10,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, tight macro dynamic action shot inside the wok. In razor-sharp close-up, a dense flurry of authentic matte-black mechanical keycaps with crisp white laser-etched legends (W, A, S, D, ESC), bright red Cherry switches, and coiling raw copper ribbons leap upward in mid-air over intense blue gas flames. The keys glisten with hot bubbling translucent amber glaze, sending tiny golden electric sparks flying. The seasoned curved rim of the carbon steel wok frames the bottom. In the soft-focus background, the chefs black-gloved hand firmly grips the wok handle. Razor-sharp focus on the flying black and red keycaps, f/2.0 macro depth of field. Negative Prompt: generic cubes, dice, tofu, wheat noodles, pasta, plain food, blurry shapes.',
      videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Macro slow-motion wok toss. Sizzling contents of the wok are tossed in a smooth, high arc over the blue flames. Glossy matte-black keycaps with legible white legends (W, A, S, D, ESC) and red switches tumble in slow motion through billowing steam and golden sparks before catching cleanly back in the sizzling steel pan. Camera Movement: MACRO_VERTICAL_TILT_FOLLOW, 24fps. Physical Invariants: Keycap legends and square edges remain crisp and recognizable, fire physics realistic. Setting: Roaring wok station.',
      audioPrompt: 'Binaural Foley: Thunderous explosive sizzle (*SSSHHH-CRACKLE!*), rhythmic clatter of hard keycaps dancing on hot steel (*TAK-TAK-TAK-CLATTER*), whoosh of rising flames.',
      soundEffects: 'Intense wok sizzle, keycap clatter, gas flame roar',
    },
    {
      sceneNumber: 11,
      heading: 'INT. PLATING TABLE - GOURMET KEYCAP MOUND (1:20 - 1:26)',
      actionSummary: 'Macro eye-level gourmet hero shot. A Michelin-star stir-fry made 80% out of modern matte-black mechanical keycaps (with crisp laser-etched white letters W, A, S, D, SPACE), vibrant ruby-red ESC keycaps, and red Cherry mechanical switches, all coated in a rich, sizzling translucent amber glaze like gourmet roasted chestnuts. Interwoven throughout are thin spiral raw copper wire noodles and diced emerald-green circuit board garnish, piled high on a dark etched matte-black motherboard serving slate. In the background, titanium precision tweezers in a black-gloved hand delicately place the final ruby-red ESC key on top.',
      estimatedDurationSeconds: 6,
      shotSize: 'MACRO_CLOSE_UP',
      cameraAngle: 'EYE_LEVEL',
      cameraMovement: 'SLOW_HORIZONTAL_SLIDER',
      targetDurationSeconds: 6,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, extreme macro gourmet hero shot. A Michelin-star stir-fry made 80% out of modern matte-black mechanical keycaps (with crisp laser-etched white letters W, A, S, D, SPACE), vibrant ruby-red ESC keycaps, and red Cherry mechanical switches, all coated in a rich, sizzling translucent amber glaze like gourmet roasted chestnuts. Interwoven throughout are thin spiral raw copper wire noodles and diced emerald-green circuit board garnish, piled high on a dark etched matte-black motherboard serving slate. In the background, titanium precision tweezers in a black-gloved hand delicately place the final ruby-red ESC key on top. Warm golden food spotlight, wisps of steam, razor-sharp focus on the key legends, f/2.0 macro depth of field. Negative Prompt: wheat noodles, pasta, plain food, meat, lo mein, generic cubes, blurry keys.',
      videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Macro eye-level glide. Camera glides smoothly across the steaming gourmet mound of glazed matte-black keycaps and copper spirals. In the chefs black-gloved hand, titanium precision tweezers lower a glowing ruby-red ESC keycap onto the summit, depositing it with a sharp, delicate tap. Thin aromatic steam wisps rise into the warm spotlight. Camera Movement: SLOW_HORIZONTAL_SLIDER, 24fps. Physical Invariants: Slate and keycaps perfectly stationary, tweezers rigid. Setting: Gourmet plating bench.',
      audioPrompt: 'Binaural Foley: Delicate high-pitched metallic click (*TING*) as tweezers deposit the keycap, gentle lingering hiss of escaping steam, deep satisfying bass thrum.',
      soundEffects: 'Tweezers click on slate, gentle steam hiss',
    },
    {
      sceneNumber: 12,
      heading: 'INT. INDUSTRIAL SCRAP KITCHEN - HERO REVEAL & SMIRK (1:26 - 1:30)',
      actionSummary: 'Hero medium shot. Wisps of steam curl from the plated keyboard stir-fry on the dark slate. The Shadow Alchemist Chef slowly lowers his tweezers and looks straight into the camera lens. His piercing hazel eyes crinkle with a knowing, secretive rogue smirk beneath his sleek matte-black half-mask. He tilts his head in quiet mastery as golden dust motes float through the warm spotlight.',
      estimatedDurationSeconds: 5,
      shotSize: 'MEDIUM',
      cameraAngle: 'EYE_LEVEL',
      cameraMovement: 'SLOW_PULL_BACK_HERO',
      targetDurationSeconds: 5,
      imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, hero medium shot. In the foreground rests the plated gourmet mechanical keyboard stir-fry glistening on a dark motherboard platter, with delicate wisps of steam rising into the air. Directly behind it, The Shadow Alchemist Chef (athletic build, tousled dark wavy hair with brass dual-lens tinker goggles, sleek matte-black half-mask with gold cheekline vents, dark work shirt with rolled sleeves, heavy leather cross-back apron) slowly lowers his titanium plating tweezers and looks straight into the camera lens. His piercing hazel eyes crinkle with a subtle, mischievous rogue smirk. Golden spotlight, moody cyan scrap shop background with CRT monitors, master 35mm lens, f/1.8 shallow depth of field, tactile raw textures.',
      videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Hero pull-back. Wisps of aromatic white steam swirl up around the plated mechanical keyboard stir-fry under the warm golden spotlight. Chef slowly looks up from his dish directly into the camera lens. His piercing hazel eyes crinkle as a rogue smirk spreads beneath his mask. He tilts his head with quiet mastery. Camera Movement: SLOW_PULL_BACK_HERO, 24fps. Physical Invariants: Chef pose steady, mask locked, background stable. Setting: Industrial tech kitchen.',
      audioPrompt: 'Binaural Foley: Deep cinematic bass sub-drop, soft hiss of fading steam, gentle intake of breath behind the vented mask.',
      soundEffects: 'Subtle cinematic swell, steam fade, breath thrum',
    },
  ];

  for (const update of sceneUpdates) {
    const sc = scenes.find(s => s.sceneNumber === update.sceneNumber);
    if (!sc) continue;

    await prisma.scene.update({
      where: { id: sc.id },
      data: {
        heading: update.heading,
        actionSummary: update.actionSummary,
        estimatedDurationSeconds: update.estimatedDurationSeconds,
      },
    });

    if (sc.shots[0]) {
      await prisma.shot.update({
        where: { id: sc.shots[0].id },
        data: {
          actionDescription: update.actionSummary,
          shotSize: update.shotSize,
          cameraAngle: update.cameraAngle,
          cameraMovement: update.cameraMovement,
          targetDurationSeconds: update.targetDurationSeconds,
          imagePrompt: update.imagePrompt,
          videoPrompt: update.videoPrompt,
          negativeConstraints: JSON.stringify({
            audioPrompt: update.audioPrompt,
            soundEffects: update.soundEffects,
            dialogue: '',
            voiceover: '',
            universalNegativePrompt: 'generic cubes, plain plastic blocks, tofu, dice, wheat noodles, pasta, real food, meat, cartoon, anime, 3d render, bare face, missing goggles',
          }),
        },
      });
    }
    console.log(`Scene ${update.sceneNumber} updated.`);
  }

  console.log('All 12 scenes updated with Modern Black Keyboard & Macro Framing!');
}

main().finally(() => prisma.$disconnect());
