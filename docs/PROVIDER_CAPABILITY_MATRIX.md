# Provider Capability Matrix

Phase 0 has **no live providers** — all are `UNVERIFIED` and no AI/paid call is
made. This matrix is a stub to be filled during Phase 1+ after verifying each
official API, account access, pricing, quotas, regions, and terms (spec §7.2,
§7.5). Nothing here is a claim of working capability.

| Provider | Story | Image | Video | Status | Notes |
|---|---|---|---|---|---|
| OpenAI API | planned | planned | — | UNVERIFIED | Official API only; API billing separate from ChatGPT (spec §7.2.1) |
| Google Gemini API | planned | planned | Veo (where access allows) | UNVERIFIED | Do not assume Flow's UI has a public API (spec §7.10) |
| Anthropic Claude API | planned | — | — | UNVERIFIED | Text tasks only |
| OpenRouter | planned | — | — | UNVERIFIED | Each routed model verified separately |
| Stability AI | — | planned | — | UNVERIFIED | Verify current API + model availability |
| Replicate | — | possible | possible | UNVERIFIED | Per-model schema, pricing, rights |

**Status values:** VERIFIED · UNVERIFIED · DISABLED · MANUAL_HANDOFF.

Before an adapter is marked `VERIFIED`: confirm official docs, account access,
regions, rate limits, pricing, terms, and that the capability is genuinely
supported by the selected model. Capability is per-model, not per-provider
(spec §7.1). Do not display a control as supported unless the active adapter
supports it (FR-VIDEO-003).
