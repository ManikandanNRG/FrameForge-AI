import { z } from "zod";
import type { TextGenerationProvider } from "@/lib/providers/types";

export interface SceneAuditResult {
  sceneNumber: number;
  heading: string;
  hookScore: number; // 0-100
  dialogueScore: number; // 0-100
  visualFeasibilityScore: number; // 0-100
  pacingScore: number; // 0-100
  issues: string[];
  directorRecommendation: string;
}

export interface ScriptAuditReport {
  overallScore: number; // 0-100
  retentionRating: "VIRAL_MASTERPIECE" | "HIGH_RETENTION" | "MODERATE_RETENTION" | "HIGH_DROP_OFF_RISK";
  breakdown: {
    hookStrength: number; // First 3s scroll stop
    narrativeCausality: number; // Scene-to-scene cause and effect
    dialogueNaturalness: number; // Colloquial, emotional authenticity
    viralPayoff: number; // Climax & shareability
    aiVisualFeasibility: number; // Single-station physics & generator stability
  };
  executiveDirectorSummary: string;
  sceneAudits: SceneAuditResult[];
  viralSocialStrategy: {
    youtubeShortsTip: string;
    instagramReelsTip: string;
    retentionTrapWarning?: string;
  };
}

export interface RawSceneInput {
  sceneNumber: number;
  heading: string;
  location: string;
  timeOfDay: string;
  action: string;
  dialogue?: string;
  voiceover?: string;
  audioScript?: string;
  estimatedDurationSeconds?: number;
}

/**
 * Heuristic Quick-Audit: Instantly analyzes script structure, dialogue quality,
 * and viral parameters before or in parallel with LLM evaluation.
 */
