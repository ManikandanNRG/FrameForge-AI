// Loaded in every vitest worker before tests run, so modules that read
// process.env (e.g. src/lib/env.ts) see the local .env values.
import "dotenv/config";
