# Local Media & Companion

## Phase 0 (current): direct local access, no companion

This version runs on localhost for one user, so there is **no separate companion
service and no pairing**. The app reads and writes local media directly through
`src/lib/media/`:

- `media-root.ts` — register/list user-approved local folders; report
  online/offline + free space (spec §6.6.2, FR-MEDIA-009).
- `paths.ts` — path-traversal-safe resolution; only files inside a registered
  root can be accessed (spec §6.6.4, §12.3).
- `checksum.ts` — streamed SHA-256 (spec §6.6.6).

Removing a root deletes the DB reference only, never files (spec §6.6.9). The
app stays usable for project metadata when a drive is offline; local media
operations report unavailable.

## Future version: the companion (online/remote)

When a later version goes online (spec §6.3, §6.6), a small companion service on
the user's machine replaces direct access:

- Pairs with the authenticated account via a short-lived one-time code.
- Maintains an **outbound** authenticated connection — no public inbound ports,
  no router forwarding, no unauthenticated local endpoint (FR-COMP-008).
- Accesses only user-approved roots; rejects traversal/symlink escapes.
- Runs FFmpeg with allowlisted argument arrays for export rendering.
- Heartbeats status (online/offline, drive availability, free space) to the API.

The current `media/` module maps onto the companion operations (spec §6.6.1):
`register-root`/`remove-root`, `inspect-media` (list + checksum), and the future
`transfer-download`/`transfer-upload`/`render-export`. The domain logic and
storage-reference model are written so the companion can be introduced without
redesigning project data.