export function quickAuditScript(
  scenes: RawSceneInput[],
  projectMeta: {
    genre?: string | null;
    tone?: string | null;
    visualStyle?: string | null;
    storyLanguage?: string | null;
    dialogueMode?: string | null;
    sourceIdea?: string | null;
  }
): ScriptAuditReport {
  const lang = (projectMeta.storyLanguage || "English").toLowerCase();
  const isTamil = lang.includes("tamil");
  const isKids =
    (projectMeta.genre || "").toLowerCase().includes("kid") ||
    (projectMeta.visualStyle || "").toUpperCase().includes("GHIBLI") ||
    (projectMeta.visualStyle || "").toUpperCase().includes("CARTOON");
  const isCulinary =
    (projectMeta.visualStyle || "").toUpperCase().includes("CULINARY") ||
    (projectMeta.genre || "").toLowerCase().includes("cooking");

  const isInedibleCooking =
    isCulinary ||
    /\b(keyboard|keycaps?|cherry mx|switch(?:es)?|pcb|circuit board|motherboard|airbuds?|airpods?|earphones?|smartphones?|mobile phone|battery|batteries|screws?|bolts?|copper wire|stones?|granite|rocks?|hardware|e-waste|tech scrap|non-food|inedible)\b/i.test((projectMeta.sourceIdea || "") + " " + (projectMeta.genre || ""));

  const sceneAudits: SceneAuditResult[] = [];
  let totalHook = 0;
  let totalDialogue = 0;
  let totalFeasibility = 0;
  let totalPacing = 0;

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const prevSc = i > 0 ? scenes[i - 1] : null;
    const issues: string[] = [];
    let hook = 85;
    let dialogueScore = 90;
    let feasibility = 92;
    let pacing = 88;
    let recommendation = "Solid cinematic blocking.";

    // Scene 1 Hook Inspection
    if (i === 0) {
      const lowerAct = sc.action.toLowerCase();
      const hasHookAction = /\b(sprint|dash|swoop|explosive|race|zoom|gasp|screams?|reveal|burst|plunge|shout|leaps?|slam|slams?|cleaver|shatter|sparks?|flames?|whoosh|erupts?|shower of)\b/i.test(lowerAct);
      const isPassive = /\b(standing|looking at|observes|walks slowly|pondering|sits|rests)\b/i.test(lowerAct);

      if (isInedibleCooking) {
        const has4BeatElements = /\b(slam|pull|pluck|chop|cleaver|sizzle|wok|pan|sparks?|burst|toss)\b/i.test(lowerAct);
        if (!has4BeatElements || isPassive) {
          hook = 55;
          issues.push("Inedible ASMR Scene 1 must be an explosive 4-beat viral hook (Slam object -> Pluck keys -> Cleaver chop -> Pan sizzle/sparks). Slow observation causes immediate swipe away.");
          recommendation = "Reframe Scene 1 as an explosive 4-beat viral hook teaser (Slam object on board -> Macro key/part pop -> Heavy cleaver chop -> Wok fireball sizzle) with chef rogue smirk.";
        } else {
          hook = 98;
          recommendation = "High-velocity 4-beat viral hook. Maximizes short-form audience retention.";
        }
      } else if (isPassive && !hasHookAction) {
        hook = 60;
        issues.push("Opening is too passive for YouTube Shorts/Reels. Viewers may swipe away within 2 seconds.");
        recommendation = "Start immediately in media res with kinetic physical action, sensory reveal, or high curiosity gap.";
      } else if (hasHookAction) {
        hook = 96;
        recommendation = "Strong scroll-stopping visual hook. Immediately captures viewer curiosity.";
      }
    }

    // Scene 2 Premature Stove Check for Inedible Harvest
    if (i === 1 && isInedibleCooking) {
      const lowerAct = sc.action.toLowerCase();
      const hasPrematureStove = /\b(stove|pan|skillet|wok|burner|sizzle|flame|boiling)\b/i.test(lowerAct);
      if (hasPrematureStove) {
        feasibility = 60;
        issues.push("Premature cooking in Harvest scene: Scene 2 should be the cold origin and harvest (unplugging, taking from rack). Mentioning stoves or flames will cause AI to render cooking before prep starts.");
        recommendation = "Keep Scene 2 strictly to cold salvage and harvest (unplugging cable, carrying to workbench). No stoves or flames active.";
      }
    }

    // Dialogue Quality & Linguistic Naturalness
    const diagText = sc.dialogue || "";
    const voText = sc.voiceover || "";
    const combinedSpeech = `${diagText} ${voText}`.trim();

    if (combinedSpeech.length > 0) {
      if (isTamil) {
        // Flag bizarre literal idiom translations like "in our blood" -> "குருதியில்"
        if (/(குருதி|குருதியில்|குருதியில் உன்|குருதி சிந்த)/.test(combinedSpeech) && isKids) {
          dialogueScore -= 35;
          issues.push("Literal translation hallucination: Used 'குருதி' (blood) as a mistranslated idiom for speed/race. This sounds bizarre and unintelligible in Tamil.");
          recommendation = "Use natural spoken speed expressions like 'மின்னல் வேகத்துல ஓடு!' or 'காற்றை விட வேகமா பாயுது!'.";
        }

        // Flag hallucinated animal addressing
        if (combinedSpeech.includes("குருவி") && !sc.action.toLowerCase().includes("sparrow") && !sc.action.toLowerCase().includes("bird")) {
          dialogueScore -= 15;
          issues.push("Entity hallucination: Spoken line addresses 'குருவி' (sparrow), but no bird or sparrow is present in this scene.");
        }

        // Detect formal/bookish Tamil or robotic translation markers
        const isBookish = /(பதிவு செய்யும்|அடையாளம்|கூட்டணி|நிகழ்த்துகிறது|செய்கிறான்|இடம் பெறுகிறார்|வெற்றி பெறும்|வெல்லக்கூடிய நேரம்|வந்தா குருவி)/.test(combinedSpeech);
        const hasNaturalSpokenMarkers = /(அடேய்|அக்கா|அப்பா|அம்மா|பாரு|வேகமா|சூப்பர்|ஐயோ|தம்பி|வாங்க|வந்தாச்சு|மின்னல்|துள்ளி|பாயுது|ஜெயிப்போம்|சாம்பியன்)/.test(combinedSpeech);

        if (isBookish && !hasNaturalSpokenMarkers) {
          dialogueScore -= 25;
          issues.push("Dialogue sounds overly formal or machine-translated rather than natural spoken colloquial Tamil.");
          recommendation = isKids
            ? "Use sweet, lively children's colloquial Tamil (e.g. 'அக்கா! அங்கே பாரு, முயல் குட்டி நம்மை விட வேகமா ஓடுது!')."
            : "Convert formal phrasing into authentic colloquial spoken dialogue matching real cinema.";
        }
      }

      // Check if Voiceover mode was requested but spoken dialogue was used
      if (projectMeta.dialogueMode === "VOICEOVER" && sc.dialogue && sc.dialogue.trim().length > 0) {
        issues.push("Project is set to Voiceover narration, but scene contains character lipsync dialogue instead of narrator voiceover.");
        dialogueScore -= 15;
      }
    }

    // Pure ASMR Check
    if (isCulinary || projectMeta.dialogueMode === "PURE_ASMR_FOLEY") {
      if (sc.dialogue && sc.dialogue.trim().length > 0) {
        issues.push("ASMR/Culinary mode strictly requires zero spoken dialogue to preserve Foley immersion.");
        dialogueScore = 50;
      }
    }

    // Spatial & Generator Feasibility (Station Teleportation Guard)
    if (isCulinary) {
      const lowerAct = sc.action.toLowerCase();
      const hasCutting = /\b(chop|slice|cutting board)\b/i.test(lowerAct);
      const hasStove = /\b(stove|pan|skillet|sear|flame)\b/i.test(lowerAct);
      if (hasCutting && hasStove) {
        feasibility = 65;
        issues.push("Station collision: Combines cutting board prep and stove cooking in a single 8-second clip. AI generators will hallucinate.");
        recommendation = "Isolate into two separate shots: one for knife prep on board, one for hot skillet sear on stove.";
      }

      if (isInedibleCooking) {
        if (lowerAct.includes("noodle") && !lowerAct.includes("copper") && !lowerAct.includes("wire") && !lowerAct.includes("ribbon")) {
          feasibility -= 20;
          issues.push("Ambiguous food term: Used 'noodles' without qualifying 'copper wire' or 'ribbon cable'. This causes AI diffusion models to draw wheat pasta/lo mein instead of technical hardware.");
          recommendation = "Specify 'spiral raw copper wire noodles' or 'flat ribbon cables' to prevent pasta hallucinations.";
        }
      }
    }

    // Causality with previous scene
    if (prevSc) {
      if (sc.location !== prevSc.location && !sc.heading.includes("EXT.") && !sc.heading.includes("INT.")) {
        pacing -= 10;
        issues.push("Sudden unestablished location jump from previous scene.");
      }
    }

    totalHook += hook;
    totalDialogue += dialogueScore;
    totalFeasibility += feasibility;
    totalPacing += pacing;

    sceneAudits.push({
      sceneNumber: sc.sceneNumber,
      heading: sc.heading,
      hookScore: hook,
      dialogueScore,
      visualFeasibilityScore: feasibility,
      pacingScore: pacing,
      issues,
      directorRecommendation: recommendation,
    });
  }

  const n = Math.max(1, scenes.length);
  const avgHook = Math.round(totalHook / n);
  const avgDialogue = Math.round(totalDialogue / n);
  const avgFeasibility = Math.round(totalFeasibility / n);
  const avgPacing = Math.round(totalPacing / n);
  const viralPayoff = Math.min(100, Math.round((avgHook * 0.4) + (avgPacing * 0.3) + (avgDialogue * 0.3)));

  const overallScore = Math.round(
    avgHook * 0.3 + avgDialogue * 0.25 + avgFeasibility * 0.2 + avgPacing * 0.15 + viralPayoff * 0.1
  );

  let retentionRating: ScriptAuditReport["retentionRating"] = "HIGH_RETENTION";
  if (overallScore >= 90) retentionRating = "VIRAL_MASTERPIECE";
  else if (overallScore >= 78) retentionRating = "HIGH_RETENTION";
  else if (overallScore >= 65) retentionRating = "MODERATE_RETENTION";
  else retentionRating = "HIGH_DROP_OFF_RISK";

  return {
    overallScore,
    retentionRating,
    breakdown: {
      hookStrength: avgHook,
      narrativeCausality: avgPacing,
      dialogueNaturalness: avgDialogue,
      viralPayoff,
      aiVisualFeasibility: avgFeasibility,
    },
    executiveDirectorSummary:
      overallScore >= 90
        ? "Exemplary screenplay structure. Dynamic scroll-stopping hook, authentic natural dialogue rhythm, and high viral retention potential across YouTube Shorts and Instagram Reels."
        : overallScore >= 75
        ? "Strong cinematic foundation with solid visual imagery. Minor dialogue polish or tighter Scene 1 hook pacing recommended to maximize viewer completion rate."
        : "Critical retention bottlenecks detected. Pacing or dialogue requires director refinement to prevent viewer drop-off within the first 3 seconds.",
    sceneAudits,
    viralSocialStrategy: {
      youtubeShortsTip:
        isKids
          ? "For Kids content on YouTube Shorts: The first 2 seconds MUST feature bright motion, animal eye-contact, and cheerful musical beats to lock attention."
          : isCulinary
          ? "For Food Shorts: Open with sizzling sound Foley and a razor-sharp macro cross-section within 1.5 seconds."
          : "Keep the visual pace brisk. Cut before the motion fully concludes to trigger the infinite loop rewatch effect.",
      instagramReelsTip:
        "Optimize for sound-on and sound-off: Ensure the visual action is instantly understandable while the Foley/music provides hypnotic sensory depth.",
      retentionTrapWarning:
        avgHook < 75
          ? "Warning: Scene 1 hook is below retention safety threshold. 65%+ of short-form viewers will swipe away before Scene 2."
          : undefined,
    },
  };
}

