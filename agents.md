# AGENTS.md — AI Filmmaking Studio

## 1. Source of Truth

- `PROJECT_SPEC.md` is the authoritative product and technical specification.
- Read the relevant specification sections before implementing any feature.
- Follow approved decisions recorded in `docs/ARCHITECTURE_DECISIONS.md`.
- Track progress in `docs/IMPLEMENTATION_STATUS.md`.
- Record unresolved questions in `docs/DECISIONS_REQUIRED.md`.
- Never silently remove, weaken or reinterpret a requirement.

## 2. Technology Stack — Do Not Change Without Approval

Use the agreed stack:

- Frontend: Next.js, TypeScript and Tailwind CSS.
- Backend: Node.js, Express and TypeScript.
- Database: PostgreSQL.
- Background jobs: Redis and BullMQ.
- AI integration: provider adapters for supported text, image and video-generation services.
- Media processing: FFmpeg and FFprobe.
- Authentication: Auth.js or the approved standard authentication solution.
- Media storage: local computer or external drive through the local companion service.
- Online deployment: web frontend, backend and database accessible remotely.

S3-compatible storage is optional, not the default media store.

Do not replace technologies, add major frameworks, introduce a microservices architecture or add infrastructure without explaining the reason and obtaining approval.

## 3. Development Workflow

- Work in the implementation phases defined in `PROJECT_SPEC.md`.
- Start with Phase 0 only.
- Inspect existing files before modifying them.
- Present the plan and acceptance criteria before substantial implementation.
- Wait for approval at phase boundaries.
- Implement small, testable increments.
- Do not attempt to build the entire application in one task.
- Do not overwrite existing working code without inspecting its purpose.
- Keep changes scoped to the approved task.

## 4. Engineering Standards

- Use TypeScript and explicit types for application boundaries.
- Validate all external inputs on the server.
- Use consistent error handling and structured logging.
- Keep frontend components separate from business logic.
- Keep AI provider-specific code inside provider adapters.
- Use database migrations for schema changes.
- Use environment variables for configuration.
- Avoid duplicated logic, unnecessary abstractions and premature optimization.
- Follow established project conventions once they are documented.
- Never claim that a feature is complete without checking its implementation and tests.

## 5. AI Provider Integrations

- Use official APIs and supported authentication methods.
- Keep text, image and video capabilities separate in the provider capability registry.
- Do not assume that every provider supports every operation.
- Do not assume a consumer-facing AI website or application has a public API.
- Never automate a website UI as a substitute for an official API unless explicitly approved and legally supported.
- Never report mock responses as real AI-generated results.
- Support provider selection, model configuration, capability checks, timeouts, retries and useful error messages.
- Never switch providers silently if the change could affect cost, quality, privacy or user settings.
- Check API availability, pricing, quotas and account requirements before enabling an integration.
- Do not initiate paid generation without explicit approval.

## 6. Local Media and Companion Security

- The online application must remain usable for project management when the local companion is offline.
- Clearly distinguish online project data from locally available media.
- Access only explicitly configured local media directories.
- Validate paths and prevent directory traversal.
- Do not expose an unauthenticated local service to the public internet.
- Authenticate companion pairing and authorize every operation.
- Use secure outbound communication with the online backend.
- Never expose provider API keys or server secrets to browser code or local media files.
- Detect unavailable drives and report missing media clearly.
- Make file transfers and rendering jobs recoverable where practical.
- Never delete or overwrite source media without explicit user authorization.

## 7. Background Jobs and Reliability

- Use BullMQ for appropriate long-running background jobs.
- Make retries bounded and use backoff for transient failures.
- Avoid duplicate generation and export jobs through idempotency controls.
- Persist meaningful job states and error details.
- Support cancellation where practical.
- Handle worker restarts and interrupted operations.
- Do not treat a queued job as a completed job.
- Distinguish failed, cancelled, pending, running and completed operations.

## 8. Testing and Completion Criteria

- Add tests for important business logic and security-sensitive operations.
- Test provider adapters with mocks and contract tests before paid live calls.
- Test failure paths, retries, invalid inputs and unavailable local drives.
- Run relevant automated tests, linting and type checks.
- Do not claim tests passed unless they were actually run.
- Document tests that could not be executed and why.
- Verify the phase acceptance criteria in `PROJECT_SPEC.md` before marking a phase complete.

## 9. Documentation and Status

After each approved task:

- Update `docs/IMPLEMENTATION_STATUS.md`.
- Record important architectural choices in `docs/ARCHITECTURE_DECISIONS.md`.
- Record unresolved blockers in `docs/DECISIONS_REQUIRED.md`.
- Document known limitations in `docs/KNOWN_LIMITATIONS.md`.
- Report files changed, tests run, actual results, remaining risks and the next recommended step.

## 10. Communication Rules

- Explain important decisions in clear language.
- Ask before making a major architectural decision not covered by the specification.
- Do not repeatedly ask questions already answered in project documentation.
- If a requirement is ambiguous, identify the ambiguity and propose a recommendation.
- If a provider or feature is unavailable, explain the limitation and propose a verified alternative.
- Prioritize a working, secure and maintainable implementation over unnecessary complexity.

## Final Rule

The objective is to build the application defined in `PROJECT_SPEC.md`, not a different application that merely resembles it. Preserve the agreed architecture, implement incrementally, verify the results and request approval at phase boundaries.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
