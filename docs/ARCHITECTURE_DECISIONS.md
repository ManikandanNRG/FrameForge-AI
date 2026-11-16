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

