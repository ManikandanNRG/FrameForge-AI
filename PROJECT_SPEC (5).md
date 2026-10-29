# PROJECT_SPEC.md

# AI Filmmaking Studio --- Implementation Specification

**Document ID:** AFS-PROJECT-SPEC\
**Specification version:** 1.2.0\
**Specification status:** LOCKED FOR MVP IMPLEMENTATION\
**SPEC_VERSION:** `1.2.0`\
**SPEC_LOCKED:** `true`\
**Product codename:** FrameForge AI (working name; branding is
configurable)\
**Document audience:** Antigravity IDE, AI coding agents, technical
reviewers, product owner\
**Primary owner:** Product owner\
**Last updated:** 2026-10-15

------------------------------------------------------------------------

## 0. Instructions to Antigravity IDE

### 0.1 Source of truth

This document is the authoritative product and implementation
specification for the MVP. Implement the system described here. Do not
silently remove requirements, replace architectural decisions, invent
provider capabilities, or broaden the MVP.

If a requirement conflicts with another requirement, stop the affected
implementation, document the conflict in `docs/DECISIONS_REQUIRED.md`,
explain the impact, and ask for a decision. Do not resolve material
product or architecture conflicts by guessing.

### 0.2 Required development behavior

1.  Read this document fully before implementation.
2.  Create the repository structure and implementation plan before
    writing feature code.
3.  Maintain `docs/IMPLEMENTATION_STATUS.md`,
    `docs/DECISIONS_REQUIRED.md`, `docs/ARCHITECTURE_DECISIONS.md`, and
    `docs/KNOWN_LIMITATIONS.md`.
4.  Implement business rules and data contracts before building the
    screens that depend on them.
5.  Work in small, testable vertical slices. Each slice must compile,
    pass relevant tests, and have acceptance criteria.
6.  Do not implement every module as a mock and report it complete.
    Clearly label mock providers and simulated outputs.
7.  Never expose provider API keys to the browser.
8.  Never pretend a generation job succeeded if the provider has not
    returned a valid result.
9.  Do not automatically overwrite approved story, character, location,
    prop, image, video, or edit versions.
10. Do not start expensive batch generation without a user-confirmed
    cost estimate and the required approval.
11. Do not assume Google Flow exposes a public API for every UI
    capability. Only integrate APIs that are documented and verified at
    implementation time.
12. Do not use browser automation, undocumented endpoints,
    reverse-engineered private APIs, or credential sharing as a
    substitute for an official integration.
13. Keep a clean separation between provider-independent domain logic
    and vendor-specific adapters.
14. Use database migrations, typed contracts, automated tests,
    structured logs, and reproducible local setup.
15. At the end of each phase, provide a concise report: implemented,
    tested, not implemented, blockers, known limitations, and next
    approved step.

### 0.3 Completion claims

A module is complete only when its acceptance criteria pass and the
behavior is tested. A UI that displays buttons without working backend
behavior is not complete. A provider adapter that returns hard-coded
output is a mock, not a production integration.

### 0.4 Spec locking

The product owner may change this document. Until then, treat the scope
and architecture as frozen. If a change is required, propose a versioned
change with rationale, affected modules, migration impact, cost impact,
and tests. Do not edit `SPEC_VERSION` or `SPEC_LOCKED` automatically.

------------------------------------------------------------------------

## 1. Executive summary

AI Filmmaking Studio is an online web application that manages the production of
films across multiple visual styles from an initial idea through story
development, screenplay, production-bible assets, storyboard, image
generation, video generation, editing, and export.

Today, the user manually coordinates multiple AI tools: a language model
for the story and prompts, an image generator for frames, a video
generator for clips, and a separate editor for assembly. The app reduces
context switching by preserving project data and carrying approved
outputs between stages.

The app is not merely a prompt generator and not merely a video editor.
It is a **production workflow orchestrator** with a persistent creative
project model, approval gates, asset/version management, provider
adapters, background job processing, cost controls, and a basic final
assembly workflow.

### 1.1 Product promise

"Describe the film you want. The studio develops the production plan,
creates visual assets and shots, generates clips, and prepares a
finished video package---with the user approving each major stage."

### 1.2 Target user

Initially, one creator producing original photorealistic cinematic films
for YouTube, usually 5--10 minutes long, using AI-generated footage. The
app is designed for personal productivity first. Multi-user
collaboration, billing, and SaaS tenancy are not MVP requirements.

### 1.3 Core product principles

-   **Approval-first automation:** AI does the drafting and repetitive
    work; the user approves stage transitions.
-   **Continuity by design:** A persistent production bible supplies
    consistent character, costume, location, prop, style, and scene
    constraints.
-   **Shot-level control:** A bad shot can be regenerated without
    restarting the film.
-   **Provider independence:** Creative data and workflow logic are not
    tied to one AI vendor.
-   **Truthful integrations:** The system only offers a provider
    capability if the adapter actually supports it.
-   **Resumability:** Completed work survives browser closure, worker
    restart, and transient provider failure.
-   **Cost transparency:** Users see estimates, caps, and actual usage
    where provider data is available.
-   **Reversible creative decisions:** Approved versions remain
    recoverable.
-   **No hidden destructive changes:** Upstream edits surface downstream
    impacts instead of silently rewriting work.

------------------------------------------------------------------------

## 2. Product scope

### 2.1 In scope for MVP

1.  Create and manage film projects.
2.  Capture a project brief: idea, language, target audience, runtime,
    aspect ratio, visual style preset, custom style notes, content rating, and constraints.
3.  Generate a logline, premise, synopsis, story outline, screenplay,
    and scene breakdown using an LLM provider adapter.
4.  Allow editing, revision, versioning, and approval of story
    artifacts.
5.  Extract a production bible: characters, locations, props, costumes,
    visual style, continuity rules, and relationships.
6.  Generate or import reference images for production-bible assets
    using a configured image provider.
7.  Create a shot list and storyboard with
    camera/framing/action/mood/continuity instructions.
8.  Generate storyboard stills from prompts and approved references.
9.  Review, approve, reject, revise, and regenerate individual shots.
10. Estimate and control generation cost before batch work.
11. Submit video-generation jobs through a supported provider adapter.
12. Track asynchronous jobs, poll or receive provider callbacks where
    supported, retry safely, and preserve job history.
13. Import externally generated video clips when no official provider
    API is available.
14. Preview assets and clips in the browser.
15. Assemble approved clips in a basic timeline/sequence editor.
16. Support clip order, in/out trim, simple transitions, title cards,
    subtitle tracks, voice-over/music/SFX tracks, and basic audio
    levels.
17. Use FFmpeg through the local companion service for deterministic final rendering to the selected local or external-drive destination.
18. Export a playable MP4, plus thumbnail and YouTube metadata draft.
19. Persist project state, media metadata, versions, approvals, job
    records, costs, and audit events.
20. Provide local development instructions, automated tests, migrations,
    seed/demo data, and deployment documentation.

### 2.2 Explicitly out of scope for MVP

-   Full professional nonlinear editor parity with Premiere Pro or
    DaVinci Resolve.
-   Real-time multi-user collaboration, comments, and team permissions.
-   Public SaaS registration, subscriptions, payment processing, or
    tenant billing.
-   Guaranteed one-click fully unattended production with no approvals.
-   Guaranteed photorealistic character consistency; the app can improve
    consistency but cannot guarantee model output.
-   Guaranteed generation of a continuous 5--10 minute video in one
    request. The film is assembled from shorter clips.
-   Direct publishing to YouTube unless a separately approved YouTube
    integration is implemented.
-   A Google Flow clone.
-   Unofficial Google Flow automation or undocumented endpoints.
-   Training or fine-tuning foundation models.
-   Automatic music generation in MVP unless a configured provider and
    rights terms are verified. User-uploaded or separately generated
    licensed audio is supported.
-   Automatic voice cloning of real people.
-   Automated copyright clearance or legal advice.
-   Mobile-native apps. MVP is a responsive web application.
-   Advanced VFX, rotoscoping, compositing, motion graphics, keyframe
    animation, and multi-camera editing.
-   Automatic guarantee of YouTube monetization or revenue.

### 2.3 MVP success definition

A user can create a project, approve a screenplay, approve
production-bible assets, approve a storyboard, generate/import clips,
assemble a sequence, render an MP4, and retrieve the final package
without manually moving project text between internal app stages.

Where a provider has no supported API, the user can still use the
workflow by exporting a prompt/reference package and importing the
resulting file. The application must visibly distinguish manual handoff
from automated generation.

------------------------------------------------------------------------

## 3. User workflows and lifecycle

### 3.1 Primary end-to-end workflow

1.  User creates a project.
2.  User enters idea and project settings.
3.  AI generates a story package.
4.  User edits and approves the story package.
5.  AI extracts production-bible entities from the approved story.
6.  User reviews character/location/prop descriptions and generates
    reference images.
7.  User approves the production bible and selected references.
8.  AI breaks the screenplay into scenes and shots.
9.  User reviews the shot list and approves the storyboard plan.
10. AI generates storyboard stills from shot prompts and selected
    references.
11. User reviews each still; rejected stills can be revised or
    regenerated.
12. User requests a cost estimate for video generation.
13. User confirms the estimate and batch scope.
14. The job queue generates clips for approved shots using the
    configured provider.
15. User reviews clips, selects versions, and regenerates failures or
    unsuitable results.
16. User arranges approved clips in the timeline, adds
    audio/text/transitions, and previews the cut.
17. User requests export; the backend validates the timeline and renders
    with FFmpeg.
18. User saves the MP4, thumbnail, captions if available, and metadata draft to the selected local or external-drive destination; optional remote copies require explicit opt-in.

Every stage must be resumable. The project dashboard indicates the
current stage and outstanding actions.

### 3.2 Approval gates

Approval gates are mandatory for: - Story package before
production-bible extraction. - Production bible before storyboard
generation. - Shot plan before bulk still generation. - Cost estimate
before paid video-generation batch. - Final timeline before rendering.

A user may explicitly skip a gate only if a future setting is introduced
and approved as a product change. No hidden auto-approval is allowed in
MVP.

### 3.3 Revisions and dependency changes

If a user edits an upstream artifact after downstream artifacts exist: -
Preserve the previous version. - Mark dependent artifacts as
`POTENTIALLY_STALE`. - Show the dependency reason and affected items. -
Let the user decide whether to regenerate affected items. - Never
automatically discard approved downstream assets. - A change to a
character's approved reference does not silently replace all shot
references.

### 3.4 Shot-level workflow

Each shot contains: - Shot number and scene membership. - Purpose in the
story. - Screenplay excerpt/action. - Duration target. - Shot
size/framing. - Camera angle and movement. - Subject blocking and screen
direction. - Character and asset references. - Location, time of day,
weather, lighting, mood, and color palette. - Start-frame image
prompt. - Video prompt. - Negative constraints and continuity
constraints. - Aspect ratio. - Provider/model configuration snapshot. -
Still versions and video versions. - Approval state and regeneration
history.

A failed or rejected shot can be retried independently. Batch retry must
exclude already-approved clips unless the user explicitly selects them.

### 3.5 Manual provider handoff workflow

If a service is only available through its official web UI: 1. Generate
a provider-neutral prompt package. 2. Include reference assets, prompt
text, aspect ratio, duration target, and required settings. 3. Let the
user download/copy the package. 4. User generates externally. 5. User
uploads the resulting file to the intended shot. 6. Validate file type,
size, duration, and media integrity. 7. Link the imported clip to the
shot and retain the prompt/package version used. 8. Mark the clip's
provenance as `MANUAL_IMPORT`.

Do not represent this as API automation.

------------------------------------------------------------------------

## 4. Functional requirements

Priority definitions: **P0** = required for MVP; **P1** = desirable if
stable; **P2** = post-MVP.

### 4.1 Project management

-   **FR-PROJ-001 (P0):** Create a project with title, optional
    description, language, runtime target, aspect ratio, visual style,
    and content rating.
-   **FR-PROJ-002 (P0):** List, search, open, archive, and delete
    projects. Deletion requires confirmation and follows retention
    rules.
-   **FR-PROJ-003 (P0):** Display current production stage, approved
    stages, outstanding approvals, failed jobs, and estimated/actual
    cost.
-   **FR-PROJ-004 (P0):** Save drafts automatically with visible
    save/error status.
-   **FR-PROJ-005 (P0):** Resume a project after logout, browser
    closure, or worker restart.
-   **FR-PROJ-006 (P0):** Store all project artifacts and media
    references under a project ID.
-   **FR-PROJ-007 (P1):** Duplicate a project without copying secrets or active job state.
-   **FR-PROJ-008 (P0):** Allow the user to choose a visual style preset for each project.
-   **FR-PROJ-009 (P0):** Keep style rules consistent across story, production bible, storyboard, image prompts, and video prompts.

### 4.2 Project brief

-   **FR-BRIEF-001 (P0):** Capture the user's original idea as
    unmodified source text.
-   **FR-BRIEF-002 (P0):** Capture language for dialogue/narration and
    language for UI metadata separately.
-   **FR-BRIEF-003 (P0):** Capture target runtime (default 5--10
    minutes), aspect ratio (default 16:9), target audience, genre, tone,
    realism level, and content constraints.
-   **FR-BRIEF-004 (P0):** Capture desired dialogue policy: dialogue,
    voice-over, or no dialogue.
