import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found");
    return;
  }
  console.log("Found user:", user.id, user.email);

  let series = await prisma.series.findFirst({ where: { slug: "inedible-tech-asmr" } });
  if (!series) {
    series = await prisma.series.create({
      data: {
        ownerId: user.id,
        title: "The Shadow Alchemist — Inedible ASMR",
        slug: "inedible-tech-asmr",
        description:
          "Oddly satisfying culinary transformation of vintage technology and hardware into 5-star acoustic ASMR masterworks (20s Bayashi 2X Rapid Pacing).",
        visualStyle: "CULINARY_MACRO_ASMR",
        genre: "Culinary & Cooking ASMR",
        tone: "Satisfying, Crisp & Hypnotic",
        dialogueMode: "PURE_ASMR_FOLEY",
        aspectRatio: "PORTRAIT_9_16",
        targetRuntime: 20,
        storyLanguage: "en",
        defaultStudioEnvironment: "Dark Walnut End-Grain Butcher Block",
        defaultChefWardrobe:
          "vintage brass tinker goggles, sleek matte-black half-mask with gold cheekline slit vents, leather artisan apron, black grip gloves",
      },
    });
    console.log("Created Series:", series.id, series.title);
  } else {
    console.log("Existing Series found:", series.id, series.title);
  }

  // Link Episode 1
  const ep1 = await prisma.project.findUnique({ where: { id: "cmwg5nczz0001u88skd5gnrmd" } });
  if (ep1) {
    await prisma.project.update({
      where: { id: ep1.id },
      data: {
        seriesId: series.id,
        episodeNumber: 1,
        studioEnvironment: "Dark Cyberpunk Scrapyard & Industrial Wok Burner",
      },
    });
    console.log("Linked Episode 1:", ep1.title);
  }

  // Link Episode 2
  const ep2 = await prisma.project.findUnique({ where: { id: "cmwja2y3t0001u8qgfh5w3gtj" } });
  if (ep2) {
    await prisma.project.update({
      where: { id: ep2.id },
      data: {
        seriesId: series.id,
        episodeNumber: 2,
        studioEnvironment: "Dark Walnut Butcher Block & Tempura Oil Pot",
      },
    });
    console.log("Linked Episode 2:", ep2.title);
  }

  const seriesWithEpisodes = await prisma.series.findUnique({
    where: { id: series.id },
    include: { episodes: { orderBy: { episodeNumber: "asc" } } },
  });
  console.log(
    "Series has episodes:",
    seriesWithEpisodes?.episodes.map((e) => `Ep ${e.episodeNumber}: ${e.title}`)
  );
}

main().catch(console.error).finally(() => prisma.$disconnect());
