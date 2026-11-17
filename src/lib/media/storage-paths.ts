import path from "node:path";
import { normalizeRoot } from "./paths";

export interface ProjectStorageContext {
  id: string;
  episodeNumber?: number | null;
  series?: {
    id: string;
    slug: string;
    title: string;
  } | null;
}

/**
 * Resolves the isolated local storage directory for a project or episodic series.
 * 
 * Channels & Episodic Projects:
 *   <mediaRoot>/channels/<channel-slug>/episodes/ep<N>_<projectId-short>/
 * 
 * Standalone Films:
 *   <mediaRoot>/projects/<projectId>/
 */
export function getProjectStorageDir(
  project: ProjectStorageContext,
  mediaRoot?: string
): string {
  const root = normalizeRoot(mediaRoot || "./media");

  if (project.series?.slug) {
    const epNum = project.episodeNumber ? `ep${project.episodeNumber}` : "ep_standalone";
    const shortId = project.id.slice(-6);
    return path.join(root, "channels", project.series.slug, "episodes", `${epNum}_${shortId}`);
  }

  return path.join(root, "projects", project.id);
}

/**
 * Resolves the channel-level shared asset directory (for shared character portraits, channel logos, etc.).
 *   <mediaRoot>/channels/<channel-slug>/shared-assets/
 */
export function getSeriesSharedAssetsDir(
  seriesSlug: string,
  mediaRoot?: string
): string {
  const root = normalizeRoot(mediaRoot || "./media");
  return path.join(root, "channels", seriesSlug, "shared-assets");
}
