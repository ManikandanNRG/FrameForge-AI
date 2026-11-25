export type TextAlign = "left" | "center" | "right";

export type MarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "paragraph"; lines: string[] }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; language?: string; code: string }
  | { type: "hr" }
  | {
      type: "table";
      headers: string[];
      alignments: TextAlign[];
      rows: string[][];
    };

function isTableRowLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  // Require at least two pipe-separated cells or starting+ending pipe
  return trimmed.startsWith("|") || trimmed.split("|").length >= 3;
}

function splitTableCells(line: string): string[] {
  const trimmed = line.trim();
  const stripped = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  return stripped.split("|").map((cell) => cell.trim());
}

function isTableSeparatorLine(line: string): boolean {
  const cells = splitTableCells(line);
  if (cells.length === 0) return false;
  return cells.every((cell) => /^:?-{2,}:?$/.test(cell.trim()));
}

function parseAlignments(separatorLine: string, expectedCols: number): TextAlign[] {
  const cells = splitTableCells(separatorLine);
  const alignments: TextAlign[] = [];
  for (let i = 0; i < expectedCols; i++) {
    const raw = (cells[i] || "---").trim();
    if (raw.startsWith(":") && raw.endsWith(":")) {
      alignments.push("center");
    } else if (raw.endsWith(":")) {
      alignments.push("right");
    } else {
      alignments.push("left");
    }
  }
  return alignments;
}

/**
 * Parses markdown text (including GFM tables, headings, lists, and fenced code)
 * into structured blocks for safe React rendering.
 */
export function parseMarkdownBlocks(input: string): MarkdownBlock[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code block
    const fenceMatch = trimmed.match(/^```(\w+)?\s*$/);
    if (fenceMatch) {
      const language = fenceMatch[1];
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: "code", language, code: codeLines.join("\n") });
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length as 1 | 2 | 3 | 4,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // GFM Table (header + separator + 0..N rows)
    if (
      i + 1 < lines.length &&
      isTableRowLine(lines[i]) &&
      isTableSeparatorLine(lines[i + 1])
    ) {
      const headers = splitTableCells(lines[i]);
      const alignments = parseAlignments(lines[i + 1], headers.length);
      const rows: string[][] = [];
      i += 2;

      while (i < lines.length && lines[i].trim() !== "" && isTableRowLine(lines[i])) {
        const rowCells = splitTableCells(lines[i]);
        // Normalize row length to header count
        const normalized = Array.from({ length: headers.length }, (_, idx) => rowCells[idx] ?? "");
        rows.push(normalized);
        i++;
      }

      blocks.push({ type: "table", headers, alignments, rows });
      continue;
    }

    // Unordered or ordered list
    const ulMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    const olMatch = trimmed.match(/^\d+[.)]\s+(.+)$/);
    if (ulMatch || olMatch) {
      const ordered = Boolean(olMatch);
      const items: string[] = [];
      while (i < lines.length) {
        const current = lines[i].trim();
        const match = ordered
          ? current.match(/^\d+[.)]\s+(.+)$/)
          : current.match(/^[-*•]\s+(.+)$/);
        if (!match) break;
        items.push(match[1].trim());
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    // Paragraph (stop before structural blocks)
    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i];
      const curTrimmed = current.trim();
      if (!curTrimmed) break;
      if (
        /^```/.test(curTrimmed) ||
        /^#{1,4}\s+/.test(curTrimmed) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(curTrimmed) ||
        /^[-*•]\s+/.test(curTrimmed) ||
        /^\d+[.)]\s+/.test(curTrimmed) ||
        (i + 1 < lines.length && isTableRowLine(current) && isTableSeparatorLine(lines[i + 1]))
      ) {
        break;
      }
      paraLines.push(current);
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", lines: paraLines });
    }
  }

  return blocks;
}

export type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "code"; value: string };

/**
 * Tokenizes inline bold, italic, and code spans without using HTML injection.
 */
export function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    const raw = match[0];
    if (raw.startsWith("**") && raw.endsWith("**")) {
      tokens.push({ type: "bold", value: raw.slice(2, -2) });
    } else if (raw.startsWith("`") && raw.endsWith("`")) {
      tokens.push({ type: "code", value: raw.slice(1, -1) });
    } else if (raw.startsWith("*") && raw.endsWith("*")) {
      tokens.push({ type: "italic", value: raw.slice(1, -1) });
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens;
}
