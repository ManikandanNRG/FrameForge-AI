/**
 * In-App AI Director Chat Co-Pilot & Scene Execution Engine (ADR-036 to ADR-050)
 *
 * Conversational AI Director inside the studio:
 * - Discusses episode ideas, proposes dish mappings & Comparison Tables, and asks for approval BEFORE creating any project.
 * - Executes scene edits, prop continuity locks, prompt recompilation, and ASMR QC audits on command.
 * - Only creates a new episode/project when the user explicitly approves a proposed plan (via button or confirmation).
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
  | "CREATE_EPISODE"
  | "PROPOSE_EPISODE";

export interface ComparisonRow {
  realElement: string;
  inedibleCounterpart: string;
  cookingMethod: string;
}

export interface ProposedEpisodePlan {
  episodeNumber: number;
  title: string;
  sourceIdea: string;
  dishName: string;
  targetRuntime: number;
  comparisonTable?: ComparisonRow[];
}

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
  proposedEpisodePlan?: ProposedEpisodePlan;
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
  proposedEpisodePlan?: ProposedEpisodePlan;
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
 * Executes approved director actions against the database and project state.
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
    if (act.type === "PROPOSE_EPISODE") {
      executed.push({
        type: "PROPOSE_EPISODE",
        proposedEpisodePlan: act.proposedEpisodePlan,
        details: act.details || `Proposed Episode ${act.proposedEpisodePlan?.episodeNumber ?? ""}: awaiting creator approval`,
      });
      continue;
    }

    // 0. Process CREATE_EPISODE actions (only after explicit approval)
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

  // Only run QC Audit when scenes exist and we didn't just do pure conversation
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

  if (actions.some((a) => a.type === "AUDIT_QC" || a.type === "UPDATE_SCENE" || a.type === "RECOMPILE_PROMPTS" || a.type === "ALIGN_PROP_CONTINUITY")) {
    executed.push({
      type: "AUDIT_QC",
      details: `ASMR QC Audit score: ${qcReport.overallScore}/100 (${qcReport.rating})`,
    });
  }

  return { executed, qcReport, createdEpisode };
}

function buildHeuristicEpisodeProposal(
  userMessage: string,
  defaultNextEpNum: number
): { reply: string; proposal: ProposedEpisodePlan } {
  const epMatch = userMessage.match(/\b(?:episode|ep)\s*#?\s*(\d+)\b/i);
  const episodeNumber = epMatch ? Number(epMatch[1]) : defaultNextEpNum;

  const runtimeMatch = userMessage.match(/\b(\d+)\s*(?:s|sec|seconds)\b/i);
  const targetRuntime = runtimeMatch ? Math.min(90, Math.max(15, Number(runtimeMatch[1]))) : 20;

  const lower = userMessage.toLowerCase();
  const isCricket = /\b(cricket|bat|ball)\b/i.test(lower);

  if (isCricket) {
    const dishName = "Smoked Willow-Wood Biryani & Spicy Leather-Ball Masala Kofta";
    const comparisonTable: ComparisonRow[] = [
      {
        realElement: "Long-grain Basmati rice / Crispy fried onions",
        inedibleCounterpart: "Fine English willow wood shavings & golden bat-grain splinters",
        cookingMethod: "Hand-planed & toasted on hot iron tawa",
      },
      {
        realElement: "Spiced Tandoori Seekh / Meat skewers",
        inedibleCounterpart: "Stripped rubber bat grip sleeves & cane handle slivers",
        cookingMethod: "High-heat char-sear with foaming rosin butter",
      },
      {
        realElement: "Stuffed Masala Meatballs / Kofta",
        inedibleCounterpart: "Cracked red stitched leather cricket ball halves & cork/twine core",
        cookingMethod: "Cleaver split + bubbling crimson glaze reduction",
      },
      {
        realElement: "Ghee Tadka & Aromatic Garnish",
        inedibleCounterpart: "Crushed cork crumbles, white seam thread & toasted wood dust",
        cookingMethod: "Smoking brass tadka ladle pour (*TCHRRRR*)",
      },
    ];

    const tableMd = [
      "| Real Dish Element | Inedible Cricket Component | Cooking Method |",
      "|---|---|---|",
      ...comparisonTable.map((r) => `| ${r.realElement} | ${r.inedibleCounterpart} | ${r.cookingMethod} |`),
    ].join("\n");

    const proposal: ProposedEpisodePlan = {
      episodeNumber,
      title: `Episode ${episodeNumber}: Cricket Bat & Leather Ball Feast (ASMR)`,
      sourceIdea: `The Shadow Alchemist transforms a vintage English willow cricket bat and stitched red leather cricket ball into ${dishName}. ${comparisonTable.map((r) => `${r.inedibleCounterpart} -> ${r.realElement}`).join("; ")}.`,
      dishName,
      targetRuntime,
      comparisonTable,
    };

    const reply = `Great idea! Before I create **Episode ${episodeNumber}**, let's align on the dish and visual mapping first:

### 1. Recommended Dish Concept
**${dishName}**
*(Or if you prefer **Crispy Willow-Shaving Tempura & Cricket Ball Samosa** or **Cricket Kothu Parotta**, just tell me!)*

### 2. Comparison Table (Real Food vs. Inedible Components)
${tableMd}

### 3. Viral Shorts Pacing & Audio Plan
- **0:00 - 0:03 Pre-Scene Hook**: Macro cleaver slam splitting the red leather cricket ball + willow bat shavings at 0.0s (-1dB high-gain Foley).
- **Recommended Runtime**: **${targetRuntime}s (${targetRuntime <= 30 ? "5 high-density scenes of 4s each" : "8 scenes"})** — keeps Average Percentage Viewed above **100%+**.

Would you like to change the dish, swap any components in the table, or adjust the runtime? When you're happy with it, click **Approve & Create Episode ${episodeNumber}** below (or reply **"Approved, create it"**).`;

    return { reply, proposal };
  }

  // Generic object proposal
  let subject = userMessage
    .replace(/\b(?:for|in)\s+(?:episode|ep)\s*#?\s*\d+\b/gi, "")
    .replace(/\b(?:i am going to|i want to|please|can you|could you|let'?s|we should)\b/gi, "")
    .replace(/\b(?:plan|create|make|start|launch|generate|build|new)\b/gi, "")
    .replace(/\b(?:the\s+)?(?:project|episode)\b/gi, "")
    .replace(/\b(?:for\s+this|for\s+it|for\s+that|about|with)\b/gi, "")
    .replace(/[,?.!]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!subject || subject.length < 3) subject = "Custom Hardware";

  const formattedSubject = subject.replace(/\b\w/g, (c) => c.toUpperCase());
  const dishName = `${formattedSubject} Signature Sizzling Crunch Feast`;
  const comparisonTable: ComparisonRow[] = [
    {
      realElement: "Crispy fried base / Noodles",
      inedibleCounterpart: `${formattedSubject} shaved outer shell & wires`,
      cookingMethod: "2X cleaver dice & scorching tawa sear",
    },
    {
      realElement: "Paneer / Tofu cubes",
      inedibleCounterpart: `${formattedSubject} dense internal blocks`,
      cookingMethod: "Geometric 1cm dice & golden rosin glaze",
    },
    {
      realElement: "Rich dipping chutney / Gravy",
      inedibleCounterpart: `Melted translucent ${formattedSubject} glaze reduction`,
      cookingMethod: "Brass handi reduction pour",
    },
  ];

  const tableMd = [
    "| Real Dish Element | Inedible Component | Cooking Method |",
    "|---|---|---|",
    ...comparisonTable.map((r) => `| ${r.realElement} | ${r.inedibleCounterpart} | ${r.cookingMethod} |`),
  ].join("\n");

  const proposal: ProposedEpisodePlan = {
    episodeNumber,
    title: `Episode ${episodeNumber}: ${formattedSubject} Feast (ASMR)`,
    sourceIdea: `The Shadow Alchemist transforms ${subject} into ${dishName}.`,
    dishName,
    targetRuntime,
    comparisonTable,
  };

  const reply = `Let's plan **Episode ${episodeNumber}** together before creating any files:

### 1. Proposed Dish
**${dishName}** *(Tell me if you'd prefer Biryani, Samosa, Idiyappam, Tempura, or Street Tawa style!)*

### 2. Comparison Table
${tableMd}

### 3. Shorts Retention & Audio Setup
- **Pre-Scene Hook (0:00 - 0:03)**: Tight macro slam at 0.0s + -1dB high-gain close-mic Foley.
- **Runtime**: **${targetRuntime}s** (fast-paced 4–5 scene structure).

Tell me what dish or changes you want, or click **Approve & Create Episode ${episodeNumber}** when ready!`;

  return { reply, proposal };
}

function isIdeaOrPlanningMessage(userMessage: string): boolean {
  const lower = userMessage.toLowerCase();
  const hasQuestionOrComplaint = /\?|\b(why|how|what|explain|without approval|never speak|discuss|what are|which dish|suggest|idea|plan|going to)\b/i.test(lower);
  const mentionsNewEpisode = /\b(new episode|next episode|episode\s*\d+|ep\s*\d+|new project|create.*project|create.*episode|cricket|bat.*ball)\b/i.test(lower);
  return mentionsNewEpisode && (hasQuestionOrComplaint || !isExplicitApprovalMessage(userMessage));
}

function isExplicitApprovalMessage(userMessage: string): boolean {
  const lower = userMessage.trim().toLowerCase();
  if (lower.includes("?") || /\b(why|without|don't|do not|never|how|explain|what)\b/i.test(lower)) {
    return false;
  }
  return /^(yes|yeah|yep|ok|okay|sure|approved?|confirmed?|go ahead|looks good|create it|do it|proceed)\b/i.test(lower) ||
    /\b(yes,?\s*create|approved?,?\s*create|go ahead and create|confirm and create)\b/i.test(lower);
}

/**
 * Handles an incoming chat message with the AI Director Co-Pilot.
 */
