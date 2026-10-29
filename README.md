# AI Filmmaking Studio

One unified, automated tool to turn a story idea into a finished film:
**Idea $\rightarrow$ Story Studio $\rightarrow$ Production Bible $\rightarrow$ Storyboard Shots $\rightarrow$ AI Image/Video Generation $\rightarrow$ Timeline Assembly $\rightarrow$ MP4 Export.**

You describe the film idea; the studio develops the screenplay, extracts the production entities (characters, locations, props), plans camera shots, generates storyboard images (via DALL·E 3) and video clips (via Kling AI), auto-assembles the editing sequence, and renders the final video with FFmpeg.

---

## Features

- **Story Studio:** Automated multi-step screenplay development (logline, synopsis, outline, character arcs, scene-by-scene script) powered by Google Gemini (free tier) or OpenAI.
- **Production Bible:** Screenplay entity extraction identifying characters, wardrobes, locations, and props with draft approval states.
- **Storyboard & Cinematography:** Automated shot breakdown with camera movement, lighting, mood, framing, and tailored image/video prompts.
- **AI Image Generation:** One-click DALL·E 3 generation for all shot storyboard stills with live thumbnail and preview streaming.
- **AI Video Generation:** Async background video generation powered by Kling AI, downloading completed MP4 clips directly into the project library.
- **Auto-Assembled Timeline:** One-click timeline synchronization that builds frame-accurate video/audio sequences from shots in narrative order.
- **FFmpeg MP4 Rendering:** Safe, non-shell background rendering of your edited sequences to high-quality MP4.
- **Secure Key Management:** AES-256-GCM encryption for provider credentials stored in SQLite.
- **Durable Job Worker:** Resilient background job queue with crash reconciliation, bounded retries, and exponential backoff.

---

## Quickstart

```powershell
# 1. Install dependencies
npm install

# 2. Database setup
npm run db:migrate
npm run db:seed

# 3. Start app and worker concurrently
npm run dev
```

Open `http://localhost:3000` in your browser.
Sign in at `/login` with the passcode from your `.env` (`AUTH_PASSCODE`, default: `frameforge`).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs both Next.js web (`localhost:3000`) and the background worker concurrently |
| `npm run dev:web` | Starts only the Next.js frontend |
| `npm run worker` | Starts only the background job worker |
| `npm run build` | Compiles TypeScript and creates optimized production build |
| `npm run start` | Runs the production build |
| `npm run typecheck` | Validates TypeScript types across the entire project |
| `npm run test` | Runs the Vitest test suite |
| `npm run db:migrate` | Runs Prisma migrations |
| `npm run db:studio` | Opens Prisma Studio to view database records |

---

## Project Structure

```
src/
  app/                    Next.js App Router (pages & API routes)
    api/
      auth/               Login, logout, session verification
      jobs/               Background job queue status & polling
      media/              Path-safe local media streaming & checksums
      projects/           Project CRUD, story, bible, shots, sequences
      sequences/          Timeline sync and FFmpeg export jobs
      settings/           Provider API key configuration & testing
    projects/             Project dashboard, Story Studio, Bible, Storyboard, Editor
    settings/             Provider configuration (Gemini, OpenAI, Kling)
  lib/
    api/                  Standard API envelope & error handlers
    auth/                 Iron-session encrypted cookie authentication
    bible/                Production bible schemas & extraction logic
    crypto/               AES-256-GCM key encryption
    db/                   Prisma client singleton
    edit/                 Frame-accurate timeline schema & FFmpeg engine
    jobs/                 Job queue, state machine, worker, and handlers
    media/                Path traversal prevention & SHA-256 checksums
    providers/            AI adapters (Gemini, OpenAI, Kling, Mock)
    shots/                Cinematography planning schemas & service
    story/                Story prompts, schemas & multi-step pipeline
prisma/                   SQLite schema, migrations, and seed script
tests/unit/               Vitest unit test suite
docs/                     Architecture decisions, runbooks, and implementation status
```

---

## Architecture & Technology Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide icons.
- **Backend:** Next.js API Routes, TypeScript, iron-session.
- **Database:** SQLite via Prisma ORM (portable to PostgreSQL).
- **Background Processing:** Durable DB-backed job queue with polling worker.
- **AI Providers:**
  - Text: Google Gemini (`@google/generative-ai`), OpenAI (`openai`).
  - Image: DALL·E 3 (`openai`).
  - Video: Kling AI (JWT authentication).
- **Media Processing:** FFmpeg / FFprobe via safe non-shell subprocess execution.