-   **FR-BRIEF-005 (P0):** Capture user-provided references and their
    usage rights/notes.
-   **FR-BRIEF-006 (P0):** Allow brief revision and versioning.

### 4.3 Story development

-   **FR-STORY-001 (P0):** Generate logline, premise, synopsis,
    act/sequence outline, character arcs, ending, and screenplay.
-   **FR-STORY-002 (P0):** Generate a scene list with IDs, scene
    headings, location/time, characters, objective, conflict, action,
    and estimated duration.
-   **FR-STORY-003 (P0):** Support regeneration of selected sections
    without replacing unrelated approved sections.
-   **FR-STORY-004 (P0):** Provide screenplay editor with explicit save
    and version history.
-   **FR-STORY-005 (P0):** Require user approval before production-bible
    extraction.
-   **FR-STORY-006 (P0):** Store model/provider/prompt-template version
    and generation parameters for each AI artifact.
-   **FR-STORY-007 (P0):** Validate structured AI output against
    schemas; reject malformed output and use bounded repair attempts.
-   **FR-STORY-008 (P1):** Provide a screenplay coverage summary:
    pacing, unclear motivation, continuity risks, and approximate
    runtime. It is advisory, not authoritative.

### 4.4 Production bible

-   **FR-BIBLE-001 (P0):** Extract characters, locations, props,
    costumes, vehicles, and visual-style rules from the approved
    screenplay.
-   **FR-BIBLE-002 (P0):** Every entity has a stable ID, name,
    description, attributes, source references, versions, and approval
    state.
-   **FR-BIBLE-003 (P0):** Character attributes include approximate age
    range, appearance, build, hair, wardrobe, distinguishing traits,
    emotional baseline, and prohibited changes.
-   **FR-BIBLE-004 (P0):** Location attributes include geography/layout,
    architecture, lighting, weather, time-of-day variants, and spatial
    anchors.
-   **FR-BIBLE-005 (P0):** Prop attributes include shape, material,
    color, state, owner/holder, and continuity details.
-   **FR-BIBLE-006 (P0):** Generate image prompts for each visual asset
    and generate reference images through an image-provider adapter or
    accept uploads.
-   **FR-BIBLE-007 (P0):** User can select a canonical reference image
    per asset/version.
-   **FR-BIBLE-008 (P0):** Approve production bible before storyboard
    generation.
-   **FR-BIBLE-009 (P0):** Allow multiple reference views for a
    character or location, but identify which is canonical.
-   **FR-BIBLE-010 (P0):** Preserve approved asset versions and show
    which shots use each version.

### 4.5 Storyboard and shot planning

-   **FR-SHOT-001 (P0):** Split scenes into shots based on action,
    dramatic beats, camera setup, and target runtime.
-   **FR-SHOT-002 (P0):** Let the user edit shot order, duration,
    description, framing, movement, and reference links.
-   **FR-SHOT-003 (P0):** Generate a storyboard image for each shot.
-   **FR-SHOT-004 (P0):** Maintain shot-specific image and video prompts
    as editable text.
-   **FR-SHOT-005 (P0):** Use approved asset references and continuity
    notes in prompt assembly.
-   **FR-SHOT-006 (P0):** Provide approve/reject/revise/regenerate
    actions for each still.
-   **FR-SHOT-007 (P0):** Approve the shot plan before bulk still
    generation; permit individual edits afterward.
-   **FR-SHOT-008 (P0):** Maintain prompt, image, and model versions.
-   **FR-SHOT-009 (P0):** Preserve screen direction and spatial
    constraints as explicit structured fields when provided.
-   **FR-SHOT-010 (P1):** Provide a contact-sheet view of storyboard
    images.

### 4.6 Video generation

-   **FR-VIDEO-001 (P0):** Generate a video prompt from an approved shot
    and selected references.
-   **FR-VIDEO-002 (P0):** Display provider-supported duration, aspect
    ratio, reference-image, audio, and resolution options dynamically
    from adapter capabilities.
-   **FR-VIDEO-003 (P0):** Never display a control as supported if the
    active adapter does not support it.
-   **FR-VIDEO-004 (P0):** Estimate cost before a batch and require
    explicit confirmation.
-   **FR-VIDEO-005 (P0):** Submit jobs through asynchronous background
    workers.
-   **FR-VIDEO-006 (P0):** Poll provider status or accept authenticated
    callbacks where supported.
-   **FR-VIDEO-007 (P0):** Store provider job IDs, state, timestamps,
    error codes, usage/cost data, and output asset IDs.
-   **FR-VIDEO-008 (P0):** Retry only transient failures with bounded
    exponential backoff and jitter.
-   **FR-VIDEO-009 (P0):** Use idempotency keys where supported;
    otherwise guard duplicate submissions with internal job state and
    reconciliation.
-   **FR-VIDEO-010 (P0):** Let the user cancel pending jobs when the
    provider supports cancellation; explain when cancellation cannot
    stop provider-side billing.
-   **FR-VIDEO-011 (P0):** Import manually generated video into a
    selected shot.
-   **FR-VIDEO-012 (P0):** Allow multiple versions per shot and let the
    user select the approved version.
-   **FR-VIDEO-013 (P0):** Validate output file and create a
    preview/thumbnail.
-   **FR-VIDEO-014 (P0):** Never automatically mark a generated clip
    approved.
-   **FR-VIDEO-015 (P1):** Support optional clip-quality checklist and AI critique, with human review remaining authoritative.
-   **FR-VIDEO-016 (P0):** Allow users to choose a video provider/model from currently verified compatible options.
-   **FR-VIDEO-017 (P0):** Allow provider fallback according to the configured mode and only for eligible errors.

### 4.7 Editing and export

-   **FR-EDIT-001 (P0):** Create an edit sequence containing ordered
    clip items and track items.
-   **FR-EDIT-002 (P0):** Support clip in/out trim, reorder, split, and
    delete from the sequence without deleting the underlying source
    asset.
-   **FR-EDIT-003 (P0):** Support simple hard cuts and basic
    crossfade/dissolve transitions.
-   **FR-EDIT-004 (P0):** Support title cards and basic text overlays.
-   **FR-EDIT-005 (P0):** Support imported audio tracks for music,
    narration, and sound effects.
-   **FR-EDIT-006 (P0):** Support per-track volume and simple fade
    in/out.
-   **FR-EDIT-007 (P0):** Support subtitles/captions via imported
    SRT/VTT and basic manual editing.
-   **FR-EDIT-008 (P0):** Provide low-resolution preview or proxy
    playback where feasible.
-   **FR-EDIT-009 (P0):** Validate missing media, invalid trim ranges,
    timeline gaps, unsupported codecs, and audio configuration before
    rendering.
-   **FR-EDIT-010 (P0):** Render final video asynchronously using
    FFmpeg.
-   **FR-EDIT-011 (P0):** Default export is H.264 MP4 with AAC audio,
    16:9 at 1080p where source/output constraints permit.
-   **FR-EDIT-012 (P0):** Preserve project timeline and render settings
    as a versioned export snapshot.
-   **FR-EDIT-013 (P0):** Provide export progress, failure reason,
    retry, and download.
-   **FR-EDIT-014 (P0):** Generate a thumbnail image or allow
    upload/select of a frame.
-   **FR-EDIT-015 (P0):** Generate title, description, chapter
    suggestions, and tags as editable metadata draft; do not publish
    automatically.
-   **FR-EDIT-016 (P1):** Support 9:16 vertical export and 1:1 square
    export.
-   **FR-EDIT-017 (P1):** Support automated speech-to-text subtitles
    through a verified provider.

### 4.8 Cost management

-   **FR-COST-001 (P0):** Store estimated and actual cost/usage for
    every provider job where available.
-   **FR-COST-002 (P0):** Show estimated batch cost before confirmation.
-   **FR-COST-003 (P0):** Allow project-level and batch-level spending
    limits.
-   **FR-COST-004 (P0):** Block a new paid batch if its estimated cost
    exceeds the remaining approved budget, unless the user explicitly
    raises the limit.
-   **FR-COST-005 (P0):** Clearly mark estimates as estimates and show
    when actual provider pricing/usage is unavailable.
-   **FR-COST-006 (P0):** Never claim that cancelling an internal job
    refunds provider usage.
-   **FR-COST-007 (P0):** Log cost-limit overrides with user action and
    timestamp.
-   **FR-COST-008 (P1):** Provide cost per scene, shot, and completed minute based on available data.
-   **FR-COST-009 (P0):** Keep separate cost/budget settings for each connected provider and make fallback cost differences visible.

### 4.9 Project and media management

- **FR-MEDIA-001 (P0):** Store primary media binaries on a user-selected local computer or external-drive folder through the local companion service. Store metadata and a provider-neutral storage reference in PostgreSQL, not large binary payloads.
- **FR-MEDIA-002 (P0):** Validate uploads by MIME sniffing, file signature, size, and supported media parser before accepting them.
- **FR-MEDIA-003 (P0):** Generate thumbnails/proxies locally where supported; sync small preview derivatives to the online app only when required for remote browsing.
- **FR-MEDIA-004 (P0):** Record provenance: generated by provider, user upload, external import, or derived by FFmpeg.
- **FR-MEDIA-005 (P0):** Keep original and derived assets distinct and never overwrite approved originals.
- **FR-MEDIA-006 (P0):** Use authenticated companion-mediated file access for local assets. If optional cloud storage is enabled, use short-lived signed URLs for private remote objects.
- **FR-MEDIA-007 (P0):** Prevent one project from accessing another project's media, and prevent the companion from accessing folders outside explicitly configured roots.
- **FR-MEDIA-008 (P1):** Support project-level media archive/export manifests and optional remote backup.
- **FR-MEDIA-009 (P0):** Show local media availability states: online, companion offline, drive disconnected, missing, transfer pending, and checksum mismatch.
- **FR-MEDIA-010 (P0):** Support resumable transfers where feasible; verify completed transfers with SHA-256 checksums.
- **FR-MEDIA-011 (P0):** Never imply that local media is accessible from another device while the source computer is offline unless a separate remote copy exists.
- **FR-MEDIA-012 (P1):** Allow an explicit user choice to keep small previews or selected deliverables in optional S3-compatible object storage. Do not upload all primary media by default.

### 4.10 Local companion and remote access

- **FR-COMP-001 (P0):** Pair a local companion to the authenticated account using a one-time, expiring pairing code.
- **FR-COMP-002 (P0):** Display companion connection, version, last-seen time, selected storage roots, drive availability and free space.
- **FR-COMP-003 (P0):** Allow the user to register/rename/revoke storage roots and restrict file operations to those roots.
- **FR-COMP-004 (P0):** Report local media availability and transfer/render progress to the online app.
- **FR-COMP-005 (P0):** Support secure, resumable transfer of generated provider outputs to local storage where provider terms and file availability permit.
- **FR-COMP-006 (P0):** Verify transferred/generated files with size and SHA-256 checksum before marking them available.
- **FR-COMP-007 (P0):** Execute FFmpeg/FFprobe using validated argument lists and report structured progress/errors.
- **FR-COMP-008 (P0):** Never expose an unauthenticated local control endpoint or require router port forwarding.
- **FR-COMP-009 (P0):** Continue allowing online story/project metadata work while the companion is offline; clearly disable operations that require local media.
- **FR-COMP-010 (P0):** Allow the user to revoke a companion device and invalidate its credentials.
- **FR-COMP-011 (P0):** Require explicit confirmation before deleting any local file and distinguish deleting a media reference from deleting the file itself.
- **FR-COMP-012 (P1):** Support a manifest export that records project-relative media paths, checksums, formats and version metadata for recovery/migration.


------------------------------------------------------------------------

## 5. User interface and page requirements

### 5.1 Global application shell

-   Responsive desktop-first layout.
-   Left navigation: Projects, current project sections, Asset Library,
    Settings.
-   Main workspace with breadcrumbs and project title.
-   Persistent job/activity indicator.
-   Visible save status, error banners, and provider status.
-   No destructive action without confirmation.
-   Keyboard accessibility for core controls.
-   Loading, empty, success, partial-success, and failure states for
    every asynchronous view.

### 5.2 Page inventory

#### P-01: Projects dashboard

Purpose: list projects and start/resume production. Required elements:
project cards/list, current stage, progress summary, estimated/actual
cost, last updated, failed-job indicator, create project action,
search/filter, archive/delete actions.

#### P-02: Create project / brief

Purpose: capture initial idea and constraints. Required fields: project
title, idea, story language, dialogue mode, target runtime, aspect
ratio, genre, tone, audience, visual style, content constraints, budget
cap. Optional reference uploads.

#### P-03: Story Studio

Purpose: review generated story artifacts. Tabs: logline/premise,
synopsis, outline, screenplay, scenes. Actions: edit, regenerate
selected section, compare versions, approve story package. Show
generated-at metadata and model/prompt-template version.

#### P-04: Production Bible

Purpose: manage characters, locations, props, costumes, vehicles, and
visual style. Layout: entity list + detail panel + reference gallery.
Actions: edit description, generate prompt, generate/import reference,
select canonical reference, approve entity, approve bible. Show
downstream dependencies.

#### P-05: Storyboard

Purpose: review shot plan and generated stills. Views: scene list, shot
cards, contact sheet. Each shot card shows shot ID, scene, duration,
thumbnail, prompt status, approval state, continuity notes, and
generation actions. Actions: reorder, edit prompt, regenerate still,
approve/reject, open detail.

