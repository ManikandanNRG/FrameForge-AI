export interface DirectorSuggestionsInput {
  visualStyle?: string;
  genre?: string;
  tone?: string;
  title?: string;
  sourceIdea?: string;
  description?: string;
}

export interface DirectorSuggestionsOutput {
  pills: string[];
  placeholder: string;
}

/**
 * Generates context-aware AI Director Co-Pilot instruction pills and placeholders
 * based on the project's visual style, genre, tone, and story world.
 */
export function getDirectorSuggestions(
  proj: DirectorSuggestionsInput | null | undefined,
  scene?: { action?: string; heading?: string },
): DirectorSuggestionsOutput {
  const isCulinary =
    proj?.visualStyle === "CULINARY_MACRO_ASMR" ||
    proj?.genre?.toLowerCase().includes("culinary") ||
    proj?.genre?.toLowerCase().includes("cook") ||
    proj?.title?.toLowerCase().includes("keyboard stir-fry") ||
    proj?.title?.toLowerCase().includes("steak") ||
    proj?.sourceIdea?.toLowerCase().includes("stir-fry") ||
    proj?.sourceIdea?.toLowerCase().includes("cook") ||
    proj?.sourceIdea?.toLowerCase().includes("keyboard");

  const isAnimeOrKids =
    proj?.visualStyle === "GHIBLI_ANIME" ||
    proj?.visualStyle === "CARTOON_2D" ||
    proj?.visualStyle === "ANIMATION_3D" ||
    proj?.visualStyle === "ANIME" ||
    proj?.genre?.toLowerCase().includes("children") ||
    proj?.genre?.toLowerCase().includes("animation");

  const isVintage =
    proj?.visualStyle === "VINTAGE_FILM" ||
    proj?.genre?.toLowerCase().includes("period") ||
    proj?.genre?.toLowerCase().includes("historical") ||
    proj?.sourceIdea?.toLowerCase().includes("vintage") ||
    proj?.sourceIdea?.toLowerCase().includes("1900") ||
    proj?.sourceIdea?.toLowerCase().includes("pudukkottai");

  const isSciFi =
    proj?.visualStyle?.includes("FANTASY") ||
    proj?.genre?.toLowerCase().includes("sci-fi") ||
    proj?.sourceIdea?.toLowerCase().includes("cyber") ||
    proj?.sourceIdea?.toLowerCase().includes("alchemist") ||
    proj?.sourceIdea?.toLowerCase().includes("e-waste");

  if (isCulinary) {
    return {
      pills: [
        "Speed up to 2X Bayashi tempo",
        "Tighten camera to 90% cutting board macro",
        "Enhance ASMR crunch & snap acoustics",
        "Intensify sizzling oil / pan contact",
        "Add hero crunch pull & chef thumbs-up",
      ],
      placeholder: 'e.g. "Accelerate to 2X micro-actions: punch, butterfly slice, batter dip", "Focus 90% macro on golden crust", "Add sharp thumbs-up to camera"...',
    };
  }

  if (isAnimeOrKids) {
    return {
      pills: [
        "Make dialogue more cheerful & playful",
        "Add whimsical giggle & laughter",
        "Enhance colorful magical atmosphere",
        "Add warm playful teamwork beat",
        "Make motion bouncy & energetic",
      ],
      placeholder: 'e.g. "Make characters cheer together", "Add joyful giggle", "Add soft breeze through flower meadow"...',
    };
  }

  if (isVintage) {
    return {
      pills: [
        "Deepen authentic period atmosphere",
        "Add traditional street foley & chimes",
        "Make dialogue more culturally authentic",
        "Enhance antique sepia lighting",
        "Add dramatic historical weight",
      ],
      placeholder: 'e.g. "Add sound of wooden wheels on red dust", "Show brass oil lamp flickering", "Make dialogue more colloquial in native dialect"...',
    };
  }

  if (isSciFi) {
    return {
      pills: [
        "Increase cyber neon glow & smoke",
        "Add futuristic tech humming foley",
        "Make action faster & urgent",
        "Heighten dramatic suspense & tension",
        "Focus macro on hardware details",
      ],
      placeholder: 'e.g. "Add electronic spark crackle", "Show reflection in chef\'s goggles", "Increase smoke swirling in neon light"...',
    };
  }

  return {
    pills: [
      "Deepen emotional character resonance",
      "Add tense dramatic pause",
      "Make dialogue more punchy & natural",
      "Accelerate scene pacing & urgency",
      "Enhance environmental foley atmosphere",
    ],
    placeholder: 'e.g. "Make character delivery more emotional", "Add dramatic sound of rain outside", "Shorten dialogue for quicker tempo"...',
  };
}

/**
 * Extracts speaker, dialogue text, and emotional delivery cues.
 */
export function extractDialogueDelivery(
  dialogueText = "",
  language = "Tamil",
): { speaker: string; text: string; delivery: string } {
  let speaker = "Character";
  let text = dialogueText;
  let delivery = language.toLowerCase().includes("tamil") ? "இயல்பாகவும், தெளிவாகவும்" : "Natural and expressive";

  const speakerMatch = dialogueText.match(/^(?:\[@?([A-Za-z0-9_-]+)\]|@?([A-Za-z0-9_-]+))\s*(?:speaks|says)?:?\s*(.*)$/i);
  if (speakerMatch) {
    speaker = speakerMatch[1] || speakerMatch[2];
    text = speakerMatch[3] || text;
  }

  // Strip leading and trailing quotes before checking cues
  text = text.replace(/^["“”']+|["“”']+$/g, "").trim();

  // Check for explicit delivery cue in parentheses at start of dialogue, e.g. "(அதிர்ச்சியுடன்) ..." or "(whispering) ..."
  const cueMatch = text.match(/^\s*\(([^)]+)\)\s*(.*)$/);
  if (cueMatch) {
    delivery = cueMatch[1];
    text = cueMatch[2].replace(/^["“”']+|["“”']+$/g, "").trim();
  } else if (text.includes("!")) {
    delivery = language.toLowerCase().includes("tamil") ? "உற்சாகமாகவும், ஆவேசமாகவும்" : "Energetic and dramatic";
  } else if (text.includes("?")) {
    delivery = language.toLowerCase().includes("tamil") ? "ஆர்வத்துடனும், கேள்வியாகவும்" : "Curious and searching";
  }

  return { speaker, text: text.trim(), delivery };
}
