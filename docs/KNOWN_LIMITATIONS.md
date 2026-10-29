# Known Limitations

- **Localhost only, single user.** No online deployment, no companion pairing,
  no multi-user auth. The app runs on `http://localhost:3000` for one owner.
- **FFmpeg binary installation required.** Timeline assembly and validation are
  implemented, but rendering MP4 requires FFmpeg installed on the system PATH
  or configured via `FFMPEG_PATH` in `.env`.
- **SQLite concurrency.** A single file database with a single in-process worker
  is fine for one local user but is not built for high-concurrency parallelism.
- **Single in-process worker.** One polling worker per process; background jobs
  execute sequentially or with bounded concurrency.
- **Transitive dependency advisories.** `npm audit` reports advisories that have
  not been force-fixed (see `DECISIONS_REQUIRED.md`).
