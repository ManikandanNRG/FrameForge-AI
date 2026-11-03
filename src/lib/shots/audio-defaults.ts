/**
 * Helper to retrieve or derive the Voiceover, Dialogue, and Sound Design
 * for any shot in a film. Ensures backwards compatibility for existing shots
 * as well as structured data for newly generated shots.
 */
export interface ShotAudioData {
  voiceover: string;
  dialogue: string;
  audioPrompt: string;
  characterAnchor?: string;
}

export function getShotAudioData(
  negativeConstraints: string | null | undefined,
  sceneNumber: number,
  shotNumber: number,
  actionDescription = "",
): ShotAudioData {
  let voiceover = "";
  let dialogue = "";
  let audioPrompt = "";
  let characterAnchor = "";

  try {
    const parsed = JSON.parse(negativeConstraints || "{}");
    if (typeof parsed === "object" && parsed !== null) {
      voiceover = parsed.voiceover || "";
      dialogue = parsed.dialogue || "";
      audioPrompt = parsed.audioPrompt || parsed.soundEffects || "";
      characterAnchor = parsed.characterAnchor || "";
    }
  } catch {}

  if (voiceover || dialogue || audioPrompt || characterAnchor) {
    return { voiceover, dialogue, audioPrompt, characterAnchor };
  }

  // Atmospheric defaults tailored to the scene context
  if (sceneNumber === 1) {
    return {
      voiceover: "Before the morning sun crests the eastern palms, the red soil wakes to the ancient song of flowing water.",
      dialogue: "",
      audioPrompt: "Gentle morning breeze rustling through coconut palms, distant temple bells, chirping songbirds, flowing canal water.",
    };
  }
  if (sceneNumber === 2 && shotNumber === 1) {
    return {
      voiceover: "Every sunrise begins not in the sky, but with a father's quiet promise to his land and family.",
      dialogue: 'MURUGAN: "Eat well, little one. Today we sow the seeds for tomorrow."',
      audioPrompt: "Clay pot clinking, wood fire crackling softly, rooster crowing in the distant yard.",
    };
  }
  if (sceneNumber === 2 && shotNumber === 2) {
    return {
      voiceover: "Step by step, generations have walked this beaten red dirt into golden harvest.",
      dialogue: 'MURUGAN: "Vanakkam, Mother Earth. Bless our hands today."',
      audioPrompt: "Footsteps on dry mud patio, heavy wooden door creaking softly, cool morning breeze.",
    };
  }
  if (sceneNumber === 3) {
    return {
      voiceover: "Together with his bullocks, the rhythm of plowing is an ancient song written into the mud.",
      dialogue: 'MURUGAN: "Heii... go on, Velu! Straight line through the clay!"',
      audioPrompt: "Wooden plow cutting wet earth, cattle bells clinking rhythmically, farmer calls, splashing mud.",
    };
  }
  if (sceneNumber === 4) {
    return {
      voiceover: "Here, sweat and water become one. In every handful of green saplings lies the heartbeat of the land.",
      dialogue: 'MURUGAN: "Press them deep into the soil. Let the roots drink the life of the river."',
      audioPrompt: "Water splashing around farmer waist, rhythmic planting into soft clay, distant peacock call, afternoon cicadas.",
    };
  }
  if (sceneNumber === 5 && shotNumber === 1) {
    return {
      voiceover: "As the crimson sun dips behind the palms, the fields breathe in the cool evening shade.",
      dialogue: "",
      audioPrompt: "Evening crickets chirping, gentle breeze through ripening stalks, distant temple chimes.",
    };
  }
  if (sceneNumber === 5 && shotNumber === 2) {
    return {
      voiceover: "Weary bodies, but unbroken spirits. Another day given to the earth, another harvest promised.",
      dialogue: 'SELVAN: "Good work today, Murugan." MURUGAN: "By God\'s grace, brother. Our soil never lies."',
      audioPrompt: "Warm laughter, tea cups clinking, evening breeze in ancient banyan leaves, distant cow mooing.",
    };
  }

  return {
    voiceover: `With steady devotion, the rhythm of village life flows through ${actionDescription.slice(0, 60)}.`,
    dialogue: "",
    audioPrompt: "Ambient nature sounds, gentle breeze, natural environment audio.",
  };
}

