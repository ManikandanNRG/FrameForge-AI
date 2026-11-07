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
  targetRuntimeSeconds?: number;
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
  return `You are a world-class screenwriter and narrative director specialising in ${styleNote(brief.visualStyle)} cinema.
Film Idea: "${brief.sourceIdea}"
Genre: ${brief.genre ?? "unspecified"} | Tone: ${brief.tone ?? "unspecified"}
Target runtime: ${brief.targetRuntimeSeconds ? `${brief.targetRuntimeSeconds} seconds (~${Math.round(brief.targetRuntimeSeconds / 6)} shots)` : `~${brief.targetRuntimeMinutes} minutes`} | Audience: ${brief.audience ?? "general"}
Target Story Language: "${brief.storyLanguage}" | Dialogue policy: ${dialogueNote(brief.dialogueMode)}
Visual style: ${styleNote(brief.visualStyle)} — keep all visual elements consistent with this aesthetic.

CRITICAL MULTI-LINGUAL & SCRIPT RULES:
1. DIALOGUE & VOICEOVER NARRATION: MUST be written in the specified target language: "${brief.storyLanguage}" (e.g., if Tamil, write authentic Tamil lines in Tamil script; if Hindi, write in Devanagari script; if English, write in English).
2. VISUAL ACTION LINES & CAMERA CONTEXT: Keep visual descriptions in clear, vivid cinematic English so downstream AI video generators (Google Flow / Veo, Kling, Sora) understand the visuals, character actions, and camera movements with 100% precision.
3. Return valid JSON only. No prose outside JSON.`;
}

export function loglinePrompt(): string {
  return `Write a compelling logline (1–2 sentences) and a premise (2–3 sentences) for this film.
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
Write a complete professional scene-by-scene screenplay for a ~${brief.targetRuntimeMinutes}-minute ${styleNote(brief.visualStyle)} film with full audio, voice-over, and speech scripts.
Target Language for Dialogue and Voice-Over: "${brief.storyLanguage}".

CRITICAL SCREENPLAY LOGIC & DRAMATIC CAUSALITY STANDARDS:
1. AIRTIGHT CAUSE-AND-EFFECT:
   - Every character action, emotion, and reaction MUST be motivated by a clear physical or sensory catalyst.
   - If a character drops an object in shock or asks "Why are you screaming?", the screenplay MUST clearly establish what they saw or heard (e.g., hearing frantic cries echoing in advance, seeing a breathless child trembling and pointing in terror).
   - Characters must NEVER react without motivation or appear disconnected from what just happened in the preceding scene.
2. DIALOGUE LOGIC & CONTINUITY:
   - Spoken dialogue in "${brief.storyLanguage}" must organically match the immediate physical stakes and carry forward narrative momentum.
   - When a character delivers urgent news, subsequent characters must acknowledge it and react realistically (e.g., "What the boy said is true! The wild elephant has broken in!").
3. MUTUAL EXCLUSIVITY OF AUDIO BEATS:
   - When characters are actively speaking dialogue, keep narration silent so character voices take center stage. Use voice-over primarily during visual establishing or reflective moments.

Every scene must have:
- heading: INT./EXT. LOCATION - TIME
- action: visual action lines describing character movements, setting, and cinematic atmosphere (in English)
- voiceover: compelling voice-over (V.O.) narration script that guides the audience and conveys emotional depth (IN "${brief.storyLanguage}")
- dialogue: spoken character dialogue and speech lines (IN "${brief.storyLanguage}", formatted as 'CHARACTER: "Spoken line here"')
- audioScript: detailed audio design, ambient soundscape (e.g. rustling breeze, birds, flowing water, tools, distant bells), Foley sound effects, and musical score tone
- estimatedDurationSeconds: duration in seconds (15-60s)

Return JSON matching this shape exactly:
{
  "title": "Film Title",
  "scenes": [{
    "sceneNumber": 1,
    "heading": "EXT. VILLAGE FIELDS - DAWN",
    "location": "Village Fields",
    "timeOfDay": "DAWN",
    "action": "Visual description...",
    "voiceover": "Narrator (V.O.) script in ${brief.storyLanguage}...",
    "dialogue": "Character spoken lines in ${brief.storyLanguage}...",
    "audioScript": "Sound design, Foley, ambient audio, and score...",
    "estimatedDurationSeconds": 30
  }],
  "totalEstimatedDurationSeconds": N
}`;
}
