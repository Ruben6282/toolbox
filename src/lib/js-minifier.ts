const isSpaceNoNewline = (ch: string) =>
  ch === " " || ch === "\t" || ch === "\f" || ch === "\v";

const isNewline = (ch: string) => ch === "\n" || ch === "\r";

const isIdentChar = (ch: string) =>
  (ch >= "a" && ch <= "z") ||
  (ch >= "A" && ch <= "Z") ||
  (ch >= "0" && ch <= "9") ||
  ch === "_" ||
  ch === "$";

export function minifyJs(input: string): string {
  const code = input;
  const len = code.length;

  let out = "";
  let i = 0;

  let inString = false;
  let stringQuote: '"' | "'" | null = null;

  let inTemplate = false;
  let inRegex = false;
  let inCharClass = false;

  let inLineComment = false;
  let inBlockComment = false;

  let prevNonWsOutChar: string | null = null;

  while (i < len) {
    const ch = code[i];
    const next = i + 1 < len ? code[i + 1] : "";

    // Inside line comment: skip until newline (but keep newline)
    if (inLineComment) {
      if (isNewline(ch)) {
        inLineComment = false;

        // Normalize CRLF / CR to single '\n'
        if (ch === "\r" && next === "\n") {
          i += 2;
        } else {
          i++;
        }

        out += "\n";
        // prevNonWsOutChar unchanged (newline is not "non ws")
        continue;
      } else {
        i++;
        continue;
      }
    }

    // Inside block comment: skip until */
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    // Inside string literal
    if (inString) {
      out += ch;

      if (ch === "\\" && i + 1 < len) {
        // Escaped char
        out += code[i + 1];
        i += 2;
        continue;
      }

      if (ch === stringQuote) {
        inString = false;
        stringQuote = null;
        prevNonWsOutChar = ch;
      }

      i++;
      continue;
    }

    // Inside template literal (we treat whole template as opaque)
    if (inTemplate) {
      out += ch;

      if (ch === "\\" && i + 1 < len) {
        out += code[i + 1];
        i += 2;
        continue;
      }

      if (ch === "`") {
        inTemplate = false;
        prevNonWsOutChar = ch;
      }

      i++;
      continue;
    }

    // Inside regex literal
    if (inRegex) {
      out += ch;

      if (ch === "\\" && i + 1 < len) {
        out += code[i + 1];
        i += 2;
        continue;
      }

      if (ch === "[" && !inCharClass) {
        inCharClass = true;
      } else if (ch === "]" && inCharClass) {
        inCharClass = false;
      } else if (ch === "/" && !inCharClass) {
        // end of regex
        inRegex = false;
        prevNonWsOutChar = "/";
      }

      i++;
      continue;
    }

    // === Default / top-level state ===

    // Start of string?
    if (ch === '"' || ch === "'") {
      inString = true;
      stringQuote = ch;
      out += ch;
      prevNonWsOutChar = ch;
      i++;
      continue;
    }

    // Start of template literal?
    if (ch === "`") {
      inTemplate = true;
      out += ch;
      prevNonWsOutChar = ch;
      i++;
      continue;
    }

    // Handle potential comments or regex/division
    if (ch === "/") {
      // Possible comment start?
      if (next === "/") {
        inLineComment = true;
        i += 2;
        continue;
      }
      if (next === "*") {
        inBlockComment = true;
        i += 2;
        continue;
      }

      // Heuristic: whether this can start a regex literal.
      // Very simplified: after these chars, a regex can start.
      const prev = prevNonWsOutChar;
      const canStartRegex =
        !prev ||
        /[([{:;,!%^&*+=<>?|~-]/.test(prev);

      if (canStartRegex) {
        inRegex = true;
        inCharClass = false;
        out += "/";
        prevNonWsOutChar = "/";
        i++;
        continue;
      }

      // Otherwise, it's division or '/=' etc. Treat as plain char.
      out += ch;
      prevNonWsOutChar = ch;
      i++;
      continue;
    }

    // Whitespace handling
    if (isNewline(ch)) {
      // Normalize CRLF / CR to single newline
      if (ch === "\r" && next === "\n") {
        i += 2;
      } else {
        i++;
      }

      // Avoid multiple consecutive newlines
      const lastOut = out[out.length - 1];
      if (lastOut !== "\n") {
        out += "\n";
      }
      // prevNonWsOutChar unchanged
      continue;
    }

    if (isSpaceNoNewline(ch)) {
      // Collapse space/tab/etc runs and emit at most one ' ' if needed
      let j = i + 1;
      while (j < len && isSpaceNoNewline(code[j])) j++;

      // Look ahead to next non-whitespace (including newlines)
      let k = j;
      while (k < len && (isSpaceNoNewline(code[k]) || isNewline(code[k]))) k++;
      const nextNonWs = k < len ? code[k] : "";

      const prev = prevNonWsOutChar;
      const needSpace =
        prev !== null && nextNonWs !== "" && isIdentChar(prev) && isIdentChar(nextNonWs);

      if (needSpace) {
        if (out[out.length - 1] !== " ") {
          out += " ";
        }
      }

      i = j;
      continue;
    }

    // Normal character
    out += ch;
    if (!isSpaceNoNewline(ch)) {
      prevNonWsOutChar = ch;
    }
    i++;
  }

  return out.trim();
}
