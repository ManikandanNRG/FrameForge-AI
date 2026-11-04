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
  characterTag?: string;
  characterName?: string;
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
  let characterTag = "";
  let characterName = "";

  try {
    const parsed = JSON.parse(negativeConstraints || "{}");
    if (typeof parsed === "object" && parsed !== null) {
      voiceover = parsed.voiceover || "";
      dialogue = parsed.dialogue || "";
      audioPrompt = parsed.audioPrompt || parsed.soundEffects || "";
      characterAnchor = parsed.characterAnchor || "";
      characterTag = parsed.characterTag || "";
      characterName = parsed.characterName || (characterTag ? characterTag.replace(/^@/, "") : "");
    }
  } catch {}

  if (voiceover || dialogue || audioPrompt || characterAnchor || characterTag) {
    if (!characterTag && characterAnchor) {
      const match = characterAnchor.match(/^([A-Za-z0-9_-]+):/);
      if (match) {
        characterName = match[1];
        characterTag = `@${match[1]}`;
      }
    }
    return { voiceover, dialogue, audioPrompt, characterAnchor, characterTag, characterName };
  }

  // Atmospheric defaults tailored to the scene context
  if (sceneNumber === 1) {
    return {
      voiceover: "கிழக்கு பனைமரங்களுக்கு மேல் அதிகாலை சூரியன் உதிக்கும் முன்பே, இந்த செம்மண் ஓடும் நீரின் பாடலுக்கு விழித்துக்கொள்கிறது. (\"Before the morning sun crests the eastern palms, the red soil wakes to the ancient song of flowing water.\")",
      dialogue: "",
      audioPrompt: "Gentle morning breeze rustling through coconut palms, distant temple bells, chirping songbirds, flowing canal water.",
      characterTag: "",
      characterName: "",
    };
  }
  if (sceneNumber === 2 && shotNumber === 1) {
    return {
      voiceover: "ஒவ்வொரு விடியலும் வானத்தில் தொடங்குவதில்லை, ஒரு தந்தை தன் நிலத்திற்கும் குடும்பத்திற்கும் தரும் அமைதியான வாக்குறுதியில்தான் தொடங்குகிறது. (\"Every sunrise begins with a father's quiet promise to his land.\")",
      dialogue: '@Murugan speaks in a gentle fatherly tone: "நன்றாக சாப்பிடு, கண்ணா. நாளைக்கான விதைகளை இன்றுதான் நாம் விதைக்க வேண்டும்." ("Eat well, little one. Today we sow the seeds for tomorrow.")',
      audioPrompt: "Clay pot clinking, wood fire crackling softly, rooster crowing in the distant yard.",
      characterTag: "@Murugan",
      characterName: "Murugan",
    };
  }
  if (sceneNumber === 2 && shotNumber === 2) {
    return {
      voiceover: "படிப்படியாக, தலைமுறைகள் இந்த செம்மண்ணை உழைப்பால் பொன் அறுவடையாக மாற்றியிருக்கின்றன. (\"Step by step, generations have walked this beaten red dirt into golden harvest.\")",
      dialogue: '@Murugan speaks in a humble, devoted tone: "வணக்கம் பூமி தாயே! இன்று எங்கள் கைகளை ஆசீர்வதியுங்கள்." ("Vanakkam, Mother Earth! Bless our hands today.")',
      audioPrompt: "Footsteps on dry mud patio, heavy wooden door creaking softly, cool morning breeze.",
      characterTag: "@Murugan",
      characterName: "Murugan",
    };
  }
  if (sceneNumber === 3) {
    return {
      voiceover: "காளைகளுடன் இணைந்து உழுவது, இந்த சேற்றில் எழுதப்பட்ட ஒரு பழங்காலப் பாடல். (\"Together with his bullocks, the rhythm of plowing is an ancient song written into the mud.\")",
      dialogue: '@Murugan calls out to his bullocks: "ஹேய்... போ வேலு! களிமண்ணில் நேர்கோடு போடு!" ("Heii... go on, Velu! Straight line through the clay!")',
      audioPrompt: "Wooden plow cutting wet earth, cattle bells clinking rhythmically, farmer calls, splashing mud.",
      characterTag: "@Murugan",
      characterName: "Murugan",
    };
  }
  if (sceneNumber === 4) {
    return {
      voiceover: "இங்கு வியர்வையும் தண்ணீரும் ஒன்றாகிவிடுகிறது. ஒவ்வொரு கைப்பிடி நாற்றிலும் இந்த பூமியின் இதயத்துடிப்பு இருக்கிறது. (\"Here, sweat and water become one. In every handful of green saplings lies the heartbeat of the land.\")",
      dialogue: '@Murugan speaks with deep conviction: "மண்ணில் ஆழமாக நடுங்கள். நதியின் ஜீவன் வேர்களை நனைக்கட்டும்." ("Press them deep into the soil. Let the roots drink the life of the river.")',
      audioPrompt: "Water splashing around farmer waist, rhythmic planting into soft clay, distant peacock call, afternoon cicadas.",
      characterTag: "@Murugan",
      characterName: "Murugan",
    };
  }
  if (sceneNumber === 5 && shotNumber === 1) {
    return {
      voiceover: "செவ்வானம் பனைமரங்களின் பின்னே சாயும்போது, நெல்வயல்கள் அந்திப் பொழுதின் குளிர்ந்த காற்றில் மூச்சுவிடுகின்றன. (\"As the crimson sun dips behind the palms, the fields breathe in the cool evening shade.\")",
      dialogue: "",
      audioPrompt: "Evening crickets chirping, gentle breeze through ripening stalks, distant temple chimes.",
      characterTag: "@Murugan",
      characterName: "Murugan",
    };
  }
  if (sceneNumber === 5 && shotNumber === 2) {
    return {
      voiceover: "களைத்த உடல்கள், ஆனால் தளராத உள்ளங்கள். இந்த பூமிக்கு அளித்த மற்றொரு நாள், மற்றொரு அறுவடையின் வாக்குறுதி. (\"Weary bodies, but unbroken spirits. Another day given to the earth, another harvest promised.\")",
      dialogue: '@Selvan speaks: "இன்று நல்ல வேலை செய்தோம், முருகா." @Murugan speaks: "இறைவனின் அருள் அண்ணா, நம் பூமி ஒருபோதும் பொய் சொல்லாது." ("Good work today, Murugan." / "By God\'s grace, brother. Our soil never lies.")',
      audioPrompt: "Warm laughter, tea cups clinking, evening breeze in ancient banyan leaves, distant cow mooing.",
      characterTag: "@Murugan",
      characterName: "Murugan",
    };
  }

  return {
    voiceover: `With steady devotion, the rhythm of village life flows through ${actionDescription.slice(0, 60)}.`,
    dialogue: "",
    audioPrompt: "Ambient nature sounds, gentle breeze, natural environment audio.",
    characterTag: "",
    characterName: "",
  };
}

