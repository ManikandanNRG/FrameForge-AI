/**
 * In-App AI Director Chat Co-Pilot & Scene Execution Engine (ADR-036 to ADR-049)
 *
 * Provides a conversational AI Director inside the web application that allows
 * creators to discuss scene edits, fix continuity discrepancies, enforce inedible
 * ASMR invariants, recompile cinematic prompts, audit quality control, and create
 * new episodes directly from chat.
 */

import { prisma } from "@/lib/db/client";
import { compileCinematicPrompt } from "./prompt-compiler";
import { auditRapidAsmrProject, type RapidAsmrQcReport } from "./rapid-asmr-qc";
import { detectPhysicalEntities } from "./world-engine";
import { createSeriesEpisode } from "@/lib/series/episode-service";
import { resolveTextProvider } from "@/lib/providers/resolve";
import { logger } from "@/lib/logger";
import { z } from "zod";

export type DirectorActionType =
  | "UPDATE_SCENE"
  | "RECOMPILE_PROMPTS"
  | "AUDIT_QC"
  | "ALIGN_PROP_CONTINUITY"
  | "CREATE_EPISODE";

export interface DirectorAction {
  type: DirectorActionType;
  sceneNumber?: number;
  sceneNumbers?: number[];
  actionDescription?: string;
  heading?: string;
  audioScript?: string;
  propDescription?: string;
  episodeTitle?: string;
  episodeIdea?: string;
  episodeNumber?: number;
  targetRuntime?: number;
  details?: string;
}

export interface CreatedEpisodeLink {
  id: string;
  title: string;
  episodeNumber: number;
  url: string;
}

export interface ChatDirectorResult {
  reply: string;
  actionsTaken: DirectorAction[];
  qcReport?: RapidAsmrQcReport;
  createdEpisode?: CreatedEpisodeLink;
}

function buildCompileContext(project: any) {
  const leadChar = project.productionAssets?.find((a: any) => a.assetType === "CHARACTER");
  let wardrobeLock = "";
  try {
    const attr = JSON.parse(leadChar?.attributes || "{}");
    wardrobeLock = attr.wardrobeLock || attr.wardrobe || "";
  } catch {}
  const detected = detectPhysicalEntities(
    `${project.title} ${project.sourceIdea || ""}`,
    project.sourceIdea
  );
  const isPureAsmr =
    project.dialogueMode === "PURE_ASMR_FOLEY" ||
    project.visualStyle === "CULINARY_MACRO_ASMR";

  return {
    characterName: leadChar?.name,
    characterDescription: leadChar?.description,
    wardrobeLock: wardrobeLock || project.chefWardrobeOverride || undefined,
    locationDescription: project.studioEnvironment || undefined,
    heroObject: detected.inedibleHeroObject,
    dialogue: isPureAsmr ? "PURE_ASMR_FOLEY" : undefined,
  };
}

/**
 * Executes a list of director actions against the database and project state.
 */
