import { describe, expect, it } from "vitest";
import { parseInlineTokens, parseMarkdownBlocks } from "@/components/chat/markdown-parser";

describe("parseMarkdownBlocks", () => {
  it("parses culinary comparison GFM tables cleanly alongside headings and lists", () => {
    const md = `Let's pivot to **Crispy Cinnamon Churro Bat & Red Velvet Truffle Ball**!

### Creative Culinary Comparison Table

| Real Dish Element | Inedible Component | Cooking Method |
| :--- | :--- | :--- |
| Golden Churro Bat | English Willow Bat | Deep-fried choux pastry press |
| Red Velvet Truffle Ball | Leather Cricket Ball | Chill-molded red-velvet cake sphere |

### Recommended Strategy
- **Optimal Runtime:** 20s–30s
- **Acoustic Hook (0.0s):** Deep **CRACK** sound`;

    const blocks = parseMarkdownBlocks(md);

    expect(blocks.map((b) => b.type)).toEqual([
      "paragraph",
      "heading",
      "table",
      "heading",
      "list",
    ]);

    const table = blocks[2];
    expect(table.type).toBe("table");
    if (table.type === "table") {
      expect(table.headers).toEqual([
        "Real Dish Element",
        "Inedible Component",
        "Cooking Method",
      ]);
      expect(table.alignments).toEqual(["left", "left", "left"]);
      expect(table.rows).toHaveLength(2);
      expect(table.rows[0][0]).toBe("Golden Churro Bat");
      expect(table.rows[1][2]).toBe("Chill-molded red-velvet cake sphere");
    }
  });

  it("handles inline bold, italic, and code tokens", () => {
    const tokens = parseInlineTokens("Use **CRACK** with *steam* and `0.0s` hook");
    expect(tokens).toEqual([
      { type: "text", value: "Use " },
      { type: "bold", value: "CRACK" },
      { type: "text", value: " with " },
      { type: "italic", value: "steam" },
      { type: "text", value: " and " },
      { type: "code", value: "0.0s" },
      { type: "text", value: " hook" },
    ]);
  });
});
