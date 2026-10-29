import "dotenv/config";
import { logger } from "@/lib/logger";
import { startWorker, stopWorker } from "./worker";

// Entry point for `npm run worker`. Not imported by the app.
startWorker().catch((err) => {
  logger.error({ err }, "failed to start worker");
  process.exit(1);
});

process.on("SIGINT", async () => {
  await stopWorker();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await stopWorker();
  process.exit(0);
});