#### P-06: Shot detail

Purpose: precise control over one shot. Fields: action, camera, framing,
motion, subject blocking, screen direction, location/time, references,
image prompt, video prompt, negative constraints, aspect ratio, duration
target. Panels: still versions, video versions, generation history, cost
history, dependencies. Actions: regenerate, approve selected version,
export prompt package, import external result.

#### P-07: Video generation queue

Purpose: monitor asynchronous production. Show
queued/running/waiting/retrying/succeeded/failed/cancelled states,
provider job ID where safe, progress if provided, elapsed time,
estimated cost, retry count, error summary, and result. Actions: pause
unsent jobs, cancel where supported, retry eligible failures, open shot.

#### P-08: Edit Studio

Purpose: assemble approved media. MVP layout: preview player,
sequence/timeline, media bin, properties panel. Timeline must support
ordered video clips, basic transitions, title overlays, audio tracks,
trimming, and snapping. Show invalid/missing media and render warnings.
Do not advertise advanced editing controls that are not implemented.

#### P-09: Export

Purpose: configure and render the final film through the local companion to the selected local/external-drive destination. Fields: export name,
resolution, aspect ratio, frame rate, codec/preset, audio settings,
captions, thumbnail. Show validation checklist, estimated render time if
available, job state, progress, retry, and download links.

#### P-10: Settings and providers

Purpose: configure provider credentials and defaults. Provider
credentials are entered securely and stored server-side encrypted. UI
only displays masked values and connection/test status. Show supported
capabilities and configuration status per provider. Never expose secrets
in logs or API responses.

#### P-11: Cost and activity

Purpose: review estimated/actual usage and job history. Filters:
project, date, provider, job type, status. Show cost breakdown and
whether values are estimated or actual.

### 5.3 Design principles

-   Cinematic, professional, dark-first interface is acceptable, but
    accessibility contrast is mandatory.
-   Prioritize storyboard and asset continuity over decorative dashboard
    elements.
-   Make approval status unmistakable.
-   Never use color alone to communicate state.
-   Show AI-generated drafts as drafts until approved.
-   Preserve user-entered text and selected assets during errors.
-   Do not trigger paid generation from a single accidental click; use
    explicit confirmation for batches.

------------------------------------------------------------------------

## 6. Technical architecture

### 6.1 Architecture decision

Use the agreed stack: Next.js + TypeScript + Tailwind CSS for the online web application; Node.js + Express + TypeScript for the dedicated API; PostgreSQL for persistent application data; Redis + BullMQ for durable background job orchestration; provider adapters for AI services; FFmpeg/FFprobe for media assembly; standard authentication; and a small local companion service for local/external-drive media operations and rendering.

The website and API are hosted online and accessible from anywhere. The primary full-resolution media library lives on the user's computer or external drive. The local companion is the secure bridge between those two environments. S3-compatible object storage is optional, not the primary media store.

Do not replace this agreed stack with a different architecture without the product owner's explicit approval.

### 6.2 Locked MVP stack

| Need | Chosen technology | Responsibility and justification |
|---|---|---|
| Web UI | Next.js + TypeScript + Tailwind CSS | Responsive online application, story editor, storyboard, asset browser, timeline and settings. |
| Dedicated backend API | Node.js + Express + TypeScript | Project rules, API contracts, provider integration, approval workflow, access control and coordination with the local companion. |
| Database | PostgreSQL | Projects, story artifacts, versions, approvals, media metadata/references, provider settings, job history, costs and audit events. |
| Background jobs | Redis + BullMQ | Durable queues, concurrency limits, retries and scheduling for long-running AI generation and reconciliation. PostgreSQL remains the durable domain record. |
| AI integrations | Provider adapters using official APIs/SDKs | Multiple compatible providers/models can be configured per task without coupling project data to one vendor. |
| Media processing | FFmpeg + FFprobe | Deterministic trim, join, transition, audio mix, subtitle, thumbnail, validation and final MP4 export. Runs locally through the companion by default. |
| Primary media storage | Local computer / external drive | User-controlled full-resolution media, working files and final exports. |
| Optional remote storage | S3-compatible object storage | Optional small previews, selected deliverables, temporary transfer or user-enabled backup only. |
| Authentication | Auth.js or another standard, maintained authentication solution | Protect online access and user/project ownership. The selected implementation must be documented before coding. |
| Local media bridge | Small companion service | Authenticated outbound connection to the online API; local file operations, media transfer, drive checks and FFmpeg execution. |
| Validation | Zod or equivalent TypeScript schema validation | Validate API inputs, environment variables and structured AI responses. |
| Testing | Vitest plus Playwright or equivalent | Unit/contract tests and key browser workflows. |

### 6.3 Deployment topology

- **Online frontend:** hosted HTTPS website.
- **Online API:** Node.js/Express service, private configuration and server-side provider credentials.
- **Online data services:** PostgreSQL and Redis, with managed hosting acceptable.
- **Online worker:** BullMQ worker process for AI jobs, provider polling, retries, cost reconciliation and status updates. Keep it in the same repository unless a documented operational reason requires a separate repository.
- **Local companion:** installed/running on the user's computer; pairs with the account using a one-time pairing code or equivalent short-lived credential, then maintains an outbound authenticated connection. Do not require public inbound ports or expose an unauthenticated local server.
- **Local media root:** user explicitly selects one or more allowed folders, such as a project media folder on an external drive. The companion may access only these roots.
- **Optional object storage:** disabled by default for primary media. Any remote upload must be explicit and visible to the user.

### 6.4 Suggested repository layout

```text
/
  apps/
    web/                       # Next.js + TypeScript + Tailwind UI
    api/                       # Node.js + Express + TypeScript API
    worker/                    # BullMQ worker; shares domain/provider packages
    companion/                 # Local media bridge and FFmpeg runner
  packages/
    domain/                    # Provider-independent business rules
    contracts/                 # Shared API/job/media schemas
    providers/                 # Text, image, video, audio adapters
    prompts/                   # Versioned prompt templates and composition
    media/                     # Media inspection, checksums, FFmpeg planning
  database/
    migrations/
    seeds/
  docs/
    IMPLEMENTATION_STATUS.md
    DECISIONS_REQUIRED.md
    ARCHITECTURE_DECISIONS.md
    KNOWN_LIMITATIONS.md
    PROVIDER_CAPABILITY_MATRIX.md
    RUNBOOK.md
    LOCAL_COMPANION.md
  tests/
    unit/
    integration/
    e2e/
  .env.example
  README.md
  PROJECT_SPEC.md
```

Antigravity may propose a monorepo tool only if necessary; do not add a framework/tool just for fashion. Keep package boundaries clear and the initial setup straightforward.

### 6.5 Application boundaries

- Web UI never calls paid AI provider APIs directly.
- Express route handlers validate input and delegate to application/domain services.
- Domain rules do not import vendor SDKs.
- Provider-specific code lives behind typed interfaces.
- BullMQ workers handle long-running provider tasks and status reconciliation.
- The local companion accepts only authenticated, authorized commands scoped to paired user/project and configured media roots.
- PostgreSQL stores canonical project, approval, job and media-reference records.
- Local filesystem is authoritative for primary media bytes. Optional remote object storage is authoritative only for objects explicitly stored there.
- Provider responses, remote URLs, callback payloads, filenames and paths are untrusted input and must be validated.
- All timestamps are UTC; monetary values use integer minor units or exact decimal types.
- Every job and request carries a correlation ID. Secrets and signed URLs are never logged.
- Use transactions for state transitions and budget reservations; never hold database transactions open during network calls or rendering.

### 6.6 Local companion security and lifecycle

1. Pair the companion through a short-lived one-time code initiated from the authenticated website.
2. Store a revocable device credential securely on the local machine; never expose provider API keys to the companion unless a specific documented feature requires it.
3. Use outbound TLS connections; avoid public inbound ports, router port forwarding, and unauthenticated local endpoints.
4. Scope file access to user-approved roots and reject path traversal, symlink escapes and arbitrary absolute paths.
5. Use allowlisted commands and argument arrays for FFmpeg; never concatenate untrusted text into shell commands.
6. Display companion version, connection status, selected storage roots, free disk space and last-seen time.
7. If the companion is offline, keep online project metadata accessible but mark local media operations unavailable. Queue only operations that can safely wait.
8. Support revoking a paired device from account settings.
9. Do not silently delete local files. Deletion requires explicit confirmation and must explain whether only the database reference or the actual file will be deleted.
10. Provide signed releases or a documented integrity-verification process for companion updates before public distribution.

### 6.6.1 Companion protocol and API contracts

The online API issues short-lived pairing codes and scoped device credentials. The companion authenticates outbound to the online API and periodically sends a heartbeat containing device ID, companion version, storage-root IDs, free space, active job IDs and health status. It must not send a complete file listing unless the user initiates an import/scan.

Minimum companion operations:

- `pair`: exchange a one-time code for a revocable device credential.
- `heartbeat`: report online status and capabilities.
- `register-root` / `remove-root`: manage explicitly approved local storage roots.
- `inspect-media`: return safe metadata, checksum and availability for a referenced file.
- `transfer-download`: receive an authorized media-transfer job and write to a safe project-relative destination.
- `transfer-upload`: transfer a user-selected local asset to a provider or optional remote storage only when explicitly requested.
- `render-export`: receive a versioned render plan referencing authorized media IDs, run FFmpeg, validate output, and report progress.
- `cancel-job`: cancel a local operation when safe; cancellation does not imply rollback of already written files or provider charges.

Every operation must be idempotent where practical, scoped to a paired device and authorized project, validated against a shared schema, and logged without secrets. Never accept an arbitrary command string, arbitrary output path or arbitrary URL from the online server. Resolve media IDs to registered roots inside the companion.

### 6.7 Architectural rules

1. Never move primary media to cloud storage without explicit user action.
2. Never claim local media is available remotely if the companion or source drive is offline.
3. Every provider capability is backed by a verified official API or visibly labelled manual handoff.
4. Keep the local companion and online backend independently restartable.
5. Treat PostgreSQL as canonical for project workflow and job history; Redis is a queue, not the only record.
6. Persist checksums and file metadata for media stored locally.
7. Preserve approved versions and make upstream changes visibly mark downstream artifacts potentially stale.
8. All API endpoints enforce authenticated user/project ownership.
9. Use migrations, typed contracts, structured logs, tests and documented recovery procedures.


------------------------------------------------------------------------

## 7. Multi-provider AI strategy

### 7.1 Core requirement: never depend on one AI provider

The app must not be Gemini-only. The user must be able to connect their own API keys, choose models per task, and change providers when a provider's credits, quota, account access, or service availability becomes a problem.

A provider and a model are different:
- **Provider:** company/platform and credential, such as OpenAI or Google.
- **Model:** specific model available through that provider.
- **Capability:** task a model can actually perform, such as story writing, image generation, image editing, or video generation.

Do not assume that every model supports every capability. Show only capabilities verified for the selected provider/model.

### 7.2 Provider support targets

The architecture must support at least the following providers/platforms over the product lifecycle. The MVP should implement a minimum of four usable provider options across supported tasks, prioritizing the user's most important workflow. These are integration targets, not a claim that every provider supports every modality.

| Provider/platform target | Intended uses | Implementation note |
|---|---|---|
| OpenAI API | Story/script generation; image generation/editing | Image generation must use the official API, not automate the ChatGPT website |
| Google Gemini API | Story/script generation; image generation; Veo video generation where account access allows | Do not assume Flow's full UI has a public API |
| Anthropic Claude API | Story/script development, screenplay critique, structured planning where supported | Not an image/video generator; use for text tasks |
| OpenRouter | Access to multiple supported text models through one API and key | Treat each routed model as a distinct selectable model; verify structured output and provider policies per model |
| Stability AI | Image generation where supported by the selected current API | Capability and model availability must be verified at implementation time |
| Replicate | Access to compatible image/video models hosted on the platform | Model availability, input schema, pricing, rights, and latency vary by model |
| Additional adapters | Add later without changing domain logic | Examples may include other official image/video APIs that meet the capability contract |

The minimum does not mean every provider must be integrated on day one. The code must be designed for them, and the first release must include more than one independent provider for important tasks where feasible. Before marking an adapter live, verify current official documentation, account access, supported regions, rate limits, pricing, and terms.

### 7.2.1 Important billing distinction for OpenAI

The ChatGPT subscription and OpenAI API billing are separate products. Having ChatGPT Go/Plus/Pro does not automatically provide API credits for this application. To use OpenAI image generation from the app, the user must configure an OpenAI API key and separately enable API billing as required. See the official OpenAI Help Center: https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform.

The app must not ask for a ChatGPT website password or attempt to use a consumer ChatGPT session as an API. Only use the official API with a user-provided API key. Show a clear setup message when OpenAI API credentials or billing are unavailable.

### 7.3 Provider and model settings

The Settings page must let the user:
- Add, test, enable, disable, update, and remove provider API credentials.
- Add multiple providers, including multiple model options from the same provider.
- Select a default model separately for story writing, screenplay review, production-bible extraction, image generation, image editing, video generation, and optional speech tasks.
- Choose a fallback order for each task.
- Set per-provider and per-project spending limits.
- View connection status, last test time, quota/rate-limit errors, supported capabilities, and a link to official documentation.
- See the model/provider that was used for each generated artifact.
- Change the default provider without losing any existing project content.

