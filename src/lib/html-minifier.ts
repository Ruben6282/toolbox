// src/lib/html-minifier.ts

export interface HtmlMinifyOptions {
  removeComments: boolean;
  collapseWhitespace: boolean;
  removeWhitespaceBetweenTags: boolean;
  removeEmptyAttributes: boolean;
  removeRedundantAttributes: boolean;
  removeScriptTypeAttributes: boolean;
  removeStyleLinkTypeAttributes: boolean;
  removeOptionalTags: boolean;
  removeEmptyElements: boolean;
  minifyCSS: boolean;
  minifyJS: boolean;
}

export const DEFAULT_HTML_MINIFY_OPTIONS: HtmlMinifyOptions = {
  removeComments: true,
  collapseWhitespace: true,
  removeWhitespaceBetweenTags: true,
  removeEmptyAttributes: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  removeOptionalTags: false,
  removeEmptyElements: false,
  minifyCSS: false,
  minifyJS: false,
};

interface PreserveBlock {
  placeholder: string;
  content: string;
}

// Extract blocks for tags where whitespace must be preserved
function extractPreserveBlocks(
  html: string,
  tags: string[]
): { html: string; blocks: PreserveBlock[] } {
  const blocks: PreserveBlock[] = [];
  const tagGroup = tags.join("|");
  const regex = new RegExp(
    `<(${tagGroup})(\\b[^>]*)?>([\\s\\S]*?)<\\/\\1>`,
    "gi"
  );

  const out = html.replace(regex, (match) => {
    const placeholder = `__HTMLMIN_PRESERVE_${blocks.length}__`;
    blocks.push({ placeholder, content: match });
    return placeholder;
  });

  return { html: out, blocks };
}

function restorePreserveBlocks(html: string, blocks: PreserveBlock[]): string {
  let result = html;
  for (const block of blocks) {
    result = result.replace(block.placeholder, block.content);
  }
  return result;
}

// Very conservative CSS minifier – safe-ish for regular CSS
function minifyCssContent(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "") // remove /* comments */
    .replace(/[ \t\r\n\f]+/g, " ") // collapse whitespace
    .replace(/\s*([{}:;,>])\s*/g, "$1") // trim around common separators
    .replace(/;}/g, "}") // remove trailing ;
    .trim();
}

// Very conservative JS "minifier" – mostly whitespace cleanup
// (does NOT touch // comments to avoid breaking URLs / strings)
function minifyJsContent(js: string): string {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, "") // remove /* comments */
    .replace(/[ \t\r\n\f]+/g, " ") // collapse whitespace runs
    .replace(/^\s+|\s+$/gm, "") // trim each line
    .trim();
}

export function minifyHtml(
  html: string,
  userOptions: Partial<HtmlMinifyOptions> = {}
): string {
  const options: HtmlMinifyOptions = {
    ...DEFAULT_HTML_MINIFY_OPTIONS,
    ...userOptions,
  };

  let result = html;

  if (!result || !result.trim()) {
    return "";
  }

  // 1) Minify CSS inside <style> tags (optional)
  if (options.minifyCSS) {
    result = result.replace(
      /<style\b([^>]*)>([\s\S]*?)<\/style>/gi,
      (match, attrs, css) => {
        const minifiedCSS = minifyCssContent(css);
        return `<style${attrs}>${minifiedCSS}</style>`;
      }
    );
  }

  // 2) Minify JS inside <script> tags (optional, conservative)
  if (options.minifyJS) {
    result = result.replace(
      /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
      (match, attrs, js) => {
        const minifiedJS = minifyJsContent(js);
        return `<script${attrs}>${minifiedJS}</script>`;
      }
    );
  }

  // 3) Extract blocks where we must NOT touch whitespace (and scripts/styles already processed)
  const preserved = extractPreserveBlocks(result, [
    "pre",
    "code",
    "textarea",
    "script",
    "style",
  ]);
  result = preserved.html;

  // 4) Remove HTML comments
  if (options.removeComments) {
    result = result.replace(/<!--([\s\S]*?)-->/g, "");
  }

  // 5) Remove script type="text/javascript" on <script> tags only
  if (options.removeScriptTypeAttributes) {
    result = result.replace(
      /<script([^>]*?)\s+type=["']text\/javascript["']([^>]*?)>/gi,
      "<script$1$2>"
    );
  }

  // 6) Remove type="text/css" on <link> / <style> tags only
  if (options.removeStyleLinkTypeAttributes) {
    result = result.replace(
      /<(link|style)([^>]*?)\s+type=["']text\/css["']([^>]*?)>/gi,
      "<$1$2$3>"
    );
  }

  // 7) Remove redundant type attributes regardless (safe-ish)
  if (options.removeRedundantAttributes) {
    result = result.replace(/\s+type=["']text\/javascript["']/gi, "");
    result = result.replace(/\s+type=["']text\/css["']/gi, "");
  }

  // 8) Remove empty attributes: attr="" or attr='   '
  if (options.removeEmptyAttributes) {
    result = result.replace(
      /\s+[a-zA-Z_:.-]+\s*=\s*["']\s*["']/g,
      ""
    );
  }

  // 9) Remove optional tags (html/head/body/tbody/thead/tfoot/colgroup)
  if (options.removeOptionalTags) {
    result = result.replace(
      /<\/?(?:html|head|body|tbody|thead|tfoot|colgroup)>/gi,
      ""
    );
  }

  // 10) Collapse whitespace runs to a single space
  if (options.collapseWhitespace) {
    result = result.replace(/[ \t\r\n\f]+/g, " ");
  }

  // 11) Normalize whitespace between tags
  // Use > < to keep a single "space" between inline tags instead of gluing them
  if (options.removeWhitespaceBetweenTags) {
    result = result.replace(/>\s+</g, "> <");
  }

  // 12) Remove truly empty non-void elements (not script/style)
  if (options.removeEmptyElements) {
    result = result.replace(
      /<(?!script|style)([a-zA-Z0-9:-]+)(\s[^>]*)?>\s*<\/\1>/gi,
      ""
    );
  }

  // 13) Restore preserved blocks (pre, code, textarea, script, style)
  result = restorePreserveBlocks(result, preserved.blocks);

  return result.trim();
}
