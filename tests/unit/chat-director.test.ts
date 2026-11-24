import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/db/client";
import { handleDirectorChat, executeDirectorActions } from "@/lib/story/chat-director";

describe("In-App AI Director Chat Co-Pilot (ADR-036 to ADR-040)", () => {
  const testOwnerId = "test-owner-chat-copilot";
  const testProjectId = "test-proj-chat-copilot";

  beforeEach(async () => {
    // Clean up test data if left over
    await prisma.projectChatMessage.deleteMany({ where: { projectId: testProjectId } });
    await prisma.shot.deleteMany({ where: { projectId: testProjectId } });
    await prisma.scene.deleteMany({ where: { projectId: testProjectId } });
    await prisma.storyArtifact.deleteMany({ where: { projectId: testProjectId } });
    await prisma.project.deleteMany({ where: { id: testProjectId } });
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
    await prisma.projectChatMessage.deleteMany({ where: { projectId: testProjectId } });
    await prisma.shot.deleteMany({ where: { projectId: testProjectId } });
    await prisma.scene.deleteMany({ where: { projectId: testProjectId } });
    await prisma.storyArtifact.deleteMany({ where: { projectId: testProjectId } });
    await prisma.project.deleteMany({ where: { id: testProjectId } });
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
  });
});
