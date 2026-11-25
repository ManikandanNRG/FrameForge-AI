"use client";

import React from "react";
import { parseInlineTokens, parseMarkdownBlocks } from "./markdown-parser";

function renderInline(text: string, keyPrefix: string) {
  const tokens = parseInlineTokens(text);
  return tokens.map((tok, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (tok.type === "bold") {
      return (
        <strong key={key} className="font-semibold text-white">
          {tok.value}
        </strong>
      );
    }
    if (tok.type === "italic") {
      return (
        <em key={key} className="italic text-slate-300">
          {tok.value}
        </em>
      );
    }
    if (tok.type === "code") {
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700/70 text-amber-300 font-mono text-[11px]"
        >
          {tok.value}
        </code>
      );
    }
    return <React.Fragment key={key}>{tok.value}</React.Fragment>;
  });
}

export function FormattedChatContent({ content }: { content: string }) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-slate-200">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          const sizeClass =
            block.level <= 2
              ? "text-sm font-bold text-amber-300 pt-1"
              : "text-xs font-bold uppercase tracking-wide text-amber-400 pt-1";
          return (
            <h4 key={idx} className={sizeClass}>
              {renderInline(block.text, `h-${idx}`)}
            </h4>
          );
        }

        if (block.type === "hr") {
          return <hr key={idx} className="border-slate-700/70 my-2" />;
        }

        if (block.type === "code") {
          return (
            <pre
              key={idx}
              className="p-2.5 rounded-lg bg-slate-950 border border-slate-700/70 overflow-x-auto text-[11px] font-mono text-slate-200"
            >
              <code>{block.code}</code>
            </pre>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? "ol" : "ul";
          return (
            <ListTag
              key={idx}
              className={`space-y-1 pl-4 ${
                block.ordered ? "list-decimal" : "list-disc"
              } marker:text-amber-400`}
            >
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="pl-0.5">
                  {renderInline(item, `li-${idx}-${itemIdx}`)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "table") {
          return (
            <div
              key={idx}
              className="my-2 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-950/70 shadow-inner"
            >
              <table className="w-full border-collapse text-left text-[11px] leading-snug">
                <thead>
                  <tr className="bg-slate-900/95 border-b border-slate-700/80">
                    {block.headers.map((header, colIdx) => {
                      const align = block.alignments[colIdx] || "left";
                      const alignClass =
                        align === "center"
                          ? "text-center"
                          : align === "right"
                          ? "text-right"
                          : "text-left";
                      return (
                        <th
                          key={colIdx}
                          className={`px-3 py-2 font-bold text-amber-300 whitespace-nowrap ${alignClass}`}
                        >
                          {renderInline(header, `th-${idx}-${colIdx}`)}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {block.rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={rowIdx % 2 === 1 ? "bg-slate-900/35" : "bg-transparent"}
                    >
                      {row.map((cell, colIdx) => {
                        const align = block.alignments[colIdx] || "left";
                        const alignClass =
                          align === "center"
                            ? "text-center"
                            : align === "right"
                            ? "text-right"
                            : "text-left";
                        return (
                          <td
                            key={colIdx}
                            className={`px-3 py-2 align-top text-slate-200 ${
                              colIdx === 0 ? "font-semibold text-white whitespace-nowrap" : ""
                            } ${alignClass}`}
                          >
                            {renderInline(cell, `td-${idx}-${rowIdx}-${colIdx}`)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={idx} className="whitespace-pre-wrap">
            {block.lines.map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {lineIdx > 0 && "\n"}
                {renderInline(line, `p-${idx}-${lineIdx}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
