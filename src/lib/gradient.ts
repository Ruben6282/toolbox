// src/lib/gradient.ts

// -------------------------------
// HEX COLOR VALIDATION + ENCODING
// -------------------------------

/**
 * Normalize and validate a HEX color.
 * Supports:
 * - #rgb
 * - #rrggbb
 * Automatically converts #rgb → #rrggbb
 * Rejects everything else (returns empty string).
 */
export function normalizeHexColor(raw: string): string {
  if (!raw) return "";

  let val = raw.trim();

  // Keep only hex chars
  const hasHash = val.startsWith("#");
  val = val.replace(/[^0-9a-fA-F]/g, "");
  if (hasHash) {
    val = "#" + val;
  }

  // #rgb
  if (/^#[0-9a-fA-F]{3}$/.test(val)) {
    const r = val[1];
    const g = val[2];
    const b = val[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  // #rrggbb
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    return val.toLowerCase();
  }

  return "";
}

// -------------------------------
// TYPES
// -------------------------------

export type GradientType = "linear" | "radial";

export type RadialShape = "circle" | "ellipse";

export type RadialPosition =
  | "center"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top left"
  | "top right"
  | "bottom left"
  | "bottom right";

export interface LinearGradientConfig {
  type: "linear";
  angle: number; // 0–360 degrees
  colors: string[];
}

export interface RadialGradientConfig {
  type: "radial";
  shape: RadialShape;
  position: RadialPosition;
  colors: string[];
}

export type GradientConfig = LinearGradientConfig | RadialGradientConfig;

// -------------------------------
// HELPERS
// -------------------------------

export function clampAngle(angle: number): number {
  if (!Number.isFinite(angle)) return 0;
  let a = Math.round(angle) % 360;
  if (a < 0) a += 360;
  return a;
}

// -------------------------------
// CSS GENERATION
// -------------------------------

export function buildGradientCss(config: GradientConfig): string {
  const colors = config.colors.filter(Boolean);
  if (colors.length < 2) {
    // Needs at least two colors to look like a gradient
    return "";
  }

  if (config.type === "linear") {
    const angle = clampAngle(config.angle);
    const dir = `${angle}deg`;

    return `
background: -webkit-linear-gradient(${dir}, ${colors.join(", ")});
background: -moz-linear-gradient(${dir}, ${colors.join(", ")});
background: linear-gradient(${dir}, ${colors.join(", ")});
`.trim();
  }

  // Radial
  const radialConfig = `${config.shape} at ${config.position}`;

  return `
background: -webkit-radial-gradient(${radialConfig}, ${colors.join(", ")});
background: -moz-radial-gradient(${radialConfig}, ${colors.join(", ")});
background: radial-gradient(${radialConfig}, ${colors.join(", ")});
`.trim();
}
