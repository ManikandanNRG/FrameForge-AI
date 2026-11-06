import { z } from "zod";

const CharacterItemSchema = z.object({
  name: z.string().default("Character"),
  role: z.string().default("Supporting"),
  age: z.string().optional().default(""),
  appearance: z.string().default(""),
  wardrobe: z.string().optional().default(""),
  personality: z.string().default(""),
  arc: z.string().optional().default(""),
  googleFlowCharacterPrompt: z.string().optional().default(""),
  voiceProfile: z.string().optional().default(""),
});

const LocationItemSchema = z.object({
  name: z.string().default("Location"),
  description: z.string().default(""),
  lighting: z.string().optional().default(""),
  timeOfDayVariants: z.array(z.string()).optional().default([]),
});

const PropItemSchema = z.object({
  name: z.string().default("Prop"),
  description: z.string().default(""),
  owner: z.string().optional().default(""),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ProductionBibleSchema = z.preprocess((val: any) => {
  if (!val) return { characters: [], locations: [], props: [] };
  if (Array.isArray(val)) {
    return { characters: val, locations: [], props: [] };
  }
  return {
    characters: Array.isArray(val.characters) ? val.characters : [],
    locations: Array.isArray(val.locations) ? val.locations : [],
    props: Array.isArray(val.props) ? val.props : [],
    visualStyleNotes: typeof val.visualStyleNotes === "string" ? val.visualStyleNotes : "",
  };
}, z.object({
  characters: z.array(CharacterItemSchema).default([]),
  locations: z.array(LocationItemSchema).default([]),
  props: z.array(PropItemSchema).optional().default([]),
  visualStyleNotes: z.string().optional().default(""),
}));

export type ProductionBible = z.infer<typeof ProductionBibleSchema>;
