# Decisions Required

Open items that need the product owner before the next phase. None of these
block Phase 0; they gate later work.

1. **Going online / multi-user in a future version.** Phase 0 is localhost
   only. When/if a later version goes online, decide: adopt Auth.js, move to
   PostgreSQL + Redis+BullMQ, and build the local companion (pairing, outbound
   connection). The owner will decide this when planning the next version.

2. **Phase 1 provider choices.** Spec §7.2 targets OpenAI, Gemini, Anthropic,
   OpenRouter, Stability, Replicate. Before any live adapter: confirm official
   API access, account/region/region access, pricing, quotas, and terms. **No
   paid calls without explicit owner approval.** A mock provider covers CI.

3. **FFmpeg before Phase 4.** FFmpeg/FFprobe are not installed on this machine
   and are only needed for the edit/export phase. Decide an install method
   (official build / package manager) before Phase 4.

4. **ESLint.** Lint is intentionally deferred in Phase 0 (Next 16 removed the
   in-config ESLint key). Decide whether to add ESLint flat-config or another
   linter in an early Phase 1 hardening step.

5. **npm audit advisories.** `npm audit` reports 9 transitive advisories
   (4 moderate, 3 high, 2 critical) in the dependency tree. None were
   force-fixed (to avoid breaking changes). Decide whether to address them
   before proceeding.