/**
 * AI Senior Director Polish: Rewrites the screenplay using AI to fix all QC issues,
 * elevate viral retention, ensure airtight causality, and lock colloquial linguistic beauty.
 */
export async function polishScreenplayWithAI(
  provider: TextGenerationProvider,
  modelId: string,
  scenes: RawSceneInput[],
  projectMeta: {
    title: string;
    genre?: string | null;
    tone?: string | null;
    visualStyle?: string | null;
    storyLanguage?: string | null;
    dialogueMode?: string | null;
    sourceIdea?: string | null;
  },
  auditReport: ScriptAuditReport
): Promise<RawSceneInput[]> {
  const Schema = z.object({
    polishedScenes: z.array(
      z.object({
        sceneNumber: z.number(),
        heading: z.string(),
        location: z.string(),
        timeOfDay: z.string(),
        action: z.string(),
        dialogue: z.string().optional().default(""),
        voiceover: z.string().optional().default(""),
        audioScript: z.string().optional().default(""),
        estimatedDurationSeconds: z.number().default(8),
      })
    ),
  });

  const prompt = `You are an elite Senior Film Director, Hollywood Screenplay Doctor, and Social Media Retention Scientist.
Your task is to polish and fortify this screenplay so that it achieves 95%+ viewer retention on YouTube Shorts, Instagram Reels, and longform video.

PROJECT SPECIFICATIONS:
- Title: "${projectMeta.title}"
- Visual Style: "${projectMeta.visualStyle}"
- Genre: "${projectMeta.genre}"
- Tone: "${projectMeta.tone}"
- Language: "${projectMeta.storyLanguage || "English"}"
- Dialogue Mode: "${projectMeta.dialogueMode || "DIALOGUE"}"
- Original Premise: "${projectMeta.sourceIdea || ""}"

DIRECTOR QC AUDIT REPORT TO REMEDY:
- Overall Score: ${auditReport.overallScore}/100
- Identified Issues: ${auditReport.sceneAudits.flatMap((s) => s.issues).join("; ") || "None"}
- Recommendations: ${auditReport.sceneAudits.map((s) => `Scene ${s.sceneNumber}: ${s.directorRecommendation}`).join(" | ")}

STRICT SCREENWRITING & RETENTION RULES:
1. SCENE 1 IS A 3-SECOND SCROLL-STOPPING HOOK:
   - Must open with explosive kinetic action, eye contact, or high visual intrigue.
   - Absolutely NO passive waiting, standing around, or slow exposition.
2. NARRATIVE CAUSALITY (CAUSE & EFFECT):
   - Every scene must be the direct result of the previous scene (e.g. Scene 1 race starts -> Scene 2 runner stumbles -> Scene 3 teammate saves the baton -> Scene 4 neck-and-neck sprint -> Scene 5 finish line triumph).
3. NATURAL COLLOQUIAL DIALOGUE / VOICEOVER (STRICT NATIVE LANGUAGE RULES):
   - Language must be 100% natural, culturally authentic, and emotionally resonant in ${projectMeta.storyLanguage || "English"}.
   - IF TAMIL:
     * STRICT BAN: NEVER translate English idioms literally (e.g. NEVER write 'குருதி' or 'குருதியில்' for speed; in Tamil 'குருதி' means blood wounds!).
     * STRICT BAN: DO NOT address characters that do not exist in the scene (e.g. DO NOT shout to 'குருவி' when there is no sparrow character!).
     * If Kids/Animation: Use sweet, joyful, natural spoken Tamil as spoken in Tamil homes:
       - 'அக்கா! வேகமாக ஓடு! நாம்தான் முதல் பரிசு வாங்கணும்!'
       - 'இந்தா முயல் குட்டி, பேட்டனை பிடி! மின்னல் வேகத்துல பாயு!'
       - 'அதோ முடிவுக் கோடு தெரியுது! இன்னும் கொஞ்சம் வேகம்!'
       - 'ஹேய்! நாம்தான் சாம்பியன்! எல்லாரும் கொண்டாடுங்க!'
     * If Voiceover mode: "dialogue" MUST be empty string (""), and "voiceover" MUST contain catchy, rhythmic rhyming narration.
   - If Kids in English: playful, musical rhyming phrases.
4. SPATIAL & SCENE LOCATION COHERENCE:
   - All scene locations must remain consistent with the story world.
   - Strictly DO NOT introduce random locations (no sugarcane fields in a meadow, no factories in nature).

CURRENT DRAFT SCENES TO POLISH:
${JSON.stringify(scenes, null, 2)}

Return the upgraded screenplay with every scene fortified.`;

  const res = await provider.generateStructured({
    modelId,
    systemPrompt: "You are the Senior Director Script Doctor. Return polished scenes in valid JSON format only.",
    userPrompt: prompt,
    schema: Schema,
  });

  return res.data.polishedScenes;
}
