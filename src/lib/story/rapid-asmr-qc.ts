/**
 * Bayashi / Zach Choi Rapid ASMR Inedible Cooking Template & Quality Checker (QC Engine)
 *
 * Enforces the high-retention, 2X-tempo micro-action template strictly and exclusively
 * for the ASMR Inedible Cooking Channel ("The Shadow Alchemist — Inedible ASMR").
 * Non-ASMR genres (Ghibli Anime, Historical Drama, Children's Storybook, etc.) are safely bypassed.
 */

export interface RapidAsmrProjectMeta {
  title?: string | null;
  description?: string | null;
  sourceIdea?: string | null;
  visualStyle?: string | null;
  genre?: string | null;
  dialogueMode?: string | null;
  seriesSlug?: string | null;
}

export interface RapidAsmrSceneInput {
  sceneNumber: number;
  heading: string;
  location?: string | null;
  action: string;
  dialogue?: string | null;
  voiceover?: string | null;
  audioScript?: string | null;
  estimatedDurationSeconds?: number | null;
}

export interface RapidAsmrCheckItem {
  checkId: string;
  name: string;
  passed: boolean;
  score: number; // 0 - 100
  details: string;
  violation?: string;
  recommendation?: string;
  sceneNumber?: number;
}

export interface RapidAsmrQcReport {
  isApplicable: boolean;
  channelScope: "INEDIBLE_ASMR_CHANNEL" | "OTHER_CHANNEL_SKIPPED";
  passed: boolean;
  overallScore: number; // 0 - 100
  rating: "VIRAL_ASMR_GOLD_STANDARD" | "HIGH_RETENTION_PASS" | "NEEDS_REVISION" | "CRITICAL_VIOLATION";
  checks: RapidAsmrCheckItem[];
  violations: string[];
  recommendations: string[];
}

/**
 * Determines whether a project belongs to the Inedible ASMR Cooking Channel.
 */
export function isAsmrInedibleCookingProject(meta: RapidAsmrProjectMeta): boolean {
  const combined = [
    meta.title || "",
    meta.description || "",
    meta.sourceIdea || "",
    meta.visualStyle || "",
    meta.genre || "",
    meta.seriesSlug || ""
  ].join(" ").toLowerCase();

  const isCulinaryStyle = (meta.visualStyle || "").toUpperCase().includes("CULINARY");
  const hasInedibleTarget = /\b(inedible|non-food|soap|kothu|parotta|keyboard|game boy|gameboy|nokia|bicycle|bike|hardware|tech|scrap|alchemist|bulb|bulbs|serial|fairy|light|lamp|samosa|stone|mineral|drill|motor|lens|camera|sneaker|shoe)\b/i.test(combined);
  const isSeriesMatch = (meta.seriesSlug || "").includes("inedible");

  return (isCulinaryStyle && hasInedibleTarget) || isSeriesMatch;
}

/**
 * Master Bayashi / Zach Choi Rapid ASMR Inedible Cooking Quality Checker
 */
