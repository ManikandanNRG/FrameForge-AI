import { type NextRequest } from "next/server";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db/client";
import { requireUserId } from "@/lib/auth/session";

/**
 * GET /api/media/file?path=<absolute-path>
 * Serves a local media file if the path is within a registered media root
 * owned by the authenticated user. Used to display generated images in browser.
 */
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const ownerId = await requireUserId();
    const filePath = req.nextUrl.searchParams.get("path");
    if (!filePath) return new Response("path is required", { status: 400 });

    const normalized = path.normalize(filePath);

    // Verify the path belongs to a registered media root owned by this user
    const roots = await prisma.mediaRoot.findMany({ where: { ownerId } });
    // Also allow the default ./media directory
    const defaultRoot = path.resolve("./media");
    const allRoots = [defaultRoot, ...roots.map((r) => r.path)];

    const allowed = allRoots.some(
      (root) => normalized.startsWith(path.normalize(root) + path.sep) || normalized.startsWith(path.normalize(root)),
    );
    if (!allowed) return new Response("Forbidden", { status: 403 });

    if (!existsSync(normalized)) return new Response("File not found", { status: 404 });

    const stats = await stat(normalized);
    const ext = path.extname(normalized).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
      ".webp": "image/webp", ".gif": "image/gif",
      ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
      ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4",
    };
    const contentType = mimeMap[ext] ?? "application/octet-stream";

    const rangeHeader = req.headers.get("range");

    if (rangeHeader && (contentType.startsWith("video/") || contentType.startsWith("audio/"))) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunkSize = end - start + 1;

      const stream = createReadStream(normalized, { start, end });
      const webStream = new ReadableStream({
        start(controller) {
          stream.on("data", (chunk) => controller.enqueue(chunk));
          stream.on("end", () => controller.close());
          stream.on("error", (err) => controller.error(err));
        },
        cancel() { stream.destroy(); },
      });

      return new Response(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${stats.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkSize),
          "Content-Type": contentType,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    // Stream the whole file
    const stream = createReadStream(normalized);
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
      cancel() { stream.destroy(); },
    });

    return new Response(webStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stats.size),
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("401")) {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response("Internal error", { status: 500 });
  }
}
