import { z } from "zod";

export const ProductionBibleSchema = z.object({
  characters: z.array(z.object({
    name: z.string(),
    role: z.string(),
    age: z.string().optional(),
    appearance: z.string(),
    wardrobe: z.string().optional(),
    personality: z.string(),
    arc: z.string().optional(),
  })),
  locations: z.array(z.object({
    name: z.string(),
    description: z.string(),
    lighting: z.string().optional(),
    timeOfDayVariants: z.array(z.string()).optional(),
  })),
  props: z.array(z.object({
    name: z.string(),
    description: z.string(),
    owner: z.string().optional(),
  })).optional(),
  visualStyleNotes: z.string().optional(),
});

export type ProductionBible = z.infer<typeof ProductionBibleSchema>;