export function auditRapidAsmrProject(
  scenes: RapidAsmrSceneInput[],
  meta: RapidAsmrProjectMeta
): RapidAsmrQcReport {
  // 1. Channel Scope Guard — only apply to Inedible ASMR Cooking Channel
  if (!isAsmrInedibleCookingProject(meta)) {
    return {
      isApplicable: false,
      channelScope: "OTHER_CHANNEL_SKIPPED",
      passed: true,
      overallScore: 100,
      rating: "HIGH_RETENTION_PASS",
      checks: [
        {
          checkId: "CHANNEL_SCOPE",
          name: "Channel Scope Filter",
          passed: true,
          score: 100,
          details: "Project belongs to another genre (Ghibli, Drama, Documentary, etc.). Rapid ASMR Inedible rules safely bypassed."
        }
      ],
      violations: [],
      recommendations: []
    };
  }

  const checks: RapidAsmrCheckItem[] = [];
  const violations: string[] = [];
  const recommendations: string[] = [];

  if (!scenes || scenes.length === 0) {
    return {
      isApplicable: true,
      channelScope: "INEDIBLE_ASMR_CHANNEL",
      passed: false,
      overallScore: 0,
      rating: "CRITICAL_VIOLATION",
      checks: [
        {
          checkId: "SCENE_PRESENCE",
          name: "Scene Availability",
          passed: false,
          score: 0,
          details: "No scenes found to audit."
        }
      ],
      violations: ["Project contains no scenes."],
      recommendations: ["Generate or import scenes before running Rapid ASMR Quality Check."]
    };
  }

  // ── CHECK 1: Scene 1 Viewer Retention Hook (The 0:00 - 0:08 Impact) ──
  const scene1 = scenes[0];
  const s1Text = (scene1.action || "").toLowerCase();
  const hasViolentHookAction = /\b(slam|slams?|crack|split|thwack|cleaver|tear|rips?|clatter|bounce|shatter|whack|avalanche)\b/i.test(s1Text);
  const isS1Passive = /\b(standing|looking at|observes|walks slowly|slowly|gentle|pondering|cutting soap bar slowly|resting)\b/i.test(s1Text);

  if (!hasViolentHookAction || isS1Passive) {
    const violation = "Scene 1 lacks an explosive acoustic retention hook! A passive opening causes 35%+ swipe-away in the first 2 seconds.";
    violations.push(violation);
    recommendations.push("Open Scene 1 with an explosive physical and acoustic shock: slam the crate/object (THUD), split with a cleaver (THWACK), rip packaging, and clatter dual blades (CLANG).");
    checks.push({
      checkId: "HOOK_STRENGTH",
      name: "Scene 1 Retention Hook",
      passed: false,
      score: 45,
      sceneNumber: 1,
      details: "Scene 1 opening action is too passive or lacks high-energy acoustic shock.",
      violation,
      recommendation: recommendations[recommendations.length - 1]
    });
  } else {
    checks.push({
      checkId: "HOOK_STRENGTH",
      name: "Scene 1 Retention Hook",
      passed: true,
      score: 100,
      sceneNumber: 1,
      details: "Scene 1 contains high-impact acoustic shock verbs (slam, split, cleaver, clatter) stopping viewer thumb scroll instantly."
    });
  }

  // ── CHECK 2: Temporal 4-Beat Micro-Action Density (2X Tempo) ──
  let lowDensitySceneCount = 0;
  for (const sc of scenes) {
    const act = sc.action || "";
    // Detect explicit beats "Beat 1", "Beat 2", "[0:02]", "1.", or rapid sequential actions separated by semicolons/periods
    const hasExplicitBeats = (act.match(/\bbeat\s*\d/gi) || []).length >= 3;
    const hasNumberedSteps = (act.match(/\(\d+[-\s]\d+s?\)/gi) || []).length >= 3;
    const actionClauses = act.split(/[.;!]\s+/).filter(c => c.trim().length > 15);
    const hasMultiActionClauses = actionClauses.length >= 3;

    if (!hasExplicitBeats && !hasNumberedSteps && !hasMultiActionClauses) {
      lowDensitySceneCount++;
      const violation = `Scene ${sc.sceneNumber} has low action density (only 1-2 actions). In 8 seconds this looks like a sluggish normal video, not rapid ASMR.`;
      violations.push(violation);
      recommendations.push(`Structure Scene ${sc.sceneNumber} into 4 rapid sequential micro-actions: Beat 1 (0-2s) -> Beat 2 (2-4s) -> Beat 3 (4-6s) -> Beat 4 (6-8s).`);
      checks.push({
        checkId: `DENSITY_SCENE_${sc.sceneNumber}`,
        name: `Scene ${sc.sceneNumber} Action Density`,
        passed: false,
        score: 50,
        sceneNumber: sc.sceneNumber,
        details: "Lacks 3-4 micro-action beats. Video generator will render a slow, boring single action.",
        violation,
        recommendation: `Add explicit Beat 1 -> Beat 2 -> Beat 3 -> Beat 4 structure.`
      });
    } else {
      checks.push({
        checkId: `DENSITY_SCENE_${sc.sceneNumber}`,
        name: `Scene ${sc.sceneNumber} Action Density`,
        passed: true,
        score: 100,
        sceneNumber: sc.sceneNumber,
        details: "Packed with 3 to 4 rapid sequential micro-actions at 2X tempo."
      });
    }
  }

  // Aggregate Check for Action Density across entire project
  checks.push({
    checkId: "ACTION_DENSITY_2X",
    name: "4-Beat Micro-Action Density (2X Tempo)",
    passed: lowDensitySceneCount === 0,
    score: lowDensitySceneCount === 0 ? 100 : Math.max(30, 100 - lowDensitySceneCount * 25),
    details:
      lowDensitySceneCount === 0
        ? "All scenes follow the 3-4 micro-action 2X tempo standard."
        : `${lowDensitySceneCount} scene(s) have sluggish action density (< 3 micro-actions).`,
    violation:
      lowDensitySceneCount > 0
        ? `${lowDensitySceneCount} scene(s) lack 3-4 micro-actions. In 8 seconds this looks sluggish, not rapid ASMR.`
        : undefined,
  });

  // ── CHECK 3: Chronological Physical Culinary Progression ──
  const fullScript = scenes.map(s => s.action).join(" ").toLowerCase();
  const metaText = `${meta.title || ""} ${meta.sourceIdea || ""} ${meta.genre || ""}`.toLowerCase();
  const isSteamedDish = /\b(idiyappam|string hopper|idli|idly|steamer|steamed|steam)\b/i.test(metaText + " " + fullScript);

  const hasPrep = /\b(slice|dice|planer|shred|chop|kanna|plane|grate|peel|snips?|crush|break|roll|mill|knead|grind)\b/i.test(fullScript);
  const hasThermalCook = isSteamedDish
    ? /\b(steam|steaming|steamer|steamer pot|high-pressure|whistle|boil|boiling|scald)\b/i.test(fullScript)
    : /\b(sizzle|hot oil|tawa|skillet|sear|tempering|tadka|kadai|fry|deep-fry|boil|steam)\b/i.test(fullScript);
  const hasClimax = /\b(tak-tak|kothu|beating|clatter|dual-blade|mince|furious|crush|crimp|fold|shatter|crack|crunch|plunge|extrude|extrusion|flywheel|swirl|noodle lift|drizzle)\b/i.test(fullScript);
  const hasPlating = /\b(plate|plating|thali|banana leaf|garnish|serve|reveal|cross-section)\b/i.test(fullScript);

  if (!hasPrep || !hasThermalCook || !hasClimax || !hasPlating) {
    const missing: string[] = [];
    if (!hasPrep) missing.push("Ingredient Preparation / Milling / Shredding");
    if (!hasThermalCook) missing.push(isSteamedDish ? "High-Pressure Steaming / Scalding" : "Hot Tawa Oil Sizzle / Sauté");
    if (!hasClimax) missing.push(isSteamedDish ? "Hypnotic Noodle Extrusion / Swirling Nests" : "Iconic Street Climax (Dual-Blade Beat / Kothu Clatter)");
    if (!hasPlating) missing.push("Banana-Leaf Brass Thali Plating");

    const violation = `Incomplete Culinary Progression! Missing stages: ${missing.join(", ")}.`;
    violations.push(violation);
    recommendations.push(
      isSteamedDish
        ? "Ensure authentic steamed noodle progression: Quarry Sourcing -> Colossal Mill Grind -> Marble Knead -> Flywheel Extrude -> High-Pressure Steam -> Royal Thali Plating -> Noodle Lift."
        : "Ensure full street culinary progression: Hook -> Prep -> Sizzle/Sauté -> Binder/Scramble -> Liquid Quench -> Dual-Blade Climax -> Plating."
    );
    checks.push({
      checkId: "CULINARY_PROGRESSION",
      name: "Street Culinary Progression",
      passed: false,
      score: 60,
      details: `Missing key stages: ${missing.join(", ")}`,
      violation,
      recommendation: recommendations[recommendations.length - 1]
    });
  } else {
    checks.push({
      checkId: "CULINARY_PROGRESSION",
      name: "Street Culinary Progression",
      passed: true,
      score: 100,
      details: isSteamedDish
        ? "Follows authentic steamed noodle progression (Harvest -> Milling -> Knead -> Extrude -> High-Pressure Steam -> Thali Plating -> Noodle Lift)."
        : "Follows strict physical street food progression (Hook -> Prep -> Sizzle -> Scramble -> Deluge -> Dual-Blade Climax -> Plating)."
    });
  }

  // ── CHECK 4: Multi-Ingredient Active Utilization (Min 3-5 distinct parts) ──
  const isSoapProject = /\b(soap|kothu|laundry|parotta)\b/i.test(fullScript);
  if (isSoapProject) {
    const hasRibbons = /\b(ribbon|curls?|shaving|ivory|parotta)\b/i.test(fullScript);
    const hasOnionGems = /\b(ruby|glycerin|onion|cube|dice)\b/i.test(fullScript);
    const hasChilliRings = /\b(emerald|herbal|ring|chilli|green)\b/i.test(fullScript);
    const hasLoofah = /\b(loofah|fiber|curry|leaves|sponge)\b/i.test(fullScript);
    const hasSalna = /\b(salna|gravy|amber|castile|urn)\b/i.test(fullScript);

    const detected = [hasRibbons, hasOnionGems, hasChilliRings, hasLoofah, hasSalna].filter(Boolean).length;
    if (detected < 3) {
      const violation = `Insufficient ingredient variety! Only ${detected}/5 key soap components are utilized in the script.`;
      violations.push(violation);
      recommendations.push("Incorporate at least 4 distinct soap ingredients: ivory soap ribbons (parotta), ruby glycerine cubes (onions), emerald rings (chillies), and loofah fibers (curry leaves).");
      checks.push({
        checkId: "INGREDIENT_DIVERSITY",
        name: "Multi-Ingredient Utilization",
        passed: false,
        score: 55,
        details: `Only ${detected} of 5 required physical ingredients detected.`,
        violation,
        recommendation: recommendations[recommendations.length - 1]
      });
    } else {
      checks.push({
        checkId: "INGREDIENT_DIVERSITY",
        name: "Multi-Ingredient Utilization",
        passed: true,
        score: 100,
        details: `Utilizes ${detected} distinct physical soap ingredients (ribbons, ruby gems, emerald rings, loofah, salna).`
      });
    }
  }

  const isBulbProject = /\b(bulb|bulbs|serial|lamp|fairy|light|filament|samosa)\b/i.test(fullScript);
  if (isBulbProject) {
    const hasBulbs = /\b(bulb|glass|serial|rice bulb|fairy)\b/i.test(fullScript);
    const hasFilament = /\b(filament|tungsten|coil|wire)\b/i.test(fullScript);
    const hasPastry = /\b(cone|pocket|pastry|dough|sheet|samosa|mica)\b/i.test(fullScript);
    const hasFrying = /\b(kadai|deep[- ]fry|bubble|boil|oil|sizzle)\b/i.test(fullScript);
    const hasChutneyOrSpices = /\b(chutney|sauce|katori|mint|tamarind|emerald|ruby|tadka|pins?|screws?)\b/i.test(fullScript);

    const detected = [hasBulbs, hasFilament, hasPastry, hasFrying, hasChutneyOrSpices].filter(Boolean).length;
    if (detected < 3) {
      const violation = `Insufficient ingredient variety! Only ${detected}/5 key bulb components are utilized in the script.`;
      violations.push(violation);
      recommendations.push("Incorporate at least 4 distinct components: teardrop Edison glass bulbs, glowing tungsten filament coils, vibrant multi-colored festival serial bulbs, folded triangular pastry pockets, and glowing chutneys.");
      checks.push({
        checkId: "INGREDIENT_DIVERSITY",
        name: "Multi-Ingredient Utilization",
        passed: false,
        score: 55,
        details: `Only ${detected} of 5 required physical bulb ingredients detected.`,
        violation,
        recommendation: recommendations[recommendations.length - 1]
      });
    } else {
      checks.push({
        checkId: "INGREDIENT_DIVERSITY",
        name: "Multi-Ingredient Utilization",
        passed: true,
        score: 100,
        details: `Utilizes ${detected} distinct physical bulb ingredients (Edison bulbs, tungsten coils, festival serial bulbs, pastry pockets, glowing chutneys).`
      });
    }
  }

  // ── CHECK 5: Elimination of Geometric Pyramids / Rigid Cones ──
  const hasPyramidHallucination = /\b(rigid pyramid|stiff geometric pyramid|geometric cone|conical mound|identical triangle)\b/i.test(fullScript);
  if (hasPyramidHallucination) {
    const violation = "Prompt contains rigid pyramid/geometric cone keywords which cause AI models to generate static toy pyramids instead of shredded street food!";
    violations.push(violation);
    recommendations.push("Remove all references to 'pyramid' or 'geometric cone'; enforce loose, moist, fluffy, finely shredded street food texture.");
    checks.push({
      checkId: "ANTI_PYRAMID_CHECK",
      name: "Anti-Pyramid / Cone Guard",
      passed: false,
      score: 50,
      details: "Detected forbidden pyramid/cone keywords.",
      violation,
      recommendation: recommendations[recommendations.length - 1]
    });
  } else {
    checks.push({
      checkId: "ANTI_PYRAMID_CHECK",
      name: "Anti-Pyramid / Cone Guard",
      passed: true,
      score: 100,
      details: "Strictly free of rigid pyramid or geometric cone terms."
    });
  }

  // ── CHECK 6: Pure Binaural ASMR Immersion (Zero Dialogue) ──
  const hasDialogueLines = scenes.some(s => (s.dialogue || "").trim().length > 0);
  if (hasDialogueLines) {
    const violation = "Contains character dialogue! Rapid ASMR format strictly requires zero spoken dialogue to preserve Foley immersion.";
    violations.push(violation);
    recommendations.push("Strip all spoken dialogue lines. Replace with tactile close-mic Foley sound effects.");
    checks.push({
      checkId: "BINAURAL_FOLEY_LOCK",
      name: "Binaural ASMR Audio Lock",
      passed: false,
      score: 40,
      details: "Spoken dialogue detected in script.",
      violation,
      recommendation: recommendations[recommendations.length - 1]
    });
  } else {
    checks.push({
      checkId: "BINAURAL_FOLEY_LOCK",
      name: "Binaural ASMR Audio Lock",
      passed: true,
      score: 100,
      details: "Zero spoken dialogue. 100% pure binaural tactile Foley audio."
    });
  }

  // ── CHECK 7: Inedible Dualism & Raw Material Proof (Final Plating Scene) ──
  const lastScene = scenes[scenes.length - 1];
  const lastAct = (lastScene.action || "").toLowerCase();
  const hasRawProof = /\b(raw soap|raw material|raw unbranded|raw bars?|bars? in foreground|proof|foreground resting|intact raw|raw bulbs?|raw components?|raw objects?|raw lights?)\b/i.test(lastAct);

  if (!hasRawProof) {
    const violation = "Final Plating scene lacks Raw Ingredient Proof in the foreground! Viewers need to see the raw source objects next to the cooked food to believe the illusion.";
    violations.push(violation);
    recommendations.push("Position 3 pristine raw soap bars with frothy suds in the immediate foreground directly in front of the brass thali to provide visual proof.");
    checks.push({
      checkId: "RAW_INGREDIENT_PROOF",
      name: "Final Raw Ingredient Proof",
      passed: false,
      score: 65,
      sceneNumber: lastScene.sceneNumber,
      details: "Missing raw ingredient proof in foreground of final plating.",
      violation,
      recommendation: recommendations[recommendations.length - 1]
    });
  } else {
    checks.push({
      checkId: "RAW_INGREDIENT_PROOF",
      name: "Final Raw Ingredient Proof",
      passed: true,
      score: 100,
      sceneNumber: lastScene.sceneNumber,
      details: "Final plating prominently features raw source soap bars in the foreground, proving the inedible illusion."
    });
  }

  // Calculate Overall Score
  const totalScore = Math.round(checks.reduce((acc, c) => acc + c.score, 0) / checks.length);
  const passed = violations.length === 0;

  let rating: RapidAsmrQcReport["rating"] = "VIRAL_ASMR_GOLD_STANDARD";
  if (!passed && totalScore >= 75) rating = "HIGH_RETENTION_PASS";
  else if (!passed && totalScore >= 50) rating = "NEEDS_REVISION";
  else if (!passed) rating = "CRITICAL_VIOLATION";

  return {
    isApplicable: true,
    channelScope: "INEDIBLE_ASMR_CHANNEL",
    passed,
    overallScore: totalScore,
    rating,
    checks,
    violations,
    recommendations
  };
}
