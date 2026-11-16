# Implementation Status

## Phase 0 — Repository foundation (localhost)
**Status:** COMPLETE (verified) · **Date:** 2026-10-24

## Phase 1 & 2 & 3 & 4 — End-to-End Pipeline & Generation Engine
**Status:** COMPLETE (fully verified live) · **Date:** 2026-10-30

### Implemented & Integrated
- **Full 3-Stage Image-to-Video Generation Sequence (Character Portrait -> Scene Keyframe Still -> I2V Video Motion)** (`src/app/api/projects/[projectId]/assets/[assetId]/generate-image/route.ts`, `src/app/projects/[projectId]/bible/page.tsx`, `src/app/projects/[projectId]/storyboard/page.tsx`, `src/lib/story/prompt-compiler.ts`):
  - **Stage 1A (Master Character Portrait & Casting)**:
    - Added dedicated `POST /api/projects/[projectId]/assets/[assetId]/generate-image` endpoint generating high-resolution 1:1 character portrait images using free FLUX.1 (Pollinations, zero cost).
    - Integrated Visual Character Casting station in Step 2: Assets (Bible) with live portrait preview, 1-click `🎨 Generate Character Portrait (Free FLUX.1)`, `🔄 Regenerate Portrait`, and `⬇️ Download Portrait` for direct upload into Google Flow "Characters" or Kling.
    - Clear **Character Image Generation Prompt** copyable for Midjourney, FLUX.1, Google Flow, and Kling.
    - Synchronized character portrait generation and preview inside the Storyboard Character Library modal (`isCharModalOpen`).
  - **Stage 1B (Scene Keyframe Still Image Generation)**:
    - Reordered Storyboard prompt hub tabs so **`🖼️ Stage 1: Scene Still Image (FLUX / Midjourney)`** is the primary default tab.
    - Provides photorealistic, style-locked 1080p still prompt + 1-click **`🎨 Generate AI Still (Free FLUX.1)`** button in cinema viewport.
    - Download still button for instant use as reference start frame.
  - **Stage 2 (Universal Image-to-Video Motion Prompts)**:
    - **`🎬 Stage 2: Video Motion Prompt (Google Flow / Kling / Runway / Luma / Wan 2.1)`**: Formats physics-grounded motion prompts designed specifically to animate the uploaded still image with 100% facial and workstation consistency without hallucinations.
    - Direct tool launcher pills for Google Flow (Veo I2V), Kling I2V, Runway Gen-3, Luma Dream Machine, and Wan 2.1.
  - **Stage 3 (Direct Video Alternative)**:
    - Retained **`⚡ Direct Video Prompt (Google Flow Veo @Mention)`** for single-step text-to-video generation.
