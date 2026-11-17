import { describe, it, expect } from "vitest";
import path from "node:path";
import { getProjectStorageDir, getSeriesSharedAssetsDir } from "@/lib/media/storage-paths";

describe("Isolated Media Storage Paths", () => {
  const root = "D:/kilo/media";

  it("resolves isolated episodic directory for series episodes", () => {
    const project = {
      id: "cmwja2y3t0001u8qgfh5w3gtj",
      episodeNumber: 2,
      series: {
        id: "series_123",
        slug: "inedible-tech-asmr",
        title: "The Shadow Alchemist — Inedible ASMR",
      },
    };

    const dir = getProjectStorageDir(project, root);
    const expected = path.join(path.resolve(root), "channels", "inedible-tech-asmr", "episodes", "ep2_5w3gtj");
    expect(dir).toBe(expected);
  });

  it("resolves standard directory for standalone projects without series", () => {
    const project = {
      id: "standalone_proj_999",
      episodeNumber: null,
      series: null,
    };

    const dir = getProjectStorageDir(project, root);
    const expected = path.join(path.resolve(root), "projects", "standalone_proj_999");
    expect(dir).toBe(expected);
  });

  it("resolves channel shared assets directory", () => {
    const sharedDir = getSeriesSharedAssetsDir("inedible-tech-asmr", root);
    const expected = path.join(path.resolve(root), "channels", "inedible-tech-asmr", "shared-assets");
    expect(sharedDir).toBe(expected);
  });
});
