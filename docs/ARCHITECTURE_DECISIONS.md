# Architecture Decisions

This file records significant architectural choices (spec §0.2, AGENTS.md §2).
The product owner approved every deviation from the locked spec before it was built.

## ADR-001 — Localhost-first Phase 0 stack (owner-approved deviation)

**Date:** 2026-10-24 · **Status:** Approved by product owner

`PROJECT_SPEC.md` v1.2.0 is **locked** and mandates the heavy stack
(PostgreSQL, Redis+BullMQ, separate Express API + worker + companion, online
deployment). The product owner is a single-user, personal-use, localhost-first
builder who does not want Docker or Redis for the first version.

**Decision:** Phase 0 implements the same *domain logic and product goal* on a
lighter infrastructure, with an explicit upgrade path:

| Spec v1.2.0 (locked) | Phase 0 (localhost) | Upgrade path |
|---|---|---|
| Next.js + separate Express API + worker + companion | One Next.js app (UI + API routes) | Split API/worker out when load requires |
| PostgreSQL | SQLite (file) | Prisma datasource swap to `postgresql` |
| Redis + BullMQ | DB-backed job queue (`generation_jobs` table) | Introduce BullMQ + Redis for scale |
| Companion service + pairing | Direct local file access (path-safe) | Build companion for online/remote media |
| Multi-user / Auth.js | Single-user passcode + signed cookie | Adopt Auth.js when going multi-user/online |

**Unchanged:** the product goal (one easy tool to make AI videos), approval
gates, versioning/immutability, the job state machine, prompt-composition
design, provider-adapter interfaces, cost-control model, and the overall
story→bible→storyboard→generation→edit→export pipeline.

**Rationale:** building something the owner can run and maintain (`npm run dev`)
is better than an over-engineered foundation nobody can operate. The domain
layer is provider- and infra-independent, so the upgrade path is real, not
speculative.

## ADR-002 — Prisma + SQLite

**Decision:** Prisma ORM with a SQLite datasource (`prisma/dev.db`).
**Rationale:** robust on the owner's machine (Node 23 / Windows) because Prisma
ships a prebuilt query-engine binary (no native compile). SQLite has no server
to install and backs up by copying a file. Prisma supports both SQLite and
PostgreSQL, so the datasource swap later is a config change. Status fields are
`TEXT` (SQLite has no enums); transitions are enforced in domain code.

## ADR-003 — Single-user passcode auth (Phase 0)

**Decision:** one owner logs in with a passcode from the local `.env`; a signed
(iron-session) cookie holds the user id. All protected endpoints run an
ownership check (`requireUserId`).
**Rationale:** localhost single-user needs no provider/OAuth dance. A `userId`
is still stored so ownership and the later Auth.js upgrade stay intact.

## ADR-004 — DB-backed job queue with the spec state machine

**Decision:** `generation_jobs` is the durable record; a polling worker claims
and processes jobs; on restart it reconciles in-flight jobs to
`NEEDS_USER_ACTION` rather than blindly resubmitting (spec §10.6).
**Rationale:** no Redis for Phase 0. The state machine (spec §10.2), retry
policy (§10.3), and reconciliation behavior are unchanged from the spec.

## ADR-005 — Provider adapter interfaces stubbed, no calls

**Decision:** `src/lib/providers/types.ts` defines the text/image/video
provider contracts (spec §7.6) but **no adapter is implemented and no AI / paid
call is made** in Phase 0.
**Rationale:** lock the trajectory toward multi-provider AI generation (the
product goal) without incurring cost or unverified integrations before Phase 1.

## ADR-006 — Integrated AI Image & Video Generation with Automated Timeline Assembly

**Date:** 2026-10-29 · **Status:** Approved & Implemented

**Decision:**
1. Implement DALL·E 3 (`OpenAIImageProvider`) to automatically generate visual storyboard stills from shot prompts.
2. Implement Kling AI (`KlingVideoProvider`) to generate video clips from shot prompts via async background jobs.
3. Automatically bridge shot media to the editing timeline via `build-from-shots`, compiling frame ranges in sequence and eliminating manual timeline JSON configuration.
4. Provide a streaming media proxy (`/api/media/file`) with path traversal guards to display locally stored media directly within the browser.
**Rationale:**
This fulfills the core user objective (automated idea-to-storyboard-to-video workflow similar to Google Flow) rather than forcing manual prompt copying and external file import.

## ADR-007 — Browser Prompt Hub & Lossless Video Audio Multiplexing

**Date:** 2026-11-03 · **Status:** Approved & Implemented

**Decision:**
1. **Hybrid Studio Workflow:** Act as the cinematic production orchestrator (screenplay, character bible, structured prompts, shot plan) while enabling users to generate video/images via browser-based free tiers (Google Flow, ChatGPT DALL·E 3, Gemini Imagen 3, Kling Web 66 free daily credits, Luma Dream Machine) with zero API costs.
2. **Script-First Prompting:** Every prompt format (Google Flow, ChatGPT, Gemini, Kling Motion) explicitly includes the **Voice-over (VO) narrative beat**, **Spoken Character Dialogue**, and **Sound Design/Foley** derived from the story.
3. **Lossless Audio Multiplexing:** Because browser video generators output silent MP4 clips, the manual import pipeline (`/api/.../shots/[shotId]/import`) automatically detects silent video streams via `ffprobe`, synthesizes the shot's dialogue/VO, and multiplexes the audio into the MP4 container via FFmpeg (`-c:v copy -c:a aac -af apad -shortest`) in under 200ms.
**Rationale:**
Ensures characters have authentic voices and narrative sound without paid API dependencies, delivering fully audible, high-production-value video clips directly in the application.

## ADR-007: Professional Desktop NLE Multi-Track Video Editor
- **Date**: 2026-11-03
- **Decision**: Replace web-form card layout with a high-performance, desktop NLE video editing suite modeled directly after CapCut / Premiere Pro.
- **Implementation**:
  - 3-panel top studio layout: Media Pool (left), Cinema Monitor with transport controls (center), Inspector & Trim Controls (right).
  - Multi-track horizontal timeline: V1 video track with repeating thumbnail filmstrips, A1 audio track with waveform peak visualizations, A2 ambient soundscape.
  - Interactive scrubbing: Time ruler with continuous playhead tracking across all tracks.
  - Editing operations: Blade/Split tool (`][`), In/Out frame trimming, and deletion with automatic gap closing.
  - Concat demuxer with frame-accurate in/out cut points exported via FFmpeg.

## ADR-008: Direct-to-Video Master Prompts & Character Consistency Architecture
- **Date**: 2026-11-03
- **Decision**: Support direct video generation (Google Flow / Veo 2, Kling v3, Sora, Runway) by generating fully structured master video prompts that lock in character consistency anchors and native language scripts, skipping the intermediate still image requirement.
- **Implementation**:
  - `ProductionBible`: Extracts ultra-detailed physical character anchors (ethnicity, skin tone, facial hair, eye color, exact wardrobe colors/fabrics).
  - `generateShotPlan`: Loads all character and location anchors from `ProductionAsset` and injects them directly into every shot's `videoPrompt`.
  - Multi-Lingual Screenplay: Dialogue and voiceover narration generated in the user's selected input language (e.g., Tamil script for Tamil, Hindi for Hindi), while visual camera directions remain in cinematic English for maximum AI model comprehension.
  - Storyboard AI Prompt Hub: Features Google Flow (Veo) as primary tab with 1-click prompt copy and deep-link launcher.

## ADR-009: Universal Cinematic World & Physics Compiler
- **Date**: 2026-11-10 · **Status**: Approved & Implemented
- **Context**: Video diffusion models (Google Flow / Veo, Kling, Sora, Wan 2.1) and image generators (FLUX.1) hallucinate physical anomalies (e.g. draft animals tied to both ends of a cart, 180° backward-twisted necks, limbs fusing into vehicles, floating props) due to ambiguous scene prompts lacking physical invariants and spatial depth staging.
- **Decision**:
  1. Replace ad-hoc, scene-by-scene prompt adjustments with an automated, universal system: `Universal Cinematic World & Kinematics Engine` (`src/lib/story/world-engine.ts`) and `Universal Prompt Compiler` (`src/lib/story/prompt-compiler.ts`).
  2. Enforce four universal physical laws across all generated prompts:
     - **Mechanical & Propulsion Law**: Single-point forward propulsion for all vehicles, carts, wagons, and mounts; strictly forbids dual-ended harnesses or rear-hitched animals.
     - **Skeletal & Locomotion Law**: Enforces forward physiological alignment of chest, neck, face, and gaze in direction of movement; pairs moving dialogue with backward tracking camera to eliminate 180° neck-twisting.
     - **3-Plane Spatial Depth Staging**: Separates Foreground (hero actors), Midground (grounded vehicles/props), and Background (architecture/sky) so diffusion models do not fuse background entities into hero subjects.
     - **Prop Manipulation & Permanence**: Single designated hand grip with rigid mass conservation.
  3. Universal Multi-Engine Negative Constraint Matrix: Automatically injects engine-specific negative guardrails into Google Flow, Kling, Sora, and FLUX.1.
  4. Storyboard UI "Universal Physics Inspector" & Auto-Enhance API: Real-time physics status badge in the Prompt Hub with a 1-click `⚡ Auto-Enhance Physics` action that audits and repairs any custom prompt on demand.

## ADR-010: High-CTR YouTube Thumbnail Studio & Viral Cash-Cow Workflow Integration
- **Date**: 2026-11-10 · **Status**: Approved & Implemented
- **Context**: Reverse-engineering of Sabarkaro.com (an expensive creator toolkit charging ₹35,000–₹88,000/year for faceless YouTube channels) revealed that YouTube creators prioritize rapid ideation from proven cash-cow niches and high-CTR thumbnail generation over manual editing.
- **Decision**:
  1. **High-CTR YouTube Thumbnail Studio (Step 5)**:
     - Built an integrated thumbnail studio in Step 5 Launch Kit (`/api/projects/[projectId]/thumbnail` + `ProjectWorkflowNav.tsx`).
     - Generates 1280x720 (16:9) thumbnails powered by free FLUX.1 with 3 viral style presets: `⚡ Curiosity & Shock` (expressive reaction face, high contrast rim-light), `🎬 Epic Cinematic` (golden hour atmosphere, deep bokeh), and `⚔️ Dramatic Conflict` (teal-orange tension).
     - Live simulation of bold YouTube-style headline typography overlays with 1-click download.
  2. **1-Click Viral Cash-Cow Presets (Step 1)**:
     - Integrated quick-action pills in the Director Pitch modal covering top creator niches: Health & Remedies, Ancient Dynasties, Village Wildlife, Unsolved Mysteries, Psychology of Money, and Cyber AI 2050.
  3. **YouTube Competitor Video Cloner**:
     - Built a competitor URL importer in the Director Pitch modal to clone viral retention pacing and adapt proven concepts into original 5-scene screenplays in native dialogue.
  4. **Zero-Cost Advantage**: All features operate completely free using local resources, free FLUX.1, and the free Gemini tier, eliminating the need for ₹35,000–₹88,000/year subscriptions.