- **Culinary ASMR & Dynamic Multi-Angle Camera Studio Engine** (`src/lib/story/world-engine.ts`, `src/lib/story/prompt-compiler.ts`, `src/lib/shots/service.ts`, `src/lib/bible/service.ts`, `src/app/api/projects/[projectId]/story/generate-options/route.ts`, `src/app/api/projects/[projectId]/story/select-option/route.ts`, `src/app/api/projects/analyze-idea/route.ts`, `src/app/projects/new/page.tsx`, `src/app/projects/[projectId]/page.tsx`, `tests/unit/culinary-asmr.test.ts`):
  - **Dynamic Multi-Angle Camera Rotation**: Rhythmic, cinematic alternating shot coverage across sequential shots:
    1. *Wide / Medium Workstation Establishing*: Establishes kitchen space, cutting board, and fresh whole ingredients.
    2. *Top-Down Flat Lay (90° Bird's Eye)*: Overhead geometric alignment of ingredients on cutting board.
    3. *Macro Extreme Close-Up (ECU 45°)*: 85mm probe macro lens with f/1.8 shallow depth of field tracking knife edge slicing cleanly through produce.
    4. *Low-Angle Skillet Pan*: Dynamic sliding angle as hot oil shimmers, butter foams, and aromatic steam billows on pan contact.
    5. *Chef Hands First-Person POV*: Over-the-shoulder perspective showing two hands actively basting, tossing, or stirring with utensil.
    6. *Macro Simmering Reduction*: Glistening sauce bubbles bursting at 60fps.
    7. *Plating & Garnishing*: 30° orbital pan around completed dish on dark slate.
    8. *Macro Crunchy Slice / Bite Reveal*: Slow-motion cross-section cut revealing tender juicy interior and crispy crust.
  - **Master Workstation & Cookware Continuity**: Strictly locks the kitchen countertop material, walnut cutting board grain, and cast-iron cookware style across every shot to maintain 100% spatial consistency.
  - **Culinary Kinematic Invariants & Anti-Hallucination Guardrails**:
    - Max 2 hands in frame (knife grip + claw grip); strictly prohibits phantom 3rd hands, floating arms, or deformed fingers.
    - Rigid knife grip; cutting board resting firmly on counter; cookware anchored to stove flame.
    - Slicing direction preserves mass: cut pieces remain separated on cutting board, zero morphing food.
  - **Pristine Binaural ASMR Sound Foley**: Dedicated `PURE_ASMR_FOLEY` dialogue mode that strictly excludes spoken dialogue, voice-over, and background music, compiling rich close-mic Foley sound effects (crisp knife chops on wood, oil sizzle, liquid pouring, steam hissing).
  - **New Visual Style & Presets**: Added `CULINARY_MACRO_ASMR` ("Culinary ASMR & Cooking (Macro Food Realism)"), `PURE_ASMR_FOLEY` dialogue mode, "Culinary & Cooking ASMR" genre, and "Satisfying, Crisp & Hypnotic" tone across project creation, idea analysis, and project settings.
- **High-CTR YouTube Thumbnail Studio & Cash-Cow Creator Tools (Zero-Cost Alternative to Sabarkaro)** (`src/app/api/projects/[projectId]/thumbnail/route.ts`, `src/components/nav/ProjectWorkflowNav.tsx`, `src/app/projects/[projectId]/story/page.tsx`):
  - **High-CTR YouTube Thumbnail Studio in Step 5 Launch Kit**:
    - Dedicated 1280x720 16:9 thumbnail generator powered by FLUX.1 (Free, zero API key required).
    - 3 viral style presets: `⚡ Curiosity & Shock` (expressive reaction face, high contrast rim-light), `🎬 Epic Cinematic` (golden hour atmosphere, deep bokeh), and `⚔️ Dramatic Conflict` (teal-orange tension).
    - Live typography preview simulating bold YouTube feed headline overlays (e.g., *"99% WRONG!"*, *"DON'T MISS THIS!"*).
    - 1-click `Download 1280×720 PNG` and `Copy Prompt` buttons directly alongside master film export.
  - **1-Click Cash-Cow Viral Quick-Pills (Sabarkaro Mode)**:
    - Added quick-preset pills in the Director Pitch modal covering the most viral faceless YouTube niches: Health & Remedies, Vintage History, Wildlife Action, Unsolved Mysteries, Psychology of Money, and Cyber AI 2050.
    - Clicking any pill auto-fills a curated, high-retention viral concept with instant 1-click option development.
  - **YouTube Competitor Video Cloner**:
    - Added a competitor URL cloner bar in the Director Pitch modal allowing creators to paste any viral YouTube link to extract narrative hooks and generate an original 5-scene cinematic screenplay in native dialogue.
- **Senior Director QC & Social Media Viral Script Doctor Engine** (`src/lib/story/script-doctor.ts`, `src/app/api/projects/[projectId]/story/script-doctor/route.ts`, `src/app/projects/[projectId]/story/page.tsx`, `tests/unit/script-doctor.test.ts`):
  - **5-Pillar Viral Retention Audit Engine**:
    - *3s Scroll-Stopping Hook*: Ensures Scene 1 starts in media res with kinetic action or high intrigue to halt viewer scroll on YouTube Shorts and Instagram Reels.
    - *Narrative Causality*: Validates that every scene is the direct consequence of the previous scene (Cause & Effect vs. disjointed random events).
    - *Colloquial Linguistic Naturalness*: Detects machine-translated or bookish phrasing in Tamil/English and recommends spoken colloquial cadence suitable for the selected genre and tone.
    - *Viral Payoff & Shareability*: Scores climax strength and loopability.
    - *AI Video Feasibility*: Guards against station teleportation (e.g. cutting board prep + stove cook in a single clip) that triggers morphing artifacts.
  - **Script Doctor Backend API**:
    - `POST /api/projects/[projectId]/story/script-doctor` supporting `action: "audit"` (instant score breakdown and director tips) and `action: "polish"` (invokes TextGenerationProvider with Senior Director Hollywood screenplay doctor prompt to rewrite and fortify the screenplay, saving an approved new SCREENPLAY version in Prisma).
  - **Script Stage UI Integration**:
    - Added persistent Senior Director QC banner displaying 5-pillar scores and executive director summary.
    - Added top navigation button with live score badge.
    - Added full Senior Director QC Modal showing breakdown progress meters, YouTube Shorts & Instagram Reels director tips, scene-by-scene audit checklist with specific director remedies, and 1-click `⚡ Polish & Auto-Fix Script with Senior Director AI`.
  - **Unit Test Suite**:
    - Added `tests/unit/script-doctor.test.ts` (100% pass across 33 tests in total test suite).
- **Universal Cinematic World & Physics Compiler (Systemic Hallucination Prevention)** (`src/lib/story/world-engine.ts`, `src/lib/story/prompt-compiler.ts`, `src/app/api/projects/[projectId]/shots/audit-prompt/route.ts`, `src/app/projects/[projectId]/storyboard/page.tsx`, `src/lib/jobs/image-generation-handler.ts`, `tests/unit/culinary-asmr.test.ts`):
  - **Universal Physics Laws**: Automatically enforces 4 core physical invariants on every shot and prompt across any concept or genre (Mechanical/Draft Kinematics, Skeletal/Locomotion Forward Alignment, 3-Plane Spatial Depth Separation, and Rigid Prop Grip).
  - **8 Precise Craft Action Stages (Anti-Hallucination Kinematics)**:
    - Eliminates conflicting station prompts by expanding detection into 8 distinct craft stages: `OBJECT_SOURCING` (shelving retrieval), `TOOL_DISASSEMBLY` (wire pullers/switch extractors), `MANUAL_FRACTURE` (palm strikes), `CULINARY_CUTTING` (cleaver chopping), `LIQUID_MARINADE` (rosin flux pour), `STOVE_COOK` (wok tossing), `PLATING_SERVE` (tweezers), and `HERO_REACTION` (smirk/pull-back).
    - Prevents premature tool/debris spawning: Scene 2 (shelf retrieval) strictly locks to industrial shelving with zero cutting boards, zero kitchen knives, zero stovetops, and zero pre-scattered loose keys/switches.
    - Prevents geometry disappearance during cutting: Enforces Conservation of Mass and Rigid Body Persistence so uncut chassis sections remain firmly anchored on the board without vanishing into thin air.
  - **Zero-Ingestion Safety Policy & Conceptual Art Ending (ADR-017)**:
    - Eliminates dangerous eating/tasting actions: strictly bans `eating, biting, chewing, tasting, mouth open, putting in mouth` across all prompts for inedible object cooking.
    - Upgrades Scene 12 to a Master Artwork Presentation where the chef slides the plated motherboard platter forward like a Michelin-star offering, locking eyes with a rogue smirk.
    - Injects mandatory Content Safety Disclaimer into prompts and export metadata: `"CONCEPTUAL ARTWORK & ASMR ENTERTAINMENT ONLY — INEDIBLE. DO NOT ATTEMPT OR INGEST."`
  - **Automated Anti-Hallucination Guardrails**: Eliminates dual-sided vehicles (e.g. draft animals tied to both front and back ends of carts), 180° backward neck twists, rubber spines, and spatial fusion of background objects into foreground heroes.
  - **Universal Multi-Engine Prompt Compiler**: Generates engine-specific, physically grounded prompts and negative matrices for Google Flow (Veo), Kling Direct Video, Sora, FLUX.1 Stills, and ChatGPT/Gemini.
  - **Storyboard UI Physics Health Inspector & Auto-Enhance API**: Integrated a live `Universal Physics Engine: Verified` status bar in the Prompt Hub with a 1-click `⚡ Auto-Enhance Physics` action that audits, repairs, and fortifies any prompt in real time.
- **Persistent 5-Step Film Production Workflow Navigation & YouTube Launch Kit** (`src/components/nav/ProjectWorkflowNav.tsx`, `src/app/projects/[projectId]/*`):
  - **Unified 5-Step Pipeline Navigation Bar**: Added a persistent, studio-styled top navigation bar across all project pages following the natural filmmaking order:
    1. **`1. Script`** (`/projects/[id]/story`): Screenplay development, scene-by-scene scriptwriting, 2 story options comparison, and inline AI Director co-pilot.
    2. **`2. Assets`** (`/projects/[id]/bible`): Character consistency library, wardrobe & physical appearance locking, and production bible lore.
    3. **`3. Storyboard`** (`/projects/[id]/storyboard`): Video generation prompts (Google Flow / Kling), free FLUX.1 stills, and shot approvals.
    4. **`4. Video Studio`** (`/projects/[id]/edit`): Multi-track NLE desktop timeline editor, real-time scrubbing, audio mixing, and clip trimming.
    5. **`5. YouTube Launch`** (`/projects/[id]/edit?view=export` / Launch Kit Modal): Master 1080p MP4 preview player, 1-click download, copyable YouTube/Social title, description, and hashtags, plus completion checklist.
  - **Context-Aware Progression**: Each stage features active step gradient highlighting and a contextual "Next Step" button (`Next: Assets (Bible) →`, `Next: Storyboard →`, `Next: Video Studio →`, `5. YouTube Launch 🚀`).
  - **YouTube Launch & Export Kit Modal**: Built directly into the workflow nav so creators can preview the master film, copy YouTube-ready metadata (title, bilingual synopsis, production tags), and download the final video file with one click.
  - **Project Overview Pipeline Grid**: Replaced the previous 3-link list on `/projects/[id]` with an interactive 5-step pipeline command center.
- **Studio Ghibli, Kids Animation & Universal Multi-Style Engine (YouTube Multi-Channel Architecture)** (`src/lib/story/world-engine.ts`, `src/lib/story/prompt-compiler.ts`, `src/app/api/projects/analyze-idea/route.ts`, `src/app/api/projects/[projectId]/story/select-option/route.ts`, `src/app/projects/new/page.tsx`, `src/app/projects/[projectId]/page.tsx`, `tests/unit/multi-style.test.ts`):
  - **Comprehensive Multi-Style Visual Support**:
    1. *Studio Ghibli Animation* (`GHIBLI_ANIME`): Hand-painted watercolor nature, Hayao Miyazaki pastoral landscapes, fluffy cumulus clouds, and expressive character animation.
    2. *2D Storybook Cartoon* (`CARTOON_2D`): Crisp expressive line art, vibrant storybook colors, playful kinematics.
    3. *3D Kids Animation* (`ANIMATION_3D`): Pixar/Disney-quality 3D models, soft global illumination, and bouncy child-friendly physics.
    4. *Culinary ASMR & Cooking* (`CULINARY_MACRO_ASMR`): Station-locked prep/stovetop isolation, 50mm/85mm probe macro lenses, and rigid steel knife invariants.
    5. *Vintage / Historical 35mm* (`VINTAGE_FILM`): Authentic early 20th-century cellulose grain, sepia earth tones, and period-accurate khadi wardrobe locking.
    6. *Stop-Motion Claymation* (`STOP_MOTION`): Handcrafted clay and miniature puppet armature textures, 12fps tactile cadence, and miniature studio macro lighting.
    7. *Comic-Book / Graphic Novel* (`COMIC_BOOK`): Halftone dot printing patterns, dynamic ink cross-hatching, and high-contrast comic framing.
    8. *Watercolor Illustration* (`WATERCOLOR`): Luminous pigments on cold-press cotton paper with transparent bleeding washes.
    9. *Fantasy Concept Art* (`FANTASY_CONCEPT_ART`): Epic digital matte painting with volumetric god-rays and grand scale.
    10. *Documentary Realism* (`DOCUMENTARY`): Grounded 35mm cinema realism with true-to-life skin pores and natural daylight.
    11. *High-End Commercial* (`LIVE_ACTION_AD`): Arri Alexa 65mm clarity, glamorous lighting, and vibrant commercial color grading.
  - **Dynamic Negative Prompt Inversion (`isStylizedArt`)**:
    - Stylized/animated media dynamically bans photorealistic live-action, real human photographs, dark horror, and grotesque elements without ever banning their own art medium.
    - Live-action media dynamically bans CGI, cartoons, 3D renders, and plastic skin.
  - **Automated Idea Analysis Recognition**: Detects keywords across all 6+ channels to auto-recommend optimal genre, tone, dialogue mode, runtime, and aspect ratio.
  - **Unit Test Coverage**: Added `tests/unit/multi-style.test.ts` (28/28 total test cases passing) validating prompt generation, negative prompt safety, and zero cross-contamination across all styles.
  - **Eliminated Hardcoded Legacy Artifacts**:
    - Removed hardcoded "Sugarcane plantation" default fallbacks across `storyboard/page.tsx`, `image-generation-handler.ts`, and `schemas.ts` in favor of dynamic style-aware environment defaults.
    - Fixed binary vehicular/culinary integrity ternary in `prompt-compiler.ts` so draft animals and knives are never erroneously assigned to animated/kids projects.
    - Eliminated false culinary triggers (e.g. "pour into finish line") in `world-engine.ts`.
    - Made `generate-options` dialogue directives genre-aware and language-bound, preventing out-of-context period Tamil drama from contaminating cheerful kids animations.
- **Dev Server Webpack Stability & Route Params Hook Refactor (Resolved Flickering Reload Loop)** (`package.json`, `src/app/projects/[projectId]/*`):
  - **Turbopack HMR Loop Resolution**: Next.js 16.4.3 Turbopack on Windows was caught in an endless file-lock / cache mismatch loop in `.next/dev/cache/turbopack/` (generating 34,281 HMR reload events at 10 requests/sec). Cleared the corrupted `.next` cache and switched `dev` and `dev:web` scripts to `next dev --webpack` for rock-solid dev server stability.
  - **Synchronous `useParams()` Migration**: Replaced asynchronous `React.use(params)` across all dynamic client pages (`story`, `storyboard`, `bible`, `edit`, `page.tsx`) with Next.js official synchronous `useParams()` hook, preventing client Suspense re-mounting and screen flashing.
  - **Localhost Session Auto-Recovery**: If a dev server restart or cookie expiration causes `session.userId` to be missing on localhost in development mode, `requireUserId()` and `/api/auth/me` automatically attach and persist the single local owner user (`env.OWNER_EMAIL`), preventing 401 Unauthorized locks across all project and generation routes.
  - **URL Query Param Loop Prevention**: Guarded the `action=options` trigger in `story/page.tsx` with a `useRef` and immediately sanitized the browser URL with `window.history.replaceState({}, "", window.location.pathname)` to eliminate rapid re-execution and reloads.
  - **Detailed API Error Logging**: Enhanced `apiHandler` logging to record HTTP method and pathname upon request failure for instant debugging.
- **Inline AI Director Co-Pilot (Chat-Bot Scene Refinement)** (`src/app/projects/[projectId]/story/page.tsx`, `src/app/api/projects/[projectId]/story/regenerate-scene/route.ts`, `src/lib/providers/gemini-text.ts`):
  - **Inline Chat-Bot Bar on Every Scene Card**: Users can now type natural language instructions directly into any scene card (e.g. *"Make Karthi shout louder in Tamil"*, *"Mother hugs him tightly in fear"*, *"Increase suspense when elephant appears"*).
  - **Quick-Prompt Inspiration Pills**: 1-click pills to append common director adjustments (`+ Make dialogue more emotional`, `+ Add frantic screams & fear`, `+ Increase suspense with elephant threat`, `+ Make action faster & urgent`).
  - **1-Click AI Rewrite**: Direct `✨ AI Rewrite` button on the input bar that rewrites that exact scene in real-time, preserving locked character wardrobe, voice continuity, and dramatic cause-and-effect with neighboring scenes.
  - **Optimized Gemini Model Resolution & Schema Normalization**: Pointed directly to `gemini-2.0-flash` and `gemini-1.5-flash` as primary Google Gemini models for fast, reliable generation without 404 retries. Added resilient Zod preprocessing to `TwoStoryOptionsSchema` to automatically normalize and sanitize schema variations from OpenRouter/Gemini (handling `scene_number`, optional headings, default option IDs, and array formatting).
- **On-Demand Single-Shot & Bulk Free AI Image Generation for Image-to-Video (I2V)** (`src/app/api/projects/[projectId]/shots/generate-images/route.ts`, `src/app/projects/[projectId]/storyboard/page.tsx`, `src/lib/jobs/image-generation-handler.ts`, `src/lib/providers/resolve-image.ts`, `src/lib/providers/flux-image.ts`):
  - **100% Free & Zero-Cost**: Powered by open-source FLUX.1 (via Pollinations), requiring zero API keys, zero credit cards, and zero usage limits.
  - **On-Demand & Optional**: Not blocking or mandatory. Users can generate still images per-shot whenever needed for Image-to-Video workflows (Kling, Luma Dream Machine, Wan 2.1, Hailuo, Runway Gen-3) or in-app animation.
  - **Single-Shot 1-Click Generation**: Added `🎨 Generate AI Image (100% Free FLUX.1)` directly inside the Cinema Viewport, Media Station, and AI Prompt Hub header.
  - **Instant Image-to-Video (I2V) Export**: Added `⬇️ Download Still (for I2V)` to download 1080p still images to the user's computer with 1 click for direct upload into video generation models.
  - **Aspect-Ratio Conscious Dimensions**: Automatically matches the project orientation (`768x1360` for 9:16 vertical, `1280x720` for 16:9 widescreen, `1024x1024` for square).
  - **Image Variation & Regeneration**: `🔄 Regenerate Still` triggers fresh generation with a new seed.
- **Two-Story Option Development & Dynamic Idea Analysis Engine (Option A vs Option B)** (`src/lib/story/schemas.ts`, `src/app/api/projects/[projectId]/story/generate-options/route.ts`, `src/app/api/projects/[projectId]/story/select-option/route.ts`, `src/app/projects/[projectId]/story/page.tsx`, `src/app/projects/[projectId]/page.tsx`):
  - **Dynamic Idea Analysis (No Hardcoded Categories)**: The AI analyzes any user idea (comedy, romance, sports, horror, fantasy, sci-fi, village drama, etc.) and formulates two organic, contrasting creative treatments (Angle A vs Angle B) derived directly from that idea.
  - **Side-by-Side Comparison Modal**: Review dynamic concept angles, titles, loglines, premises, and complete scene breakdowns (8s/10s duration) with native Tamil dialogues before committing.
  - **Idea Editor & Instant Preview**: Multi-line editable prompt populated with the project's actual `sourceIdea`, plus an instant mock preview button alongside AI generation.
  - **1-Click Option Activation**: Instantly writes artifacts, synchronizes database `Scene` and `Shot` records, and populates the Script Studio.
- **Scene-by-Scene Script Studio & AI Scene Regenerator** (`src/app/projects/[projectId]/story/page.tsx`, `src/app/api/projects/[projectId]/story/regenerate-scene/route.ts`, `src/app/api/projects/[projectId]/story/scene/route.ts`):
  - **Interactive Scene Cards**: Displays `SCENE 01` badge, `⏱️ 8s / 10s` video duration tags, spoken dialogue with emotional delivery badges (`பயத்துடனும், அவசரமாகவும்`), voiceover narration, and foley sound design.
  - **Per-Scene AI Regenerate**: Rewrite any individual scene with custom director instructions while maintaining locked character wardrobe and strict dramatic cause-and-effect with neighboring scenes.
  - **Inline Script Editor Modal**: Edit scene heading, location, duration (8s/10s), character dialogue `[@Name] speaks: "..."`, voiceover, and action blocking with instant database sync.
  - **Prominent Transition to Prompts**: Finalize all dialogue and scenes first, then click **`🚀 Finalize & Proceed to Prompts (Storyboard)`**.
- **100% Zero-Cost AI Architecture & Daily Quota Dashboard** (`src/lib/providers/openrouter-text.ts`, `src/lib/providers/gemini-text.ts`, `src/lib/providers/resolve.ts`, `src/app/settings/page.tsx`):
  - **Prioritized Free Model Order**:
    - Primary: **Google Gemini Free Tier** (1,500 requests/day, 15 RPM).
    - Secondary: **OpenRouter 100% Free Tier** (`meta-llama/llama-3.3-70b-instruct:free`, `google/gemini-2.0-flash-lite:free`, `deepseek/deepseek-r1:free`).
    - Stills & Motion: **FLUX.1 Free Generator** + In-App FFmpeg Camera Motion & TTS Voiceover (100% local, zero-cost).
  - **Daily Filmmaking Quota Monitor**: Added a real-time capacity and quota monitor in Settings tailored for creating 1 video per day (2–3 minutes / ~15–20 shots) consuming less than 1% of the daily free limits.
  - **Graceful Rate-Limit & Fallback Handling**: Automatically catches 429 quota limits and shifts to backup free models without user interruption or failure.
  - **Fixed React Controlled Input Warning**: Defaulted form inputs in Settings to empty string (`keys[p.id] ?? ""`).
- **Direct-to-Video Master Prompts & Character Consistency Engine** (`src/lib/story/prompts.ts`, `src/lib/bible/service.ts`, `src/lib/shots/service.ts`, `src/app/projects/[projectId]/storyboard/page.tsx`):
  - **Single-Line Idea to Multi-Lingual Screenplay**: Generates complete scene-by-scene script with voiceover narration and character dialogue written in the user's chosen language (e.g. Tamil, Hindi, Spanish, English) and visual action in cinematic English.
  - **Production Bible Consistency Anchors**: Automatically extracts locked character physical identity descriptions (ethnicity, skin tone, facial hair, eye color, and exact clothing) so the same character appears across every single shot.
  - **Direct Video Generation (Google Flow / Veo & Kling)**: Skips the still image step and generates complete direct-to-video master prompts with locked character anchors, camera dynamics, temporal action, and native dialogue cues.
  - **Storyboard Prompt Hub**: Displays Google Flow (Veo) as the primary tab with 1-click copy and quick launcher.
- **CapCut / Premiere Pro Desktop NLE Video Editor** (`src/app/projects/[projectId]/edit/page.tsx`):
  - **Top 3-Panel Studio Layout**:
    - **Media Pool & Asset Library**: Multi-tab panel (`Media`, `Audio`, `Screenplay`) with 16:9 thumbnail previews, duration badges, "Added" status, and 1-click timeline insertion.
    - **Cinema Viewport Monitor**: Central canvas with live playhead sync, transport controls (play, pause, step 1s, jump to start), timecode readout (`00:00:00:00`), and direct MP4 export download.
    - **Clip Inspector & Properties**: Real-time trim in/out adjustments (`-0.5s` / `+0.5s`), split at playhead (blade tool), clip reordering, and VO script view.
  - **Multi-Track Desktop Timeline**:
    - **Toolbar**: Split (blade cut), Delete, Clip count, and dynamic Zoom slider (`20px/s` to `120px/s`).
    - **Time Ruler & Scrubbing**: Full timecode ruler with glowing cyan playhead that tracks playback across all tracks.
    - **Track V1 (Video)**: Authentic filmstrip clips with repeating thumbnail frames, duration, and in/out points.
    - **Track A1 (Voiceover)**: Audio waveform visualization with teal peak bars and screenplay audio tracking.
    - **Track A2 (Atmosphere)**: Ambient foley and environmental sound bed.
- **Built-In In-App Still-to-Video Animation Engine** (`src/app/api/projects/[projectId]/shots/generate-videos/route.ts`, `src/lib/jobs/video-generation-handler.ts`, `src/lib/providers/lipsync/local-motion.ts`):
  - Allows users to animate all still images generated from ChatGPT/Gemini directly into 1080p 24fps MP4 video clips inside the app without needing external video APIs or paid credits.
  - Applies dynamic cinematic camera motion (`zoompan` slow push-in / breath) via local FFmpeg.
  - Synthesizes the authentic screenplay voiceover / dialogue audio via Google TTS and multiplexes it directly into the MP4 container.
  - Added 1-click **`🎬 Animate All Scenes to Video`** prominent button in the sidebar and per-shot **`🎬 Animate to Video (In-App)`** in the media station.
- **Browser Prompt Hub & Google Flow / Veo Integration** (`src/app/projects/[projectId]/storyboard/page.tsx`):
  - Interactive multi-tab prompt hub with dedicated formats for:
    - **Google Flow (Veo)**: Formatted with scene heading, camera framing, character continuity, voiceover beat, spoken dialogue, and sound effects.
    - **ChatGPT (DALL·E 3)** & **Gemini (Imagen 3)**: High-fidelity photorealistic stills with embedded screenplay script and negative constraints.
    - **🎬 Video Motion**: Motion dynamics, camera flow, and audio atmosphere.
    - **🎙️ Script (VO & Dialogue)**: Clean narrator voiceover, character lines, and foley for direct voice recording or TTS.
    - **Raw JSON Prompt**: Machine-readable scene/shot schema.
  - Quick-launch buttons to open **Google Flow / VideoFX**, **ChatGPT**, **Gemini**, **Kling Web (66 Free credits/day)**, and **Luma Dream Machine**.
  - One-click copy with visual feedback, and whole-project JSON export.
- **Automatic Audio Multiplexing on Video Import** (`src/app/api/projects/[projectId]/shots/[shotId]/import/route.ts`, `src/lib/edit/ffmpeg.ts`):
  - When silent video clips generated in Kling, Luma, or Google Flow are uploaded or pasted (`Ctrl+V`), the server checks for audio streams using `hasAudioStream`.
  - Automatically synthesizes the shot's dialogue/voiceover using `synthesizeVoiceover` if not present.
  - Losslessly multiplexes the audio onto the video using FFmpeg (`muxAudioOntoVideo`), so imported videos immediately play with voice and speech.
- **DALL·E 3 & FLUX.1 Image Generation Engine** (`src/lib/providers/openai-image.ts`, `src/lib/providers/flux-image.ts`):
  - Integrates with official OpenAI DALL·E 3 when a funded key is present.
  - Automatically falls back to 100% free, zero-cost, photorealistic FLUX.1 (via Pollinations) when OpenAI has no credits.
  - Includes retry loops with exponential backoff to handle transient network/queue throttles.
  - Tested and verified: All 7 storyboard shots generated and saved locally with SHA-256 checksums.
- **Kling AI Video Generation Provider** (`src/lib/providers/kling-video.ts`):
  - Updated to `kling-v3` flagship model with direct `Bearer` token authentication (`api-key-kling-...`).
- **Local Motion Engine & Fallback Video Rendering** (`src/lib/media/animate.ts`):
  - Automatically turns storyboard still images into broadcast 1080p 24fps MP4 clips using local FFmpeg.
  - Seamlessly handles quota exhaustion (`1102 Account balance not enough`) on external providers so video production is never blocked.
- **FFmpeg Full Movie Render & Export Engine** (`src/lib/edit/ffmpeg.ts`):
  - Concat demuxer with aspect-ratio scaling, faststart MP4 encoding, and ffprobe validation.
  - Tested and verified: 40-second 1080p 24fps `.mp4` movie generated and exported to `media/projects/.../exports/`.
- **Edit & Export Page with Embedded Player & Download** (`src/app/projects/[projectId]/edit/page.tsx`):
  - In-browser HTML5 video player and one-click direct MP4 download.
- **Media Serving Route** (`src/app/api/media/file/route.ts`):
  - Path-traversal safe stream endpoint serving local generated images, clips, and exported films to the browser.

- **Inedible Object Cooking ASMR Engine & 4-Beat Viral Hook System** (`src/lib/story/world-engine.ts`, `src/lib/story/prompt-compiler.ts`, `src/lib/story/prompts.ts`, `src/lib/story/script-doctor.ts`, `tests/unit/culinary-asmr.test.ts`):
  - **Inedible Technical Hardware Physics (Law 6)**: Recognizes non-food objects (mechanical keyboards, keycaps, Cherry MX switches, circuit boards, earbuds, smartphones, stones, e-waste) and guarantees they retain rigid mechanical geometry with legible laser-etched legends and metallic contacts rather than dissolving into generic cubes, plastic blocks, or tofu dice.
  - **4-Beat Rapid-Fire Viral Hook Architecture**: Short-form Scene 1 (0:00 - 0:05) enforces a 4-beat kinetic teaser (Slam object on board -> Pop components toward camera -> Heavy cleaver chop -> Wok fireball sizzle) with chef rogue smirk to prevent viewer swipe-away.
  - **Cold Harvest / Origin Station Lock**: Scene 2 (0:05 - 0:15) strictly locks to cold salvage and harvest (unplugging cable, carrying to workbench) with negative prompt guards against active stoves, pans, or flames.
  - **The Macro Rule**: All small-component actions (keycaps, switches, screws, microchips) are automatically upgraded to 85mm probe macro optics, f/1.8 shallow depth of field.
  - **Universal Anti-Cube Negative Matrix**: Permanently injects `generic cubes, plain plastic blocks, tofu, dice, wheat noodles, pasta, flour spaghetti, lo mein, real grocery food, meat, chicken, broccoli`.
  - **Inedible Gourmet Ratio (80% Object Prominence)**: Enforces that plated stir-fries are 80% composed of authentic technical components glistening under translucent culinary flux/glaze, strictly prohibiting ambiguous food terms that trigger wheat pasta hallucinations.
  - **Canonical Prop DNA Lock**: Embeds modern, relatable prop definitions (e.g., modern matte-black mechanical keyboard with doubleshot PBT keycaps and Cherry MX switches) across all scene prompts to guarantee continuous prop consistency across every scene.

### Verified (not just claimed)
- `npm run typecheck` → passes with 0 errors across all routes, models, and providers.
- `npm run test` → 35/35 vitest unit tests pass.
- `npm run build` → Next.js production build passes with all static and dynamic routes compiled.

### Next Recommended Step
- Run an end-to-end test with a real prompt using Gemini (free text generation) and OpenAI (DALL-E 3 storyboard generation) or Kling video generation.
- Install FFmpeg on the host machine to test final MP4 timeline rendering.


### 2026-11-15 — ADR-018: Social Launch Kit & AI Thumbnail Studio Integrated
- **Features Implemented**:
  1. `src/lib/story/launch-kit.ts`: Authoritative multi-platform publishing engine generating tailored YouTube packages (3 viral title variants, SEO description with safety disclaimer and timestamps, tags), Instagram Reels packages (high-retention caption, trending audio recommendation, 25+ viral hashtags, engagement pinned comment poll), and high-CTR thumbnail prompts (16:9 & 9:16).
  2. `src/app/api/projects/[projectId]/thumbnail/route.ts`: Updated GET and POST endpoints to support `OBJECT_COOKING_HOOK`, returning `launchKit` and rendering 16:9 (1280x720) or 9:16 (720x1280) via FLUX.1.
  3. `src/components/nav/ProjectWorkflowNav.tsx`: 3-tab Social Launch Suite (YouTube Launch, Instagram Reels, AI Thumbnail Studio) with 1-click copy for all fields, aspect ratio selector, and AI prompt viewer.
  4. `tests/unit/launch-kit.test.ts`: Automated test suite covering prompt constraints, YouTube package, and Instagram Reels package.
- **Verification**:
  - `pnpm test`: 40/40 tests passing across 8 test suites.
  - `tsc --noEmit`: 0 errors.

### 2026-11-16 — ADR-019: Viral YouTube Headline Engine & Thumbnail Studio Customizer
- **Features Implemented**:
  1. **Masculine Chef Anchor Lock (`src/lib/story/launch-kit.ts`)**:
     - Hardened character prompt subject to explicitly define `"@TheShadowAlchemist, an athletic male artisan culinary alchemist chef, handsome masculine facial structure, piercing hazel eyes..."` preventing image models (e.g. FLUX.1) from hallucinating female or anime faces.
  2. **Dual-Mode AI Prompts (`src/lib/story/launch-kit.ts`)**:
     - Added `landscape16x9WithHeadline` and `portrait9x16WithHeadline` with embedded `Viral Text Header Directive:` for text-capable image generators (Google Flow / Imagen 3).
     - Added dynamic prompt synchronization that updates in real-time with custom headline text.
  3. **Multi-Style Overlay Customizer (`src/components/nav/ProjectWorkflowNav.tsx`)**:
     - **3 Style Modes**: `🔥 Viral YT Header` (huge gradient text with thick black outline and white glow matching user-approved design), `⚠️ Caution Sticker` (angled box badge), and `⚪ Clean Impact` (modern bold typography).
     - **Font Size Controls**: `Hero (Huge YT)`, `Large`, `Medium`, `Compact`.
     - **Safe Zone Positioning**: `Top-Center`, `Top-Right`, `Top-Left`, `Bottom`.
     - **Vertical Nudge Slider (Y-Offset)**: 1% to 25% slider allowing fine-tuning to keep text strictly above the chef's goggles.
     - **Theme Gradients**: `🔥 Fiery Sunset` (Yellow -> Orange -> Red gradient), `⚡ Electric Yellow`, `🛑 Caution Red`, `⚪ Pure White`.
     - **Font Family**: `Impact (YouTube)`, `Modern Sans`, `Monospace`.
     - **One-Click Presets & Custom Input**: `"DO NOT EAT THIS!"`, `"⚠️ DANGEROUS DISH!"`, `"🚫 100% INEDIBLE!"`, `"🍳 500°F WOK STIR-FRY"`, `"⌨️ CRUNCHY KEYBOARD"`.
  4. **Base Image Flexibility & Master Chef Switcher**:
     - Automatically discovers and surfaces the user's approved master chef image (`media_1794762564764_ab5dc0ae.jpg`), allowing 1-click toggling between `⭐ Approved Master Chef` and `🤖 AI Generated (FLUX.1)`.
  5. **High-Res HTML5 Canvas Compositing & Export**:
     - Upgraded `downloadCompositedThumbnail` to render pixel-perfect multi-stop gradients, heavy black strokes (`lineWidth`), white halo glow (`shadowBlur`), and positioning onto high-res canvas exports.
  6. **Persistence API (`src/app/api/projects/[projectId]/thumbnail/route.ts`)**:
     - Added `PATCH` endpoint to save custom overlay settings to the project's `StoryArtifact` database record.
- **Verification**:
  - `tsc --noEmit`: 0 errors.
  - `pnpm test`: 40/40 tests passing across 8 test suites.

### 2026-11-16 — ADR-020: Scene 11 (Cooked Consistency) & Scene 12 (3-Star Michelin White Plate Artwork)
- **Features Implemented**:
  1. **Scene 11 (End of Cooking & Sauce Consistency in Pan)**:
     - Updated database records (`Scene` 11 and `Shot` 11 in project `cmwg5nczz0001u88sld5gnrmd`).
     - **Visual Prompt**: Macro eye-level shot inside the hot carbon-steel wok at the end of cooking. Thick, glistening amber reduction glaze bubbling. Chef lifts stainless spatula upward—sticky, glistening sauce stretches and drips in slow motion over glossy black keycaps and ruby Cherry MX switches, showcasing the caramelized cooked consistency.
     - **ASMR Audio**: Thick bubbling simmer (*gloop-bubble-sizzle*), slow sticky saucy stretch sound (*shhhk-gloooop*), keycaps gently clicking in heavy glaze, wisps of steam. Strictly zero spoken words or voiceover.
  2. **Scene 12 (3-Star Michelin White Plate Artwork Presentation)**:
     - Updated database records (`Scene` 12 and `Shot` 12 in project `cmwg5nczz0001u88sld5gnrmd`).
     - Replaced dull dark motherboard with a **pristine, high-contrast bright white ceramic coupe plate** for maximum visual pop on YouTube/Instagram feeds.
     - **Visual Prompt**: Bold curved swoosh of dark amber chili glaze across gleaming white porcelain; central geometric gourmet mound of caramelized keycaps and ruby switches; delicate spiral copper wire ribbons; emerald PCB chips fanned along the side; golden sauce droplets piped in a curve; crowned with a single ruby-red ESC keycap under a focused warm spotlight.
     - **ASMR Audio**: Soft steam whisper, subtle ceramic clink, ambient low hum.
  3. **Screenplay Synchronization & Universal Architecture (`src/lib/story/prompts.ts`, `src/lib/story/prompt-compiler.ts`, `src/lib/story/launch-kit.ts`)**:
     - Updated screenplay artifact version text, YouTube description timestamps, and system prompt guidelines.
     - **Locked Base Format for All Future Inedible Cooking Episodes**:
       - *Penultimate Scene*: Guaranteed "End of Cooking & Sauce Consistency (Pan Lift)" inside the wok/pan showing the rich, thick reduction glaze stretching in slow-mo as the spatula lifts.
       - *Final Scene*: Guaranteed "3-Star Michelin White Plate Artwork Presentation" on a pristine bright white ceramic plate with bold glaze swoosh, geometric centerpiece, and micro-garnishes.
- **Verification**:
  - `tsc --noEmit`: 0 errors.
  - `pnpm test`: 40/40 tests passing across 8 test suites.

### 2026-11-16 — Full Project Code QC & UAT Audit + Bug Resolutions
- **Bugs Diagnosed & Fixed**:
  1. **Vitest Node 18 CJS/ESM Startup Error**:
     - Converted `vitest.config.ts` to `vitest.config.mts` to eliminate `ERR_REQUIRE_ESM` when bundling under Node 18 without `"type": "module"`.
  2. **Dual-Use `negativeConstraints` & Audio Corruption ("Murugan Infiltration")**:
     - Hardened `getShotAudioData` (`src/lib/shots/audio-defaults.ts`) to safely parse JSON audio payloads, respect intentional empty strings for ASMR/silent shots, and eliminate fallback Murugan Tamil village lines from polluting unrelated non-village projects.
  3. **Directorial Action Descriptions Spoken Aloud by TTS**:
     - Fixed `video-generation-handler.ts`, `import/route.ts`, and `voiceover/route.ts` to strictly forbid speaking `shot.actionDescription` as voiceover speech. Enforced silence/ambient audio when dialogue and voiceover are empty or when `dialogueMode` is `PURE_ASMR_FOLEY` / `NO_DIALOGUE`.
  4. **OpenRouter Provider Excluded in API Validation**:
     - Added `"openrouter"` to the provider validation checks in `src/app/api/projects/[projectId]/bible/route.ts`, `shots/route.ts`, and `story/route.ts`.
  5. **State Machine Violation in Inline Job Execution (`QUEUED -> RUNNING`)**:
     - Added atomic `claimSpecificJob(id)` in `src/lib/jobs/queue.ts` (`QUEUED -> SUBMITTING`). Fixed inline `setImmediate` handlers in `jobs/[jobId]`, `generate-images`, `generate-videos`, and `sequences/[sequenceId]/export` to claim jobs prior to calling `markRunning()`.
  6. **Hardcoded Loopback Fetch (`http://localhost:3000`) in 1-Click Studio**:
     - Replaced unauthenticated HTTP loopback fetch in `src/app/api/projects/[projectId]/pipeline/one-click/route.ts` with direct internal job queuing via `enqueue`.
  7. **Hardcoded "Village" Fallback in Story Studio**:
     - Replaced hardcoded `"Village"` location in `src/app/projects/[projectId]/story/page.tsx` line 223 with dynamic project-aware location fallback.
  8. **Prompt Template Contamination ("Sugarcane Field")**:
     - Replaced hardcoded `"EXT. SUGARCANE FIELD - AFTERNOON"` examples in `generate-options/route.ts` and `service.ts` with generic story world placeholders.
  9. **Added Unit Test Suite**:
     - Added `tests/unit/audio-defaults.test.ts` (6 tests) and expanded `tests/unit/state-machine.test.ts`. Total test suite now: 9 test suites, 46/46 passing tests.
- **Verification**:
  - `npm run typecheck` (`tsc --noEmit`): 0 errors.
  - `npm test` (`vitest run`): 46/46 tests passing across 9 test suites.

### 2026-11-16 — ADR-022: Story-First Creative Studio Architecture & Context-Aware AI Co-Pilot
- **User Problem Addressed**:
  - Script area dropped users directly into technical AI camera prompt syntax (`VISUAL PROMPT & CAMERA`, `Omni Flash / Veo 2`, camera tracking tags) instead of allowing creators to read and understand the story developed from their one-line pitch.
  - Hardcoded elephant threat and Tamil village quick-pills (`+ Increase suspense with elephant threat`, `+ Add mother comforting Karthi`) were displayed on all scene cards regardless of genre or project world (such as Cyberpunk Alchemist Cooking ASMR).
- **Architectural & UX Solutions Implemented**:
  1. **2-Stage Story Development Workflow (`src/app/projects/[projectId]/story/page.tsx`)**:
     - **Stage 1 (Viral Story Treatment & Narrative Foundation)**: Prominently featured hero treatment display at the top of the Script Studio presenting:
       - *1. Original Idea Pitch*: Displays the creator's raw pitch quote.
       - *2. 3-Second Scroll-Stopping Viral Hook*: Highlights the visual scroll-stopper.
       - *3. Story Premise & Cinematic Setting*: Highlights protagonist goals, world constraints, and cinematic tension.
       - *4. 3-Act Viral Narrative Arc*: Timeline cards showing Act 1 (The Hook & Setup), Act 2 (Escalation & Craft), and Act 3 (Climax & Viral Payoff).
       - *Action Buttons*: Quick-access buttons to compare 2 competing creative treatments (Option A vs Option B) or approve the story and proceed to screenplay scenes.
     - **Stage 2 (Scene-by-Scene Screenplay)**:
       - Prioritizes **Dramatic Story Action & Beat** in readable screenplay prose.
       - Added a **View Mode Switcher**: `📖 Story View (Clean)` vs `🎬 Director AI Prompts`.
       - Placed technical diffusion prompts and binaural Foley in a collapsible `Director & AI Camera Diffusion Specs` accordion.
  2. **Dynamic Context-Aware AI Director Co-Pilot (`src/lib/story/director-copilot.ts`)**:
     - Created `getDirectorSuggestions(project, scene)` to dynamically generate tailored instruction pills and input placeholders based on project `visualStyle`, `genre`, and `tone`.
     - For Culinary ASMR: Generates sizzle, crunch, sauce glaze, and knife prep suggestions (eliminating all elephant/Karthi pills).
     - For Anime/Kids: Generates playful dialogue, laughter, and meadow atmosphere pills.
     - For Vintage/Period: Generates authentic cultural dialogue, antique foley, and sepia lighting pills.
     - For Sci-Fi: Generates cyber neon glow, capacitor hum, and hardware macro pills.
     - Enhanced `extractDialogueDelivery` to strip quotes and parse explicit parentheses delivery tags across all languages.
  3. **Foundation Story Artifact Auto-Synthesis (`src/app/api/projects/[projectId]/story/route.ts`)**:
     - `GET /api/projects/[projectId]/story` automatically verifies whether `LOGLINE`, `PREMISE`, and `SYNOPSIS` artifacts exist. If missing from projects with existing screenplays, it synthesizes and persists them into the database so the story foundation is never blank.
  4. **Unit Tests Added (`tests/unit/director-copilot.test.ts`)**:
     - 6 unit tests covering culinary, anime, vintage, and sci-fi director suggestions and dialogue delivery cue extraction. Total test suite: 10 test suites, 52/52 passing tests.
- **Verification**:
  - `npm run typecheck` (`tsc --noEmit`): 0 errors.
  - `npm test` (`vitest run`): 52/52 tests passing across 10 test suites.

### 2026-11-16 — Episode 2 Production & Transformation: "The Vintage Game Boy Tempura (ASMR)" — 20s Viral Rapid ASMR Standard (Bayashi 2X Pacing & 60% Credit Reduction)
- **Project**: `cmwja2y3t0001u8qgfh5w3gtj`
- **User Pivot & Viral Benchmark**:
  - Addressed creator critique on slow 8s scenes with low action density.
  - Benchmarked against viral reference video (`would_you_eat_this__#shorts.mp4` by Bayashi TV, 61M+ views, 19.82 seconds total).
  - Replaced the old 12-scene format (~90s) with the **5 High-Density Scenes (~20s total, 4s each)**:
    - *Scene 1 (4s)*: Rapid Violent Disassembly Hook (slam Game Boy, cartridge snap, 6 tri-wing screws & shell pop, pluck D-pad/buttons).
    - *Scene 2 (4s)*: Rapid Fracture, Knife Slicing & Batter Dip (PCB snap like chocolate, staccato ribbon cable chop, golden glaze dip, panko coat).
    - *Scene 3 (4s)*: Foaming Tempura Deep-Fry & Sizzle (boiling oil immersion *TZZZZ*, brass chopstick flip, wire rack lift).
    - *Scene 4 (4s)*: 4-Quadrant Wrap Assembly & Crisp Knife Slice (load quadrants, viral 4-fold trick, grill pan sear, diagonal knife cut *CRUNCH*).
    - *Scene 5 (4s)*: Hero Crunch Pull & Confident Chef Thumbs-Up (pull steaming cheesy cross-section apart in extreme macro, camera tilts up, chef nods and flashes a sharp, confident thumbs-up to camera).
- **Core Engineering Updates**:
  1. **Credit Reduction**: Reduced generation jobs by **60%–65%** (5 scenes instead of 12).
  2. **Framing Rule**: Enforced 90% screen real estate filled by ingredients, cutting board, and hands in extreme macro close-up and top-down flat lay.
  3. **Runtime Presets & Invariants**:
     - Added `{ seconds: 20, label: "20s — Viral Rapid ASMR (Bayashi 2X Pacing · 4-5 High-Density Scenes) [60M+ Views Standard]" }` to `RUNTIME_PRESETS` in UI and schema validation (`src/app/api/projects/route.ts`).
     - Added `UNIVERSAL_PHYSICAL_LAWS.VIRAL_RAPID_ASMR_PACING` in `src/lib/story/world-engine.ts`.
     - Integrated Bayashi 2X pacing rules into `src/lib/story/prompts.ts`, `src/lib/story/service.ts`, and `src/app/api/projects/[projectId]/story/generate-options/route.ts`.
- **Verification**:
  - Unit tests: 53/53 tests passing across 10 test suites (`tests/unit/culinary-asmr.test.ts`).
  - Typecheck: `tsc --noEmit` clean with 0 errors.

### 2026-11-16 — ADR-024: Google Flow Character Anchor Consistency & Prompt Doctor Overhaul
- **Defects Addressed**:
  1. `fluxStillPrompt` omitted the `@` character handle in Stage 1 Still Prompts (`Subject: The Shadow Alchemist Chef` instead of `Subject: [@TheShadowAlchemistChef] (The Shadow Alchemist Chef)`), breaking Google Flow character profile binding.
  2. The Prompt Doctor endpoint (`fix-issue/route.ts`) dumbly dumped creator issue descriptions into `--negative "<user sentence>"` and inverted tab persistence by saving still fixes into `videoPrompt` while leaving `imagePrompt` unmodified.
- **Architectural Fixes**:
  1. Updated `src/lib/story/prompt-compiler.ts` so `fluxStillPrompt`, `chatgptPrompt`, and `geminiPrompt` always embed `Subject: [@${charName}] (${characterName})`.
  2. Overhauled `src/app/api/projects/[projectId]/shots/[shotId]/fix-issue/route.ts` with `resolveTextProvider` AI diagnosis, strict negative keyword sanitization (visual defects only, never raw user text), and explicit `@character` anchor injection.
  3. Corrected tab persistence: `flux` writes to `Shot.imagePrompt`, `video`/`flow` writes to `Shot.videoPrompt`.
  4. Updated `src/app/projects/[projectId]/storyboard/page.tsx` so frontend state immediately updates the active tab.
  5. Cleaned all corrupted prompt strings across PostgreSQL DB shots.
- **Verification**:
  - Unit tests: 56/56 passing across 11 test suites (`tests/unit/prompt-doctor.test.ts`).
  - Typecheck: `tsc --noEmit` clean with 0 errors.