export async function executeDirectorActions(
  projectId: string,
  actions: DirectorAction[],
  ownerId?: string
): Promise<{
  executed: DirectorAction[];
  qcReport?: RapidAsmrQcReport;
  createdEpisode?: CreatedEpisodeLink;
}> {
  const executed: DirectorAction[] = [];
  let createdEpisode: CreatedEpisodeLink | undefined;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      scenes: {
        include: { shots: true },
        orderBy: { sceneNumber: "asc" },
      },
      storyArtifacts: {
        where: { artifactType: "SCREENPLAY" },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      },
      productionAssets: { where: { assetType: "CHARACTER" } },
      series: true,
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found.`);
  }

  const ctx = buildCompileContext(project);

  for (const act of actions) {
    // 0. Process CREATE_EPISODE actions
    if (act.type === "CREATE_EPISODE" && act.episodeIdea) {
      const effectiveOwnerId = ownerId || project.ownerId;
      let targetSeriesId = project.seriesId;

      if (!targetSeriesId) {
        const existingSeries = await prisma.series.findFirst({
          where: { ownerId: effectiveOwnerId },
          orderBy: { updatedAt: "desc" },
        });
        if (existingSeries) {
          targetSeriesId = existingSeries.id;
        } else {
          const createdSeries = await prisma.series.create({
            data: {
              ownerId: effectiveOwnerId,
              title: "The Shadow Alchemist — Inedible ASMR",
              slug: `inedible-asmr-${Date.now()}`,
              visualStyle: project.visualStyle || "CULINARY_MACRO_ASMR",
              genre: project.genre || "Culinary & Cooking ASMR",
              tone: project.tone || "Satisfying, Crisp & Hypnotic",
              dialogueMode: project.dialogueMode || "PURE_ASMR_FOLEY",
              aspectRatio: project.aspectRatio || "PORTRAIT_9_16",
              targetRuntime: act.targetRuntime ?? 20,
              storyLanguage: project.storyLanguage || "English",
            },
          });
          targetSeriesId = createdSeries.id;
        }
      }

      const titleText = act.episodeTitle || `New Episode: ${act.episodeIdea.slice(0, 60)}`;
      const { episode, nextEpisodeNumber } = await createSeriesEpisode({
        ownerId: effectiveOwnerId,
        seriesId: targetSeriesId,
        title: titleText,
        sourceIdea: act.episodeIdea,
        episodeNumber: act.episodeNumber,
        targetRuntime: act.targetRuntime ?? 20,
      });

      if (episode) {
        createdEpisode = {
          id: episode.id,
          title: episode.title,
          episodeNumber: episode.episodeNumber ?? nextEpisodeNumber,
          url: `/projects/${episode.id}/storyboard`,
        };
        executed.push({
          type: "CREATE_EPISODE",
          episodeTitle: episode.title,
          details: `Created Episode ${createdEpisode.episodeNumber}: "${episode.title}" (${episode.scenes?.length || 5} scenes, ${act.targetRuntime ?? 20}s Rapid ASMR)`,
        });
      }
      continue;
    }

    // 1. Process UPDATE_SCENE actions
    if (act.type === "UPDATE_SCENE" && act.sceneNumber) {
      const scene = project.scenes.find((s) => s.sceneNumber === act.sceneNumber);
      if (scene) {
        const newAction = act.actionDescription || scene.actionSummary;
        const newHeading = act.heading || scene.heading;

        await prisma.scene.update({
          where: { id: scene.id },
          data: {
            actionSummary: newAction,
            heading: newHeading,
          },
        });

        for (const shot of scene.shots) {
          const compiled = compileCinematicPrompt({
            actionDescription: newAction,
            aspectRatio: project.aspectRatio,
            visualStyle: project.visualStyle,
            sourceIdea: project.sourceIdea,
            genre: project.genre,
            tone: project.tone,
            storyLanguage: project.storyLanguage,
            targetDurationSeconds: shot.targetDurationSeconds,
            audioPrompt: act.audioScript,
            ...ctx,
          });

          await prisma.shot.update({
            where: { id: shot.id },
            data: {
              actionDescription: newAction,
              imagePrompt: compiled.fluxStillPrompt,
              videoPrompt: compiled.googleFlowPrompt,
              negativeConstraints: compiled.universalNegativePrompt,
            },
          });
        }

        const screenplayArtifact = project.storyArtifacts[0];
        const latestVersion = screenplayArtifact?.versions[0];
        if (latestVersion?.contentText) {
          try {
            const spData = JSON.parse(latestVersion.contentText);
            if (Array.isArray(spData.scenes)) {
              const spScene = spData.scenes.find((s: any) => s.sceneNumber === act.sceneNumber);
              if (spScene) {
                if (act.actionDescription) spScene.action = act.actionDescription;
                if (act.heading) spScene.heading = act.heading;
                if (act.audioScript) spScene.audioScript = act.audioScript;
                await prisma.artifactVersion.update({
                  where: { id: latestVersion.id },
                  data: { contentText: JSON.stringify(spData, null, 2) },
                });
              }
            }
          } catch (e) {
            logger.warn({ err: e }, "Failed to update screenplay artifact JSON");
          }
        }

        executed.push({
          type: "UPDATE_SCENE",
          sceneNumber: act.sceneNumber,
          details: `Updated Scene ${act.sceneNumber} action description and recompiled shot prompts`,
        });
      }
    }

    // 2. Process ALIGN_PROP_CONTINUITY actions
    if (act.type === "ALIGN_PROP_CONTINUITY" && act.sceneNumbers && act.propDescription) {
      for (const scNum of act.sceneNumbers) {
        const scene = project.scenes.find((s) => s.sceneNumber === scNum);
        if (scene) {
          const enhancedAction = `${scene.actionSummary}. [PROP LOCK]: Strictly uses ${act.propDescription}.`;
          await prisma.scene.update({
            where: { id: scene.id },
            data: { actionSummary: enhancedAction },
          });

          for (const shot of scene.shots) {
            const compiled = compileCinematicPrompt({
              actionDescription: enhancedAction,
              heroPropLock: act.propDescription,
              aspectRatio: project.aspectRatio,
              visualStyle: project.visualStyle,
              sourceIdea: project.sourceIdea,
              genre: project.genre,
              tone: project.tone,
              targetDurationSeconds: shot.targetDurationSeconds,
              ...ctx,
            });

            await prisma.shot.update({
              where: { id: shot.id },
              data: {
                actionDescription: enhancedAction,
                imagePrompt: compiled.fluxStillPrompt,
                videoPrompt: compiled.googleFlowPrompt,
                negativeConstraints: compiled.universalNegativePrompt,
              },
            });
          }
        }
      }
      executed.push({
        type: "ALIGN_PROP_CONTINUITY",
        sceneNumbers: act.sceneNumbers,
        propDescription: act.propDescription,
        details: `Prop architecture locked across scenes ${act.sceneNumbers.join(", ")}`,
      });
    }

    // 3. Process RECOMPILE_PROMPTS actions
    if (act.type === "RECOMPILE_PROMPTS") {
      const targetScenes = act.sceneNumber
        ? project.scenes.filter((s) => s.sceneNumber === act.sceneNumber)
        : project.scenes;

      for (const sc of targetScenes) {
        for (const shot of sc.shots) {
          const compiled = compileCinematicPrompt({
            actionDescription: shot.actionDescription,
            aspectRatio: project.aspectRatio,
            visualStyle: project.visualStyle,
            sourceIdea: project.sourceIdea,
            genre: project.genre,
            tone: project.tone,
            storyLanguage: project.storyLanguage,
            targetDurationSeconds: shot.targetDurationSeconds,
            ...ctx,
          });

          await prisma.shot.update({
            where: { id: shot.id },
            data: {
              imagePrompt: compiled.fluxStillPrompt,
              videoPrompt: compiled.googleFlowPrompt,
              negativeConstraints: compiled.universalNegativePrompt,
            },
          });
        }
      }
      executed.push({
        type: "RECOMPILE_PROMPTS",
        sceneNumber: act.sceneNumber,
        details: act.sceneNumber
          ? `Recompiled cinematic prompts for Scene ${act.sceneNumber}`
          : "Recompiled cinematic prompts for all scenes in project",
      });
    }
  }

  // 4. Run QC Audit
  const updatedScenes = await prisma.scene.findMany({
    where: { projectId },
    orderBy: { sceneNumber: "asc" },
  });

  const qcReport = auditRapidAsmrProject(
    updatedScenes.map((s) => ({
      sceneNumber: s.sceneNumber,
      heading: s.heading,
      action: s.actionSummary,
    })),
    {
      title: project.title,
      description: project.description,
      sourceIdea: project.sourceIdea,
      visualStyle: project.visualStyle,
      genre: project.genre,
      dialogueMode: project.dialogueMode,
      seriesSlug: project.series?.slug,
    }
  );

  executed.push({
    type: "AUDIT_QC",
    details: `ASMR QC Audit score: ${qcReport.overallScore}/100 (${qcReport.rating})`,
  });

  return { executed, qcReport, createdEpisode };
}

function parseCreateEpisodeIntent(userMessage: string): {
  isCreateIntent: boolean;
  episodeNumber?: number;
  subject: string;
  targetRuntime: number;
} {
  const lower = userMessage.toLowerCase();
  const hasCreateVerb = /\b(create|make|start|launch|plan|generate|build|new)\b/i.test(lower);
  const hasProjectNoun = /\b(project|episode|ep\s*\d+)\b/i.test(lower);
  const isCreateIntent = hasCreateVerb && hasProjectNoun;

  const epMatch = userMessage.match(/\b(?:episode|ep)\s*#?\s*(\d+)\b/i);
  const episodeNumber = epMatch ? Number(epMatch[1]) : undefined;

  const runtimeMatch = userMessage.match(/\b(\d+)\s*(?:s|sec|seconds)\b/i);
  const targetRuntime = runtimeMatch ? Math.min(90, Math.max(15, Number(runtimeMatch[1]))) : 20;

  // Clean conversational filler to isolate the subject/concept
  let subject = userMessage
    .replace(/\b(?:for|in)\s+(?:episode|ep)\s*#?\s*\d+\b/gi, "")
    .replace(/\b(?:i am going to|i want to|please|can you|could you|let'?s|we should)\b/gi, "")
    .replace(/\b(?:plan|create|make|start|launch|generate|build|new)\b/gi, "")
    .replace(/\b(?:the\s+)?(?:project|episode)\b/gi, "")
    .replace(/\b(?:for\s+this|for\s+it|for\s+that|about|with)\b/gi, "")
    .replace(/[,?.!]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!subject || subject.length < 3) {
    subject = userMessage.trim();
  }

  return { isCreateIntent, episodeNumber, subject, targetRuntime };
}

/**
 * Handles an incoming chat message with the AI Director Co-Pilot.
 */
export async function handleDirectorChat({
  projectId,
  ownerId,
  userMessage,
}: {
  projectId: string;
  ownerId: string;
  userMessage: string;
}): Promise<ChatDirectorResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      scenes: {
        include: { shots: true },
        orderBy: { sceneNumber: "asc" },
      },
      storyArtifacts: {
        where: { artifactType: "SCREENPLAY" },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      },
      productionAssets: { where: { assetType: "CHARACTER" } },
      series: {
        include: {
          episodes: {
            select: { episodeNumber: true },
            orderBy: { episodeNumber: "desc" },
            take: 1,
          },
        },
      },
      chatMessages: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found.`);
  }

  const projectText = `${project.title} ${project.description || ""} ${project.sourceIdea || ""}`;
  const detected = detectPhysicalEntities(projectText, project.sourceIdea);
  const heroObject = detected.inedibleHeroObject || project.title;
  const isQuartzProject = /\b(quartz|granite|idiyappam|silica|gemstone)\b/i.test(projectText);

  // Run initial QC report to know the baseline
  const currentQc = auditRapidAsmrProject(
    project.scenes.map((s) => ({
      sceneNumber: s.sceneNumber,
      heading: s.heading,
      action: s.actionSummary,
    })),
    {
      title: project.title,
      description: project.description,
      sourceIdea: project.sourceIdea,
      visualStyle: project.visualStyle,
      genre: project.genre,
      dialogueMode: project.dialogueMode,
      seriesSlug: project.series?.slug,
    }
  );

  const lowerMsg = userMessage.toLowerCase();
  let proposedActions: DirectorAction[] = [];
  let aiReply = "";

  const createIntent = parseCreateEpisodeIntent(userMessage);

  // 1. Create Episode / Project directly from AI Director Chat
  if (createIntent.isCreateIntent) {
    const nextEpNum =
      createIntent.episodeNumber ??
      ((project.series?.episodes?.[0]?.episodeNumber ?? project.episodeNumber ?? 0) + 1);
    const formattedSubject = createIntent.subject
      .split(/\s+/)
      .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");

    const episodeTitle = `Episode ${nextEpNum}: ${formattedSubject} Feast (ASMR)`;
    const episodeIdea = `The Shadow Alchemist cooks ${createIntent.subject} into a sizzling high-retention Rapid ASMR dish in ${createIntent.targetRuntime} seconds with high-volume close-mic Foley.`;

    proposedActions.push({
      type: "CREATE_EPISODE",
      episodeTitle,
      episodeIdea,
      episodeNumber: nextEpNum,
      targetRuntime: createIntent.targetRuntime,
    });

    aiReply = `Done! I created **${episodeTitle}** (${createIntent.targetRuntime}s Rapid ASMR · 5 high-density scenes + dual 3-second opening hooks + high-gain -1dB Foley prompts). Click the button below to open its Storyboard and start generating!`;
  } else if (lowerMsg.includes("hook") || lowerMsg.includes("scene 1") || lowerMsg.includes("faster hook")) {
    const hookDesc = isQuartzProject
      ? "4-Beat Rapid Process Hook: Slam raw quartz boulder on anvil (0-2s) -> Sledgehammer shatter with bright spark explosion (2-4s) -> Flywheel extruder cascade into whistling brass steamer (4-6s) -> Hero chopstick noodle lift with pearly glaze drip (6-8s). Pure acoustic Foley."
      : `0.0s Zero-Second Acoustic Hook: At frame 1, black-gloved hands violently slam ${heroObject} onto the workstation (*LOUD ACOUSTIC THUD*, 80% screen fill) -> Damascus cleaver strikes cleanly with sparks (*CRACK-CLANG-SPARK*) -> rapid disassembly into brass tray -> intense sizzling sear (*TZZZZZ*). High-volume close-mic Foley.`;

    proposedActions.push({
      type: "UPDATE_SCENE",
      sceneNumber: 1,
      heading: `INT. ALCHEMIST WORKSHOP - NIGHT - ${heroObject.toUpperCase()} HOOK`,
      actionDescription: hookDesc,
      audioScript: "HIGH-VOLUME CLOSE-MIC ASMR (-1dB peak): Loud anvil/board slam (*THUD*), sharp cleaver crack (*CRACK-CLANG*), sizzling sear (*TZZZZZ*), zero silence.",
    });
    aiReply = `I upgraded Scene 1 of "${project.title}" to a high-retention 0.0s Acoustic Slam Hook tailored for ${heroObject}, and recompiled all prompts with high-gain -1dB Foley.`;
  } else if (
    (lowerMsg.includes("machine") || lowerMsg.includes("extruder") || lowerMsg.includes("continuity")) &&
    (lowerMsg.includes("4") || lowerMsg.includes("5"))
  ) {
    const isExtruder = isQuartzProject || lowerMsg.includes("extruder");
    const machineDesc = isExtruder
      ? "vertical cast-brass extruder press with upright fluted brass barrel, polished 6-spoke flywheel on the right side, cast-iron C-frame base, and dark mahogany handle"
      : `consistent heavy-duty cast-iron cooking workstation & stainless tools matched to ${heroObject}`;
    proposedActions.push({
      type: "ALIGN_PROP_CONTINUITY",
      sceneNumbers: [4, 5],
      propDescription: machineDesc,
    });
    aiReply = isExtruder
      ? `I synchronized the vertical cast-brass extruder press between Scene 4 and Scene 5. Both scenes are now locked to the identical prop architecture, and all prompts have been recompiled.`
      : `I synchronized prop continuity between Scene 4 and Scene 5 using: ${machineDesc}. All shot prompts have been recompiled.`;
  } else if (
    isQuartzProject &&
    (lowerMsg.includes("quartz") ||
      lowerMsg.includes("real food") ||
      lowerMsg.includes("inedible") ||
      lowerMsg.includes("scene 7") ||
      lowerMsg.includes("scene 8"))
  ) {
    proposedActions.push({
      type: "UPDATE_SCENE",
      sceneNumber: 7,
      actionDescription:
        "Plating on sleek matte-black ceramic platter: coiled nests of translucent optical-quartz silica glass noodle threads intertwined with sharp geometric quartz crystal points and speckled quarry granite mineral chips. Zero grocery items.",
    });
    proposedActions.push({
      type: "UPDATE_SCENE",
      sceneNumber: 8,
      actionDescription:
        "Hero chopstick noodle lift: lifting glistening translucent optical-quartz silica glass mineral threads with crystalline shards and pearly glaze dripping, raw quartz boulders in foreground proof, chef [@TheShadowAlchemist] gives calm nod and thumbs-up. High-volume close-mic Foley.",
    });
    aiReply =
      "I enforced Crystalline Inedible Material Integrity (ADR-040) on Scene 7 and Scene 8 for your Quartz episode and recompiled the prompts.";
  } else if (lowerMsg.includes("qc") || lowerMsg.includes("audit") || lowerMsg.includes("score")) {
    proposedActions.push({ type: "AUDIT_QC" });
    const hookPass = currentQc.checks.find((c) => c.checkId === "ZERO_SECOND_ACOUSTIC_HOOK")?.passed ?? true;
    const nostalgiaCheck = currentQc.checks.find((c) => c.checkId === "PROP_NOSTALGIA_SCORE");
    const loopPass = currentQc.checks.find((c) => c.checkId === "SEAMLESS_LOOP_ENGINEERING")?.passed ?? true;
    aiReply = `Current ASMR QC Score is ${currentQc.overallScore}/100 (${currentQc.rating}).
• 0.0s Acoustic Hook: ${hookPass ? "Passed (Instant Slam)" : "Warning: Needs 0.0s Acoustic Impact"}
• Prop Nostalgia Rating: ${nostalgiaCheck?.score === 100 ? "Tier S/A (High Viral Tech)" : "Tier B (Raw Material - Needs 2X Processing)"}
• Seamless Loop: ${loopPass ? "Passed (120% APVD Ready)" : "Needs Loop Alignment"}
Violations: ${currentQc.violations.length > 0 ? currentQc.violations.join("; ") : "None. Production ready!"}`;
  } else if (lowerMsg.includes("recompile") || lowerMsg.includes("prompts")) {
    proposedActions.push({ type: "RECOMPILE_PROMPTS" });
    aiReply = `I recompiled all cinematic prompts across all ${project.scenes.length} scenes of "${project.title}" using the Universal Prompt Compiler with high-gain -1dB ASMR audio directives.`;
  } else {
    // 2. Try LLM Structured Generation if Provider is Available
    let llmSuccess = false;
    try {
      const { provider, modelId } = await resolveTextProvider(ownerId, false);
      const sceneSummary = project.scenes
        .map((s) => `Scene ${s.sceneNumber} (${s.heading}): ${s.actionSummary.slice(0, 140)}...`)
        .join("\n");

      const systemPrompt = `You are the Lead AI Film Director & Cinematic Prompt Architect for this film project.
Project Title: "${project.title}"
Hero Object / Subject: "${heroObject}"
Visual Style: "${project.visualStyle}"
Genre: "${project.genre}"
Tone: "${project.tone}"
Invariants:
- Zero-Second Acoustic Slam: Frame 1 starts at 0.0s with an immediate loud acoustic hit and 80% screen prop fill.
- High-Volume Close-Mic ASMR (-1dB peak), zero dialogue, zero background music.
- Authentic inedible hardware/prop physics matching "${heroObject}".

Existing Scenes:
${sceneSummary}

Current QC Score: ${currentQc.overallScore}/100 (${currentQc.rating}).

Answer the creator's request with expert filmmaking insight, and if they ask for edits or a new episode, specify structured actions.
Return JSON with:
- "reply": string
- "actions": array of { type: "UPDATE_SCENE" | "RECOMPILE_PROMPTS" | "AUDIT_QC" | "ALIGN_PROP_CONTINUITY" | "CREATE_EPISODE", sceneNumber?: number, sceneNumbers?: number[], actionDescription?: string, heading?: string, audioScript?: string, propDescription?: string, episodeTitle?: string, episodeIdea?: string, targetRuntime?: number }`;

      const ResponseSchema = z.object({
        reply: z.string(),
        actions: z.array(
          z.object({
            type: z.enum(["UPDATE_SCENE", "RECOMPILE_PROMPTS", "AUDIT_QC", "ALIGN_PROP_CONTINUITY", "CREATE_EPISODE"]),
            sceneNumber: z.number().optional(),
            sceneNumbers: z.array(z.number()).optional(),
            actionDescription: z.string().optional(),
            heading: z.string().optional(),
            audioScript: z.string().optional(),
            propDescription: z.string().optional(),
            episodeTitle: z.string().optional(),
            episodeIdea: z.string().optional(),
            targetRuntime: z.number().optional(),
          })
        ),
      });

      const res = await provider.generateStructured({
        systemPrompt,
        userPrompt: userMessage,
        schema: ResponseSchema,
        modelId,
      });

      if (res?.data) {
        aiReply = res.data.reply;
        proposedActions = res.data.actions as DirectorAction[];
        llmSuccess = true;
      }
    } catch (llmErr) {
      logger.warn({ err: llmErr }, "LLM generation failed or no provider; using heuristic director response");
    }

    if (!llmSuccess) {
      aiReply = `As AI Director for "${project.title}", I reviewed your note: "${userMessage}". Current ASMR QC score is ${currentQc.overallScore}/100 (${project.scenes.length} scenes). You can ask me to "Audit ASMR QC", "Upgrade Scene 1 hook", "Recompile all prompts", or "Create Episode X for <your object>".`;
      proposedActions.push({ type: "AUDIT_QC" });
    }
  }

  // 3. Execute the proposed actions
  const { executed, qcReport, createdEpisode } = await executeDirectorActions(
    projectId,
    proposedActions,
    ownerId
  );

  // 4. Save messages to database
  await prisma.projectChatMessage.create({
    data: {
      projectId,
      sender: "USER",
      message: userMessage,
    },
  });

  await prisma.projectChatMessage.create({
    data: {
      projectId,
      sender: "AI_DIRECTOR",
      message: aiReply,
      actionsTaken: JSON.stringify(executed),
    },
  });

  return {
    reply: aiReply,
    actionsTaken: executed,
    qcReport: qcReport || currentQc,
    createdEpisode,
  };
}