Credentials must be stored server-side and encrypted. The UI shows only masked credentials, never raw keys after saving.

### 7.4 Fallback and failover behavior

Fallback is controlled by the user. Provide three modes:
1. **Manual only (default):** tell the user when a provider fails and let them choose another model.
2. **Ask before fallback:** recommend the next compatible provider and display the estimated cost before switching.
3. **Automatic for eligible errors (opt-in):** switch to the next configured compatible provider only for known retryable conditions, such as quota exhausted, rate limited after retry policy, or temporary service unavailability.

Rules:
- Never switch to a provider that lacks the required capability.
- Never assume a fallback model will produce identical output or preserve the exact prompt schema.
- Show the provider/model switch and allow the user to review the result.
- For a paid image/video request, show or revalidate cost before fallback if the new provider's price differs or is unknown.
- Do not automatically duplicate a request after an ambiguous timeout. Reconcile the original provider job first.
- Do not retry permanent errors such as invalid API key, access denied, invalid input, or content-policy rejection without user action.
- A provider's exhausted credits may not be detectable through an API. Handle quota/credit errors when returned, and provide a manual switch control regardless.
- Preserve the original failed job, error, prompt snapshot, and provider response metadata (redacted).

### 7.5 Capability registry

Every adapter exposes a capability registry, including:
- Task types supported.
- Model IDs and display names.
- Text/context limits where applicable.
- Structured-output support.
- Image input/reference support.
- Image dimensions, formats, and editing support.
- Video input/reference support, durations, aspect ratios, resolution, and audio support.
- Async job/polling/webhook support.
- Rate limits and concurrency guidance where documented.
- Pricing source, pricing verification date, and whether cost estimation is exact, approximate, or unavailable.
- Status: `VERIFIED`, `UNVERIFIED`, `DISABLED`, or `MANUAL_HANDOFF`.

Do not hard-code one provider's capability assumptions into the general UI.

### 7.6 Provider interfaces

Use small task-specific interfaces rather than one giant interface that assumes every provider can do everything.

```ts
export interface TextGenerationProvider {
  id: string;
  listModels(): Promise<ModelDescriptor[]>;
  getCapabilities(modelId: string): Promise<TextCapabilities>;
  generateStructured<T>(input: StructuredTextInput<T>): Promise<GenerationResult<T>>;
}

export interface ImageGenerationProvider {
  id: string;
  listModels(): Promise<ModelDescriptor[]>;
  getCapabilities(modelId: string): Promise<ImageCapabilities>;
  estimateCost(input: ImageInput): Promise<CostEstimate>;
  generate(input: ImageInput): Promise<ProviderJobReference>;
  getJob(jobId: string): Promise<ProviderJobStatus>;
  fetchResults(jobId: string): Promise<ProviderMediaResult[]>;
}

export interface VideoGenerationProvider {
  id: string;
  listModels(): Promise<ModelDescriptor[]>;
  getCapabilities(modelId: string): Promise<VideoCapabilities>;
  estimateCost(input: VideoInput): Promise<CostEstimate>;
  submit(input: VideoInput): Promise<ProviderJobReference>;
  getJob(jobId: string): Promise<ProviderJobStatus>;
  fetchResults(jobId: string): Promise<ProviderMediaResult[]>;
  cancel?(jobId: string): Promise<CancelResult>;
}
```

Provider-specific differences stay inside adapters. The application uses normalized results and errors.

### 7.7 Provider error model

Normalize:
- `AUTHENTICATION_FAILED`
- `PERMISSION_DENIED`
- `QUOTA_EXCEEDED`
- `CREDIT_EXHAUSTED`
- `RATE_LIMITED`
- `INVALID_REQUEST`
- `UNSUPPORTED_CAPABILITY`
- `CONTENT_POLICY_REJECTED`
- `PROVIDER_UNAVAILABLE`
- `PROVIDER_TIMEOUT`
- `OUTPUT_UNAVAILABLE`
- `OUTPUT_VALIDATION_FAILED`
- `UNKNOWN_PROVIDER_ERROR`

Store sanitized code/message, retryability, provider request ID, and timestamp. Never show raw stack traces or credentials to users.

### 7.8 Visual style presets

Every project must have a selectable visual style preset. Style is independent of the AI provider and must be included consistently in story-to-shot prompt composition.

Built-in presets:
- Photorealistic cinematic
- Live-action commercial / advertisement
- Documentary realism
- 2D cartoon
- 3D animated film
- Anime
- Stop-motion
- Claymation
- Comic-book / graphic novel
- Watercolor illustration
- Painterly storybook
- Pixel art
- Paper-cutout animation
- Fantasy concept art
- Vintage film / retro
- Product showcase
- Custom style

Each style profile contains:
- Stable style ID and user-facing name.
- Description and visual rules.
- Character design rules.
- Materials, textures, lighting, color palette, and camera language.
- Motion/animation guidance.
- Things to avoid.
- Prompt-template version.
- Optional user-supplied reference images.
- Whether a provider/model has been tested with this style.

The user may change style per project or, when intentionally requested, per scene. A per-scene style change must show a continuity warning and must not silently change existing approved assets.

### 7.9 Prompt composition

Prompt assembly order:
1. Project style profile.
2. Approved character/location/prop references and descriptions.
3. Scene context.
4. Shot action and staging.
5. Camera/framing/movement.
6. Lighting, weather, palette, and emotional tone.
7. Continuity constraints and screen direction.
8. Negative constraints.
9. Provider-specific adaptation, only where required.

Keep provider-neutral prompts as the canonical version. Store the final provider-specific prompt sent to the API separately, so users can compare and revise it. Include only relevant references and respect provider input limits.

### 7.10 Official integrations only

Do not assume Google Flow's Storyboard Studio UI has a public API. Use documented Gemini/Veo API capabilities when the user's account and region support them. If a feature is only available through Flow's website, provide manual prompt/reference export and clip import. Do not use undocumented endpoints, private APIs, or browser automation to fake an integration.

## 8. Database model

Use UUID primary keys. Use UTC timestamps. Use soft deletion for
projects where practical. Apply foreign keys and indexes. Store media
bytes outside PostgreSQL.

The following is the logical schema; the ORM schema may use idiomatic
naming but must preserve the relationships and invariants.

### 8.1 `users`

-   `id UUID PK`
-   `email TEXT UNIQUE NOT NULL`
-   `display_name TEXT`
-   `auth_provider TEXT`
-   `created_at TIMESTAMPTZ NOT NULL`
-   `updated_at TIMESTAMPTZ NOT NULL`
-   `deleted_at TIMESTAMPTZ NULL`

MVP can use a single-user installation, but records should still be
owned by a user to avoid architectural rework.

### 8.2 `projects`

-   `id UUID PK`
-   `owner_user_id UUID FK users`
-   `title TEXT NOT NULL`
-   `description TEXT NULL`
-   `status ENUM(DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED)`
-   `current_stage ENUM(BRIEF, STORY, BIBLE, STORYBOARD, GENERATION, EDITING, EXPORT, COMPLETE)`
-   `source_idea TEXT NOT NULL`
-   `story_language TEXT NOT NULL`
-   `ui_language TEXT NOT NULL`
-   `dialogue_mode ENUM(DIALOGUE, VOICEOVER, NO_DIALOGUE)`
-   `target_runtime_seconds INT NOT NULL`
-   `aspect_ratio ENUM(LANDSCAPE_16_9, PORTRAIT_9_16, SQUARE_1_1, CUSTOM)`
-   `custom_aspect_width INT NULL`
-   `custom_aspect_height INT NULL`
-   `genre TEXT NULL`
-   `tone TEXT NULL`
-   `visual_style_preset ENUM(PHOTOREALISTIC_CINEMATIC, LIVE_ACTION_AD, DOCUMENTARY, ANIME, CARTOON_2D, ANIMATION_3D, STOP_MOTION, CLAYMATION, COMIC_BOOK, WATERCOLOR, PAINTERLY, PIXEL_ART, PAPER_CUTOUT, FANTASY_CONCEPT_ART, VINTAGE_FILM, PRODUCT_SHOWCASE, CUSTOM) NOT NULL DEFAULT PHOTOREALISTIC_CINEMATIC`
-   `visual_style_notes TEXT NULL`
-   `style_profile JSONB NOT NULL DEFAULT '{}'`
-   `audience TEXT NULL`
-   `content_constraints JSONB NOT NULL DEFAULT '{}'`
-   `budget_limit_minor BIGINT NULL`
-   `currency CHAR(3) NOT NULL DEFAULT 'USD'`
-   `created_at`, `updated_at`, `archived_at`, `deleted_at`

Checks: runtime must be positive and within configured product limits.
Default target runtime is 300--600 seconds, but the user can configure a
different target after validation.

### 8.3 `story_artifacts`

-   `id UUID PK`
-   `project_id UUID FK projects`
-   `artifact_type ENUM(LOGLINE, PREMISE, SYNOPSIS, OUTLINE, CHARACTER_ARCS, SCREENPLAY, SCENE_BREAKDOWN, COVERAGE)`
-   `title TEXT`
-   `current_version_id UUID NULL`
-   `approval_status ENUM(DRAFT, IN_REVIEW, APPROVED, REJECTED, POTENTIALLY_STALE)`
-   `created_at`, `updated_at`

Unique constraint as appropriate for project + artifact type if only one
active artifact of that type is allowed.

### 8.4 `artifact_versions`

-   `id UUID PK`
-   `artifact_id UUID FK story_artifacts`
-   `version_number INT NOT NULL`
-   `content_json JSONB NOT NULL`
-   `content_text TEXT NULL`
-   `source ENUM(USER, AI, IMPORT)`
-   `provider_id TEXT NULL`
-   `model_id TEXT NULL`
-   `prompt_template_id TEXT NULL`
-   `prompt_template_version TEXT NULL`
-   `generation_job_id UUID NULL`
-   `created_by_user_id UUID NULL`
-   `created_at TIMESTAMPTZ NOT NULL`
-   `change_summary TEXT NULL`
-   `approved_at TIMESTAMPTZ NULL`
-   `approved_by_user_id UUID NULL`

Unique `(artifact_id, version_number)`.

### 8.5 `scenes`

-   `id UUID PK`
-   `project_id UUID FK projects`
-   `scene_number INT NOT NULL`
-   `scene_heading TEXT NOT NULL`
-   `location_asset_id UUID NULL`
-   `time_of_day TEXT NULL`
-   `weather TEXT NULL`
-   `objective TEXT NULL`
-   `conflict TEXT NULL`
-   `action_summary TEXT NOT NULL`
-   `screenplay_excerpt TEXT NULL`
-   `estimated_duration_seconds INT NOT NULL`
-   `approval_status ENUM(DRAFT, IN_REVIEW, APPROVED, REJECTED, POTENTIALLY_STALE)`
-   `current_version INT NOT NULL DEFAULT 1`
-   `created_at`, `updated_at`

Unique `(project_id, scene_number)`; maintain ordering
deterministically.

### 8.6 `production_assets`

-   `id UUID PK`
-   `project_id UUID FK projects`
-   `asset_type ENUM(CHARACTER, LOCATION, PROP, COSTUME, VEHICLE, STYLE_REFERENCE, OTHER)`
-   `name TEXT NOT NULL`
-   `description TEXT NOT NULL`
-   `attributes JSONB NOT NULL DEFAULT '{}'`
-   `continuity_rules JSONB NOT NULL DEFAULT '[]'`
-   `source_scene_ids UUID[]` or normalized join table
-   `approval_status ENUM(DRAFT, IN_REVIEW, APPROVED, REJECTED, POTENTIALLY_STALE)`
-   `canonical_version_id UUID NULL`
-   `created_at`, `updated_at`, `deleted_at`

Prefer a normalized `production_asset_scene_links` join table instead of
UUID arrays if query requirements warrant it.

### 8.7 `production_asset_versions`

-   `id UUID PK`
-   `asset_id UUID FK production_assets`
-   `version_number INT NOT NULL`
-   `description TEXT NOT NULL`
-   `attributes JSONB NOT NULL`
-   `prompt_text TEXT NULL`
-   `reference_media_asset_id UUID NULL`
-   `provider_id TEXT NULL`
-   `model_id TEXT NULL`
-   `source ENUM(USER, AI, IMPORT)`
-   `approval_status ENUM(DRAFT, APPROVED, REJECTED)`
-   `created_at`, `approved_at`, `approved_by_user_id`
-   Unique `(asset_id, version_number)`.

### 8.8 `shots`

-   `id UUID PK`
-   `project_id UUID FK projects`
-   `scene_id UUID FK scenes`
-   `shot_number INT NOT NULL`
-   `title TEXT NULL`
-   `story_purpose TEXT NULL`
-   `action_description TEXT NOT NULL`
-   `screenplay_excerpt TEXT NULL`
-   `target_duration_seconds NUMERIC(6,2) NOT NULL`
-   `shot_size TEXT NULL`
-   `camera_angle TEXT NULL`
-   `camera_movement TEXT NULL`
-   `subject_blocking JSONB NOT NULL DEFAULT '{}'`
-   `screen_direction TEXT NULL`
-   `lighting TEXT NULL`
-   `mood TEXT NULL`
-   `color_palette TEXT NULL`
-   `image_prompt TEXT NULL`
-   `video_prompt TEXT NULL`
-   `negative_constraints JSONB NOT NULL DEFAULT '[]'`
-   `continuity_constraints JSONB NOT NULL DEFAULT '[]'`
-   `aspect_ratio TEXT NOT NULL`
-   `approval_status ENUM(DRAFT, IN_REVIEW, APPROVED, REJECTED, POTENTIALLY_STALE)`
-   `selected_still_version_id UUID NULL`
-   `selected_video_version_id UUID NULL`
-   `created_at`, `updated_at`