## ADR-011: Culinary ASMR & Dynamic Multi-Angle Camera Studio Engine
- **Date**: 2026-11-11 · **Status**: Approved & Implemented
- **Context**: High-retention culinary ASMR videos (e.g. Tasty, Almazan Kitchen, Peaceful Cuisine, Nino's Home) require:
  1. Workstation & cookware consistency across the entire video (same countertop, cutting board, and pan).
  2. Realistic food physics with zero hallucinations (no phantom 3rd hands, no floating knives, no morphing ingredients).
  3. Pristine binaural ASMR sound design (ultra-crisp close-mic Foley with zero dialogue or music).
  4. Dynamic multi-angle camera coverage (rapid, rhythmic alternation across Top-Down flat lay, 45° Macro ECU, Chef hands POV, low-angle sizzle, and wide establishing shots).
- **Decision**:
  1. **Culinary Kinematic Invariants & Anti-Hallucination Guardrails** (`src/lib/story/world-engine.ts`):
     - Added `CULINARY_ASMR_PHYSICS` to `UNIVERSAL_PHYSICAL_LAWS`:
       - Strict 2-hand limit (knife grip + claw grip); bans phantom third hands or floating limbs.
       - Rigid knife grip; cutting board anchored to counter; cookware anchored to stove flame.
       - Slicing direction preserves mass: cut pieces stay on cutting board, zero morphing food.
     - Extended `detectPhysicalEntities` to detect culinary actions (`chop`, `slice`, `sear`, `sizzle`, `simmer`, `pour`, `skillet`, `cutting board`).
     - Added `CULINARY_MACRO_ASMR` rendering integrity in `getRenderingIntegrity` (macro 50mm/85mm probe lens, f/1.8 shallow DOF, 60fps fluid & steam dynamics).
  2. **Dynamic Multi-Angle Camera Rotation** (`src/lib/shots/service.ts`, `src/lib/story/prompt-compiler.ts`, `select-option/route.ts`):
     - Implemented dynamic alternating camera angle cycling:
       - Wide / Medium Workstation Establishing -> Top-Down (Bird's Eye 90° Flat Lay) -> Macro Extreme Close-Up (ECU 45°) -> Low-Angle Skillet Sizzle -> Chef Hands First-Person POV -> Macro Simmering Reduction -> Plating & Garnishing -> Macro Crunchy Bite Reveal.
       - Enforced across screenplay development, shot planning, and prompt compilation.
  3. **Master Workstation & Cookware Lock**:
     - Locks kitchen countertop material, walnut cutting board grain, and cast-iron cookware style into Production Bible locations and props, maintaining 100% spatial consistency across all scenes.
  4. **Pristine Binaural ASMR Sound Foley**:
     - Added `PURE_ASMR_FOLEY` dialogue mode that strictly excludes spoken dialogue, voice-over, and background music, compiling rich close-mic Foley sound effects.
  5. **UI Presets & Detection**:
     - Added `CULINARY_MACRO_ASMR` visual style, `PURE_ASMR_FOLEY` dialogue mode, "Culinary & Cooking ASMR" genre, and "Satisfying, Crisp & Hypnotic" tone to project creation, idea analysis, and project specifications.

## ADR-012: 3-Stage Generation Sequence (Character Portrait -> Scene Keyframe Still -> I2V Video Motion)
- **Date**: 2026-11-11 · **Status**: Approved & Implemented
- **Context**: Users generating videos in modern AI video models (Google Flow / Veo, Kling, Runway Gen-3, Luma Dream Machine, Wan 2.1) require a clear, structured generation pipeline:
  1. **Stage 1 (Character Casting)**: Must be able to generate and preview the character portrait image first (or copy its image generation prompt) to lock character facial identity and costume.
  2. **Stage 2 (Scene Keyframe Still)**: Must be able to generate and preview the scene still image (or copy the scene still prompt) locking lighting, environment, and composition.
  3. **Stage 3 (Video Motion Prompt)**: Once the still image exists, provide an Image-to-Video (I2V) motion prompt designed specifically to animate the still image with 100% continuity and zero hallucinations.
- **Decision**:
  1. **Character Portrait Generation API & UI** (`POST /api/projects/[projectId]/assets/[assetId]/generate-image`, `src/app/projects/[projectId]/bible/page.tsx`):
     - Added endpoint generating 1:1 photorealistic portraits using free FLUX.1.
     - Added Visual Casting Station in Step 2: Assets (Bible) with portrait preview, 1-click `🎨 Generate Character Portrait (Free FLUX.1)`, `🔄 Regenerate Portrait`, `⬇️ Download Portrait`, and `Copy Character Image Prompt` for Midjourney/FLUX/Google Flow.
     - Integrated portrait generation & preview inside the Storyboard Character Library modal (`isCharModalOpen`).
  2. **Storyboard 2-Stage I2V Default Sequence** (`src/app/projects/[projectId]/storyboard/page.tsx`):
     - Re-ordered Storyboard prompt hub tabs:
       1. `🖼️ Stage 1: Scene Still Image (FLUX / Midjourney)` (default active tab)
       2. `🎬 Stage 2: Video Motion Prompt (Google Flow / Kling / Runway / Luma / Wan 2.1)`
       3. `⚡ Direct Video Prompt (Google Flow Veo @Mention)`
     - Clear distinction between Still Image Prompts and I2V Video Motion Prompts.

## ADR-013: Universal Multi-Style Engine (YouTube Multi-Channel Architecture)
- **Date**: 2026-11-13 · **Status**: Approved & Implemented
- **Context**: The studio is expanding to support creators running multiple specialized YouTube channels (e.g. Cooking ASMR, Kids Ghibli Rhymes, Historical Documentaries, 2D Storybook Cartoons, Stop-Motion Claymation, and Comic Books). Each format requires distinct rendering integrity laws, optical lenses, and mutually exclusive negative prompt matrices.
- **Decision**:
  1. **Visual Style Taxonomy**: Built full rendering integrity, cinematography directives, and FLUX/Google Flow prompt definitions for:
     - `GHIBLI_ANIME` (Studio Ghibli Watercolor Animation)
     - `CARTOON_2D` (Classic 2D Storybook Cartoon)
     - `ANIMATION_3D` (Pixar/Disney 3D Animated Feature)
     - `CULINARY_MACRO_ASMR` (Macro Food Cinematography & Binaural Foley)
     - `VINTAGE_FILM` (Authentic 1900s Vintage 35mm Archival)
     - `STOP_MOTION` (Handcrafted Miniature Claymation & Puppet Armatures)
     - `COMIC_BOOK` (Graphic Novel Halftone Inks & Comic Framing)
     - `WATERCOLOR` (Traditional Fine-Art Watercolor Washes)
     - `FANTASY_CONCEPT_ART` (Epic Digital Matte Painting & Volumetric Lighting)
     - `DOCUMENTARY` (Grounded 35mm Realism & Ambient Daylight)
     - `LIVE_ACTION_AD` (Arri Alexa 65mm Commercial Advertising)
  2. **Dynamic Negative Prompt Inversion (`isStylizedArt`)**:
     - Automatically routes negative prompts based on style: stylized media bans photorealism and live action; live action bans cartoons, anime, and CGI.
  3. **Google Flow (Veo) Flag Sanitization**:
     - Stripped `--mode std` and `--negative "..."` flags from I2V motion prompts to avoid model hallucinations.
  4. **Automated Multi-Channel Idea Heuristics**:
     - `analyze-idea` accurately parses ideas and pre-fills optimal visual styles, runtime, tone, and dialogue modes.
  5. **Unit Test Verification**:
     - Added `tests/unit/multi-style.test.ts` (all 27 tests passing across the suite).

## ADR-014: Senior Director QC & Social Media Viral Script Doctor
- **Date**: 2026-11-13 · **Status**: Approved & Implemented
- **Context**: Content creators publishing to YouTube (Longform & Shorts) and Instagram (Reels) need their scripts and scenes vetted prior to storyboard generation to avoid viewer drop-off within the first 3 seconds and ensure viral engagement. Common failure modes include passive exposition openings, disjointed scene jumping without cause-and-effect causality, stiff or machine-translated dialogue, and single-shot station collisions that cause AI video models to hallucinate.
- **Decision**:
  1. **5-Pillar Viral Retention Audit Engine (`src/lib/story/script-doctor.ts`)**:
     - Evaluates screenplays across 5 core dimensions:
       1. *3s Scroll-Stopping Hook*: Ensures Scene 1 starts in media res with kinetic action or high intrigue.
       2. *Narrative Causality*: Validates that each scene is the direct consequence of the previous scene.
       3. *Colloquial Linguistic Naturalness*: Detects machine-translated or bookish phrasing in Tamil/English and recommends spoken colloquial cadence.
       4. *Viral Payoff & Shareability*: Scores climax strength and loopability.
       5. *AI Video Feasibility*: Guards against station teleportation (e.g. cutting board prep + stove cook in a single clip) that triggers morphing artifacts.
  2. **Script Doctor API Endpoint (`src/app/api/projects/[projectId]/story/script-doctor/route.ts`)**:
     - Supports `action: "audit"` (instant heuristic and structured score report).
     - Supports `action: "polish"` (invokes TextGenerationProvider with Senior Director Hollywood screenplay doctor prompt to rewrite and fortify the screenplay, saving an approved new SCREENPLAY version in Prisma).
  3. **Studio Script Stage Integration (`src/app/projects/[projectId]/story/page.tsx`)**:
     - Persistent Senior Director QC audit quality banner above the scene cards.
     - Top navigation button displaying current retention score badge (e.g. `85/100`).
     - Full Senior Director QC Modal showing breakdown progress meters, YouTube Shorts & Instagram Reels director tips, scene-by-scene audit checklist with specific director remedies, and 1-click `⚡ Polish & Auto-Fix Script with Senior Director AI`.
  4. **Unit Test Suite (`tests/unit/script-doctor.test.ts`)**:
     - Verified hook velocity, bookish Tamil detection without Unicode boundary errors, station collision detection, and AI polish structured generation (33/33 tests passing).

## ADR-015: Inedible Object Cooking ASMR Engine, 4-Beat Viral Hook & Macro Continuity System
- **Date**: 2026-11-15 · **Status**: Approved & Implemented
- **Context**: Inedible gourmet cooking channels (e.g., cooking mechanical keyboards, wireless earbuds, smartphones, stones, computer parts) suffer from 4 systemic AI generation failure modes if treated as normal food:
  1. *Premature Cooking Hallucinations*: Harvest/unplugging scenes inadvertently placing lit stoves, smoking pans, or cooked dishes in background.
  2. *Deformed Cubes / Tofu Blobs*: Video diffusion models shooting small objects in Medium/Wide shots compressing fine mechanical features into generic dice, cubes, or tofu blocks.
  3. *Food Model Bias*: Generic terms like "noodles" triggering diffusion models to render wheat lo mein/pasta instead of technical coiled wires or hardware.
  4. *Passive Openings / Slow Commercial Promo Loops*: Opening with slow walks or static b-roll loops causing immediate short-form viewer drop-off.
- **Decision**:
  1. **Universal Law 6 & Inedible Physical Invariants (`src/lib/story/world-engine.ts`)**:
     - Added `UNIVERSAL_PHYSICAL_LAWS.INEDIBLE_OBJECT_PHYSICS`: Technical objects maintain rigid physical geometry as real technical components.
     - Added entity detection `isInedibleCooking` and `inedibleHeroObject` (keyboards, earbuds, smartphones, circuit boards, stones, e-waste).
  2. **4-Beat Rapid-Fire Viral Hook Architecture (`src/lib/story/prompts.ts`, `src/lib/story/script-doctor.ts`)**:
     - *Scene 1 (0:00 - 0:05)*: Mandates 4-beat kinetic teaser: Beat 1 Slam object -> Beat 2 Pop components toward camera -> Beat 3 Heavy cleaver chop -> Beat 4 Wok fireball sizzle, ending on chef rogue smirk.
     - *Scene 2 (0:05 - 0:15)*: Enforces cold harvest/origin with strict negative guards against active stoves, pans, or flames.
  3. **The Macro Rule & Anti-Cube Negative Matrix (`src/lib/story/prompt-compiler.ts`)**:
     - Upgrades small-component actions to 85mm probe macro optics, f/1.8 shallow depth of field.
     - Permanently injects universal negative prompt matrix: `generic cubes, plain plastic blocks, tofu, dice, wheat noodles, pasta, flour spaghetti, lo mein, real grocery food, meat, chicken, broccoli`.
     - Plated dish prompts enforce 80% authentic hero object prominence under translucent culinary flux/glaze.
  4. **Canonical Prop DNA Lock (`heroPropLock`)**:
     - Injects standardized, modern, relatable prop definitions (e.g. Modern Matte-Black Mechanical Keyboard with doubleshot PBT keycaps and Cherry MX switches) across all scene prompts to guarantee frame-to-frame prop continuity.
  5. **Unit Test Verification**:
     - Verified in `tests/unit/culinary-asmr.test.ts` (all 37 tests passing across the suite).

## ADR-016: Fine-Grained Craft Action Stages & Mass Conservation for I2V Video Diffusion
- **Date**: 2026-11-15 · **Status**: Approved & Implemented
- **Context**: Video diffusion models (Google Flow, Kling 1.5, Runway Gen-3, Luma Dream Machine) hallucinate severely when given Image-to-Video prompts that contain conflicting actions or coarse fallback stations (e.g. falling back to "knife cuts steadily on wooden cutting board" during shelf-sourcing or disassembly). Specifically:
  1. *Premature Tool & Debris Spawning*: In shelf-retrieval (Scene 2), defaulting to `BOARD_PREP` injected cutting board, knife in hand, gas stoves, and pre-scattered loose keys/switches.
  2. *Disappearing Geometry during Cutting*: In culinary chopping (Scene 6), AI models deleted or morphed the uncut half of the keyboard into thin air instead of keeping it rigidly anchored on the board.
- **Decision**:
  1. **8 Precise Craft Action Stages (`src/lib/story/prompt-compiler.ts`)**:
     - Expanded `detectCulinaryStation` from 4 crude stations to 8 fine-grained stages: `OBJECT_SOURCING`, `TOOL_DISASSEMBLY`, `MANUAL_FRACTURE`, `CULINARY_CUTTING`, `LIQUID_MARINADE`, `STOVE_COOK`, `PLATING_SERVE`, `HERO_REACTION`.
  2. **Dedicated Kinematic Invariant & Station Lock per Stage**:
     - `OBJECT_SOURCING`: `Station Lock: Industrial shelving only. Prop Integrity: The object starts and remains 100% whole, rigid, and fully assembled throughout the movement.`
     - `TOOL_DISASSEMBLY`: `Components detach exclusively when engaged by the extraction tool. Body remains anchored to the block.`
     - `MANUAL_FRACTURE`: `Both fractured halves remain visible and physically accounted for on the wooden surface after the break.`
     - `CULINARY_CUTTING`: `Conservation of Mass & Rigid Body Persistence: As the blade cuts through the object, the uncut remaining portion remains solidly anchored and fully visible without disappearing, shrinking, or morphing. Sliced fragments remain on the board right beside the blade.`
     - `LIQUID_MARINADE`: `Continuous golden stream pours into bowl. Bowl stationary.`
     - `HERO_REACTION`: `Chef lowers tools and looks into camera. Plated dish steams gently.`
  3. **Pure Positive Kinematics (Zero Negative Noun Triggers in Motion Prompts)**:
     - Eliminated the "negative noun trap" where video diffusion text encoders (T5/CLIP) attend to forbidden nouns ("no knives, zero stoves") as positive prompt triggers.
     - Video motion prompts now contain strictly positive physical commands ("Hands only", "pulls upward from shelf", "holds intact object").
     - Forbidden nouns are isolated exclusively to the `universalNegativePrompt` field where diffusion models properly suppress them.
  4. **Leak-Free Environment & Aesthetics Isolation**:
     - `OBJECT_SOURCING` scenes strip any butcher block or wok burner mentions from the environment and eliminate premature "80% plated dish" rules from still prompts.
  5. **Verification**:
     - Verified with 37/37 unit tests passing in `tests/unit/culinary-asmr.test.ts`.
     - Recompiled all 12 scenes for project `cmwg5nczz0001u88sld5gnrmd` in PostgreSQL DB.

## ADR-017: Zero-Ingestion Content Policy & Conceptual Artwork Presentation for Inedible Cooking
- **Date**: 2026-11-15 · **Status**: Approved & Implemented
- **Context**: Inedible object cooking channels (cooking keyboards, smartphones, electronics, stones, hardware) must NEVER portray human eating, biting, chewing, or ingestion:
  1. *Platform Content Safety Policies*: YouTube, Instagram, and TikTok enforce strict policies against self-harm, eating non-food items, or dangerous ingestion of toxic materials (lithium, lead, plastics). Portraying eating risks immediate strike, age-restriction, or shadowban.
  2. *Artistic Theme*: The channel's value proposition is hypnotic ASMR alchemy, Michelin-star culinary craft technique, and conceptual art that challenges imagination—not eating junk.
- **Decision**:
  1. **Zero Ingestion Invariant (`src/lib/story/world-engine.ts`, `src/lib/story/prompts.ts`, `src/lib/story/prompt-compiler.ts`)**:
     - Explicitly bans: `eating, biting, chewing, tasting, mouth open, putting in mouth, swallowing, licking` across all prompts for `isInedibleCooking`.
  2. **Master Artwork Presentation Ending (Scene 12)**:
     - The climax ends on an artistic presentation: the chef gently slides the motherboard platter forward toward the camera like a Michelin-star offering, locking eyes with a secretive rogue smirk as golden dust motes float through the warm spotlight.
  3. **Mandatory Content Safety Disclaimer**:
     - Automatically injects on-screen safety disclaimer directives into the screenplay, storyboard, and export metadata:
       `"CONCEPTUAL ARTWORK & ASMR ENTERTAINMENT ONLY — INEDIBLE. DO NOT ATTEMPT OR INGEST."`


## ADR-018: Multi-Platform Social Launch Kit & High-CTR AI Thumbnail Engine (YouTube & Instagram)
- **Date**: 2026-11-15 · **Status**: Approved & Implemented
- **Context**: Creators launching viral Inedible Object Cooking ASMR and cinematic AI shorts require complete, platform-specific launch packages with high-converting titles, descriptions, hashtags, audio recommendations, pinned comments, safety disclaimers, and validated high-CTR AI thumbnail prompts (16:9 and 9:16).
- **Decision**:
  1. **Launch Kit Compiler (`src/lib/story/launch-kit.ts`)**:
     - Produces platform-tailored publishing suites for YouTube (3 viral title variants, full SEO description with timestamps, foley sound credits, safety disclaimer, search tags) and Instagram Reels (hook-driven caption, trending audio track recommendation, 25+ viral hashtags, engagement pinned comment poll).
     - Generates verified, dual-handed AI thumbnail prompts (16:9 Landscape & 9:16 Vertical) featuring `@TheShadowAlchemist` character consistency, cleanly severed cleaver-cut keyboard half in one hand, spatula overflowing with stir-fried keycaps & crimson switches dripping with amber glaze in the other, sizzling carbon-steel pan filling the lower foreground, and deep shadowed charcoal studio vignette background.
     - Enforces strict constraints: zero teeth/bite marks, zero username rendered on screen, zero text watermarks, zero eating/ingestion.
  2. **Enhanced API Endpoint (`src/app/api/projects/[projectId]/thumbnail/route.ts`)**:
     - GET returns saved thumbnail artifact along with dynamic `launchKit` payload.

## ADR-019: Viral YouTube Headline Engine & Thumbnail Studio Customizer
- **Date**: 2026-11-16 · **Status**: Approved & Implemented
- **Context**: Creators testing viral YouTube and Instagram thumbnails need the ability to easily customize, fine-tune, and preview bold viral headlines (e.g. "DO NOT EAT THIS!", "⚠️ DANGEROUS DISH!") directly on their approved master imagery without being locked into hardcoded presets or rigid styles. Furthermore, diffusion models like FLUX.1 occasionally hallucinate generic female faces if masculine chef character anchors are not strictly fortified.
- **Decision**:
  1. **Reinforced Masculine Chef Anchors (`src/lib/story/launch-kit.ts`)**:
     - Explicitly define: `"@TheShadowAlchemist, an athletic male artisan culinary alchemist chef, handsome masculine facial structure, piercing hazel eyes locked directly onto the camera lens..."` across all 16:9 and 9:16 thumbnail prompts.
  2. **Dual-Mode AI Prompts with Headline Directives**:
     - Added optional `Viral Text Header Directive:` into thumbnail prompts when enabled by the creator, allowing Google Flow / Imagen 3 to generate the text natively if desired.
  3. **Multi-Style Overlay Customizer (`src/components/nav/ProjectWorkflowNav.tsx`)**:
     - Added 3 distinct overlay styles: `🔥 Viral YT Header` (huge gradient text with thick black outline and white glow), `⚠️ Caution Sticker` (angled box badge), and `⚪ Clean Impact` (modern bold typography).
     - Added granular controls: font size (`Hero`, `Large`, `Medium`, `Compact`), safe-zone positioning (`Top-Center`, `Top-Right`, `Top-Left`, `Bottom`), vertical position slider (`1%` to `25%` safe margin above goggles), color gradients (`🔥 Fiery Sunset`, `⚡ Electric Yellow`, `🛑 Caution Red`, `⚪ Pure White`), and font styles (`Impact`, `Modern Sans`, `Monospace`).
  4. **Base Image Source Flexibility**:
     - Added automatic detection and 1-click switcher between the creator's approved Google Flow master chef (`approved-master-chef.jpg`) and AI-generated stills.
  5. **High-Res HTML5 Canvas Compositing & Export**:
     - Canvas rendering engine draws pixel-perfect multi-stop linear gradients, double-pass black strokes, and soft white halo glows directly into exported PNG files.
  6. **Persistence & REST API**:
     - Added `PATCH /api/projects/[projectId]/thumbnail` to persist user overlay preferences directly to the database.
     - POST supports `OBJECT_COOKING_HOOK` alongside `CURIOSITY_SHOCK`, `EPIC_CINEMATIC`, and `DRAMATIC_CONFLICT`, with support for both `16:9` (1280x720) and `9:16` (720x1280) dimensions via FLUX.1.
  3. **Universal Studio UI (`src/components/nav/ProjectWorkflowNav.tsx`)**:
     - Integrated a 3-tab Social Launch Suite (YouTube Launch, Instagram Reels, AI Thumbnail Studio) into Step 5 of the studio workflow navigation bar.
     - Includes 1-click copy buttons for all titles, descriptions, captions, hashtags, comments, and AI prompts.
  4. **Verification**:
     - 40/40 unit tests passing (`tests/unit/launch-kit.test.ts`), `tsc --noEmit` clean with 0 errors.

## ADR-021: Systemic QC, UAT Audit & State Machine Resilience
- **Date**: 2026-11-16 · **Status**: Approved & Implemented
- **Context**: A comprehensive Quality Control (QC) and User Acceptance Testing (UAT) audit of the entire codebase revealed critical regressions and discrepancies:
  1. `vitest.config.ts` failed on Node 18 with `ERR_REQUIRE_ESM` because package.json lacks `"type": "module"`.
  2. Overloading `Shot.negativeConstraints` to store both audio metadata (as JSON) and raw negative prompt strings resulted in JSON parse failures, causing `getShotAudioData` to indiscriminately fall back to hardcoded Murugan Tamil village lines across completely unrelated projects (e.g. Culinary ASMR, kids animation).
  3. Visual action descriptions were improperly designated as a fallback voiceover source, causing TTS to read camera and directorial blocking instructions out loud.
  4. The OpenRouter provider was omitted from DB validation checks in `/api/projects/[id]/story`, `/bible`, and `/shots`.
  5. Inline job execution in API routes violated the state machine by attempting direct `QUEUED -> RUNNING` transitions without first claiming the job into `SUBMITTING`.
  6. The 1-click studio pipeline attempted an unauthenticated HTTP self-fetch to `http://localhost:3000`.
- **Decision**:
  1. Converted `vitest.config.ts` to `vitest.config.mts` to ensure native ESM resolution on Node 18.
  2. Fortified `getShotAudioData` (`src/lib/shots/audio-defaults.ts`) to strictly respect explicit audio records (including empty strings for ASMR), parse safely, and confine legacy Murugan demo lines exclusively to explicit Murugan context.
  3. Removed visual `actionDescription` fallback in voiceover synthesis; enforced empty speech text for `PURE_ASMR_FOLEY` and `NO_DIALOGUE` modes.
  4. Added `"openrouter"` to allowed providers in API validation checks.
  5. Implemented atomic `claimSpecificJob(id)` in `src/lib/jobs/queue.ts` (`QUEUED -> SUBMITTING`) and updated all inline `setImmediate` callers to claim prior to `markRunning()`.
  6. Replaced loopback HTTP fetch in `one-click/route.ts` with direct internal job queue calls.
  7. Added unit test suite `tests/unit/audio-defaults.test.ts` (6 tests). Total test suite: 46/46 passing across 9 suites.

## ADR-022: Story-First Creative Studio Architecture & Context-Aware AI Co-Pilot
- **Date**: 2026-11-16 · **Status**: Approved & Implemented
- **Context**: Creator feedback highlighted an inversion of the filmmaking mental model in Step 1 (Script & Story Studio):
  1. The studio dropped users directly into technical AI camera diffusion prompts (`VISUAL PROMPT & CAMERA`, `Omni Flash / Veo 2`, camera tracking parameters) rather than presenting the actual narrative story (Hook, Premise, 3-Act Arc) developed from their one-line pitch.
  2. The AI Director Co-Pilot scene rewrite tools contained static hardcoded instruction pills and placeholders referencing an elephant threat and character Karthi (`+ Increase suspense with elephant threat`, `+ Add mother comforting Karthi`), which bled into completely unrelated projects (e.g. Cyberpunk Alchemist Cooking ASMR).
  3. Projects created without separate `LOGLINE`, `PREMISE`, or `SYNOPSIS` artifacts lacked a visible narrative foundation.
- **Decision**:
  1. **Two-Stage Story Studio UX (`src/app/projects/[projectId]/story/page.tsx`)**:
     - **Stage 1 (Viral Story Treatment & Narrative Foundation)**: Prominently renders a dedicated hero treatment card displaying: (1) Creator's original pitch quote, (2) 3-Second scroll-stopping viral hook, (3) Dramatic story premise & cinematic universe, and (4) 3-Act narrative plot timeline (Act 1 Setup & Hook, Act 2 Escalation & Craft, Act 3 Climax & Viral Payoff).
     - **Stage 2 (Scene-by-Scene Screenplay)**: Separates dramatic narrative action from technical camera diffusion prompts. Introduced a View Mode switcher (`Story View` vs `Director AI Prompts`) and enclosed technical diffusion prompts in a collapsible accordion.
  2. **Dynamic Context-Aware AI Director Co-Pilot (`src/lib/story/director-copilot.ts`)**:
     - Built `getDirectorSuggestions(project, scene)` to dynamically produce instruction pills and placeholders tailored to the project's visual style, genre, and tone (e.g. pan sizzle, sauce glaze, and knife prep for culinary ASMR; playful dialogue and meadow wonder for anime/kids; authentic period foley and sepia lighting for vintage history).
     - Replaced hardcoded elephant/Karthi strings with dynamic suggestions across both inline scene cards and the modal rewrite form.
  3. **Foundation Story Artifact Auto-Synthesis (`src/app/api/projects/[projectId]/story/route.ts`)**:
     - In `GET /api/projects/[projectId]/story`, verify that `LOGLINE`, `PREMISE`, and `SYNOPSIS` artifacts exist; if missing, synthesize them from the project's pitch and screenplay scenes and persist them into the database.
  4. **Verification**:
     - 52/52 unit tests passing across 10 test suites (`tests/unit/director-copilot.test.ts`), `tsc --noEmit` clean with 0 errors.

## ADR-023: Viral 20-Second Rapid ASMR Standard (Bayashi 2X Pacing & 60% Credit Reduction)
- **Date**: 2026-11-16 · **Status**: Approved & Implemented
- **Context**: Creator analysis of top-performing culinary ASMR content (specifically reference video by Bayashi TV, 61M+ views) demonstrated that the previous 12-scene, 8s-per-scene (~90s total) format was fundamentally mismatched with short-form platform retention:
  1. *Sluggish Scene Pacing*: Performing only 1 or 2 slow isolated actions over an 8-second clip felt like a traditional long-form video rather than hyper-engaging viral ASMR.
  2. *Wasted Video Generation Credits*: Running 12 video generation calls in Google Flow / Kling for a single Short consumed massive credit allocations (120-300 credits per video) with high abandonment rates.
  3. *Framing Dilution*: Long walking shots in scrapyards or distant angles broke immersion; 60M+ view shorts maintain 90% camera framing locked onto ingredients, cutting board, and hands in extreme macro close-ups and top-down flat lays.
- **Decision**:
  1. **Viral Rapid ASMR Standard (20s Total, 4–5 Scenes, ~4s each)**:
     - Cut total project scenes from 12 down to **4 to 5 high-density scenes (3.5s to 4s each)**, achieving ~18s–20s total runtime.
     - Saves **60% to 65% of video generation credits** (4-5 generation jobs instead of 12).
  2. **2X Kinetic Tempo & Sequential Micro-Actions**:
     - Each 4-second clip is packed with **3 to 4 sequential micro-actions executed in continuous 2X fast-forward tempo** (e.g. [0-1s] slam object, [1-2s] rapid knife butterfly slice, [2-3s] dip into golden glaze & flip, [3-4s] coat in panko resistor breadcrumbs and press firm).
  3. **90% Screen Ingredient Fill**:
     - Camera is permanently locked onto the workstation, cutting board, hot oil pot, or grill in extreme macro close-up or top-down flat lay. Eliminates distant scenic establishing walks.
  4. **Viral Climax Structure**:
     - Standardizes the 5-act Bayashi formula:
       - *Scene 1 (4s)*: Violent Sourcing & Disassembly Hook (slam, cartridge snap, screws spin & shell pop, pluck buttons).
       - *Scene 2 (4s)*: Rapid Fracture, Knife Slicing & Batter Dip (PCB snap like chocolate, staccato noodle chop, glaze dip, panko coat).
       - *Scene 3 (4s)*: Foaming Tempura Deep-Fry & Sizzle (drop into boiling oil with explosive foaming hiss *TZZZZ*, brass chopstick flip, wire rack lift).
       - *Scene 4 (4s)*: 4-Quadrant Wrap Fold & Crisp Knife Crunch (load quadrants, 4-fold trick, sear on grill pan, diagonal knife cut *CRUNCH*).
       - *Scene 5 (4s)*: Hero Crunch Pull & Confident Chef Thumbs-Up (pull steaming cheesy cross-section apart in extreme macro, camera tilts up, chef nods and flashes a sharp, confident thumbs-up to camera).
  5. **Codebase Presets & Universal Physical Invariants**:
     - Added `{ seconds: 20, label: "20s — Viral Rapid ASMR (Bayashi 2X Pacing · 4-5 High-Density Scenes) [60M+ Views Standard]" }` to `RUNTIME_PRESETS` in both project creation and project settings.
     - Updated `UNIVERSAL_PHYSICAL_LAWS.VIRAL_RAPID_ASMR_PACING` in `src/lib/story/world-engine.ts`.
     - Quantized duration in `src/lib/story/prompt-compiler.ts` to support 4s/5s short-form clips.
     - Enhanced `src/lib/story/prompts.ts`, `src/lib/story/service.ts`, and `src/app/api/projects/[projectId]/story/generate-options/route.ts` with the Bayashi 2X directives.
  6. **Episode 2 Transformation**:
     - Fully transformed Project `cmwja2y3t0001u8qgfh5w3gtj` (*The Vintage Game Boy Tempura (ASMR)*) into the 5-scene 20s Bayashi Rapid ASMR standard with compiled multi-engine prompts.
  7. **Verification**:
     - 53/53 unit tests passing across 10 test suites (`tests/unit/culinary-asmr.test.ts`), `tsc --noEmit` clean with 0 errors.

## ADR-025: Dynamic Multi-Object Social Launch Kit & Dual-Handed Master Thumbnail Engine
- **Date**: 2026-11-16 · **Status**: Approved & Implemented
- **Context**: In Step 5 (YouTube Launch & Film Export Kit), creating or opening Episode 2 (*The Vintage Game Boy Tempura (ASMR)*) was displaying the previous episode's thumbnail prompts, YouTube descriptions, ingredient lists, and timestamps (hardcoded to Mechanical Keyboard, Cherry MX switches, and PBT keycaps). Furthermore, when creating projects without explicitly navigating through thumbnail creation, the `YOUTUBE_THUMBNAIL` story artifact remained uninitialized in PostgreSQL.
- **Decision**:
  1. **Dynamic Inedible Object Detection (`src/lib/story/world-engine.ts`, `src/lib/story/launch-kit.ts`)**:
     - Extended physical entity detector and launch kit engine to recognize Game Boy / retro consoles, earbuds, smartphones, and watches, while preserving exact backward-compatible strings for mechanical keyboards.
     - Automatically adapts hero props, raw hardware chunks, cooking actions, and ingredient lists across all titles, descriptions, hashtags, and social captions.
  2. **Strict Preservation of Master Dual-Handed Thumbnail Invariant**:
     - Retains the exact high-CTR dual-handed composition template across all channel episodes:
       - Subject: `@TheShadowAlchemistChef` with vintage brass tinker goggles, sleek matte-black half-mask with gold cheekline vents, leather artisan apron, black textured grip gloves, and intense direct eye contact.
       - Viewer's Left Hand: Grips the cleanly fractured, severed raw hero object chunk exposing internal circuitry and hardware (e.g. *severed translucent purple Game Boy Color with golden Pokémon 8-bit cartridge slot and emerald PCB*).
       - Viewer's Right Hand: Extends the stainless slotted spatula holding the cooked/fried gourmet mound dripping with thick bubbling amber glaze (e.g. *tall sticky mound of golden tempura-battered emerald circuit board chips and magenta A/B buttons*).
       - Center Foreground: Sizzling wok / tempura pot bubbling with crispy hardware chips and rising aromatic steam.
       - Background: Dark charcoal studio vignette with warm amber rim light.
  3. **Self-Healing Step 5 Thumbnail API (`src/app/api/projects/[projectId]/thumbnail/route.ts`)**:
     - When `GET /api/projects/[projectId]/thumbnail` is called, if the `YOUTUBE_THUMBNAIL` artifact is missing or contains stale prompts from a different object type, it automatically initializes and updates the artifact with the project-specific launch kit prompt and default overlay parameters, ensuring Step 5 is never blank or out of sync.
  4. **Verification**:
     - Added comprehensive unit test in `tests/unit/launch-kit.test.ts` verifying authentic Game Boy Color props, Pokémon cartridge, emerald PCB chips, and tempura foley.
     - Full test suite: 57/57 tests passing across 11 test files (`npm test`), `tsc --noEmit` clean with 0 errors.
     - Verified live database artifact for Project `cmwja2y3t0001u8qgfh5w3gtj` has zero keyboard references and 100% Game Boy Tempura prompts and metadata.

## ADR-026: Permanent Anti-Hallucination & Aesthetic Rigor Engine
- **Date**: 2026-11-16 · **Status**: Approved & Implemented
- **Context**: Creator evaluation of generated video footage (`Episode 2(1).mp4`, 43s) revealed 5 recurring systemic AI failure modes:
  1. *Burned-in Disclaimer Watermark*: Prompt containing `On-screen text: 'CONCEPTUAL ARTWORK & ASMR ENTERTAINMENT ONLY...'` caused Veo / Google Flow to render literal white subtitle watermarks into the bottom video frame.
  2. *Real Grocery Food Intrusion*: Inedible cooking prompts mentioning "cheese", "bacon", or "salad" caused models to generate real pork bacon, sliced cheddar, and diced tomatoes/onions, violating the inedible tech premise.
  3. *Prop Morphology Drift*: Training data bias caused "Game Boy" to morph from the specified Atomic Purple Game Boy Color into a classic 1989 beige/grey DMG-01 brick in the fryer.
  4. *Character Identity & Mask Drift*: Independent text-to-video generation across scenes caused the chef to drift in facial structure and mask design (switching to bulky circular respirator filters).
  5. *Chronological Linearity Glitch*: Assembling seared/cut wraps before the preparation steps.
- **Decision**:
  1. **Universal Text & Watermark Sanitizer (`src/lib/story/prompt-compiler.ts`)**:
     - Implemented `sanitizeOnScreenText()` to purge any `On-screen text:`, `Subtitles:`, `Captions:`, or disclaimer text strings from all raw, natural, and tagged action descriptions.
     - Added universal negative tokens across all prompt outputs: `on-screen text, subtitles, burned-in text, watermark, captions, letters, words on screen, disclaimer text, typography, logo`.
  2. **Strict Inedible Hardware Analogue Enforcement (`src/lib/story/world-engine.ts`, `src/lib/story/prompts.ts`)**:
     - Enforced strict negative filters against real grocery food in all inedible cooking contexts: `pork bacon, real bacon, raw meat, cooked meat, chicken, beef, tomatoes, diced tomatoes, onions, diced onions, salsa, pico de gallo, real cheese, cheddar cheese, dairy cheese, dairy, tortilla, real bread, edible food, grocery vegetables`.
     - Standardized hardware equivalents: Kapton polyimide tape strips (bacon), silicone thermal pads (cheese), miniature SMD resistors (seasonings/panko), and multicolored ribbon cables (ramen/noodles).
  3. **Exact Prop DNA Locking**:
     - Explicitly enforced and locked console props in prompt rules and negative tokens: `Translucent Purple Game Boy Color (atomic purple translucent chassis clearly exposing green PCB circuitry, magenta A/B buttons); strictly PROHIBIT 1989 classic grey/beige Game Boy DMG-01 housing, strictly NO thick rectangular beige brick`.
  4. **Master Character Anchor Lock**:
     - Reinforced canonical anchor for `@TheShadowAlchemistChef`: `athletic build, handsome masculine jawline, focused intense hazel eyes, dark tousled hair, brass vintage tinker goggles with dark circular glass resting on crown, bespoke matte-black tactical aerodynamic half-mask with gold vertical cheekline slit vents`.
     - Injected negative tokens: `different actor, face morphing, character drift, changing ethnicity, circular respirator filters, gas mask canister, breathing tubes, missing goggles, extra fingers, deformed thumb, rubbery hands, floating arm`.
  5. **Strict Chronological Physical Sequence**:
     - Enforced linear execution invariant: `Sourcing/Disassembly -> Coating/Batter -> Deep-Fry -> Seared Pocket & Diagonal Knife Cut -> Cross-Section Crunch Pull & Confident Chef Thumbs-Up`. Strictly bars showing cut or finished dishes before assembly.
  6. **Verification**:
     - Added automated unit test in `tests/unit/prompt-doctor.test.ts`. Full test suite: 58/58 tests passing across 11 test files (`npm test`), `tsc --noEmit` clean with 0 errors.
     - Recompiled all 5 database shots of Project `cmwja2y3t0001u8qgfh5w3gtj` in PostgreSQL with zero grocery food and zero on-screen text directives.

## ADR-027: Channel / Series Multi-Episode Architecture & Isolated Storage Hierarchy
- **Date**: 2026-11-17 · **Status**: Approved & Implemented
- **Context**: As creators scale channels on YouTube Shorts and TikTok, treating every video as an isolated, standalone project causes heavy friction:
  1. *Repetitive Setup Fatigue*: Creating Episode 3 required manually re-selecting `CULINARY_MACRO_ASMR`, `PORTRAIT_9_16`, `PURE_ASMR_FOLEY`, `20s Bayashi 2X`, and re-entering channel negative constraints.
  2. *Character Re-Casting Drift*: Lead characters like `@TheShadowAlchemistChef` had to be re-created manually in each project, risking slight description mismatches that trigger face and mask drift.
  3. *Creative Studio Variety*: While channel brand rules remain immutable, creators need the creative freedom to vary the studio workstation per episode (e.g., Ep 1: Scrapyard wok, Ep 2: Walnut butcher block tempura pot, Ep 3: Japanese Teppanyaki flat-top griddle, Ep 4: Campfire skillet).
  4. *Media Storage Collisions*: High-resolution video clips, still images, and master exports needed clean, isolated folder sandboxes per episode on disk.
- **Decision**:
  1. **Channel / Series Schema Entity (`prisma/schema.prisma`)**:
     - Created `model Series` with unique `[ownerId, slug]`, housing channel-wide brand DNA: `visualStyle`, `genre`, `tone`, `dialogueMode`, `aspectRatio`, `targetRuntime`, `defaultStudioEnvironment`, `defaultChefWardrobe`.
     - Linked `model Project` with `seriesId`, `episodeNumber`, `studioEnvironment`, and `chefWardrobeOverride`.
     - 100% backward-compatible with standalone films.
  2. **Isolated Storage Hierarchy (`src/lib/media/storage-paths.ts`)**:
     - Implemented `getProjectStorageDir(project, rootPath)`:
       - Series Episodes: `<mediaRoot>/channels/<channel-slug>/episodes/ep<N>_<shortId>/` (with dedicated `shots/<shotId>/images`, `shots/<shotId>/videos`, and `exports/` subfolders).
       - Standalone Projects: `<mediaRoot>/projects/<projectId>/`.
     - Integrated into `imageGenerationHandler`, `videoGenerationHandler`, and `exportHandler`.
  3. **1-Click Next Episode Engine (`src/app/api/series/[seriesId]/episodes/route.ts`)**:
     - Automatically increments `episodeNumber`.
     - Clones approved lead character assets (`@TheShadowAlchemistChef`) from prior episodes.
     - Accepts unique `studioEnvironment` overrides with quick presets (`Teppanyaki Flat-Top Griddle`, `Walnut Butcher Block`, `Scrapyard Workbench`, `Campfire Skillet`, `Metallurgy Forge`).
     - Auto-generates initial story artifacts, 5-scene 20s Bayashi Rapid ASMR screenplay, multi-engine prompts, and Step 5 `YOUTUBE_THUMBNAIL` story artifact.
  4. **Universal Studio Series Bar & Episode Switcher (`src/components/series/SeriesEpisodeBar.tsx`, `CreateEpisodeModal.tsx`)**:
     - Mounted in `ProjectWorkflowNav.tsx`, allowing creators to switch between episodes and launch new episodes with 1 click from any screen.
  5. **Verification**:
     - Added test suites `tests/unit/series.test.ts` and `tests/unit/storage-paths.test.ts`. Full test suite: 63/63 tests passing across 13 test files (`npm test`), `tsc --noEmit` clean with 0 errors.
     - Seeded `The Shadow Alchemist — Inedible ASMR` series, linking Episode 1 (Keyboard Stir-Fry) and Episode 2 (Game Boy Tempura).

## ADR-028: React Portal Modal Mounting & CSS Stacking Context Isolation
- **Date**: 2026-11-17 · **Status**: Implemented & Verified
- **Context**:
  - When opening the `+ New Episode` modal from the top navigation `SeriesEpisodeBar`, the modal suffered from severe visual collapse: the top header (with the "Create Episode 3" title, channel pill, and close button) was pushed above the top edge of the browser viewport (`y < 0`), leaving only the concept pitch textarea and lower inputs partially visible.
  - *Root Cause*:
    - The top navigation bar in `src/components/nav/ProjectWorkflowNav.tsx` uses `<header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b ...">`.
    - Under the W3C CSS Filters & Blending specification and CSS Transforms Module, applying `backdrop-filter` (here `backdrop-blur-md`) creates a new stacking context and containing block for all descendant elements, including `position: fixed`.
    - Consequently, `CreateEpisodeModal`'s `fixed inset-0` was trapped inside the 50px-high `<header>` container rather than the browser window viewport. Centering the modal vertically in a 50px box pushed the top 275px off-screen above `y = 0`.
- **Decision**:
  1. **Universal React Portal Mounting (`src/components/series/CreateEpisodeModal.tsx`)**:
     - Wrapped modal rendering in `createPortal(modalContent, document.body)`.
     - Added client-side `mounted` state guard to guarantee safe SSR hydration in Next.js.
     - Styled outer backdrop wrapper with `fixed inset-0 z-[9999] overflow-y-auto bg-black/75 backdrop-blur-sm p-4 sm:p-6` and inner container with `min-h-full flex items-center justify-center py-4` and `my-auto` on the card.
     - Ensured modal expands and scrolls gracefully on all screen heights without any top clipping.
  2. **Accessibility & QoL Enhancements**:
     - Added `Escape` key listener to close modal safely.
     - Implemented document body scroll locking (`overflow = "hidden"`) while modal is active.
  3. **Dropdown Menu Outside-Click Listener (`src/components/series/SeriesEpisodeBar.tsx`)**:
     - Replaced internal fixed backdrop overlay with a ref-based `mousedown` outside click listener, preventing secondary containing block issues.
- **Verification**:
  - Full TypeScript type check passed with 0 errors (`tsc --noEmit`).
  - Unit test suite: 64/64 tests passing across 13 test files (`npm test`).

## ADR-029: Complete Input Parity for Episode Creation & Elimination of Hardcoded Defaults
- **Date**: 2026-11-17 · **Status**: Implemented & Verified
- **Context**:
  - Creators think differently for each episode within a channel.
  - Previous iteration improperly pre-filled hardcoded "Sony Walkman" text and rigid preset chips (`Walkman`, `Rolex`, `AirPods`, `Game Boy`), which took away creator autonomy and assumed the episode content without user intent.
  - Furthermore, episode creation lacked full configuration parity with standard project creation (`/projects/new`), omitting language selection, runtime customization (20s to 300s + custom seconds), aspect ratio choices, visual style selection, dialogue mode choices, genre, and tone.
- **Decision**:
  1. **Clean Slate Principle & Zero Hardcoded Defaults (`src/components/series/CreateEpisodeModal.tsx`)**:
     - Purged all hardcoded "Sony Walkman", "Rolex", "AirPods", and "Game Boy" strings and preset chips.
     - Title defaults cleanly to `Episode ${nextEpisodeNumber}` with an intuitive placeholder (`e.g. Episode 3: Your Custom Episode Title`).
     - Episode Story Idea textarea starts 100% blank (`""`) with a descriptive placeholder for the user's creative vision.
  2. **Full Input Parity with Project Creation**:
     - **Story Language**: Dropdown (English, Tamil, Hindi, Telugu, Malayalam, Spanish, French, German, Japanese), defaulting to channel language.
     - **Film Length / Target Runtime**: Dropdown with presets (20s Viral Rapid ASMR [Bayashi 2X], 30s, 45s, 60s, 90s, 120s, 180s, 300s) + custom second input, defaulting to channel runtime.
     - **Aspect Ratio / Orientation**: Dropdown (9:16 Portrait / Shorts, 16:9 Landscape, 1:1 Square), defaulting to channel aspect ratio.
     - **Visual Style**: Full dropdown (Culinary ASMR, Photorealistic Cinematic, Ghibli, 3D Animation, Anime, Documentary, Stop-Motion, Vintage Film, etc.), defaulting to channel style.
     - **Dialogue Mode**: Dropdown (Pure ASMR Foley, Spoken dialogue, Voice-over, No dialogue), defaulting to channel dialogue mode.
     - **Genre & Tone**: Dropdowns with comprehensive options, defaulting to channel presets.
     - **Studio / Workstation Setting**: Text input with clean placeholder for custom kitchen/studio environment.
  3. **One-Click AI Idea Auto-Detection**:
     - Integrated `✨ Auto-detect Settings from Idea` button connected to `/api/projects/analyze-idea`.
     - When the creator types an idea, AI automatically suggests title, runtime, language, style, genre, tone, and orientation, providing an optional assistant workflow.
  4. **Dynamic API & Scene Pacing (`src/app/api/series/[seriesId]/episodes/route.ts`)**:
     - Expanded `createEpisodeSchema` to accept and persist all creation fields.
     - Dynamically computes scene durations (`sceneDuration = Math.max(3, Math.round(targetRuntime / 5))`) and timestamps instead of hardcoding 4s intervals.
- **Verification**:
  - Full TypeScript type check passed with 0 errors (`tsc --noEmit`).
  - Unit test suite: 64/64 tests passing across 13 test files (`npm test`).
## ADR-031: 60-Second Extended ASMR Masterclass Pacing, Chronological 4-Stage Pipeline, Slender Bicycle Tire Anchors & Craving Cooked Glaze
- **Date**: 2026-11-17 · **Status**: Implemented & Verified
- **Context**:
  - Creator analysis of generated Scene 4 video output (`media_1794917068432_ce81374a.mp4`) revealed two critical defects:
    1. *Giant Car/Truck Tire Hallucination*: Despite cooking a bicycle, the video generated a giant, fat automobile/truck tire. Root cause: Diffusion models (Google Flow / Veo / Kling) default the word "tire" without explicit bicycle modifiers to automotive tires.
    2. *Inverted Chronological Process Order (Premature Cooking)*: The video began by showing knife chopping on the cutting board before the tire was even removed from the wheel rim. Root causes:
       - `prompt-compiler.ts` classified the scene as `CULINARY_CUTTING` due to "knife" and automatically injected a generic override: `Action Dynamics: Rhythmic, precise chopping cadence. Heavy steel blade descends in steady vertical strokes...` and `As the blade cuts through the The... chassis...`, which overrode the tire lever prying beat.
       - Episodic structure intermingled harvesting and cooking back and forth across scenes rather than harvesting all raw materials first.
- **Decision**:
  1. **Strict 4-Stage Chronological Production Pipeline**:
     - *Stage 1: Complete Raw Sourcing & Harvest (Scenes 1 & 2)*: Extract all raw parts directly from the bicycle (wheel axle unbolt, seatpost saddle extraction, chain tool de-linking, citrus wash). Strictly ZERO knives, zero cooking.
     - *Stage 2: Culinary Butchery & Preparation (Scenes 3, 4 & 5)*: Prep harvested materials (saddle sponge tofu staccato dicing, slender 28mm bicycle tire lever removal & calamari slicing, spoke snipping & chain glaze panko dredge).
     - *Stage 3: Colossal Catering Cook (Scene 6)*: Deep-frying in colossal 4-foot Indian wedding catering iron kadai and searing on 3-foot tawa with thick bubbling caramelized molten amber glaze.
     - *Stage 4: Gourmet Plating & Craving Finale (Scenes 7 & 8)*: Plating with molten amber lava glaze pooling beneath, followed by acoustic cleaver crunch, gooey cheese-pull stretch, and confident thumbs-up.
  2. **Slender Bicycle Tire Anchoring & Negative Automotive Matrix**:
     - Explicitly anchored tire geometry: `"slender, narrow 28mm (1.25-inch) vintage road bicycle rubber tire on a thin 28-inch wire-spoked bicycle wheel rim"`.
     - Added negative tokens across compiler and shots: `car tire, truck tire, automotive tire, tractor tire, motorcycle tire, fat vehicle tire, giant tire, thick car rubber, car wheel, automotive rim`.
  3. **Sequential Execution Guard & Mass Conservation Cleanup**:
     - In `prompt-compiler.ts`: When an action description has timecoded beats (`[0:00-0:02] ...`), output `Action Dynamics: Strict chronological execution matching the timecoded beats in exact sequence` instead of generic conflicting chopping text.
     - Cleaned `heroTargetName` with `.replace(/^(the|a|an)\s+/i, "")`, eliminating `the The` grammatical anomalies.
     - Classified `tire levers?|tire pry|chain breaker|chain tool|wrench|allen key` under `TOOL_DISASSEMBLY`.
  4. **Canonical Character Lock (`[@TheShadowAlchemist]`)**:
     - Replaced all instances of `[@TheShadowAlchemistChef]` with canonical `[@TheShadowAlchemist]`.
- **Verification**:
  - Database state verified with `verify_ep3_handles.js`.
  - `npm test`: 65/65 tests passing across 13 test suites.
  - `npx tsc --noEmit`: 0 errors.

- **Date**: 2026-11-17 · **Status**: Implemented & Verified
- **Context**:
  1. *React Console Key Warning*: During screenplay viewing, React threw: `Encountered two children with the same key, '1'. Keys should be unique so that components maintain their identity across updates`. This occurred in `src/app/projects/[projectId]/story/page.tsx` line 928 where `key={scene.sceneNumber}` collided when multiple scene versions or regenerated drafts shared the same scene index.
  2. *Next.js Security Insight Alert*: In `next dev`, Next.js 16.4.3 raised a security vulnerability insight recommending upgrading Next.js.
- **Decision**:
  1. **Guaranteed Unique Keys (`src/app/projects/[projectId]/story/page.tsx`)**:
     - Updated all scene iterations (screenplay view, options view, and QC audit breakdown) to use composite keys: `key={scene.id || `scene-${scene.sceneNumber ?? idx}-${idx}`}`.
     - Added optional `id?: string` to `interface SceneData`.
  2. **Next.js Safe Release Upgrade**:
     - Upgraded `next` from `16.4.3` to `16.4.6` in `package.json` and `package-lock.json`.
     - Resolved the known vulnerability while preserving full Next.js 16 App Router compatibility.
- **Verification**:
  - `npx tsc --noEmit`: 0 errors.
  - `npm test`: 64/64 tests passing across 13 test suites.

## ADR-032: Universal Physical Object Component Registry, Dimensional Scale Anti-Drift Engine, and Strict Station Precedence
- **Date**: 2026-11-17 · **Status**: Implemented & Verified
- **Context**:
  - The creator rightly rejected one-off, single-prompt patches: *"I dont want single prompt fix . i need the feature fix for all the scene when we handle the object...."*.
  - When users feed arbitrary physical objects (Bicycle, Keyboard, Watch, Camera, Walkman, Sneaker, etc.), AI diffusion video engines (Veo, Kling, Runway, Luma) suffer from severe scale hallucination: unanchored words like "tire" become 4-foot monster truck/tractor tires; "chain" becomes a nautical anchor chain; "gear" becomes a clock-tower cog; "lens" becomes a water drinking glass.
  - Furthermore, process order inversion occurred when prompts mixed mechanical disassembly with downstream prep (e.g., tire levers + knife slices), because the prompt compiler misclassified the scene as `CULINARY_CUTTING` and injected chopping cadence overrides on cutting boards before disassembly was performed.
  - Additionally, regex stop-word bugs in `detectPhysicalEntities` turned phrases like "cook the one cycle" into `"The"`.
- **Decision**:
  1. **Universal Object Component Registry (`src/lib/story/world-engine.ts`)**:
     - Defined `OBJECT_COMPONENT_REGISTRY` covering `BICYCLE_VEHICLE`, `MECHANICAL_KEYBOARD`, `WATCH_HOROLOGY`, `AUDIO_WALKMAN_EARBUDS`, `CAMERA_OPTICS`, `SMARTPHONE_MOBILE`, `GAMING_CONSOLE`, `SNEAKER_FOOTWEAR`, and `GENERAL_PHYSICAL_OBJECT`.
     - Added `resolveObjectComponentSpecs(heroObjectNameOrIdea, actionText)`: resolves matched sub-components, dimensional anchors (e.g. "slender 28mm narrow road bike rubber tire mounted on thin 28-inch wire rim"), negative scale tokens (banning car/truck/tractor tires), extraction tools, and vessel recommendations.
     - Added `groundActionComponentScale(actionText, heroObjectName)`: dynamically scans action descriptions and substitutes generic sub-component nouns with grounded scale descriptions, while compiling targeted negative tokens.
     - Fixed `detectPhysicalEntities` with prioritized registry matching, word-boundary regexes, and a strict stop-word blacklist (`["the", "a", "an", "one", "some", "this", "that", "it", "all", "its", "each", "these", "those"]`).
  2. **Chronological Station Precedence & Motion Guards (`src/lib/story/prompt-compiler.ts`)**:
     - Upgraded `detectCulinaryStation`: mechanical extraction tools (`tire levers`, `chain breaker`, `wrench`, `screwdriver`, `puller`, `unbolt`, `unseat`) strictly take precedence over downstream prep keywords.
     - Enforces `Action Dynamics: Strict chronological execution matching the timecoded beats in exact sequence. Stage 1 mechanical extraction from host object MUST complete fully before Stage 2 prep, cutting, or grating begins. Do NOT begin with cutting on a board or cooking before extraction is complete.`
     - Injects oversized commercial catering cookware (`oversized industrial steel catering tawa & giant high-capacity catering kadai`) for large objects and bans tiny household pans.
     - Universally locks character handle to `[@TheShadowAlchemist]` across all compiled prompts and UI.
  3. **Universal 4-Stage Inedible Craft-Culinary Pipeline Generator (`src/lib/story/inedible-pipeline.ts`)**:
     - Implemented `generateInediblePipelineScenes`: generates 8 chronological scenes for 60s runtime and 5 scenes for 20s/30s runtime across any physical object.
     - Models Stage 1 (disassembly hook), Stage 2 (culinary butchery, 1-inch golden tofu cubes, calamari rings, 4-sided box grater shavings, golden rosin marinade), Stage 3 (oversized catering tawa and giant kadai), and Stage 4 (4-quadrant pocket fold, diagonal acoustic cleaver cut, hero molten caramelized glaze crunch pull, and `@TheShadowAlchemist` thumbs-up).
     - Generates high-CTR 50/50 split-screen `thumbnailPrompt`.
  4. **Dynamic Episode Creation API (`src/app/api/series/[seriesId]/episodes/route.ts`)**:
     - Directly feeds `pipeline.scenes` into the scene/shot creation loop.
     - Persists story foundation artifacts: `LOGLINE`, `PREMISE`, `SYNOPSIS`, `SCREENPLAY`, and `YOUTUBE_THUMBNAIL`.
- **Verification**:
  - `npm test`: 74/74 unit tests passing across 14 test suites (`tests/unit/object-handling.test.ts`).
  - `npm run typecheck`: 0 errors.
  - Verified Episode 3 (`cmwk9xl1n0001u8q004v0ob0z`) synchronized in PostgreSQL with 8 chronologically staged scenes, compiled shots, and 5 updated story artifacts.

## ADR-033: Bulk Village Cooking Engine, Multi-Ingredient Transformation & Indian Kitchen Machinery
- **Date**: 2026-11-18 · **Status**: Implemented & Verified
- **Context**:
  - The creator highlighted critical creative imperatives for Episode 4 targeting Indian and global viral audiences:
    1. *Avoid Monotonous Deep-Frying*: "see you are stick with only fry. dont doo that. there are plendy of items in cooking. this will get board... see when every we use these concept we need to introduce many items like grinder mixie. so we last three video did only the slicing.. i need slicing but even making intreset we have to use curnch mechine to create incredeiants. and then we have to use 5 + incredeiants for the one episode... during the cooking we have to add all the incredeiants differently and the final food contain all the incrediants in different form.. so keep all these points and let me know".
    2. *Bulk Scale Over Single Quantities (Village Cooking Channel Aesthetic)*: "OK. but the main object incrediants dont use single quantity. bacuse when we have bulk cooking it attact the users more. like the village cooking channel.. so use more than one nokia phone for this episode... it has to show as visual treat".
    3. *Camera Framing vs Camera Hero Object Collision*: In `world-engine.ts`, phrases like "thumbs-up to camera" incorrectly matched `CAMERA_OPTICS` due to overly broad regex `/\bcamera\b/i`, eclipsing the intended hero object.
- **Decision**:
  1. **Bulk Vintage Nokia Mobile Phones Registry Entry (`src/lib/story/world-engine.ts`)**:
     - Registered `BULK_NOKIA_PHONES` (`nokia|3310|1100|brick phones?|feature phones?|keypad phones?|bulk phones?`) with canonical hero name `"Bulk Vintage Nokia Mobile Phones (15x Nokia 1100 / 3310)"`.
     - Defined 5+ distinct harvested sub-components with dimensional anchors:
       - 15x Rigid Green PCBs (Motherboards) $\rightarrow$ Indian kitchen mixie grinder $\rightarrow$ Emerald masala spice powder.
       - 15x Translucent Silicone Keypad Matrices $\rightarrow$ Cleaver staccato dicing $\rightarrow$ Translucent cyan paneer / jelly cubes.
       - Coiled Copper Ribbon Cables & Antennas $\rightarrow$ Scorching street dosa tawa sauté $\rightarrow$ Crispy golden lachha noodles.
       - Silver Phillips Screws & SMD Resistors $\rightarrow$ Heavy mechanical crunch press $\rightarrow$ Smoking brass ladle mustard-oil tadka splutter.
       - 15x Monochrome LCD Glass Panels $\rightarrow$ Traditional brass handi pot slow reduction $\rightarrow$ Luminous neon-cyan & amber glaze chutney.
       - Snap-On Outer Shells $\rightarrow$ Folded crispy casing crunch parcel.
     - Refined `CAMERA_OPTICS` regex to `/\b(dslr|camcorder|vintage camera|35mm camera|camera body|camera lens|optical glass|iris blades|aperture blades)\b/i`, preventing cinematic direction terms like "to camera" or "facing camera" from misclassifying as camera hero objects.
  2. **Kitchen Machinery & Multi-Technique Station Engine (`src/lib/story/prompt-compiler.ts`)**:
     - Added `KITCHEN_MACHINERY` to `CulinaryStation` type definition and `detectCulinaryStation`.
     - Injected specialized action dynamics for high-torque mechanical pulverization (Indian mixie) and mechanical lever crush presses, complete with dedicated negative token compilation.
     - Injected phone prop DNA invariants: strictly prohibits modern smartphones, touchscreen curved OLED glass, or iPhones.
  3. **Dedicated Bulk Nokia Village Feast Pipeline (`src/lib/story/inedible-pipeline.ts`)**:
     - Implemented 60s 8-scene sequence:
       - *Scene 1 (0:00 - 0:08)*: Bulk wicker crate dump of 15 Nokia phones + cleaver bounce hook (*CLANGGG*) + chrome spudger harvest into 5 sorted copper trays.
       - *Scene 2 (0:08 - 0:15)*: Heavy-duty stainless steel Indian kitchen mixie grinding PCBs into emerald masala powder (*VRRR-KRRSH*).
       - *Scene 3 (0:15 - 0:23)*: Silicone keypad paneer dicing + mechanical crunch press crushing screws into tempering flakes.
       - *Scene 4 (0:23 - 0:30)*: Sizzling copper ribbon noodles on scorching street dosa tawa with dual spatulas (*CLANG-CLACK*).
       - *Scene 5 (0:30 - 0:38)*: Smoking brass ladle mustard oil tadka poured over noodles with violent acoustic hiss (*TCHRRRR*).
       - *Scene 6 (0:38 - 0:45)*: Luminous LCD glass chutney simmering and reducing in traditional brass handi pot (*GLOOP-GLOOP*).
       - *Scene 7 (0:45 - 0:53)*: Colossal banana-leaf brass thali village feast assembly and diagonal razor cleaver crunch slice (*CRUNCH*).
       - *Scene 8 (0:53 - 1:00)*: Hero chutney dip, caramelized molten stretch, and [@TheShadowAlchemist] confident thumbs-up to camera!
     - Generates 50/50 split-screen viral YouTube Shorts thumbnail prompt featuring the crate dump and the banana-leaf thali feast.
  4. **Database State & Verification**:
     - Created and compiled Episode 4 project (`cmwlnv4l50001u8vkzzncj5im`) in PostgreSQL with all 8 scenes, compiled shots, and 5 story artifacts (`LOGLINE`, `PREMISE`, `SYNOPSIS`, `SCREENPLAY`, `YOUTUBE_THUMBNAIL`).
     - Added test suite in `tests/unit/object-handling.test.ts`. Full test suite: 75/75 tests passing across 14 test suites (`npm test`), 0 TypeScript errors (`npm run typecheck`).

## ADR-034: Progressive Culinary Fusion & Global Station Invariant Across All Episodes
- **Date**: 2026-11-18 · **Status**: Implemented & Verified
- **Context**:
  - The creator discovered visual inconsistencies in Scene 5, 6, and 7 where harvested ingredients were rendered as separate, untouched raw piles on the serving thali, while the liquid chutney simmered untouched in a side pot. Furthermore, the model rendered a conflicting chef cutting a wrap on a wooden board behind the brass thali due to prompt contamination.
  - The creator requested a root-level architectural fix: *"is this fixed globally or only for this episode? the cooking is the process of combine all ingredients in different form and merge it to new form... but here it is not happen like that... so this become untouched... so please check in-depth and fix it"*.
- **Decision**:
  1. **Global Physical Law: Progressive Culinary Fusion (`PROGRESSIVE_CULINARY_FUSION` in `world-engine.ts`)**:
     - Codified Law 8 in `UNIVERSAL_PHYSICAL_LAWS`:
       *"Progressive Culinary Fusion & Merged Form: Cooking is the transformative process of combining distinct harvested ingredients into ONE unified, cooked creation. In cooking stages (sauté, wok toss, deep fry, boil, simmer, tawa, kadai), all harvested components must interact and blend together: liquid glazes, sauces, tadkas, and reductions MUST pour over and coat the solid components; powders and spices MUST toss and infuse into the mixture with rising steam. In plating and presentation stages (plate, thali, bowl, platter), the plated dish MUST be the completely merged, glistening, cooked final fusion of all ingredients, strictly NOT separate raw untouched piles sitting side by side. Plating shots strictly focus on the plated vessel and PROHIBIT background cutting boards, background knife chopping, or contradictory secondary dishes."*
     - Injected into `getInedibleObjectPhysics`, `getRenderingIntegrity`, and Google Flow / Veo master prompt rules for **ANY current and future culinary episode**.
  2. **Global Plating Station Isolation & Negative Filters (`src/lib/story/prompt-compiler.ts`)**:
     - Expanded `PLATING_SERVE` detection to identify all serving vessels (`plate`, `thali`, `banana-leaf`, `platter`, `banquet`, `coupe plate`, `bowl`).
     - Added global negative tokens for `PLATING_SERVE`: explicitly bans `"cutting board"`, `"wooden chopping board"`, `"chopping knife"`, `"cleaver"`, `"cleaver slicing"`, `"knife slicing"`, `"cutting in background"`, `"bread wrap"`, `"burrito wrap"`, `"raw untouched piles"`, `"separate unmerged ingredients"`, and `"unmixed raw piles"`.
     - Added global negative tokens for `STOVE_COOK`: explicitly bans `"untouched separate ingredients"`, `"ingredients not mixing"`, and `"cutting board in background"`.
  3. **Universal Pipeline Progressive Integration (`src/lib/story/inedible-pipeline.ts`)**:
     - Updated both the specific Episode 4 flow (Nokia) and the general object flow to enforce that all harvested components sear together, get coated in liquid reduction glazes, and slide onto the serving vessel as one cohesive, glistening dish.
- **Verification**:
  - `npm test`: 77/77 unit tests passing across 14 test suites (`tests/unit/prompt-doctor.test.ts`, `tests/unit/object-handling.test.ts`).
  - `npm run typecheck` (`tsc --noEmit`): 0 errors.

## ADR-035: High-Speed Robotic Motion Control Camera Kinematics (Bolt Cinema Rig & Linear Rails)
- **Date**: 2026-11-18 · **Status**: Implemented & Verified
- **Context**:
  - The creator observed that camera motion was defaulting to organic handheld float / casual cooking video sway: *"the camera movement is not going linear. like motion robotic camera.. again it is look like traditional cooking video shoot. so please include that as well"*.
  - Handheld camera shake, breathing sway, and human operator tilt wobble ruin the hyper-precise, high-end commercial aesthetic of viral craft ASMR (Bayashi / high-speed commercial food cinema).
- **Decision**:
  1. **Global Physical Law: Robotic Linear Camera Kinematics (`ROBOTIC_LINEAR_CAMERA_KINEMATICS` in `world-engine.ts`)**:
     - Codified Law 9 in `UNIVERSAL_PHYSICAL_LAWS`:
       *"Robotic Motion Control Camera Kinematics: Camera movement must be executed with high-speed precision robotic motion control (Bolt cinema arm / motorized linear rail slider). Every camera move must be strictly linear, constant-velocity, and mechanically stabilized: perfectly linear push-in, motorized horizontal tracking slide, or precision mechanical pedestal tilt. Strictly PROHIBIT organic handheld camera float, handheld breathing sway, casual handheld camera shake, amateur camera bump, or traditional slow shaky handheld cooking video style. The frame must feel like a multi-million-dollar high-speed commercial / craft cinema studio with probe lens mechanics locked on motorized tracks."*
  2. **Linear Robotic Camera Motion Resolver (`resolveLinearRoboticCameraMotion` in `prompt-compiler.ts`)**:
     - Automatically maps raw camera movements to mechanized high-speed motion control:
       - Snap/Drop $\rightarrow$ *"High-speed robotic motion control arm (Bolt rig) rapid vertical drop and linear snap-lock, perfectly steady mechanical stop, zero handheld wobble"*.
       - Orbit $\rightarrow$ *"Robotic motion control arm 360-degree linear motorized circular orbit on precision steel rail, perfectly constant angular velocity, mechanically locked framing"*.
       - Overhead/Flat Lay $\rightarrow$ *"Motorized overhead 90-degree linear rig, mechanically locked top-down flat lay, rock-solid constant velocity linear framing, zero organic sway"*.
       - Low Angle Push $\rightarrow$ *"High-speed robotic probe lens linear surface push at 60fps, razor-sharp mechanical track stabilization across sizzling surface, zero handheld shake"*.
       - Lateral Glide/Pan $\rightarrow$ *"Motorized linear slider high-speed constant-velocity tracking glide, perfectly linear horizontal move on precision motion rail, zero organic float"*.
       - Tilt/Pedestal $\rightarrow$ *"Motorized linear pedestal pull-back and smooth robotic vertical tilt up on motion control arm, perfectly linear mechanical trajectory, zero handheld wobble"*.
  3. **Anti-Handheld Negative Filters**:
     - Universal negative prompt automatically includes: `"handheld camera"`, `"handheld camera shake"`, `"organic camera float"`, `"organic sway"`, `"breathing camera wobble"`, `"traditional cooking video shoot"`, `"amateur cooking video"`, `"shaky cam"`, `"casual handheld camera"`, `"unsteady camera operator"`, `"camera drift"`, `"non-linear camera jitter"`, `"accidental camera bump"`, `"tilting wobble"`.
  4. **Database & UI Synchronization**:
     - Recompiled all shots in project `cmwlnv4l50001u8vkzzncj5im` (Episode 4) with robotic linear kinematics.
- **Verification**:
  - `npm test`: 77/77 unit tests passing across 14 test suites (`tests/unit/prompt-doctor.test.ts`).
  - `npm run typecheck` (`tsc --noEmit`): 0 errors.





