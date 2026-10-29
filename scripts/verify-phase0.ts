/**
 * Phase 0 end-to-end verification (no AI / paid calls).
 * Exercises the real DB-backed job queue + worker and the local media layer,
 * against the real SQLite database, so we don't just claim it works.
 *
 * Run: npx tsx scripts/verify-phase0.ts
 */
import "dotenv/config";
import path from "node:path";
import { writeFile, rm } from "node:fs/promises";
import { prisma } from "../src/lib/db/client";
import { enqueue } from "../src/lib/jobs/queue";
import { startWorker, stopWorker } from "../src/lib/jobs/worker";
import { addRoot, listFiles, fileChecksum, rootAvailability } from "../src/lib/media/media-root";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const email = process.env.OWNER_EMAIL ?? "owner@local";
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, displayName: "Owner" },
  });

  // 1) Queue + worker end-to-end: enqueue an ECHO job and wait for SUCCEEDED.
  const job = await enqueue({
    jobType: "ECHO",
    requestPayload: { verify: "phase0" },
    projectId: null,
  });
  console.log(`enqueued ECHO job ${job.id} (${job.status})`);

  await startWorker();

  let final = await prisma.generationJob.findUnique({ where: { id: job.id } });
  const deadline = Date.now() + 15000;
  while (final && final.status !== "SUCCEEDED" && final.status !== "FAILED" && Date.now() < deadline) {
    await sleep(400);
    final = await prisma.generationJob.findUnique({ where: { id: job.id } });
  }
  await stopWorker();

  console.log(`final job status: ${final?.status} result: ${final?.resultPayload}`);
  if (final?.status !== "SUCCEEDED") {
    throw new Error(`ECHO job did not succeed (status=${final?.status})`);
  }

  // 2) Local media layer: register a root, write a file, list, checksum, availability.
  const rootPath = path.resolve("./media");
  await addRoot(user.id, "verify-root", rootPath);
  const fileAbs = path.join(rootPath, "verify.txt");
  await writeFile(fileAbs, "hello phase 0", "utf8");

  const files = await listFiles(rootPath);
  const ck = await fileChecksum(rootPath, "verify.txt");
  const avail = await rootAvailability(rootPath);
  console.log(`media files: ${files.map((f) => f.name).join(", ")}`);
  console.log(`media checksum: ${ck.sha256}`);
  console.log(`media availability: ${JSON.stringify(avail)}`);

  if (!avail.online) throw new Error("media root reported offline");
  if (!files.some((f) => f.name === "verify.txt")) throw new Error("written file not listed");
  if (ck.sha256.length !== 64) throw new Error("checksum wrong length");

  // cleanup
  await prisma.mediaRoot.deleteMany({ where: { label: "verify-root" } });
  await rm(fileAbs, { force: true });

  console.log("PHASE 0 VERIFICATION PASSED");
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error("VERIFY FAILED:", e);
  await prisma.$disconnect();
  process.exit(1);
});