Unique `(scene_id, shot_number)`. Duration is a target and may differ
from provider-supported clip duration.

### 8.9 `shot_asset_references`

-   `shot_id UUID FK shots`
-   `production_asset_version_id UUID FK production_asset_versions`
-   `reference_role ENUM(CHARACTER, LOCATION, PROP, COSTUME, STYLE, OTHER)`
-   `priority INT NOT NULL DEFAULT 0`
-   `required BOOLEAN NOT NULL DEFAULT false`
-   Primary key `(shot_id, production_asset_version_id)`.

### 8.10 `media_assets`

-   `id UUID PK`
-   `project_id UUID FK projects`
-   `media_type ENUM(IMAGE, VIDEO, AUDIO, SUBTITLE, OTHER)`
-   `mime_type TEXT NOT NULL`
-   `storage_backend ENUM(LOCAL_COMPANION, OPTIONAL_OBJECT_STORAGE, EXTERNAL_REFERENCE) NOT NULL DEFAULT LOCAL_COMPANION`
-   `storage_key TEXT NOT NULL UNIQUE`  -- provider-neutral logical key; never trust it as a raw filesystem path
-   `local_relative_path TEXT NULL`  -- relative to a registered companion storage root; never store arbitrary absolute paths in API-visible fields
-   `companion_device_id UUID NULL`
-   `storage_status ENUM(AVAILABLE, COMPANION_OFFLINE, DRIVE_DISCONNECTED, MISSING, TRANSFER_PENDING, CHECKSUM_MISMATCH, REMOTE_ONLY) NOT NULL DEFAULT AVAILABLE`
-   `original_filename TEXT NULL`
-   `file_size_bytes BIGINT NOT NULL`
-   `checksum_sha256 TEXT NOT NULL`
-   `width INT NULL`
-   `height INT NULL`
-   `duration_seconds NUMERIC(10,3) NULL`
-   `frame_rate NUMERIC(8,3) NULL`
-   `video_codec TEXT NULL`
-   `audio_codec TEXT NULL`
-   `provenance ENUM(AI_GENERATED, USER_UPLOAD, EXTERNAL_IMPORT, DERIVED)`
-   `provider_id TEXT NULL`
-   `provider_job_id TEXT NULL`
-   `metadata JSONB NOT NULL DEFAULT '{}'`
-   `created_by_user_id UUID NULL`
-   `created_at TIMESTAMPTZ NOT NULL`
-   `deleted_at TIMESTAMPTZ NULL`

Unique checksums are useful but must not prevent intentional duplicate
logical assets. Store checksum and handle deduplication as an optional
storage optimization.

### 8.11 `shot_media_versions`

-   `id UUID PK`
-   `shot_id UUID FK shots`
-   `media_asset_id UUID FK media_assets`
-   `kind ENUM(STORYBOARD_STILL, VIDEO_CLIP, POSTER_FRAME, PROXY)`
-   `version_number INT NOT NULL`
-   `prompt_snapshot JSONB NULL`
-   `provider_configuration_snapshot JSONB NULL`
-   `approval_status ENUM(DRAFT, APPROVED, REJECTED)`
-   `created_at`, `approved_at`, `approved_by_user_id`
-   Unique `(shot_id, kind, version_number)`.

### 8.12 `generation_jobs`

-   `id UUID PK`
-   `project_id UUID FK projects`
-   `shot_id UUID NULL FK shots`
-   `job_type ENUM(STORY, BIBLE_EXTRACTION, IMAGE_GENERATION, VIDEO_GENERATION, TRANSCRIPTION, THUMBNAIL, EXPORT, MEDIA_DERIVATIVE)`
-   `provider_id TEXT NULL`
-   `provider_job_id TEXT NULL`
-   `idempotency_key TEXT NOT NULL UNIQUE`
-   `status ENUM(QUEUED, SUBMITTING, SUBMITTED, RUNNING, WAITING_FOR_PROVIDER, RETRY_WAIT, SUCCEEDED, FAILED, CANCEL_REQUESTED, CANCELLED, NEEDS_USER_ACTION)`
-   `progress_percent INT NULL`
-   `attempt_count INT NOT NULL DEFAULT 0`
-   `max_attempts INT NOT NULL DEFAULT 3`
-   `request_payload JSONB NOT NULL`
-   `result_payload JSONB NULL`
-   `error_code TEXT NULL`
-   `error_message_sanitized TEXT NULL`
-   `retryable BOOLEAN NOT NULL DEFAULT false`
-   `estimated_cost_minor BIGINT NULL`
-   `actual_cost_minor BIGINT NULL`
-   `currency CHAR(3) NOT NULL`
-   `provider_usage JSONB NULL`
-   `submitted_at`, `started_at`, `finished_at`, `next_retry_at`
-   `created_at`, `updated_at`

Ensure `request_payload` excludes credentials and unnecessary personal
data. Add indexes on `(status, next_retry_at)`,
`(project_id, created_at)`, and `(provider_id, provider_job_id)`.

### 8.13 `cost_records`

-   `id UUID PK`
-   `project_id UUID FK projects`
-   `generation_job_id UUID NULL FK generation_jobs`
-   `cost_type ENUM(ESTIMATE, RESERVATION, ACTUAL, ADJUSTMENT)`
-   `provider_id TEXT NULL`
-   `amount_minor BIGINT NOT NULL`
-   `currency CHAR(3) NOT NULL`
-   `basis TEXT NOT NULL`
-   `is_estimate BOOLEAN NOT NULL`
-   `source_reference TEXT NULL`
-   `created_at TIMESTAMPTZ NOT NULL`

### 8.14 `edit_sequences`

-   `id UUID PK`
-   `project_id UUID FK projects`
-   `name TEXT NOT NULL`
-   `version_number INT NOT NULL`
-   `status ENUM(DRAFT, IN_REVIEW, APPROVED, RENDERING, RENDERED, FAILED)`
-   `frame_rate NUMERIC(8,3) NOT NULL DEFAULT 24`
-   `width INT NOT NULL DEFAULT 1920`
-   `height INT NOT NULL DEFAULT 1080`
-   `audio_sample_rate INT NOT NULL DEFAULT 48000`
-   `timeline_json JSONB NOT NULL`
-   `created_by_user_id UUID`
-   `created_at`, `updated_at`, `approved_at`
-   Unique `(project_id, version_number)`.

Timeline JSON must be validated against a versioned schema. If querying
timeline items becomes frequent, normalize into `edit_tracks` and
`edit_items` tables rather than relying entirely on JSON.

### 8.15 `export_jobs`

-   `id UUID PK`
-   `project_id UUID FK projects`
-   `edit_sequence_id UUID FK edit_sequences`
-   `generation_job_id UUID NULL FK generation_jobs`
-   `export_settings JSONB NOT NULL`
-   `status ENUM(QUEUED, VALIDATING, RENDERING, UPLOADING, SUCCEEDED, FAILED, CANCELLED)`
-   `output_media_asset_id UUID NULL FK media_assets`
-   `error_code TEXT NULL`
-   `error_message_sanitized TEXT NULL`
-   `created_at`, `started_at`, `finished_at`

### 8.16 `dependency_links`

-   `id UUID PK`
-   `project_id UUID FK projects`
-   `source_type TEXT NOT NULL`
-   `source_id UUID NOT NULL`
-   `source_version_id UUID NULL`
-   `target_type TEXT NOT NULL`
-   `target_id UUID NOT NULL`
-   `target_version_id UUID NULL`
-   `dependency_type ENUM(USES_REFERENCE, DERIVED_FROM, PROMPT_CONTEXT, EDIT_SOURCE, OTHER)`
-   `created_at TIMESTAMPTZ NOT NULL`

Use this table to identify potentially stale downstream work when a
source version changes.

### 8.17 `provider_connections`

-   `id UUID PK`
-   `owner_user_id UUID FK users`
-   `provider_id TEXT NOT NULL`
-   `display_name TEXT NULL`
-   `encrypted_secret_blob TEXT NOT NULL`
-   `secret_key_version TEXT NOT NULL`
-   `status ENUM(NOT_TESTED, CONNECTED, ERROR, DISABLED)`
-   `capabilities_snapshot JSONB NOT NULL DEFAULT '{}'`
-   `last_verified_at TIMESTAMPTZ NULL`
-   `created_at`, `updated_at`
-   `is_enabled BOOLEAN NOT NULL DEFAULT true`

One user may have several provider connections and may connect more than one account for a provider if needed. Do not use `provider_id` alone as the unique key.

Encrypt credentials using a server-side encryption key supplied through
a secret manager/environment. Prefer a managed secret store for
production. Never return `encrypted_secret_blob` to clients.

### 8.18 `model_preferences`

-   `id UUID PK`
-   `owner_user_id UUID FK users`
-   `task_type ENUM(STORY, SCREENPLAY_REVIEW, BIBLE_EXTRACTION, IMAGE_GENERATION, IMAGE_EDITING, VIDEO_GENERATION, SPEECH, TRANSCRIPTION)`
-   `provider_connection_id UUID FK provider_connections`
-   `model_id TEXT NOT NULL`
-   `fallback_mode ENUM(MANUAL_ONLY, ASK_BEFORE_SWITCH, AUTO_ELIGIBLE_ERRORS) NOT NULL DEFAULT MANUAL_ONLY`
-   `fallback_order JSONB NOT NULL DEFAULT '[]'`
-   `enabled BOOLEAN NOT NULL DEFAULT true`
-   `created_at`, `updated_at`

Use one primary preference per user/task type; fallback candidates are stored in order and validated against the capability registry.

### 8.19 `audit_events`

-   `id UUID PK`
-   `project_id UUID NULL`
-   `actor_user_id UUID NULL`
-   `event_type TEXT NOT NULL`
-   `entity_type TEXT NULL`
-   `entity_id UUID NULL`
-   `details_redacted JSONB NOT NULL DEFAULT '{}'`
-   `correlation_id TEXT NULL`
-   `created_at TIMESTAMPTZ NOT NULL`

Record approvals, budget changes, provider connection changes, deletion,
export, and important state transitions. Do not log secrets or full
private prompts unnecessarily.

### 8.20 Database invariants

-   A selected shot version must belong to that shot.
-   A project can only reference media assets owned by that project or
    explicitly imported into it.
-   An approved artifact version is immutable; edits create a new
    version.
-   Job status transitions must be validated by domain code.
-   An approved sequence snapshot is immutable.
-   A provider job ID may not be unique globally; uniqueness scope
    depends on provider.
-   Budget reservations and cost overrides must be transactional.
-   Deleting a project must not immediately delete media while a job is
    running or an export is using it.

------------------------------------------------------------------------

## 9. API contracts

Use `/api/v1`. JSON requests/responses. Use a consistent error envelope
and schema validation.

### 9.1 Standard success and error shape

Success:

``` json
{
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-10-15T12:00:00Z"
  }
}
```

