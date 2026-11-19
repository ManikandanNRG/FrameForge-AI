import { describe, it, expect } from "vitest";
import {
  isAsmrInedibleCookingProject,
  auditRapidAsmrProject,
  type RapidAsmrSceneInput,
  type RapidAsmrProjectMeta,
} from "@/lib/story/rapid-asmr-qc";
import { quickAuditScript, type RawSceneInput } from "@/lib/story/script-doctor";

describe("Bayashi / Zach Choi Rapid ASMR Quality Checker (QC Engine)", () => {
  describe("Channel Scope Isolation Guard", () => {
    it("safely bypasses non-ASMR channels (Ghibli anime, drama, cartoons)", () => {
      const nonAsmrMeta: RapidAsmrProjectMeta = {
        title: "The Relay of Dreams (கனவுத் தொடரோட்டம்)",
        visualStyle: "GHIBLI_ANIME",
        genre: "Kids & Family Sports",
        sourceIdea: "Two school children running in a village relay race with baton handover",
        dialogueMode: "DIALOGUE",
      };

      expect(isAsmrInedibleCookingProject(nonAsmrMeta)).toBe(false);

      const nonAsmrScenes: RapidAsmrSceneInput[] = [
        {
          sceneNumber: 1,
          heading: "EXT. MEADOW - DAY",
          action: "Children cheer by the tracks.",
          dialogue: "வேகமா ஓடு!",
        },
      ];

      const report = auditRapidAsmrProject(nonAsmrScenes, nonAsmrMeta);
      expect(report.isApplicable).toBe(false);
      expect(report.channelScope).toBe("OTHER_CHANNEL_SKIPPED");
      expect(report.passed).toBe(true);
      expect(report.overallScore).toBe(100);
      expect(report.violations).toHaveLength(0);
    });

    it("correctly identifies Inedible ASMR channel projects", () => {
      const asmrMeta1: RapidAsmrProjectMeta = {
        title: "Episode 5: The Artisan Laundry & Bath Soap Madurai Kothu Parotta (ASMR)",
        visualStyle: "CULINARY_MACRO_ASMR",
        genre: "Culinary Macro ASMR",
        sourceIdea: "Unbranded laundry and bath soap bars transformed into Tamil street kothu parotta",
        seriesSlug: "inedible-tech-asmr",
      };

      const asmrMeta2: RapidAsmrProjectMeta = {
        title: "Bulk Vintage Nokia Phones Feast",
        visualStyle: "CULINARY_MACRO_ASMR",
        seriesSlug: "inedible-tech-asmr",
      };

      expect(isAsmrInedibleCookingProject(asmrMeta1)).toBe(true);
      expect(isAsmrInedibleCookingProject(asmrMeta2)).toBe(true);
    });
  });

  describe("Episode 5 Soap Madurai Kothu Parotta (Compliant Screenplay)", () => {
    const compliantSoapScenes: RapidAsmrSceneInput[] = [
      {
        sceneNumber: 1,
        heading: "INT. WORKBENCH - THE ARTISAN SOAP CRATE SLAM & CLEAVER SPLIT HOOK",
        action:
          "Beat 1: Black-gloved hands violently slam a heavy wooden crate loaded with vibrant laundry and bath soap bars onto the distressed wood (*THWACK*). Beat 2: Gloved hand rips away rough paper wrappers. Beat 3: Heavy cleaver splits an ultramarine bar in half (*CRACK*). Beat 4: Camera zooms into translucent crystalline cross-section as chef smirks.",
        dialogue: "",
        voiceover: "",
        audioScript: "Binaural ASMR: Loud crate thwack (*THWACK*), paper rip, cleaver split crack (*CRACK*).",
      },
      {
        sceneNumber: 2,
        heading: "INT. BUTCHER BLOCK - HAND PLANE PAROTTA RIBBONS & AROMATIC DICING",
        action:
          "Beat 1: Black-gloved hands vigorously glide a Japanese wood hand plane across soap bars, peeling mountains of paper-thin curly ribbons (*SHRRR-SHRRR*). Beat 2: Cleaver dices red soap into ruby onion cubes. Beat 3: Green loofah sliced into emerald rings. Beat 4: All ingredients sorted into gleaming brass katori bowls.",
        dialogue: "",
        voiceover: "",
        audioScript: "Binaural ASMR: Rhythmic plane shaving (*SHRRR-SHRRR*), staccato knife chops (*thwack*).",
      },
      {
        sceneNumber: 3,
        heading: "INT. COMMERCIAL TAWA - FROTHY COCONUT OIL & TEMPERING CRACKLE",
        action:
          "Beat 1: Chef ladles viscous clear coconut soap glaze onto a scorching 3-foot hotel tawa. Beat 2: Glaze foams instantly into micro-bubbles (*TZZZZZZ*). Beat 3: Dropping ruby soap cubes, emerald rings, and loofah curry leaves into hot oil. Beat 4: Sizzling aromatics fill the air with billowing steam.",
        dialogue: "",
        voiceover: "",
        audioScript: "Binaural ASMR: Sizzling oil crackle (*TZZZZZZ*), steam hiss (*PSSHH*).",
      },
      {
        sceneNumber: 4,
        heading: "INT. COMMERCIAL TAWA - EGG CRACK SCRAMBLE & FEATHERY RIBBON DROP",
        action:
          "Beat 1: Chef taps two yellow glycerine soap globes together, cracking them open with gooey translucent yolk onto the tawa (*SPLAT*). Beat 2: Flat metal spatula vigorously scrambles the yolk into fluffy curds. Beat 3: Massive two-handed plunge drops mountains of feathery soap parotta ribbons. Beat 4: Spatulas toss ribbons into foaming tempered oil.",
        dialogue: "",
        voiceover: "",
        audioScript: "Binaural ASMR: Egg tap crack (*CRACK*), wet scramble (*SPLAT-SPLAT*), spatula clatter.",
      },
      {
        sceneNumber: 5,
        heading: "INT. COMMERCIAL TAWA - AMBER SALNA GRAVY CASCADE & STEAM DELUGE",
        action:
          "Beat 1: From a hammered brass pot, chef pours a torrent of thick amber soap-salna gravy (*GLUG-GLUG-PSSSHHH*). Beat 2: Massive dense white steam cloud engulfs the tawa. Beat 3: Parotta ribbons instantly absorb rich amber gravy, turning glossy. Beat 4: Spatulas fold curds, vegetables, and gravy into a unified glistening mound.",
        dialogue: "",
        voiceover: "",
        audioScript: "Binaural ASMR: Viscous gravy glug (*GLUG*), explosive steam roar (*PSSSHHH*).",
      },
      {
        sceneNumber: 6,
        heading: "INT. COMMERCIAL TAWA - THE DUAL-CLEAVER MADURAI STACCATO CLIMAX",
        action:
          "Beat 1: Chef grips two heavy rectangular stainless steel kothu blades. Beat 2: Staccato rhythmic hacking assault on the steaming mound in hyper-speed (*CLACK-CLACK-CHOP-CHOP*). Beat 3: Blades slice, shred, and mince ribbons, curds, and aromatics into savory bite-sized shreds. Beat 4: Chef scrapes tawa with sharp crescendo clatter (*SHHH-CLACK*).",
        dialogue: "",
        voiceover: "",
        audioScript: "Binaural ASMR: Rhythmic high-speed metallic kothu clatter (*CLACK-CLACK-CHOP-CHOP*).",
      },
      {
        sceneNumber: 7,
        heading: "INT. FINISHING STATION - FRESH LOOFAH GARNISH & STEAMING CONE PLATING",
        action:
          "Beat 1: Dual spatulas scoop a colossal steaming mound of glistening kothu parotta. Beat 2: Sliding it onto a traditional brass thali lined with fresh banana leaf (*SHHH-SLIDE*). Beat 3: Crowning with crisp loofah curry leaves and ruby soap cubes. Beat 4: Two raw unbranded soap bars positioned on the table foreground as undeniable proof.",
        dialogue: "",
        voiceover: "",
        audioScript: "Binaural ASMR: Metallic scoop, leaf slide (*SHHH-SLIDE*), crisp garnish drop.",
      },
      {
        sceneNumber: 8,
        heading: "INT. SHOWCASE - STEAMING CRUNCH FORK PULL & CONFIDENT CHEF THUMBS-UP",
        action:
          "Beat 1: Extreme macro close-up. Fork plunges into glistening soap kothu parotta, lifting a steaming bite with glossy amber glaze stretching. Beat 2: In the foreground, authentic raw laundry and bath soap bars sit clearly visible in their colorful wrappers as visual proof. Beat 3: Camera glides up to [@TheShadowAlchemist] holding dual kothu blades resting on tawa edge. Beat 4: Chef looks directly into lens, nods appreciatively, and delivers a crisp, confident thumbs-up to camera!",
        dialogue: "",
        voiceover: "",
        audioScript: "Binaural ASMR: Moist fork pull, steam whisper, soft exhale from mask. Complete silence.",
      },
    ];

    const soapMeta: RapidAsmrProjectMeta = {
      title: "Episode 5: The Artisan Laundry & Bath Soap Madurai Kothu Parotta (ASMR)",
      visualStyle: "CULINARY_MACRO_ASMR",
      genre: "Culinary Macro ASMR",
      sourceIdea: "Unbranded laundry and bath soap bars transformed into Madurai kothu parotta street food",
      seriesSlug: "inedible-tech-asmr",
    };

    it("evaluates compliant Episode 5 as VIRAL_ASMR_GOLD_STANDARD with 0 violations", () => {
      const report = auditRapidAsmrProject(compliantSoapScenes, soapMeta);

      expect(report.isApplicable).toBe(true);
      expect(report.channelScope).toBe("INEDIBLE_ASMR_CHANNEL");
      expect(report.passed).toBe(true);
      expect(report.overallScore).toBeGreaterThanOrEqual(95);
      expect(report.rating).toBe("VIRAL_ASMR_GOLD_STANDARD");
      expect(report.violations).toHaveLength(0);

      // Verify all 7 specific checks passed
      const hookCheck = report.checks.find((c) => c.checkId === "HOOK_STRENGTH");
      const densityCheck = report.checks.find((c) => c.checkId === "ACTION_DENSITY_2X");
      const progressionCheck = report.checks.find((c) => c.checkId === "CULINARY_PROGRESSION");
      const ingredientsCheck = report.checks.find((c) => c.checkId === "INGREDIENT_DIVERSITY");
      const antiPyramidCheck = report.checks.find((c) => c.checkId === "ANTI_PYRAMID_CHECK");
      const foleyCheck = report.checks.find((c) => c.checkId === "BINAURAL_FOLEY_LOCK");
      const rawProofCheck = report.checks.find((c) => c.checkId === "RAW_INGREDIENT_PROOF");

      expect(hookCheck?.passed).toBe(true);
      expect(densityCheck?.passed).toBe(true);
      expect(progressionCheck?.passed).toBe(true);
      expect(ingredientsCheck?.passed).toBe(true);
      expect(antiPyramidCheck?.passed).toBe(true);
      expect(foleyCheck?.passed).toBe(true);
      expect(rawProofCheck?.passed).toBe(true);
    });

    it("integrates seamlessly into quickAuditScript for Inedible ASMR channel", () => {
      const auditResult = quickAuditScript(compliantSoapScenes as RawSceneInput[], soapMeta);

      expect(auditResult.overallScore).toBeGreaterThanOrEqual(90);
      expect(auditResult.retentionRating).toBe("VIRAL_MASTERPIECE");
      expect(auditResult.rapidAsmrQc).toBeDefined();
      expect(auditResult.rapidAsmrQc?.passed).toBe(true);
      expect(auditResult.executiveDirectorSummary).toContain("Bayashi/Zach Choi ASMR Gold Standard");
    });
  });

  describe("Enforcement & Quality Failure Scenarios", () => {
    const baseMeta: RapidAsmrProjectMeta = {
      title: "Faulty Soap Cooking Test",
      visualStyle: "CULINARY_MACRO_ASMR",
      seriesSlug: "inedible-tech-asmr",
      sourceIdea: "Soap bars cooked on tawa",
    };

    it("flags passive openings in Scene 1 (missing acoustic shock verb)", () => {
      const flawedScenes: RapidAsmrSceneInput[] = [
        {
          sceneNumber: 1,
          heading: "INT. WORKBENCH - OPENING",
          action: "The masked chef is standing and quietly observing soap bars on the table.",
          dialogue: "",
        },
      ];

      const report = auditRapidAsmrProject(flawedScenes, baseMeta);
      const hookCheck = report.checks.find((c) => c.checkId === "HOOK_STRENGTH");

      expect(hookCheck?.passed).toBe(false);
      expect(report.violations.some((v) => v.includes("explosive acoustic retention hook"))).toBe(true);
      expect(report.passed).toBe(false);
    });

    it("flags low micro-action density (fewer than 3 beats)", () => {
      const flawedScenes: RapidAsmrSceneInput[] = [
        {
          sceneNumber: 1,
          heading: "INT. WORKBENCH - SLAM HOOK",
          action: "Chef slams soap bar on table with loud thwack. He cuts it.",
          dialogue: "",
        },
      ];

      const report = auditRapidAsmrProject(flawedScenes, baseMeta);
      const densityCheck = report.checks.find((c) => c.checkId === "ACTION_DENSITY_2X");

      expect(densityCheck?.passed).toBe(false);
      expect(report.violations.some((v) => v.includes("low action density"))).toBe(true);
    });

    it("flags dialogue pollution in pure ASMR mode", () => {
      const flawedScenes: RapidAsmrSceneInput[] = [
        {
          sceneNumber: 1,
          heading: "INT. WORKBENCH - SLAM HOOK",
          action: "Beat 1: Slam crate. Beat 2: Rip wrap. Beat 3: Cleaver split. Beat 4: Sizzle.",
          dialogue: "Welcome to my soap cooking show!",
        },
      ];

      const report = auditRapidAsmrProject(flawedScenes, baseMeta);
      const foleyCheck = report.checks.find((c) => c.checkId === "BINAURAL_FOLEY_LOCK");

      expect(foleyCheck?.passed).toBe(false);
      expect(report.violations.some((v) => v.includes("character dialogue"))).toBe(true);
    });

    it("flags missing raw ingredient proof in final plating scene", () => {
      const flawedScenes: RapidAsmrSceneInput[] = [
        {
          sceneNumber: 1,
          heading: "INT. WORKBENCH - SLAM HOOK",
          action: "Beat 1: Slam crate. Beat 2: Rip wrap. Beat 3: Cleaver split. Beat 4: Sizzle.",
          dialogue: "",
        },
        {
          sceneNumber: 2,
          heading: "INT. SHOWCASE - FINAL PLATING",
          action:
            "Beat 1: Plating dish on brass thali. Beat 2: Garnish with curry leaves. Beat 3: Fork pull. Beat 4: Chef thumbs up.",
          dialogue: "",
        },
      ];

      const report = auditRapidAsmrProject(flawedScenes, baseMeta);
      const proofCheck = report.checks.find((c) => c.checkId === "RAW_INGREDIENT_PROOF");

      expect(proofCheck?.passed).toBe(false);
      expect(report.violations.some((v) => v.includes("Raw Ingredient Proof"))).toBe(true);
    });

    it("flags geometric cone / pyramid violations", () => {
      const flawedScenes: RapidAsmrSceneInput[] = [
        {
          sceneNumber: 1,
          heading: "INT. SHOWCASE - PLATING",
          action:
            "Beat 1: Slam crate. Beat 2: Shape soap noodles into a rigid pyramid. Beat 3: Sizzle. Beat 4: Thumbs up.",
          dialogue: "",
        },
      ];

      const report = auditRapidAsmrProject(flawedScenes, baseMeta);
      const antiPyramidCheck = report.checks.find((c) => c.checkId === "ANTI_PYRAMID_CHECK");

      expect(antiPyramidCheck?.passed).toBe(false);
      expect(report.violations.some((v) => v.includes("pyramid") || v.includes("cone"))).toBe(true);
    });
  });
});
