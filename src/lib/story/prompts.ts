/**
 * Prompt templates for story generation (spec §7.9, §7.8).
 * Visual style is included in every prompt so it flows through from brief
 * to story to later production-bible and shot prompts.
 */

export interface ProjectBrief {
  title: string;
  sourceIdea: string;
  genre?: string;
  tone?: string;
  visualStyle: string;
  dialogueMode: string;
  targetRuntimeMinutes: number;
  audience?: string;
  storyLanguage: string;
}

function styleNote(style: string): string {
  const map: Record<string, string> = {
    PHOTOREALISTIC_CINEMATIC: "photorealistic cinematic style",
    ANIME: "anime style",
    CARTOON_2D: "2D cartoon style",
    ANIMATION_3D: "3D animated film style",
    DOCUMENTARY: "documentary realism style",
    STOP_MOTION: "stop-motion animation style",
    VINTAGE_FILM: "vintage film / retro style",
    COMIC_BOOK: "comic-book / graphic novel style",
    WATERCOLOR: "watercolor illustration style",
    FANTASY_CONCEPT_ART: "fantasy concept art style",
    CUSTOM: "custom visual style",
  };
  return map[style] ?? style.toLowerCase().replace(/_/g, " ");
}

function dialogueNote(mode: string): string {
  if (mode === "NO_DIALOGUE") return "The film has no dialogue — convey story through action and visuals only.";
  if (mode === "VOICEOVER")   return "Use voice-over narration instead of on-screen dialogue.";
  return "The film may include spoken dialogue.";
}

export function systemPrompt(brief: ProjectBrief): string {
  return `You are a professional screenwriter specialising in ${styleNote(brief.visualStyle)} films for YouTube.
The film idea: "${brief.sourceIdea}"
Genre: ${brief.genre ?? "unspecified"} | Tone: ${brief.tone ?? "unspecified"}
Target runtime: ~${brief.targetRuntimeMinutes} minutes | Audience: ${brief.audience ?? "general"}
Language: ${brief.storyLanguage} | Dialogue policy: ${dialogueNote(brief.dialogueMode)}
Visual style: ${styleNote(brief.visualStyle)} — keep all story elements consistent with this style.
Always respond with valid JSON only. No prose outside JSON.`;
}

export function loglinePrompt(): string {
  return `Write a logline (1–2 sentences) and a premise (2–3 sentences) for this film.
Return JSON: { "logline": "...", "premise": "..." }`;
}

export function synopsisPrompt(logline: string): string {
  return `Based on this logline and premise:\n${logline}\n\nWrite a 3–5 paragraph synopsis covering the full story arc.
Return JSON: { "synopsis": "..." }`;
}

export function outlinePrompt(synopsis: string): string {
  return `Based on this synopsis:\n${synopsis}\n\nCreate a 3-act story outline with sequences.
Return JSON: { "acts": [{ "actNumber": 1, "title": "...", "summary": "...", "sequences": ["..."] }], "estimatedRuntimeMinutes": N }`;
}

export function characterArcsPrompt(outline: string): string {
  return `Based on this outline:\n${outline}\n\nList the main characters with their roles and arcs.
Return JSON: { "characters": [{ "name": "...", "role": "protagonist|antagonist|supporting", "arc": "..." }] }`;
}

export function screenplayPrompt(brief: ProjectBrief, outline: string, characterArcs: string): string {
  return `Based on this outline:\n${outline}\n\nCharacters:\n${characterArcs}\n\n
Write a full scene-by-scene screenplay breakdown for a ~${brief.targetRuntimeMinutes}-minute ${styleNote(brief.visualStyle)} film.
Each scene: INT./EXT. LOCATION - TIME, action description${brief.dialogueMode === "NO_DIALOGUE" ? ", no dialogue" : ", optional dialogue"}.
Include estimated duration in seconds per scene.
Return JSON matching this shape exactly:
{
  "title": "Film Title",
  "scenes": [{
    "sceneNumber": 1,
    "heading": "EXT. LIGHTHOUSE - DAY",
    "location": "Lighthouse",
    "timeOfDay": "DAY",
    "action": "...",
    "dialogue": "optional",
    "estimatedDurationSeconds": 30
  }],
  "totalEstimatedDurationSeconds": N
}`;
}