Error:

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be processed.",
    "details": [],
    "requestId": "uuid"
  }
}
```

Never return stack traces, raw provider responses containing secrets, or
internal filesystem paths to the client.

### 9.2 Projects

-   `POST /api/v1/projects` --- create project.
-   `GET /api/v1/projects` --- list/filter projects.
-   `GET /api/v1/projects/:projectId` --- project details and stage
    summary.
-   `PATCH /api/v1/projects/:projectId` --- update editable project
    settings.
-   `POST /api/v1/projects/:projectId/archive` --- archive.
-   `DELETE /api/v1/projects/:projectId` --- soft delete with
    confirmation semantics.
-   `GET /api/v1/projects/:projectId/activity` --- recent events and
    jobs.

Create request fields: title, sourceIdea, storyLanguage, uiLanguage,
dialogueMode, targetRuntimeSeconds, aspectRatio, genre, tone,
visualStyle, audience, contentConstraints, budgetLimitMinor, currency.

### 9.3 Story artifacts

-   `POST /api/v1/projects/:projectId/story/generate` --- enqueue story
    generation.
-   `GET /api/v1/projects/:projectId/story` --- retrieve artifacts and
    current versions.
-   `PATCH /api/v1/story-artifacts/:artifactId` --- edit
    metadata/current draft.
-   `POST /api/v1/story-artifacts/:artifactId/versions` --- create a
    user-edit version.
-   `POST /api/v1/story-artifacts/:artifactId/approve` --- approve
    current version.
-   `POST /api/v1/story-artifacts/:artifactId/regenerate` --- regenerate
    selected section with user instructions.
-   `GET /api/v1/story-artifacts/:artifactId/versions` --- version
    history.

Generation endpoint returns `202 Accepted` with `jobId`, not the final
generated content if asynchronous.

### 9.4 Production bible

-   `POST /api/v1/projects/:projectId/bible/extract` --- enqueue
    extraction from approved story.
-   `GET /api/v1/projects/:projectId/bible` --- list entities.
-   `POST /api/v1/projects/:projectId/assets` --- create entity.
-   `PATCH /api/v1/production-assets/:assetId` --- update draft entity.
-   `POST /api/v1/production-assets/:assetId/versions` --- create
    version.
-   `POST /api/v1/production-assets/:assetId/references/generate` ---
    enqueue reference generation.
-   `POST /api/v1/production-assets/:assetId/approve` --- approve
    entity/version.
-   `POST /api/v1/projects/:projectId/bible/approve` --- approve bible
    when all required items meet validation.

### 9.5 Storyboard and shots

-   `POST /api/v1/projects/:projectId/storyboard/generate-plan` ---
    generate scenes/shots from approved screenplay.
-   `GET /api/v1/projects/:projectId/scenes` --- list scenes.
-   `PATCH /api/v1/scenes/:sceneId` --- edit scene.
-   `GET /api/v1/scenes/:sceneId/shots` --- list shots.
-   `POST /api/v1/scenes/:sceneId/shots` --- create shot.
-   `PATCH /api/v1/shots/:shotId` --- edit shot and prompts.
-   `POST /api/v1/shots/:shotId/stills/generate` --- enqueue still
    generation.
-   `POST /api/v1/shots/:shotId/approve` --- approve shot/selected still
    according to request schema.
-   `POST /api/v1/shots/:shotId/reject` --- reject selected version with
    reason.
-   `POST /api/v1/projects/:projectId/storyboard/approve` --- approve
    shot plan.

### 9.6 Video generation

-   `GET /api/v1/providers` --- list configured providers and supported
    capabilities.
-   `POST /api/v1/projects/:projectId/video/estimate` --- estimate
    selected batch.
-   `POST /api/v1/projects/:projectId/video/generate` --- enqueue
    selected approved shots after budget confirmation.
-   `GET /api/v1/generation-jobs` --- list/filter jobs.
-   `GET /api/v1/generation-jobs/:jobId` --- job status/details.
-   `POST /api/v1/generation-jobs/:jobId/cancel` --- request
    cancellation.
-   `POST /api/v1/generation-jobs/:jobId/retry` --- retry if eligible.
-   `POST /api/v1/shots/:shotId/video/import` --- create upload
    session/import clip.
-   `POST /api/v1/shots/:shotId/video-versions/:versionId/approve` ---
    approve a video version.

Batch generation request must include shot IDs, provider ID, options
supported by that provider, estimate ID, and explicit confirmation of
the displayed amount/currency. The backend revalidates the estimate and
budget at submission time.

### 9.7 Media

-   `POST /api/v1/projects/:projectId/media/upload-session` --- create
    upload session or presigned upload.
-   `POST /api/v1/projects/:projectId/media/complete-upload` ---
    finalize and validate uploaded object.
-   `GET /api/v1/media/:mediaAssetId` --- metadata.
-   `GET /api/v1/media/:mediaAssetId/access-url` --- short-lived signed
    URL.
-   `DELETE /api/v1/media/:mediaAssetId` --- soft delete if no protected
    dependency blocks deletion.

### 9.8 Editing and export

-   `POST /api/v1/projects/:projectId/edit-sequences` --- create
    sequence.
-   `GET /api/v1/projects/:projectId/edit-sequences` --- list sequences.
-   `GET /api/v1/edit-sequences/:sequenceId` --- retrieve sequence.
-   `PATCH /api/v1/edit-sequences/:sequenceId` --- save draft timeline.
-   `POST /api/v1/edit-sequences/:sequenceId/validate` --- validate
    timeline.
-   `POST /api/v1/edit-sequences/:sequenceId/approve` --- approve
    snapshot.
-   `POST /api/v1/edit-sequences/:sequenceId/exports` --- enqueue
    render.
-   `GET /api/v1/export-jobs/:exportJobId` --- export status.
-   `POST /api/v1/export-jobs/:exportJobId/cancel` --- cancel if safe.
-   `GET /api/v1/projects/:projectId/export-package` --- list final
    package assets.

### 9.9 Settings and costs

-   `GET /api/v1/settings/providers` --- provider status, no secrets.
-   `PUT /api/v1/settings/providers/:providerId` --- store/update
    encrypted credentials.
-   `POST /api/v1/settings/providers/:providerId/test` --- test
    connection and capabilities.
-   `GET /api/v1/projects/:projectId/costs` ---
    estimate/reservation/actual breakdown.
-   `PATCH /api/v1/projects/:projectId/budget` --- update limit;
    requires audit record.

### 9.10 Pagination, validation, and concurrency

-   List endpoints use cursor pagination or consistent page/limit
    pagination.
-   Set maximum page sizes.
-   Use optimistic concurrency via `updatedAt` or version/ETag on edits
    to avoid silent overwrites.
-   Validate all IDs and ownership on the server.
-   Use idempotency keys for mutations that create paid jobs or exports.
-   Return `409 CONFLICT` for stale edits or invalid state transitions.
-   Return `422 UNPROCESSABLE_ENTITY` for valid JSON that violates
    domain rules.
-   Return `429 TOO MANY REQUESTS` for rate-limited user actions.

------------------------------------------------------------------------

## 10. Job orchestration and state machines

### 10.1 Job architecture

The API validates the request and creates a durable database job record
plus a queue message. The worker claims work, performs provider calls,
persists state, and schedules follow-up polling where needed.

Redis/BullMQ is the execution queue, not the sole source of truth.
Database state is authoritative. On startup, a reconciliation task scans
for jobs left in transitional states and safely resumes or flags them.

### 10.2 Job state machine

Allowed transitions:

-   `QUEUED -> SUBMITTING`
-   `SUBMITTING -> SUBMITTED | RUNNING | WAITING_FOR_PROVIDER | RETRY_WAIT | FAILED | NEEDS_USER_ACTION`
-   `SUBMITTED -> RUNNING | WAITING_FOR_PROVIDER | SUCCEEDED | RETRY_WAIT | FAILED | CANCEL_REQUESTED`
-   `RUNNING -> WAITING_FOR_PROVIDER | SUCCEEDED | RETRY_WAIT | FAILED | CANCEL_REQUESTED`
-   `WAITING_FOR_PROVIDER -> RUNNING | SUCCEEDED | RETRY_WAIT | FAILED | CANCEL_REQUESTED`
-   `RETRY_WAIT -> QUEUED | FAILED | NEEDS_USER_ACTION`
-   `CANCEL_REQUESTED -> CANCELLED | RUNNING | SUCCEEDED | FAILED`
-   Terminal states: `SUCCEEDED`, `FAILED`, `CANCELLED`,
    `NEEDS_USER_ACTION` (the latter may be resolved through an explicit
    user action and new job).

Reject illegal transitions in domain code. A provider may report
completion after a cancellation request; reconcile honestly and record
the final provider result.

### 10.3 Retry policy

-   Retry only errors classified as transient.
-   Use exponential backoff with jitter.
-   Initial maximum attempts: 3, configurable per job type/provider.
-   Do not retry authentication, permission, invalid request,
    content-policy rejection, unsupported capability, or quota
    exhaustion without user action.
-   Respect provider `Retry-After` where present.
-   Avoid duplicate billing: check provider job ID and idempotency
    behavior before resubmitting.
-   A timeout after submission is an ambiguous state, not proof of
    failure. Reconcile with provider before creating another submission.
-   User retries create a new attempt record or linked job history;
    never erase prior errors.

### 10.4 Queue priorities and concurrency

-   Export and user-requested single-shot jobs should not be starved by
    large batches.
-   Limit concurrency per provider and per account according to
    documented quotas.
-   Limit concurrent FFmpeg renders to configured CPU/memory capacity.
-   Implement backpressure when provider rate limits or storage capacity
    are reached.
-   Use separate queues or routing keys for story/LLM, image, video,
    media processing, and export.

### 10.5 Polling and webhooks

-   Use webhooks only if officially supported and signature verification
    is documented.
-   Otherwise poll with provider-specific intervals and a maximum job
    lifetime.
-   Use exponential polling intervals where appropriate.
-   Store last poll time and next poll time.
-   Webhook handlers must be idempotent and reject invalid signatures.
-   Never trust callback URLs, file URLs, or paths received from
    providers without validation.

### 10.6 Job reconciliation

On worker startup and periodically: 1. Find nonterminal database jobs
not represented in the queue. 2. Re-enqueue safe jobs. 3. For
provider-submitted jobs, query provider status rather than resubmit
blindly. 4. Find expired signed uploads or incomplete media imports and
mark them. 5. Detect jobs stuck beyond configured SLA and transition to
`NEEDS_USER_ACTION` with a useful message. 6. Emit metrics and audit
records for recovery actions.

### 10.7 Export job pipeline

1.  Validate approved edit sequence snapshot.
2.  Verify all source media exists and is readable.
3.  Resolve timeline to deterministic render plan.
4. Confirm the local companion is online and the selected media root is mounted and writable.
5. Resolve local media references and verify existence/checksums; request missing assets through a resumable transfer if they are still available from a provider or optional remote store.
6. Render using FFmpeg with validated argument arrays and a controlled filter plan in a temporary local working directory.
7. Validate output with FFprobe and a playback smoke test.
8. Create thumbnail and optional metadata/caption files.
9. Save the final MP4 and derived files to the selected local/external-drive destination. If the user explicitly enabled remote copies, upload only the selected outputs.
10. Persist media metadata, checksum, duration, codecs, local companion/device reference and output package.
11. Mark export complete only after local file validation and a confirmed metadata update.
12. Clean temporary files according to retention policy; never delete source media automatically.

Do not build FFmpeg commands by concatenating untrusted user strings.
Use a controlled argument list and validated filter configuration.

------------------------------------------------------------------------

## 11. Editing model and FFmpeg behavior

### 11.1 Timeline schema

Use a versioned JSON timeline structure. Example conceptual structure:

``` json
{
  "schemaVersion": 1,
  "frameRate": 24,
  "width": 1920,
  "height": 1080,
  "tracks": [
    {
      "id": "track-video-1",
      "type": "VIDEO",
      "items": [
        {
          "id": "item-1",
          "mediaAssetId": "uuid",
          "timelineStartFrames": 0,
          "sourceInFrames": 0,
          "sourceOutFrames": 120,
          "layer": 0,
          "transitionIn": null,
          "transitionOut": null
        }
      ]
    },
    {
      "id": "track-audio-1",
      "type": "AUDIO",
      "items": []
    },
    {
      "id": "track-text-1",
      "type": "TEXT",
      "items": []
    }
  ]
}
```

This is illustrative, not a complete schema. Implement Zod validation
and version migrations. Use integer frame counts internally for timeline
positions to avoid floating-point drift. Convert to seconds only at
media-processing boundaries.

### 11.2 MVP editing limits

-   One primary video track is sufficient initially.
-   Multiple audio tracks may be supported if stable; minimum
    requirement is separate narration/music/SFX tracks or equivalent
    independent audio items.
-   Basic title overlays and subtitle tracks.
-   Hard cuts and simple dissolve/crossfade.
-   Trim, reorder, split, remove from timeline.
-   No advanced keyframes, nested sequences, or complex compositing in
    MVP.

### 11.3 Rendering rules

-   Default target: MP4 container, H.264 video, AAC audio, 1920x1080, 24
    fps, 48 kHz audio.
-   If input media differs, normalize dimensions, pixel format, frame
    rate, audio sample rate, and time base as required.
-   Preserve aspect ratio; use explicit crop/pad policy rather than
    accidental stretching.
-   If audio is absent, export may contain silent audio only if the user
    chooses that setting.
-   Normalize audio levels conservatively; never clip peaks
    intentionally.
-   Use explicit font availability for text overlays and document font
    dependencies.
-   Record FFmpeg version and render settings in export metadata.
-   A render is successful only after FFprobe validation and output-file
    existence/checksum verification.

------------------------------------------------------------------------

## 12. Security, privacy, and rights

### 12.1 Authentication and authorization

-   Use secure server-side sessions or a documented equivalent.
-   Secure cookies: `HttpOnly`, `Secure` in production, appropriate
    `SameSite`.
-   Protect state-changing routes against CSRF where applicable.
-   Apply ownership checks to every project, artifact, job, media, and
    export endpoint.
-   Do not rely on obscurity of UUIDs as authorization.
-   Rate-limit login, uploads, generation submission, and expensive
    operations.
-   Use least-privilege service credentials.

### 12.2 Secret management

-   Provider keys are only sent to backend endpoints over TLS.
-   Encrypt stored credentials using authenticated encryption with key
    rotation support.
-   Production encryption keys belong in a secret manager or protected
    environment, never in the database or repository.
-   Redact keys from logs, errors, traces, and client responses.
-   `.env.example` contains placeholders only.
-   Provider connection tests must not print secrets.

### 12.3 Upload security

-   Restrict upload size and allowed types.
-   Validate actual file signatures and parse media metadata.
-   Generate random storage keys; do not trust user filenames as paths.
-   Defend against path traversal, malformed media,
    decompression/resource exhaustion, and server-side request forgery.
-   Do not fetch arbitrary URLs supplied by a user/provider without
    allowlist and network controls.
-   Run FFmpeg in a restricted process/container with time, memory,
    disk, and CPU limits.
-   Keep uploaded files private by default.
-   Use companion-mediated authenticated local access; use short-lived signed URLs only for optional remote objects.

### 12.4 Privacy

-   Store only data needed for the workflow.
-   Document data retention and project deletion behavior.
-   Avoid sending unrelated project content to providers.
-   Show which references and prompts will be sent to each provider
    where practical.
-   Do not train on user content unless a separately explicit, opt-in
    feature and provider terms permit it.
-   Provide deletion of projects and associated media according to
    retention policy, including queued jobs and derived files.
-   Make clear that external providers may process data under their own
    terms.

### 12.5 Copyright, likeness, and platform policies

-   The user is responsible for rights to uploaded references and audio.
-   Provide fields to record source/license notes for imported media.
-   Do not promise that AI output is copyrightable, exclusive, or free
    from third-party rights.
-   Do not implement deceptive impersonation or non-consensual
    real-person voice/likeness cloning.
-   Respect provider content policies and preserve relevant
    refusal/error states.
-   YouTube title/description suggestions are drafts; the user decides
    what to publish.
-   Do not guarantee monetization or revenue.

------------------------------------------------------------------------

## 13. Reliability and non-functional requirements

### 13.1 Performance targets

These are initial targets for the app's own UI/API, not for third-party
AI generation: - Common read APIs: p95 under 500 ms in a modest
single-user deployment, excluding media download. - Common write APIs:
p95 under 800 ms, excluding enqueue time variance. - Job submission
returns promptly (typically under 2 seconds) and returns a job ID. -
Dashboard should not load all media binaries to render cards. - Paginate
large lists and lazy-load images. - Use thumbnails/proxies for
browsing. - Long-running generation/rendering never blocks an HTTP
request until completion.

### 13.2 Availability and recovery

-   PostgreSQL backups and local-media backup/recovery responsibilities must be documented. Optional object-storage backups are documented only when enabled.
-   Jobs survive worker restart.
-   Retry/reconciliation is idempotent.
-   Render workspaces are cleaned up after completion/failure.
-   Failed jobs retain sanitized diagnostic information.
-   The app degrades gracefully when a provider is unavailable.
-   No provider failure should corrupt the project or delete approved
    assets.

### 13.3 Data integrity

-   Use migrations and constraints.
-   Use transactions for approvals, version creation, budget
    reservation, and state transitions.
-   Use checksums for media integrity.
-   Use optimistic concurrency for editable documents.
-   Never mutate an approved version in place.
-   Test recovery from partial failure between database updates, queue
    submission, provider submission, and result upload.

### 13.4 Accessibility and usability

-   Keyboard-accessible core flows.
-   Clear focus states and labels.
-   Statuses are not communicated by color alone.
-   Text contrast meets WCAG AA where practical.
-   Forms show field-level validation.
-   Confirmation dialogs describe the action and cost impact.
-   Long-running work shows state and can be revisited later.

### 13.5 Observability

-   Structured logs with timestamp, severity, request ID, correlation
    ID, job ID, module, and sanitized error code.
-   Metrics: queue depth, job duration, retry rate, provider error rate,
    export duration, media-processing failures, cost estimate versus
    actual where available.
-   Health endpoints: liveness and readiness.
-   Never log API secrets, session tokens, signed URLs, or unredacted
    sensitive payloads.
-   Include a troubleshooting runbook for common provider and FFmpeg
    failures.

------------------------------------------------------------------------

## 14. Cost-control system

### 14.1 Cost estimate model

A `CostEstimate` includes: - Provider ID and model ID. - Input
dimensions/options and number of jobs. - Unit basis (per second, image,
request, token, or other documented unit). - Estimated amount and
currency. - Whether the amount is official/current, calculated,
approximate, or unavailable. - Pricing source and last-verified date. -
Assumptions and excluded costs.

If pricing cannot be verified, show "Cost estimate unavailable" and
require a deliberate user decision before batch generation. Do not
fabricate a price.

### 14.2 Budget reservation

Before a batch: 1. Calculate estimate. 2. Show shot count,
provider/model, options, per-shot estimate, total estimate, and budget
remaining. 3. User confirms. 4. In a transaction, recheck remaining
budget and create a reservation. 5. Enqueue jobs with a batch ID. 6.
Reconcile reservations against actual usage when available. 7. Release
unused reservations only when the relevant jobs are terminal and
provider-side charges are understood.

Prevent two concurrent requests from overspending the same budget
through transactional locking or equivalent atomic reservation logic.

### 14.3 Cost UI

Show: - Estimated total for current stage. - Actual recorded spend. -
Pending reserved amount. - Budget limit and remaining budget. - Per-shot
cost when known. - Provider/model breakdown. - Unpriced jobs clearly
marked. - Cost of retries separately from first attempts.

Do not infer actual provider spend solely from internal job count if the
provider bills differently.

------------------------------------------------------------------------

## 15. AI output quality and validation

### 15.1 Structured generation

-   Use structured output/JSON schema features where available.
-   Validate every output using Zod.
-   If invalid, attempt a bounded repair request (maximum two repairs by
    default).
-   If still invalid, fail the job with `OUTPUT_VALIDATION_FAILED` and
    preserve diagnostics.
-   Never silently coerce structurally invalid story data into a
    misleading result.

### 15.2 Story validation

Check: - Required story sections exist. - Scene IDs and ordering are
unique. - Character references resolve to known characters or are
flagged. - Scene duration estimates are numeric and plausible. -
Dialogue mode constraints are respected. - User constraints are carried
through. - Story runtime estimate is calculated from scene/shot
estimates and presented as approximate.

### 15.3 Continuity validation

The MVP provides rule-based checks and optional AI critique, not a
guarantee of visual continuity. Checks may include: - Shot references an
approved canonical character/location/prop version. - A costume or prop
state change has an explicit explanation when required. - Screen
direction fields are consistent when explicitly specified. - Shot
location matches scene location unless explicitly changed. - A prompt
has not omitted mandatory project constraints. - Provider input limits
are not exceeded.

Any AI critique is advisory. The user remains the authority on approval.

------------------------------------------------------------------------

## 16. Testing strategy

### 16.1 Unit tests

Required for: - Domain state transitions. - Approval rules. - Version
immutability. - Dependency invalidation. - Budget reservation arithmetic
and concurrent reservations. - Timeline schema and frame arithmetic. -
Provider capability validation. - Retry classification/backoff. - Prompt
composition. - Media metadata validation. - Export plan generation.

### 16.2 Contract tests

For every provider adapter: - Capability reporting. - Input
validation. - Error normalization. - Job submission response handling. -
Polling and terminal state mapping. - Output URL/file validation. -
Redaction. - Idempotency/reconciliation behavior.

Live provider tests must be opt-in and must use a clearly marked test
project and spending limit. CI must not incur paid provider costs.

### 16.3 Integration tests

-   Database migrations from a clean database.
-   API to database workflows.
-   API to queue to worker using mock providers.
-   Worker restart and job reconciliation.
-   Upload/transfer validation, local path safety and optional object storage when enabled.
-   FFmpeg export from fixture media.
-   Export failure and retry.
-   Project ownership isolation.
-   Budget reservation under concurrent requests.

### 16.4 End-to-end tests

Use mock providers for deterministic CI: 1. Create project. 2. Generate
mock story. 3. Approve story. 4. Extract and approve production bible.
5. Create storyboard and approve shots. 6. Generate mock still/video
assets. 7. Assemble timeline. 8. Export fixture MP4. 9. Verify download
and project state. 10. Confirm no unauthorized project access.

### 16.5 Manual acceptance tests

-   Real provider credentials can be configured without exposing
    secrets.
-   A real image generation works if the selected account has access.
-   A real video job works if the selected account/model/region supports
    it.
-   Manual Flow handoff exports a usable prompt/reference package.
-   Imported external clips are linked to the correct shot.
-   Cost estimate/unknown-price handling is clear.
-   Final MP4 plays in a standard media player.

### 16.6 Test coverage

Aim for at least 80% statement coverage for domain/business-rule
packages, with higher priority on state machines, cost controls,
authorization, and timeline validation. Coverage percentage does not
replace meaningful assertions.

------------------------------------------------------------------------

## 17. Acceptance criteria

### AC-01: Project creation

Given a valid brief, when the user creates a project, then the project
is persisted and appears on the dashboard with the correct settings and
current stage.

### AC-02: Story generation

Given a project brief, when the user requests story generation, then a
durable job is created, progress/status is visible, and a validated
story artifact is stored as a draft. Invalid provider output must not be
shown as a successful screenplay.

### AC-03: Story approval

Given a draft story artifact, when the user approves it, then an
immutable approved version is recorded. Later edits create a new version
and do not overwrite the approved content.

### AC-04: Production bible

Given an approved screenplay, when extraction completes, then
characters, locations, props, costumes, and style references are stored
with stable IDs and source references. The user can edit and approve
them.

### AC-05: Reference images

Given an asset and a configured image provider, when the user requests a
reference, then the app records the generation job and resulting media
version. If the provider is not configured, the app offers upload/manual
workflow and does not claim generation occurred.

### AC-06: Storyboard

Given an approved production bible and screenplay, when a shot plan is
generated, then scenes and shots are ordered and editable. Each shot
stores its prompt and relevant reference versions.

### AC-07: Shot regeneration

Given a rejected still, when the user regenerates it, then a new version
is created and the prior version remains available. Other approved shots
remain unchanged.

### AC-08: Cost confirmation

Given a video batch, when the user requests generation, then the app
displays an estimate or explicitly says the estimate is unavailable.
Paid submission cannot proceed without the required confirmation and
budget validation.

### AC-09: Job resilience

Given a provider job submitted before a worker restart, when the worker
restarts, then it reconciles the job without blindly submitting a
duplicate paid request.

### AC-10: Video import

Given an externally generated clip, when the user imports it into a
shot, then the file is validated, stored, versioned, and linked to that
shot with manual-import provenance.

### AC-11: Timeline

Given approved clips, when the user creates and saves a sequence, then
clip order, trim points, transitions, overlays, and audio items persist
and reload correctly.

### AC-12: Export

Given a valid approved sequence, when the user requests export, then a
background render job runs and the app only reports success after the
output is uploaded and validated.

### AC-13: Project isolation

Given two users/projects, when one user requests another project's
artifact or media, then the API denies access regardless of UUID
knowledge.

### AC-14: Secret protection

Given a configured provider key, when APIs, logs, and UI are inspected,
then the raw key is not returned or logged.

### AC-15: Unsupported Flow API

Given a Flow capability with no verified official API, when the user
chooses it, then the app provides manual handoff rather than calling
undocumented endpoints or claiming automatic integration.

### AC-16: Cost integrity

Given two concurrent batch requests near the budget limit, then
transactional reservation prevents overspending the configured internal
budget.

### AC-17: Project recovery

Given a browser closure or worker crash, when the user reopens the
project, then persisted drafts, approved versions, media, and job status
are recoverable.

### AC-18: Honest status

A job is never displayed as `SUCCEEDED` until the required provider
result exists, is validated, and is persisted.

### AC-19: Multiple AI providers
Given at least two configured providers that support the same task, when the user opens a task's model selector, then only compatible verified models are shown and the user can switch providers without losing project content.

### AC-20: Provider quota fallback
Given the selected provider returns a known quota/credit-exhaustion error, when fallback is configured, then the app follows the selected manual/ask/automatic policy, records the failed attempt, and does not blindly duplicate an ambiguous paid request.

### AC-21: Visual style
Given a project uses anime, cartoon, 3D animation, stop-motion, or another available style, when prompts are generated for its production bible, storyboard, and clips, then the selected style profile is included in prompt composition and shown to the user.

### AC-22: Agreed architecture
A fresh setup includes Next.js + TypeScript + Tailwind, a Node.js/Express/TypeScript API, PostgreSQL, Redis + BullMQ, AI provider adapters, FFmpeg/FFprobe, authentication and the local companion. The online app works when the companion is offline, but local media operations clearly show as unavailable.

------------------------------------------------------------------------

## 18. Phased implementation plan

Do not start with all providers and all editor features. Build a
vertical slice, then expand.

### Phase 0 --- Repository foundation and decisions

Deliverables:
- Monorepo or clearly separated apps for Next.js web, Express API, BullMQ worker and local companion.
- PostgreSQL schema, migrations and seed data; Redis/BullMQ configuration.
- Authentication, ownership checks, environment validation, error envelopes, request IDs and structured logs.
- Local companion pairing proof-of-concept with configured storage roots and a harmless file-list/checksum operation.
- CI checks: typecheck, lint, unit tests and build for all apps/packages.
- Documentation files listed in Section 0, plus `docs/LOCAL_COMPANION.md`.

Exit criteria: clean setup works; migrations and queues work; companion can pair securely and report online/offline status; no paid AI calls occur by default.

### Phase 1 --- Project and story workflow

Deliverables:
- Project dashboard and project brief.
- Story artifacts and versioning.
- Text provider interface and at least two verified text-provider adapters, chosen from OpenAI, Gemini, Anthropic, or OpenRouter.
- Mock text provider for CI.
- Story generation job pipeline, story editor, approval gate, and job activity view.

Exit criteria: - User can create project, generate/inspect/edit/approve
story, and recover it after restart. - Tests cover validation,
versioning, and approval rules.

### Phase 2 --- Production bible and storyboard

Deliverables:
- Production-bible extraction.
- Asset entities and versioning.
- Image provider interface and at least two image-generation choices where official API access is available; prioritize OpenAI image generation and one additional verified provider such as Google or Stability AI. -
Reference generation/import. - Shot planning and storyboard UI. - Prompt
engine and reference linking. - Approval/dependency handling.

Exit criteria: - Approved story becomes a production bible; approved
bible becomes a storyboard plan. - Asset versions and shot references
remain stable. - Still regeneration does not destroy previous versions.

### Phase 3 --- Video generation and manual handoff

Deliverables:
- Video provider interface.
- At least one verified video-generation adapter if account/region/API access permits, plus manual handoff/import.
- Provider selector and cost-aware fallback handling across compatible providers. If only one live video provider is accessible, test fallback architecture with mock adapters. - Capability matrix. - Cost
estimate and budget reservation. - Async queue, polling, retry,
reconciliation. - Manual prompt-package export and external clip
import. - Video review/version approval.

Exit criteria: - Mock-provider end-to-end tests pass. - Live provider
test is verified and cost-capped, or the manual workflow is documented
as the supported path. - Unsupported capabilities are not presented as
available.

### Phase 4 --- Basic editor and export

Deliverables:
- Edit sequence model and timeline UI with trim/reorder/split, simple transitions, titles, audio and subtitles.
- Companion-driven FFmpeg rendering to a user-selected local or external-drive path.
- Local media availability checks, checksums, progress reporting and safe temporary-file cleanup.
- Thumbnail and metadata draft; export status, retry and local file reveal/open action where supported.
- Optional remote export copy only behind an explicit user setting.

Exit criteria: imported/generated clips can be assembled into a valid MP4 on the user's local storage; output is verified with FFprobe; an offline companion prevents export with a clear explanation but does not break online project access.

### Phase 5 --- Hardening and first usable release

Deliverables: - Authorization review. - Upload/transfer security limits and local path-safety checks. - Cost
concurrency tests. - Retry/reconciliation tests. - Backup/restore
runbook. - Error and troubleshooting UX. - Performance review. - Manual
acceptance test with a real project. - Deployment instructions and known
limitations.

Exit criteria: - All P0 acceptance criteria pass. - No unresolved
critical security issue. - A complete test film can be produced from
brief through export with no lost approved work. - Real-provider
limitations are documented.

### Post-MVP candidates

-   9:16 and square export polish.
-   Voice generation/transcription adapters.
-   Better continuity critique and image comparison.
-   YouTube publishing through official APIs.
-   Team collaboration.
-   User billing and multi-tenant SaaS.
-   Template library for repeatable genres and formats.
-   Advanced timeline features.

------------------------------------------------------------------------

## 19. Deployment and operations

### 19.1 Environments

- Local development for web/API/worker/companion.
- Staging online deployment with test credentials and non-production database/Redis.
- Production online deployment with HTTPS, managed PostgreSQL and Redis, secret management and monitoring.
- Companion runs on the user's computer and is versioned independently from online services.

### 19.2 Environment variables

Document and validate variables such as `NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET` or auth-provider configuration, `APP_ENCRYPTION_KEY`, provider API keys/connection records, API base URL, CORS allowlist, BullMQ concurrency/retry limits, `FFMPEG_PATH`, `FFPROBE_PATH`, upload limits, allowed media types, default budget, maximum batch size, and optional object-storage endpoint/bucket/credentials. Never put secrets in client-side environment variables. Optional object-storage variables may be absent when the feature is disabled.

The companion has its own local configuration for API URL, paired-device credential, selected storage roots, FFmpeg/FFprobe path and safe resource limits. Do not store provider keys in companion configuration by default.

### 19.3 Backups and recovery

- Back up PostgreSQL and test restore procedures.
- Back up Redis only as appropriate for operational recovery; database job records remain canonical.
- Local media backup is the user's responsibility unless an explicit backup feature is enabled. Clearly warn that a local/external drive failure can destroy primary media.
- Provide an exportable project manifest containing artifact metadata, relative paths, checksums and provider/prompt snapshots. A manifest is not a substitute for backing up the actual media.
- Optional remote object storage may be used for explicitly selected copies. Document retention and cost.
- Never delete source media because an export succeeded. Retain temporary-file cleanup policies and report cleanup failures.
- Test database recovery and companion re-pairing periodically.

### 19.4 Deployment notes

Deploy Next.js and the Express API online with HTTPS. Run the BullMQ worker as a persistent process with access to PostgreSQL and Redis. The local companion is not deployed as a public server; it runs on the user's machine and establishes authenticated outbound connections. Configure restrictive CORS, secure cookies/tokens, request limits, provider secret encryption, rate limits and project-level authorization. Do not expose database or Redis publicly.

### 19.5 Operational truthfulness

- Online project browsing must work when the companion is offline.
- Full-resolution local assets and local rendering require the companion and relevant drive to be available.
- The app must distinguish provider job completion from successful local transfer and from successful final export.
- If a generated file is held temporarily by a provider, explain its expiry/availability where known and avoid claiming it is safely archived until the local copy is verified.

## 20. Product metrics

Track product usefulness and system reliability without collecting
unnecessary personal information.

-   Time from project creation to approved screenplay.
-   Time from approved screenplay to approved storyboard.
-   Percentage of generated stills approved on first attempt.
-   Average regeneration attempts per shot.
-   Video job success/failure rate.
-   Provider error rate and median job duration.
-   Export success rate and render duration.
-   Estimated versus actual cost where provider data exists.
-   Percentage of projects reaching final export.
-   Number of manual handoffs required per completed project.

Metrics are diagnostic, not promises of creative quality or YouTube
revenue.

------------------------------------------------------------------------

## 21. Risks and mitigations

### Provider APIs change

Mitigation: provider adapters, capability matrix, pinned SDK versions,
contract tests, and documented manual fallback.

### Video generation is expensive

Mitigation: cost estimate, batch confirmation, budget reservations,
per-shot generation, and retry caps.

### Character consistency varies

Mitigation: canonical references, prompt composition, explicit
continuity rules, versioned references, and human approval. Do not
promise perfect consistency.

### Long films require many clips

Mitigation: target 5--10 minutes at the assembled timeline level;
support short source clips, shot-level generation, and editing. Never
assume one generation request yields the full runtime.

### AI outputs malformed structure

Mitigation: schema validation, bounded repair, error states, and test
fixtures.

### Provider submission times out ambiguously

Mitigation: reconciliation by provider job ID/request ID, idempotency
where supported, and no blind resubmission.

### Rendering exhausts resources

Mitigation: isolated FFmpeg worker, resource limits, queue concurrency,
temporary storage quotas, and job cleanup.

### Scope expands into a full editor

Mitigation: keep MVP editing intentionally basic; add features only
after end-to-end export is reliable.

### Google Flow integration is unavailable

Mitigation: do not depend on Flow. Use official APIs where verified and
manual prompt-package/import flow otherwise.

------------------------------------------------------------------------

## 22. Definition of done

The MVP is ready for first release only when all conditions are true:

1.  All P0 requirements are implemented or explicitly documented as
    blocked by an external provider dependency, with a usable manual
    fallback where feasible.
2.  All P0 acceptance criteria pass.
3.  Clean setup and deployment instructions work.
4.  Database migrations and seed scripts work.
5.  Unit, integration, and end-to-end test suites pass.
6.  Provider adapters are clearly labeled as live, mock, or manual.
7.  No secrets are exposed to clients or logs.
8.  Cost confirmation and budget enforcement work under concurrent
    requests.
9.  Approved versions are immutable and recoverable.
10. Jobs survive worker restart and reconcile safely.
11. A user can complete a test production and export a playable MP4.
12. Known limitations and provider access requirements are documented.
13. The product does not claim guaranteed monetization, perfect
    continuity, or unsupported provider capabilities.

------------------------------------------------------------------------

## 23. Initial implementation task order for Antigravity

Follow this order. Do not skip ahead to a visually impressive storyboard
UI before its data model and job lifecycle are stable.

1.  Read and summarize this specification into an implementation
    checklist without changing requirements.
2.  Identify ambiguities and external dependencies in
    `docs/DECISIONS_REQUIRED.md`; only block on decisions that
    materially affect architecture or user-facing behavior.
3.  Create the web/API/worker/companion repository layout, configuration validation, lint/typecheck/test scripts, and CI.
4.  Implement shared domain types, Zod contracts, standard errors, request IDs, and logging.
5.  Implement PostgreSQL schema, migrations, indexes, and seed fixtures.
6.  Implement authentication/ownership and project CRUD in the Express API.
7.  Implement job domain/state machine, Redis/BullMQ queues, and worker recovery tests.
8.  Implement story artifacts, versioning, mock LLM generation, and
    approval gates.
9.  Implement at least two real text-provider adapters after confirming official API access and schema support; include mock adapters for CI.
10. Implement production-bible extraction and asset versioning.
11. Implement at least two image provider options where verified official APIs are available, plus manual reference upload.
12. Implement scene/shot planning and storyboard approval.
13. Implement mock video adapter and job resilience tests.
14. Verify official video API access, supported features, region/account requirements, and pricing before implementing a live adapter. Do not assume one provider is sufficient for long-term operation.
15. Implement cost estimates/reservations and manual provider handoff.
16. Implement clip import and media validation.
17. Implement timeline data model and validation.
18. Implement local companion FFmpeg rendering, local path safety, checksums and output verification.
19. Implement the UI polish, dashboards, cost/activity views, and
    troubleshooting states.
20. Run acceptance tests, perform a security review, and produce a
    release report.

At every step, update `docs/IMPLEMENTATION_STATUS.md`. Do not claim the
entire app is complete after building only the frontend or mock-provider
path.

------------------------------------------------------------------------

## 24. Decisions frozen for MVP

- Product is a web-based AI filmmaking studio supporting multiple visual styles, not only photorealism.
- Target runtime is usually 5--10 minutes, assembled from shorter shots/clips.
- Website is online and accessible from anywhere.
- Project metadata, scripts, prompts, approvals, settings and job history live online in PostgreSQL.
- Primary full-resolution images, video clips, audio assets and final exports live on the user's computer or external drive, managed by a secure local companion.
- The agreed stack is Next.js + TypeScript + Tailwind CSS; Node.js + Express + TypeScript; PostgreSQL; Redis + BullMQ; AI provider adapters; FFmpeg + FFprobe; standard authentication; and the local companion. Do not silently replace or simplify this stack.
- S3-compatible object storage is optional for explicitly selected previews, temporary transfers, remote copies or backups; it is not the default primary media store.
- User approves story, production bible, shot plan, paid video batch and final timeline. No hidden auto-approval.
- Provider integration is adapter-based and supports task-specific provider/model selection and configured fallback.
- Built-in visual styles include photorealistic cinematic, live-action ad, documentary, anime, 2D cartoon, 3D animation, stop-motion, claymation, comic-book, watercolor, painterly, pixel art, paper cutout, fantasy concept art, vintage film, product showcase and custom.
- Only officially documented APIs are automated. Google Flow UI capabilities are not assumed to have a public API.
- Manual prompt-package export and external-result import are supported when no official API is available.
- No expensive paid generation without explicit cost confirmation and budget validation.
- No automatic YouTube publishing in MVP.
- No claim of guaranteed revenue, copyright clearance or perfect character consistency.
- A successful MVP can complete the workflow, use multiple compatible AI providers, and produce a validated MP4 saved to the user's local/external drive.
- The website remains usable for online project metadata when the local companion is offline; local media operations must show unavailable status rather than silently failing.

------------------------------------------------------------------------

## 25. Stack rationale and constraints

The stack is intentionally separated by responsibility, not split into a large microservice fleet. Next.js builds the web UI; Express provides a dedicated API; PostgreSQL stores structured project state; Redis/BullMQ coordinates long-running jobs; provider adapters isolate vendor-specific APIs; FFmpeg handles deterministic media assembly; authentication protects the online app; and the local companion safely manages local files and rendering.

This architecture is more involved than a single local application, but the additional components serve the explicit requirements: online access, reliable background jobs, multiple AI providers, and local primary media storage. Do not add Kubernetes, a second database, a separate analytics platform, or additional frameworks unless a documented requirement demonstrates the need. Do not remove any agreed component merely to reduce initial setup work; if implementation complexity becomes a blocker, document a proposed change and obtain owner approval first.

------------------------------------------------------------------------

## 26. Glossary

-   **Project:** One film production and all related artifacts.
-   **Story artifact:** Logline, synopsis, outline, screenplay, scene
    breakdown, or related structured document.
-   **Production bible:** Canonical descriptions and reference media for
    characters, locations, props, costumes, vehicles, and visual style.
-   **Scene:** A narrative unit in a location/time context.
-   **Shot:** A single camera setup/action unit intended to generate a
    still and/or short clip.
-   **Storyboard still:** A representative image for a shot.
-   **Clip:** A generated or imported video segment.
-   **Edit sequence:** An ordered arrangement of media and overlays for
    final rendering.
-   **Provider adapter:** Vendor-specific implementation behind a stable
    application interface.
-   **Approval gate:** A user decision required before the next
    production stage.
-   **Manual handoff:** Exporting instructions/references for use in an
    external UI and importing the result back.
-   **Potentially stale:** An artifact may no longer reflect an updated
    upstream version; it remains preserved until the user decides what
    to do.
-   **Idempotency key:** A stable identifier used to prevent duplicate
    processing of the same logical request.
-   **Production bible canonical version:** The approved asset version
    treated as the default reference for new shots.
-   **Cost reservation:** An internal allocation of estimated budget for
    a batch; it is not necessarily a provider-side financial hold.

------------------------------------------------------------------------

**End of specification.**\
**SPEC_VERSION=1.2.0**\
**SPEC_LOCKED=true**
