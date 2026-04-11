import { tool } from "ai";
import { z } from "zod";
import fs from "fs";
import path from "path";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const CONTEXT_LINES = 5; // lines of context around each match
const MAX_RESULTS = 6;

interface SearchResult {
  source: string;
  excerpt: string;
  matchCount: number;
}

function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }
  return files;
}

function searchFile(
  filePath: string,
  terms: string[]
): SearchResult | null {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }

  const lines = content.split("\n");
  const lowerContent = content.toLowerCase();
  const lowerTerms = terms.map((t) => t.toLowerCase());

  // Count how many terms appear in the file
  const matchCount = lowerTerms.filter((t) => lowerContent.includes(t)).length;
  if (matchCount === 0) return null;

  // Find lines that contain any of the terms and extract context
  const matchingLineIndices = new Set<number>();
  lines.forEach((line, i) => {
    const lowerLine = line.toLowerCase();
    if (lowerTerms.some((t) => lowerLine.includes(t))) {
      for (let j = Math.max(0, i - CONTEXT_LINES); j <= Math.min(lines.length - 1, i + CONTEXT_LINES); j++) {
        matchingLineIndices.add(j);
      }
    }
  });

  if (matchingLineIndices.size === 0) return null;

  // Build excerpt from matching line ranges
  const sortedIndices = Array.from(matchingLineIndices).sort((a, b) => a - b);
  const excerptLines: string[] = [];
  let lastIndex = -2;

  for (const idx of sortedIndices) {
    if (idx > lastIndex + 1 && excerptLines.length > 0) {
      excerptLines.push("...");
    }
    excerptLines.push(lines[idx]);
    lastIndex = idx;
  }

  // Relative path for citation
  const relativePath = path.relative(KNOWLEDGE_DIR, filePath).replace(/\\/g, "/");

  return {
    source: relativePath,
    excerpt: excerptLines.join("\n").trim(),
    matchCount,
  };
}

export const searchKnowledgeTool = tool({
  description:
    "Search the ASPACK knowledge base for technical information about cardboard packaging materials, manufacturing processes, regulations, ECMA standards, sustainability, or glossary terms. Use this tool when answering technical questions to find relevant documented information before responding.",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "The search query — use specific technical terms (e.g. 'SBS gramaje', 'PPWR reciclabilidad', 'ECMA tuck-end', 'offset UV barniz')"
      ),
  }),
  execute: async ({ query }) => {
    const terms = query
      .split(/\s+/)
      .filter((t) => t.length > 2)
      .slice(0, 8);

    if (terms.length === 0) {
      return { results: [], message: "No search terms provided." };
    }

    const files = getAllMarkdownFiles(KNOWLEDGE_DIR);

    if (files.length === 0) {
      return {
        results: [],
        message:
          "The knowledge base is currently empty. Answer based on your built-in expertise.",
      };
    }

    const results: SearchResult[] = [];
    for (const file of files) {
      const result = searchFile(file, terms);
      if (result) results.push(result);
    }

    // Sort by match count descending
    results.sort((a, b) => b.matchCount - a.matchCount);
    const topResults = results.slice(0, MAX_RESULTS);

    if (topResults.length === 0) {
      return {
        results: [],
        message:
          "No matching documents found in the knowledge base for this query. Answer based on your built-in expertise.",
      };
    }

    return {
      results: topResults.map((r) => ({
        source: `knowledge/${r.source}`,
        excerpt: r.excerpt,
      })),
      message: `Found ${topResults.length} relevant document(s).`,
    };
  },
});
