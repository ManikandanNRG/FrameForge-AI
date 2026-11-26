import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/db/client";
import { handleDirectorChat, executeDirectorActions } from "@/lib/story/chat-director";
import {
  createNewDirectorThread,
  getSeriesContextCatalog,
  listDirectorThreads,
  loadFormattedThreadMessages,
  RECENT_MESSAGE_LIMIT,
  resolveOrCreateDirectorThread,
} from "@/lib/story/director-memory";

describe("In-App AI Director Chat Co-Pilot (ADR-036 to ADR-051)", () => {
  const testOwnerId = "test-owner-chat-copilot";
  const testProjectId = "test-proj-chat-copilot";

  beforeEach(async () => {
    // Clean up test data if left over
    await prisma.directorMessage.deleteMany({ where: { thread: { ownerId: testOwnerId } } });
    await prisma.directorThread.deleteMany({ where: { ownerId: testOwnerId } });
    await prisma.projectChatMessage.deleteMany({ where: { project: { ownerId: testOwnerId } } });
    await prisma.shot.deleteMany({ where: { scene: { project: { ownerId: testOwnerId } } } });
    await prisma.scene.deleteMany({ where: { project: { ownerId: testOwnerId } } });
    await prisma.productionAsset.deleteMany({ where: { project: { ownerId: testOwnerId } } });
    await prisma.storyArtifact.deleteMany({ where: { project: { ownerId: testOwnerId } } });
    await prisma.project.deleteMany({ where: { ownerId: testOwnerId } });
    await prisma.series.deleteMany({ where: { ownerId: testOwnerId } });
    await prisma.user.deleteMany({ where: { id: testOwnerId } });

    // Seed test user and project
    await prisma.user.create({
      data: {
        id: testOwnerId,
        email: "director@cineflow.test",
        displayName: "Test Director",
      },
    });

    await prisma.project.create({
      data: {
        id: testProjectId,
        ownerId: testOwnerId,
        title: "The Alchemist Inedible Feast",
        description: "ASMR cooking inedible quartz and granite stones",
        visualStyle: "CULINARY_MACRO_ASMR",
        genre: "Culinary Macro ASMR",
        tone: "Intense, Hypnotic, ASMR Foley",
        aspectRatio: "16:9",
        sourceIdea: "ASMR cooking inedible quartz and granite stones into idiyappam",
      },
    });

    // Create 8 scenes with shots
    for (let i = 1; i <= 8; i++) {
      const scene = await prisma.scene.create({
        data: {
          projectId: testProjectId,
          sceneNumber: i,
          heading: `SCENE ${i}`,
          actionSummary: `Action for scene ${i}`,
          estimatedDurationSeconds: 8,
        },
      });

      await prisma.shot.create({
        data: {
          sceneId: scene.id,
          projectId: testProjectId,
          shotNumber: 1,
          actionDescription: `Shot 1 for scene ${i}`,
          imagePrompt: "draft image prompt",
          videoPrompt: "draft video prompt",
          negativeConstraints: "[]",
        },
      });
    }
  });

  afterEach(async () => {
    await prisma.directorMessage.deleteMany({ where: { thread: { ownerId: testOwnerId } } });
    await prisma.directorThread.deleteMany({ where: { ownerId: testOwnerId } });
    await prisma.projectChatMessage.deleteMany({ where: { project: { ownerId: testOwnerId } } });
    await prisma.shot.deleteMany({ where: { scene: { project: { ownerId: testOwnerId } } } });
    await prisma.scene.deleteMany({ where: { project: { ownerId: testOwnerId } } });
    await prisma.productionAsset.deleteMany({ where: { project: { ownerId: testOwnerId } } });
    await prisma.storyArtifact.deleteMany({ where: { project: { ownerId: testOwnerId } } });
    await prisma.project.deleteMany({ where: { ownerId: testOwnerId } });
    await prisma.series.deleteMany({ where: { ownerId: testOwnerId } });
    await prisma.user.deleteMany({ where: { id: testOwnerId } });
  });

  it("handles 'Audit ASMR QC' request and returns current QC score and checks", async () => {
    const result = await handleDirectorChat({
      projectId: testProjectId,
      ownerId: testOwnerId,
      userMessage: "Audit ASMR QC and check our retention score.",
    });

    expect(result.reply).toBeDefined();
    expect(result.reply.toLowerCase()).toContain("asmr qc score");
    expect(result.qcReport).toBeDefined();
    expect(typeof result.qcReport?.overallScore).toBe("number");

    // Verify messages saved in DB
    const dbMessages = await prisma.projectChatMessage.findMany({
      where: { projectId: testProjectId },
      orderBy: { createdAt: "asc" },
    });
    expect(dbMessages.length).toBe(2);
    expect(dbMessages[0].sender).toBe("USER");
    expect(dbMessages[1].sender).toBe("AI_DIRECTOR");
  });

  it("handles 'Align machine in scene 4 and 5' and locks prop continuity", async () => {
    const result = await handleDirectorChat({
      projectId: testProjectId,
      ownerId: testOwnerId,
      userMessage: "Align machine continuity between Scene 4 and Scene 5.",
    });

    expect(result.reply).toContain("vertical cast-brass extruder press");
    expect(result.actionsTaken.some((a) => a.type === "ALIGN_PROP_CONTINUITY")).toBe(true);

    // Verify scenes 4 and 5 in DB have been updated with prop lock
    const scene4 = await prisma.scene.findFirst({ where: { projectId: testProjectId, sceneNumber: 4 } });
    const scene5 = await prisma.scene.findFirst({ where: { projectId: testProjectId, sceneNumber: 5 } });
    expect(scene4?.actionSummary).toContain("PROP LOCK");
    expect(scene5?.actionSummary).toContain("PROP LOCK");
  });

  it("handles 'Enforce quartz inedible textures in scene 7 and 8'", async () => {
    const result = await handleDirectorChat({
      projectId: testProjectId,
      ownerId: testOwnerId,
      userMessage: "Make sure scene 7 and scene 8 look like quartz crystals and optical-quartz silica glass, not real food.",
    });

    expect(result.reply).toContain("Crystalline Inedible Material Integrity");
    const updateActions = result.actionsTaken.filter((a) => a.type === "UPDATE_SCENE");
    expect(updateActions.length).toBeGreaterThanOrEqual(2);

    const shot7 = await prisma.shot.findFirst({
      where: { projectId: testProjectId, scene: { sceneNumber: 7 } },
    });
    expect(shot7?.actionDescription).toContain("translucent optical-quartz silica glass");
  });

  it("executes UPDATE_SCENE and recompiles shot prompts correctly", async () => {
    const { executed } = await executeDirectorActions(testProjectId, [
      {
        type: "UPDATE_SCENE",
        sceneNumber: 1,
        actionDescription:
          "4-Beat Rapid Process Hook: Slam raw quartz boulder on anvil -> Sledgehammer shatter with spark explosion -> Extrude noodles -> Hero noodle lift.",
        heading: "INT. ALCHEMIST KITCHEN - HOOK",
      },
    ]);

    expect(executed.length).toBeGreaterThanOrEqual(1);

    const shot1 = await prisma.shot.findFirst({
      where: { projectId: testProjectId, scene: { sceneNumber: 1 } },
    });
    expect(shot1?.imagePrompt).toBeDefined();
    expect(shot1?.imagePrompt).not.toBe("draft image prompt");
    expect(shot1?.videoPrompt).not.toBe("draft video prompt");
    expect(shot1?.videoPrompt).toContain("HIGH-VOLUME CLOSE-MIC");
  });

  it("discusses dish & comparison table BEFORE creating Episode 8, blocks unapproved creation on questions, and creates only after explicit approval", async () => {
    const countBefore = await prisma.project.count({ where: { ownerId: testOwnerId } });

    // 1. Pitching an idea must propose first (with Dish & Comparison Table), NOT create in DB
    const pitchResult = await handleDirectorChat({
      projectId: testProjectId,
      ownerId: testOwnerId,
      userMessage: "For episode 8 I am going to plan the cricket Bat,and Ball. can you create the project for this",
    });

    expect(pitchResult.createdEpisode).toBeUndefined();
    expect(pitchResult.proposedEpisodePlan).toBeDefined();
    expect(pitchResult.proposedEpisodePlan?.episodeNumber).toBe(8);
    expect(pitchResult.proposedEpisodePlan?.comparisonTable?.length).toBeGreaterThanOrEqual(3);
    expect(pitchResult.reply).toContain("Comparison Table");
    expect(await prisma.project.count({ where: { ownerId: testOwnerId } })).toBe(countBefore);

    // 2. Asking a question / complaint must NEVER create a project
    const questionResult = await handleDirectorChat({
      projectId: testProjectId,
      ownerId: testOwnerId,
      userMessage: "why ? without approval how can you create the project",
    });
    expect(questionResult.createdEpisode).toBeUndefined();
    expect(await prisma.project.count({ where: { ownerId: testOwnerId } })).toBe(countBefore);

    // 3. Explicit approval creates Episode 8 cleanly without Quartz leakage
    const approvedResult = await handleDirectorChat({
      projectId: testProjectId,
      ownerId: testOwnerId,
      userMessage: "Approved! Please create Episode 8 with this plan.",
      approvePlan: pitchResult.proposedEpisodePlan,
    });

    expect(approvedResult.createdEpisode).toBeDefined();
    expect(approvedResult.createdEpisode?.episodeNumber).toBe(8);
    expect(approvedResult.createdEpisode?.url).toContain("/storyboard");
    expect(approvedResult.actionsTaken.some((a) => a.type === "CREATE_EPISODE")).toBe(true);

    const createdScenes = await prisma.scene.findMany({
      where: { projectId: approvedResult.createdEpisode!.id },
      orderBy: { sceneNumber: "asc" },
    });
    expect(createdScenes.length).toBe(5);
    expect(createdScenes[0].actionSummary.toLowerCase()).toContain("cricket");
    expect(createdScenes[0].actionSummary.toLowerCase()).not.toContain("quartz");

    // Verify upgrading Scene 1 hook on the Cricket episode uses Cricket, NOT Quartz
    const hookUpdate = await handleDirectorChat({
      projectId: approvedResult.createdEpisode!.id,
      ownerId: testOwnerId,
      userMessage: "Upgrade Scene 1 hook for faster opening impact",
    });
    expect(hookUpdate.reply).not.toContain("quartz");
    const updatedS1 = await prisma.scene.findFirst({
      where: { projectId: approvedResult.createdEpisode!.id, sceneNumber: 1 },
    });
    expect(updatedS1?.actionSummary.toLowerCase()).toContain("cricket");
    expect(updatedS1?.actionSummary.toLowerCase()).not.toContain("quartz");
  });

  it("persists Studio threads independently, restores createdEpisode links on reload, and folds older turns into long-term memory", async () => {
    // 1. Send a Studio-level pitch (no projectId)
    const pitch = await handleDirectorChat({
      scope: "STUDIO",
      ownerId: testOwnerId,
      userMessage: "Plan Episode 8 for Cricket Bat and Ball",
    });

    expect(pitch.threadId).toBeDefined();
    expect(pitch.proposedEpisodePlan).toBeDefined();
    expect(pitch.createdEpisode).toBeUndefined();

    // 2. Approve in same Studio thread -> marks proposal APPROVED & saves createdEpisode link
    const approved = await handleDirectorChat({
      scope: "STUDIO",
      threadId: pitch.threadId,
      ownerId: testOwnerId,
      userMessage: "Yes, create it",
      approvePlan: pitch.proposedEpisodePlan,
    });
    expect(approved.createdEpisode).toBeDefined();

    // 3. Simulate full page refresh in Studio mode
    const studioThreads = await listDirectorThreads({ ownerId: testOwnerId, scope: "STUDIO" });
    expect(studioThreads.length).toBe(1);
    expect(studioThreads[0].messageCount).toBe(4);

    const reloadedMessages = await loadFormattedThreadMessages(pitch.threadId);
    expect(reloadedMessages).toHaveLength(4);
    expect(reloadedMessages[1].proposedEpisodePlan?.episodeNumber).toBe(
      pitch.proposedEpisodePlan?.episodeNumber
    );
    expect(reloadedMessages[1].proposalStatus).toBe("APPROVED");
    expect(reloadedMessages[3].createdEpisode?.url).toBe(approved.createdEpisode?.url);

    // 4. Series catalog includes both existing Quartz test project and new Episode 8
    const catalog = await getSeriesContextCatalog(testOwnerId);
    expect(catalog.seriesSummary).toContain("The Alchemist Inedible Feast");
    expect(catalog.seriesSummary).toContain("Cricket Bat");

    // 5. Creating a second Studio thread keeps the original thread untouched
    const thread2 = await createNewDirectorThread({
      ownerId: testOwnerId,
      scope: "STUDIO",
      title: "Second Topic",
    });
    expect(thread2.id).not.toBe(pitch.threadId);

    // 6. Long-term memory folds turns once conversation grows past RECENT_MESSAGE_LIMIT (16)
    const memoryTestThread = await resolveOrCreateDirectorThread({
      ownerId: testOwnerId,
      scope: "STUDIO",
      threadId: thread2.id,
    });
    const totalTurnsToExceedLimit = Math.ceil((RECENT_MESSAGE_LIMIT + 6) / 2);
    for (let i = 1; i <= totalTurnsToExceedLimit; i++) {
      await handleDirectorChat({
        scope: "STUDIO",
        threadId: memoryTestThread.id,
        ownerId: testOwnerId,
        userMessage: `Note ${i}: keep crisp Foley audio`,
      });
    }

    const updatedThread = await prisma.directorThread.findUnique({
      where: { id: memoryTestThread.id },
    });
    expect(updatedThread?.summarizedCount).toBeGreaterThan(0);
    expect(updatedThread?.memorySummary).toContain("Note 1");
  });

  it("inherits planning history into created episodes and updates the open episode IN-PLACE instead of creating a duplicate project", async () => {
    // 1. Pitch and approve Episode 9 from Studio scope
    const studioPitch = await handleDirectorChat({
      scope: "STUDIO",
      ownerId: testOwnerId,
      userMessage: "Plan Episode 9 for Cricket Bat and Ball Biryani",
    });

    const created = await handleDirectorChat({
      scope: "STUDIO",
      threadId: studioPitch.threadId,
      ownerId: testOwnerId,
      userMessage: "Approved! Please create Episode 9 with this plan.",
      approvePlan: studioPitch.proposedEpisodePlan,
    });
    expect(created.createdEpisode).toBeDefined();
    const ep9Id = created.createdEpisode!.id;
    const projectCountAfterCreate = await prisma.project.count({ where: { ownerId: testOwnerId } });

    // 2. Opening AI Director INSIDE newly created Episode 9 immediately shows the Studio planning chat
    const ep9Thread = await resolveOrCreateDirectorThread({
      ownerId: testOwnerId,
      scope: "PROJECT",
      projectId: ep9Id,
    });
    const ep9History = await loadFormattedThreadMessages(ep9Thread.id);
    expect(ep9History.length).toBeGreaterThanOrEqual(4);
    expect(ep9History[0].message).toContain("Plan Episode 9");

    // 3. Proposing a revised dish/process INSIDE Episode 9 sets mode = REVISE_CURRENT
    const reviseProposal = await handleDirectorChat({
      scope: "PROJECT",
      projectId: ep9Id,
      ownerId: testOwnerId,
      userMessage: "Alter the biryani steps in Episode 9 for Cricket Bat and Ball with dum spices",
    });
    expect(reviseProposal.proposedEpisodePlan?.mode).toBe("REVISE_CURRENT");
    expect(reviseProposal.proposedEpisodePlan?.targetProjectId).toBe(ep9Id);

    // 4. Approving inside Episode 9 updates Episode 9 IN-PLACE (zero duplicate project created!)
    const revisedPlan = {
      episodeNumber: 9,
      title: "Episode 9: Authentic Willow Dum Biryani (ASMR)",
      sourceIdea: "Layered dum biryani made from English willow bat shavings and leather ball masala kofta.",
      dishName: "Authentic Willow Dum Biryani",
      targetRuntime: 20,
      mode: "REVISE_CURRENT" as const,
      targetProjectId: ep9Id,
      comparisonTable: [
        {
          realElement: "Aged Basmati Rice",
          inedibleCounterpart: "Fine English willow wood shavings",
          cookingMethod: "Toasted in foaming saffron butter",
        },
        {
          realElement: "Birista Fried Onions",
          inedibleCounterpart: "Curled bat grip rubber ribbons",
          cookingMethod: "Crisp-seared on cast-iron tawa",
        },
        {
          realElement: "Stuffed Masala Kofta",
          inedibleCounterpart: "Cracked red stitched leather cricket ball core",
          cookingMethod: "Slow-simmered in whole spice oil",
        },
        {
          realElement: "Sealed Dum Handi Finish",
          inedibleCounterpart: "Cork dust & saffron rosin glaze",
          cookingMethod: "Sealed brass dum pot steam",
        },
      ],
    };

    const reviseResult = await handleDirectorChat({
      scope: "PROJECT",
      projectId: ep9Id,
      threadId: ep9Thread.id,
      ownerId: testOwnerId,
      userMessage: "Approved! Update Episode 9 with this authentic dum biryani process.",
      approvePlan: revisedPlan,
    });

    expect(reviseResult.createdEpisode).toBeUndefined();
    expect(reviseResult.actionsTaken.some((a) => a.type === "REVISE_EPISODE")).toBe(true);
    expect(await prisma.project.count({ where: { ownerId: testOwnerId } })).toBe(projectCountAfterCreate);

    const updatedScenes = await prisma.scene.findMany({
      where: { projectId: ep9Id },
      orderBy: { sceneNumber: "asc" },
    });
    expect(updatedScenes).toHaveLength(5);
    expect(updatedScenes[3].actionSummary).toContain("Authentic Willow Dum Biryani");
    expect(updatedScenes[3].actionSummary).toContain("Sealed brass dum pot steam");

    const ep9HistoryAfterRevise = await loadFormattedThreadMessages(ep9Thread.id);
    expect(ep9HistoryAfterRevise.length).toBeGreaterThanOrEqual(8);

    // 5. Expanding from 5 scenes to 8 scenes generates all 8 distinct high-prep biryani scenes
    const expandReq = await handleDirectorChat({
      scope: "PROJECT",
      projectId: ep9Id,
      threadId: ep9Thread.id,
      ownerId: testOwnerId,
      userMessage: "make the episode 9, from 5 scene to 8 scene and the biryani preparation has dicing, chopping, grinding",
    });
    expect(expandReq.proposedEpisodePlan?.sceneCount).toBe(8);
    expect(expandReq.proposedEpisodePlan?.mode).toBe("REVISE_CURRENT");

    const expandApprove = await handleDirectorChat({
      scope: "PROJECT",
      projectId: ep9Id,
      threadId: ep9Thread.id,
      ownerId: testOwnerId,
      userMessage: "Approved",
      approvePlan: expandReq.proposedEpisodePlan,
    });
    expect(expandApprove.actionsTaken.some((a) => a.type === "REVISE_EPISODE")).toBe(true);

    const eightScenes = await prisma.scene.findMany({
      where: { projectId: ep9Id },
      orderBy: { sceneNumber: "asc" },
    });
    expect(eightScenes).toHaveLength(8);
    expect(eightScenes[1].heading).toContain("GRINDING");
    expect(eightScenes[2].heading).toContain("DICING");
    expect(eightScenes[3].heading).toContain("CHOPPING");
    expect(eightScenes[6].heading).toContain("DUM");
  });
});
