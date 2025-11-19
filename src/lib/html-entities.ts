// src/lib/html-entities.ts

export interface EncodeHtmlOptions {
  /**
   * If true, also encode all non-ASCII characters as numeric entities.
   * Example: "é" -> "&#233;"
   */
  encodeNonAscii?: boolean;
}

/**
 * Encode a string into HTML entities.
 * - Always encodes &, <, >, ", '
 * - Optionally encodes all non-ASCII characters as numeric entities
 */
export function encodeHtmlEntities(
  input: string,
  options: EncodeHtmlOptions = {}
): string {
  const { encodeNonAscii = false } = options;

  let result = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  if (encodeNonAscii) {
    // Replace any non-ASCII char with a numeric entity
    result = result.replace(/[^\x20-\x7E]/g, (ch) => {
      const codePoint = ch.codePointAt(0);
      return codePoint !== undefined ? `&#${codePoint};` : ch;
    });
  }

  return result;
}

/**
 * Common HTML named entities mapping to their Unicode characters.
 * This is not the full HTML5 entity table, but covers the most used ones.
 * Unknown entities are left untouched.
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00A0",
  copy: "©",
  reg: "®",
  trade: "™",
  hellip: "…",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  ndash: "–",
  mdash: "—",
  euro: "€",
  cent: "¢",
  pound: "£",
  yen: "¥",
  bull: "•",
};

/**
 * Decode HTML entities (named, decimal numeric, hex numeric).
 *
 * Supports:
 * - &amp; &lt; &gt; &quot; &apos; &nbsp; &copy; ... (common named entities)
 * - &#160; (decimal numeric)
 * - &#xA0; or &#XA0; (hex numeric)
 *
 * Unknown entities are left as-is.
 */
export function decodeHtmlEntities(input: string): string {
  if (!input.includes("&")) return input;

  let result = input;

  // 1) Decode hex numeric entities: &#xHHHH; or &#XHHHH;
  result = result.replace(/&#x([0-9a-fA-F]+);?/g, (match, hex: string) => {
    const codePoint = parseInt(hex, 16);
    if (Number.isNaN(codePoint)) return match;
    try {
      return String.fromCodePoint(codePoint);
    } catch {
      return match;
    }
  });

  // 2) Decode decimal numeric entities: &#DDDD;
  result = result.replace(/&#(\d+);?/g, (match, dec: string) => {
    const codePoint = parseInt(dec, 10);
    if (Number.isNaN(codePoint)) return match;
    try {
      return String.fromCodePoint(codePoint);
    } catch {
      return match;
    }
  });

  // 3) Decode named entities (common subset)
  result = result.replace(/&([a-zA-Z][a-zA-Z0-9]+);/g, (match, name: string) => {
    const decoded = NAMED_ENTITIES[name];
    return decoded !== undefined ? decoded : match;
  });

  return result;
}
