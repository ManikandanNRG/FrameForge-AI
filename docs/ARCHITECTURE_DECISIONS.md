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
