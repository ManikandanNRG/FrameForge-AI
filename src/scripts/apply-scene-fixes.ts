import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmwg5nczz0001u88sld5gnrmd';

  // 1. Update Scene 1 (Viral Hook)
  const scene1 = await prisma.scene.findFirst({
    where: { projectId, sceneNumber: 1 },
    include: { shots: true },
  });

  if (scene1) {
    await prisma.scene.update({
      where: { id: scene1.id },
      data: {
        heading: 'INT. INDUSTRIAL TECH KITCHEN - WOK STATION - VIRAL HOOK (0:00 - 0:05)',
        actionSummary: 'VIRAL HOOK (0:00 - 0:05): In-media-res explosive cold open. The Shadow Alchemist Chef violently tosses a roaring blue-flame wok in ultra slow-motion. A dense shower of glowing, caramelized mechanical keycaps, clicky switches, and copper wire ribbons soar into the air amidst golden flux sparks and white steam before clattering back into the sizzling pan. The chef looks directly into the lens with piercing hazel eyes and a rogue smirk beneath his matte-black mask.',
        estimatedDurationSeconds: 5,
      },
    });

    if (scene1.shots[0]) {
      await prisma.shot.update({
        where: { id: scene1.shots[0].id },
        data: {
          actionDescription: 'VIRAL HOOK (0:00 - 0:05): In-media-res explosive cold open. The Shadow Alchemist Chef violently tosses a roaring blue-flame wok in ultra slow-motion. A dense shower of glowing, caramelized mechanical keycaps, clicky switches, and copper wire ribbons soar into the air amidst golden flux sparks and white steam before clattering back into the sizzling pan. The chef looks directly into the lens with piercing hazel eyes and a rogue smirk beneath his matte-black mask.',
          shotSize: 'MEDIUM_CLOSE_UP',
          cameraAngle: 'LOW_ANGLE',
          cameraMovement: 'DYNAMIC_WOK_TOSS_SLOW_MO',
          targetDurationSeconds: 5,
          imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, explosive viral cold open hook. The Shadow Alchemist Chef (athletic build, tousled wavy dark hair with vintage brass dual-lens tinker goggles, sleek matte-black ergonomic half-mask with gold cheekline vents, piercing hazel eyes, black nitrile grip gloves, distressed leather cross-back apron). Action & Blocking: High-intensity wok toss frozen in mid-air slow motion. In the foreground, a roaring blue gas flame engulfs the rounded base of a seasoned carbon steel wok. Leaping out of the wok is a dense, glistening arc of caramelized mechanical keycaps (beige, grey, and vibrant red Cherry MX keycaps coated in sizzling amber flux glaze), accompanied by roasted mechanical switches and flying golden electrical sparks. In the background, the chef holds the heavy wooden handle with both gloved hands, gazing intensely into the camera lens with a mischievous rogue smirk. Environment: Dark moody industrial tech kitchen with glowing cyan and amber neon signs, stacks of retro CRT monitors blurred in the background. Cinematography: Dynamic low-angle 35mm lens, f/1.8 shallow depth of field, high-speed shutter freezing flying keycaps and sparks, golden firelight illumination, 1080p full HD, tactile raw textures.',
          videoPrompt: '[The Shadow Alchemist Chef]. VIRAL HOOK (0:00 - 0:05). Action & Kinematics: High-speed slow motion. The chef vigorously tosses the heavy carbon steel wok over roaring blue flames. Sizzling caramelized mechanical keycaps, switches, and golden sparks erupt upward in an arc toward the camera, then fall cleanly back into the wok with thunderous physical clatter. Chef locks eyes with the camera, tilting his head with a confident smirk. Camera Movement: SLOW_PULL_BACK_WHILE_TILT, smooth 24fps motion blur. Physical Invariants: Chef hands remain locked in black grip gloves, fire physics and keycap gravity realistic, zero morphing objects. Setting: High-heat wok station in industrial tech kitchen.',
          negativeConstraints: JSON.stringify({
            audioPrompt: 'Binaural Foley: Massive explosive bass boom followed by roaring whoosh of blue gas flame, high-frequency crackle of solder flux, and a heavy cascade of hard plastic keycaps clattering against hot carbon steel (*TAK-TAK-CLATTER-SSSHHH*).',
            soundEffects: 'Gas flame whoosh, sizzling flux, resonant keycap clatter on steel',
            dialogue: '',
            voiceover: '',
            universalNegativePrompt: 'wheat noodles, edible pasta, lo mein, real grocery food, cartoon, anime, 3d render, uncovered face, missing goggles, extra fingers',
          }),
        },
      });
    }
  }

  // 2. Update Scene 11 (Hero Plating - Glazed Keycaps Mountain)
  const scene11 = await prisma.scene.findFirst({
    where: { projectId, sceneNumber: 11 },
    include: { shots: true },
  });

  if (scene11) {
    await prisma.scene.update({
      where: { id: scene11.id },
      data: {
        heading: 'INT. INDUSTRIAL TECH KITCHEN - PLATING TABLE - HERO REVEAL',
        actionSummary: 'Macro eye-level gourmet hero shot. A Michelin-star stir-fry made ENTIRELY out of mechanical keyboard components is piled high onto a dark etched motherboard serving slate. The dish is composed 80% of glossy glazed vintage keycaps, tangled with thin spiral copper wire ribbons and roasted switches. With surgical precision, the chefs black-gloved hand uses titanium tweezers to place a pristine glowing ruby-red ESC keycap on the very peak.',
        estimatedDurationSeconds: 7,
      },
    });

    if (scene11.shots[0]) {
      await prisma.shot.update({
        where: { id: scene11.shots[0].id },
        data: {
          actionDescription: 'Macro eye-level gourmet hero shot. A Michelin-star stir-fry made ENTIRELY out of mechanical keyboard components is piled high onto a dark etched motherboard serving slate. The dish is composed 80% of glossy glazed vintage keycaps, tangled with thin spiral copper wire ribbons and roasted switches. With surgical precision, the chefs black-gloved hand uses titanium tweezers to place a pristine glowing ruby-red ESC keycap on the very peak.',
          shotSize: 'MACRO_CLOSE_UP',
          cameraAngle: 'EYE_LEVEL',
          cameraMovement: 'SLOW_HORIZONTAL_SLIDER',
          targetDurationSeconds: 7,
          imagePrompt: 'Cinematic 9:16 vertical photorealistic film still, macro eye-level gourmet hero shot. A gourmet Michelin-star stir-fry made ENTIRELY out of mechanical keyboard parts, beautifully piled high on a dark etched matte-black motherboard serving platter. The dish is composed 80% of glossy glazed vintage mechanical keycaps (beige, dark grey, and vibrant retro keys coated in a rich, glistening translucent amber-caramel glaze like roasted gourmet chestnuts), tangled with thin spiral-wound raw copper wire noodles, roasted mechanical clicky switches, and garnished with finely diced emerald-green circuit board microchips. In the background, the black-gloved hand of The Shadow Alchemist Chef uses precision titanium tweezers to delicately place one pristine, glowing ruby-red ESC keycap onto the very peak of the mound. Lighting & Style: Warm golden top-down food-styling spotlight, delicate wisps of steam rising from the hot caramelized keycaps, razor-sharp focus on the embossed letters of the keys and the metallic sheen of the switches, f/2.0 macro depth of field. Negative Prompt: wheat noodles, edible pasta, flour spaghetti, lo mein, meat, chicken, broccoli, real grocery food, blurry textures.',
          videoPrompt: '[The Shadow Alchemist Chef]. Action & Kinematics: Macro eye-level glide. The camera smoothly glides sideways across the steaming mound of glistening glazed mechanical keycaps and copper spirals. In the chefs black-gloved hand, titanium precision tweezers lower a glowing red ESC keycap onto the summit, letting it rest with a sharp, delicate tap. Thin aromatic steam wisps rise upward into the spotlight. Camera Movement: SLOW_HORIZONTAL_SLIDER, smooth cinematic 24fps motion blur. Physical Invariants: Chef hands remain locked in black grip gloves, tools and tweezers rigid, motherboard slate completely stationary, zero morphing objects. Setting: Gourmet plating bench.',
          negativeConstraints: JSON.stringify({
            audioPrompt: 'Binaural Foley: Delicate high-pitched metallic click (*TING*) as tweezers deposit the keycap, gentle lingering hiss of escaping steam, deep satisfying bass thrum.',
            soundEffects: 'Tweezers click on slate, gentle steam hiss',
            dialogue: '',
            voiceover: '',
            universalNegativePrompt: 'wheat noodles, edible pasta, flour spaghetti, lo mein, meat, chicken, broccoli, real grocery food, cartoon, anime, 3d render',
          }),
        },
      });
    }
  }

  console.log('Successfully updated Scene 1 and Scene 11 in database!');
}

main().finally(() => prisma.$disconnect());
