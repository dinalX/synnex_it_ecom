import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Resolves real product image URLs from the synnex.lk Google Shopping feed
 * (feed-11431.csv) by product name, so seeded products get real photos
 * instead of the placeholder SVGs. Falls back to null when no confident
 * match exists.
 */

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const normalize = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim();
const tokensOf = (s: string) => new Set(normalize(s).split(" ").filter(Boolean));

type FeedEntry = { title: string; image: string; tokens: Set<string> };

export function loadFeedImageResolver(
  csvPath = fileURLToPath(new URL("./feed-11431.csv", import.meta.url)),
) {
  let feed: FeedEntry[] = [];
  try {
    const rows = parseCsv(readFileSync(csvPath, "utf8"));
    const header = rows[0];
    const titleIdx = header.indexOf("title");
    const imageIdx = header.indexOf("image_link");
    feed = rows
      .slice(1)
      .filter((r) => r[titleIdx] && r[imageIdx]?.startsWith("http"))
      .map((r) => ({ title: r[titleIdx], image: r[imageIdx], tokens: tokensOf(r[titleIdx]) }));
  } catch {
    // Feed missing/unreadable — resolver just returns null for everything.
  }

  const byExactName = new Map(feed.map((f) => [normalize(f.title), f.image]));

  return function resolveImage(productName: string): string | null {
    const exact = byExactName.get(normalize(productName));
    if (exact) return exact;

    const nameTokens = tokensOf(productName);
    let best: { entry: FeedEntry; score: number; modelHit: boolean } | null = null;
    for (const entry of feed) {
      const intersection = [...nameTokens].filter((t) => entry.tokens.has(t));
      const score = intersection.length / Math.max(nameTokens.size, entry.tokens.size);
      // Model numbers ("P61", "BN-T109B" → "BN"/"T109B") are far stronger
      // signals than shared generic words like "printer".
      const modelHit = intersection.some((t) => /\d/.test(t) && t.length >= 2);
      if (!best || score > best.score) best = { entry, score, modelHit };
    }

    if (best && (best.score >= 0.6 || (best.modelHit && best.score >= 0.35))) {
      return best.entry.image;
    }
    return null;
  };
}