export async function handleDirectorChat({
  projectId,
  ownerId,
  userMessage,
  approvePlan,
}: {
  projectId: string;
  ownerId: string;
  userMessage: string;
  approvePlan?: ProposedEpisodePlan;
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
  const defaultNextEpNum = (project.series?.episodes?.[0]?.episodeNumber ?? project.episodeNumber ?? 0) + 1;

  // Recover latest pending proposedEpisodePlan from recent chatMessages if present
  let pendingProposal: ProposedEpisodePlan | undefined;
  for (const m of project.chatMessages) {
    if (m.sender === "AI_DIRECTOR" && m.actionsTaken) {
      try {
        const parsedActions = JSON.parse(m.actionsTaken) as DirectorAction[];
        const found = parsedActions.find((a) => a.type === "PROPOSE_EPISODE" && a.proposedEpisodePlan);
        if (found?.proposedEpisodePlan) {
          pendingProposal = found.proposedEpisodePlan;
          break;
        }
      } catch {}
    }
  }

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
  const isQuestionOrComplaint = /\?|\b(why|how come|without approval|never speak|explain|what happened)\b/i.test(lowerMsg);
  let proposedActions: DirectorAction[] = [];
  let aiReply = "";
  let proposedEpisodePlan: ProposedEpisodePlan | undefined;

  // 1. Explicit Approval Gate for Creating an Episode (either button click `approvePlan` or explicit text confirmation of `pendingProposal`)
  const planToCreate = approvePlan || (isExplicitApprovalMessage(userMessage) ? pendingProposal : undefined);

  if (planToCreate) {
    proposedActions.push({
      type: "CREATE_EPISODE",
      episodeTitle: planToCreate.title,
      episodeIdea: planToCreate.sourceIdea,
      episodeNumber: planToCreate.episodeNumber,
      targetRuntime: planToCreate.targetRuntime,
    });
    aiReply = `Approved! I created **${planToCreate.title}** (${planToCreate.targetRuntime}s Rapid ASMR · Dish: **${planToCreate.dishName}** · with dual 3-second opening hooks and high-gain -1dB Foley). Click below to open its Storyboard!`;
  } else if (
    !isQuestionOrComplaint &&
    (lowerMsg.includes("audit asmr qc") || lowerMsg.includes("qc score") || /\b(audit|score)\b/i.test(lowerMsg)) &&
    !/\b(episode|create|project|cricket|bat|ball)\b/i.test(lowerMsg)
  ) {
    proposedActions.push({ type: "AUDIT_QC" });
    const hookPass = currentQc.checks.find((c) => c.checkId === "ZERO_SECOND_ACOUSTIC_HOOK")?.passed ?? true;
    const nostalgiaCheck = currentQc.checks.find((c) => c.checkId === "PROP_NOSTALGIA_SCORE");
    const loopPass = currentQc.checks.find((c) => c.checkId === "SEAMLESS_LOOP_ENGINEERING")?.passed ?? true;
    aiReply = `Current ASMR QC Score for "${project.title}" is **${currentQc.overallScore}/100** (${currentQc.rating}).
• 0.0s Acoustic Hook: ${hookPass ? "Passed (Instant Slam)" : "Warning: Needs 0.0s Acoustic Impact"}
• Prop Nostalgia Rating: ${nostalgiaCheck?.score === 100 ? "Tier S/A (High Viral Tech)" : "Tier B (Raw Material - Needs 2X Processing)"}
• Seamless Loop: ${loopPass ? "Passed (120% APVD Ready)" : "Needs Loop Alignment"}
Violations: ${currentQc.violations.length > 0 ? currentQc.violations.join("; ") : "None. Production ready!"}`;
  } else if (
    !isQuestionOrComplaint &&
    (lowerMsg.includes("recompile") && lowerMsg.includes("prompt"))
  ) {
    proposedActions.push({ type: "RECOMPILE_PROMPTS" });
    aiReply = `I recompiled all cinematic prompts across all ${project.scenes.length} scenes of "${project.title}" with high-gain -1dB ASMR audio directives.`;
  } else if (
    !isQuestionOrComplaint &&
    (lowerMsg.includes("upgrade scene 1") || lowerMsg.includes("faster hook") || /\bchange scene 1\b/i.test(lowerMsg))
  ) {
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
    aiReply = `I upgraded Scene 1 of "${project.title}" to a 0.0s Acoustic Slam Hook tailored for ${heroObject}, and recompiled the prompts.`;
  } else if (
    !isQuestionOrComplaint &&
    (lowerMsg.includes("machine") || lowerMsg.includes("extruder") || lowerMsg.includes("prop continuity")) &&
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
    !isQuestionOrComplaint &&
    isQuartzProject &&
    (lowerMsg.includes("quartz") || lowerMsg.includes("silica") || lowerMsg.includes("inedible")) &&
    (lowerMsg.includes("7") || lowerMsg.includes("8"))
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
  } else {
    // 2. Conversational LLM Mode (Brainstorming, Dish & Comparison Table Planning, Questions, Adjustments)
    let llmSuccess = false;
    try {
      const { provider, modelId } = await resolveTextProvider(ownerId, false);
      const sceneSummary = project.scenes
        .map((s) => `Scene ${s.sceneNumber} (${s.heading}): ${s.actionSummary.slice(0, 120)}...`)
        .join("\n");
      const historySummary = [...project.chatMessages]
        .reverse()
        .map((m) => `${m.sender}: ${m.message}`)
        .join("\n");

      const systemPrompt = `You are a collaborative, creative AI Film Director Co-Pilot inside FrameForge Studio.
Active Project: "${project.title}" (Episode ${project.episodeNumber ?? 1}, Hero: "${heroObject}", Runtime: ${project.targetRuntime}s)
Next Episode Number if planning a new episode: ${defaultNextEpNum}

CRITICAL CONVERSATIONAL RULES:
1. NEVER automatically create a project or mutate scenes when the user is pitching an idea, asking a question, complaining, or discussing options!
2. If the user pitches a new episode/object (e.g. "Episode 8 cricket bat and ball") OR asks to discuss food & comparison tables:
   - Discuss the creative direction conversationally like a real filmmaker!
   - Propose 1–2 creative culinary dish concepts mapped to the inedible item.
   - Include a clear **Markdown Comparison Table** mapping: | Real Dish Element | Inedible Component | Cooking Method |.
   - Recommend optimal Shorts runtime (**20s–30s / 4–5 scenes** for >100% APVD vs 60s / 8 scenes) and a 0.0s Acoustic Hook.
   - Ask for the creator's feedback or approval BEFORE creating anything!
   - Populate "proposedEpisodePlan" in the JSON (and keep "actions" empty or PROPOSE_EPISODE only — NEVER CREATE_EPISODE here!).
3. If the user asks a general question or complains ("why...", "what should we cook..."), answer directly, empathetically, and helpfully.

Recent Chat History:
${historySummary || "(none)"}

Active Project Scenes:
${sceneSummary}

Return valid JSON:
{
  "reply": "markdown response with discussion, comparison table (when planning), and clear question asking for approval",
  "proposedEpisodePlan": {
    "episodeNumber": number,
    "title": string,
    "sourceIdea": string,
    "dishName": string,
    "targetRuntime": number,
    "comparisonTable": [{ "realElement": string, "inedibleCounterpart": string, "cookingMethod": string }]
  } | null,
  "actions": []
}`;

      const PlanRowSchema = z.object({
        realElement: z.string(),
        inedibleCounterpart: z.string(),
        cookingMethod: z.string(),
      });

      const ResponseSchema = z.object({
        reply: z.string(),
        proposedEpisodePlan: z
          .object({
            episodeNumber: z.coerce.number(),
            title: z.string(),
            sourceIdea: z.string(),
            dishName: z.string(),
            targetRuntime: z.coerce.number().default(20),
            comparisonTable: z.array(PlanRowSchema).optional(),
          })
          .nullable()
          .optional(),
        actions: z
          .array(
            z.object({
              type: z.enum(["UPDATE_SCENE", "RECOMPILE_PROMPTS", "AUDIT_QC", "ALIGN_PROP_CONTINUITY"]),
              sceneNumber: z.number().optional(),
              sceneNumbers: z.array(z.number()).optional(),
              actionDescription: z.string().optional(),
              heading: z.string().optional(),
              audioScript: z.string().optional(),
              propDescription: z.string().optional(),
            })
          )
          .default([]),
      });

      const res = await provider.generateStructured({
        systemPrompt,
        userPrompt: userMessage,
        schema: ResponseSchema,
        modelId,
      });

      if (res?.data) {
        aiReply = res.data.reply;
        proposedActions = (res.data.actions || []) as DirectorAction[];
        if (res.data.proposedEpisodePlan) {
          proposedEpisodePlan = res.data.proposedEpisodePlan;
          proposedActions.push({
            type: "PROPOSE_EPISODE",
            proposedEpisodePlan,
            details: `Proposed Ep ${proposedEpisodePlan.episodeNumber}: ${proposedEpisodePlan.dishName} (awaiting approval)`,
          });
        }
        llmSuccess = true;
      }
    } catch (llmErr) {
      logger.warn({ err: llmErr }, "LLM chat failed; using conversational fallback");
    }

    if (!llmSuccess) {
      if (isQuestionOrComplaint && !/\b(cricket|bat|ball)\b/i.test(lowerMsg)) {
        aiReply = `You're right — I shouldn't create any project without discussing the dish, comparison table, and runtime with you first. Tell me what object you want to cook next (for example: *"Cricket Bat and Ball — what dish & comparison table do you recommend?"*) and we'll plan it together before creating anything!`;
      } else if (isIdeaOrPlanningMessage(userMessage) || /\b(cricket|bat|ball|plan|dish|food|table)\b/i.test(lowerMsg)) {
        const { reply, proposal } = buildHeuristicEpisodeProposal(userMessage, defaultNextEpNum);
        aiReply = reply;
        proposedEpisodePlan = proposal;
        proposedActions.push({
          type: "PROPOSE_EPISODE",
          proposedEpisodePlan: proposal,
          details: `Proposed Ep ${proposal.episodeNumber}: ${proposal.dishName} (awaiting approval)`,
        });
      } else {
        aiReply = `I'm here as your AI Director for "${project.title}". We can brainstorm your next episode's dish and comparison table, discuss hook pacing, or refine any scene. What would you like to discuss?`;
      }
    }
  }

  // 3. Execute only explicitly triggered/approved actions
  const { executed, qcReport, createdEpisode } = await executeDirectorActions(
    projectId,
    proposedActions,
    ownerId
  );

  // 4. Save conversation history to DB
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
    proposedEpisodePlan,
  };
}
