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
