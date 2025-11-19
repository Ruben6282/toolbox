// src/lib/css-minifier.ts


export function minifyCss(input: string): string {
  const css = input;
  const len = css.length;

  let out = "";
  let i = 0;

  let inString = false;
  let stringQuote: '"' | "'" | null = null;
  let prevNonSpace: string | null = null;

  const isWhitespace = (ch: string) =>
    ch === " " || ch === "\n" || ch === "\r" || ch === "\t" || ch === "\f";

  while (i < len) {
    const ch = css[i];
    const next = i + 1 < len ? css[i + 1] : "";

    // Inside string literal: copy as-is until matching quote
    if (inString) {
      out += ch;

      if (ch === stringQuote && css[i - 1] !== "\\") {
        inString = false;
        stringQuote = null;
        prevNonSpace = ch;
      }

      i++;
      continue;
    }

    // Not in string -----------------------------------------

    // Start of comment?
    if (ch === "/" && next === "*") {
      const isLicense = i + 2 < len && css[i + 2] === "!";

      let end = i + 2;
      while (end + 1 < len && !(css[end] === "*" && css[end + 1] === "/")) {
        end++;
      }
      const commentEnd = end + 2; // position after */

      if (isLicense) {
        // Preserve /*! ... */ comments exactly
        const comment = css.slice(i, Math.min(commentEnd, len));
        // Insert a newline before if previous wasn't whitespace or start
        if (out && !isWhitespace(out[out.length - 1])) {
          out += "\n";
        }
        out += comment;
        out += "\n";
        prevNonSpace = "/";
      }

      i = commentEnd;
      continue;
    }

    // Start of string?
    if (ch === '"' || ch === "'") {
      inString = true;
      stringQuote = ch;
      out += ch;
      prevNonSpace = ch;
      i++;
      continue;
    }

    // Whitespace handling
    if (isWhitespace(ch)) {
      // Look ahead to next non-whitespace character
      let j = i + 1;
      while (j < len && isWhitespace(css[j])) j++;
      const nextNonSpace = j < len ? css[j] : "";

      const skipSpaceBefore =
          !prevNonSpace || /[{};:,>[(]/.test(prevNonSpace);
      const skipSpaceAfter =
          !nextNonSpace || /[{});:,>\]]/.test(nextNonSpace);


      // Only emit a single space if it’s likely meaningful
      if (!(skipSpaceBefore || skipSpaceAfter)) {
        if (out[out.length - 1] !== " ") {
          out += " ";
        }
      }

      i = j;
      continue;
    }

    // Normal character (non-whitespace, non-comment, non-string)

    // Remove trailing semicolon before }
    if (ch === ";") {
      let j = i + 1;
      while (j < len && isWhitespace(css[j])) j++;
      const nextNonSpace = j < len ? css[j] : "";
      if (nextNonSpace === "}") {
        // skip this semicolon
        i++;
        continue;
      }
    }

    out += ch;
    if (!isWhitespace(ch)) {
      prevNonSpace = ch;
    }

    i++;
  }

  return out.trim();
}
