// Single source of truth for the "Terminal 2.0" 4x2 home-screen widget.
//
// Every hex value here is meant to be copied 1:1 into
// android/app/src/main/res/values/widget_colors.xml (name in `androidName`),
// so the TypeScript mockups and the real RemoteViews widget can never drift.
// See docs/widget-spec.md for the implementation contract.

import type { WeatherKind } from "@/lib/wmo";

/* ------------------------------------------------------------------ */
/* Colors                                                              */
/* ------------------------------------------------------------------ */

export type WidgetColorToken = {
  /** hex value, exactly as it must appear in widget_colors.xml */
  hex: string;
  /** resource name in res/values/widget_colors.xml */
  androidName: string;
  /** what this color is allowed to be used for */
  role: string;
};

export const WIDGET_COLORS = {
  bg: { hex: "#000000", androidName: "widget_bg", role: "widget backdrop (top of gradient)" },
  bgDeep: {
    hex: "#060d06",
    androidName: "widget_bg_deep",
    role: "widget backdrop (bottom of gradient)",
  },
  zone: {
    hex: "#0a1a0a",
    androidName: "widget_zone",
    role: "footer / hero sub-surface fill",
  },
  phosphor: {
    hex: "#33ff66",
    androidName: "widget_green",
    role: "primary text, day temps, online dot",
  },
  phosphorDim: {
    hex: "#3f8f55",
    androidName: "widget_green_dim",
    role: "labels, night temps, chrome (raised contrast vs. old #4a6a4a)",
  },
  rule: { hex: "#1f8a3f", androidName: "widget_rule", role: "hairline separators, brackets" },
  cyan: {
    hex: "#55ffff",
    androidName: "widget_cyan",
    role: "live data accent: current temp, POP bars",
  },
  amber: { hex: "#ffb000", androidName: "widget_amber", role: "stale data, warnings" },
  crimson: { hex: "#ff5555", androidName: "widget_offline", role: "offline / error state" },
  ink: { hex: "#000000", androidName: "widget_ink", role: "text on inverted chips" },
} as const satisfies Record<string, WidgetColorToken>;

export type WidgetColorName = keyof typeof WIDGET_COLORS;

export const color = (name: WidgetColorName): string => WIDGET_COLORS[name].hex;

/* ------------------------------------------------------------------ */
/* Type scale + spacing (dp / sp — 1 mock px === 1 dp)                 */
/* ------------------------------------------------------------------ */

export const WIDGET_TYPE = {
  chrome: { sp: 9, weight: 400, tracking: 1.2, uppercase: true },
  dayLabel: { sp: 9, weight: 700, tracking: 1.6, uppercase: true },
  heroTemp: { sp: 30, weight: 700, tracking: -0.5, uppercase: false },
  heroMeta: { sp: 10, weight: 400, tracking: 0.4, uppercase: false },
  dayTemp: { sp: 17, weight: 700, tracking: 0, uppercase: false },
  nightTemp: { sp: 11, weight: 400, tracking: 0, uppercase: false },
  pop: { sp: 9, weight: 400, tracking: 0.4, uppercase: false },
  joke: { sp: 10, weight: 400, tracking: 0.2, uppercase: false },
} as const;

export type WidgetTypeToken = keyof typeof WIDGET_TYPE;

export const WIDGET_METRICS = {
  /** nominal 4x2 cell footprint in dp */
  widthDp: 330,
  heightDp: 155,
  padDp: 8,
  gapDp: 6,
  columnGapDp: 4,
  hairlineDp: 1,
  bracketDp: 9,
  iconDp: 28,
  refreshHitDp: 26,
  dotDp: 7,
  popBarHeightDp: 12,
  cornerRadiusDp: 3,
} as const;

/** Background transparency variants — mirrors widget_background_{35,60,85,100}.xml */
export const WIDGET_OPACITIES = [35, 60, 85, 100] as const;
export type WidgetOpacity = (typeof WIDGET_OPACITIES)[number];

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export type WidgetState = "ok" | "stale" | "offline" | "refreshing" | "no-location";

export type WidgetStateStyle = {
  /** color token used for the status dot + meta line */
  accent: WidgetColorName;
  /** short status word rendered in the header */
  label: string;
  /** glyph shown in place of the refresh icon */
  refreshGlyph: string;
  /** whether the body shows live data at all */
  showsData: boolean;
};

export const WIDGET_STATE_STYLES: Record<WidgetState, WidgetStateStyle> = {
  ok: { accent: "phosphor", label: "sync", refreshGlyph: "⟳", showsData: true },
  stale: { accent: "amber", label: "stale", refreshGlyph: "⟳", showsData: true },
  offline: { accent: "crimson", label: "offline", refreshGlyph: "⚠", showsData: true },
  refreshing: { accent: "cyan", label: "fetch", refreshGlyph: "◜", showsData: true },
  "no-location": { accent: "amber", label: "no fix", refreshGlyph: "⌖", showsData: false },
};

/** Spinner frames cycled one step per RemoteViews update (no real animation exists). */
export const REFRESH_FRAMES = ["◜", "◝", "◞", "◟"] as const;

/* ------------------------------------------------------------------ */
/* Precipitation probability -> mini bar                               */
/* ------------------------------------------------------------------ */

const BAR_GLYPHS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"] as const;

/**
 * Map a 0..100 precipitation probability to a 3-glyph sparkline plus the
 * color it should be drawn in. Deterministic — the Kotlin side must produce
 * the exact same string (see docs/widget-spec.md).
 */
export function popToBar(pop: number): { glyphs: string; accent: WidgetColorName } {
  const p = Math.max(0, Math.min(100, Math.round(pop)));
  const level = Math.round((p / 100) * (BAR_GLYPHS.length - 1));
  const glyphs = [Math.max(0, level - 2), Math.max(0, level - 1), level]
    .map((i) => BAR_GLYPHS[i])
    .join("");
  const accent: WidgetColorName = p >= 60 ? "cyan" : p >= 25 ? "phosphorDim" : "rule";
  return { glyphs, accent };
}

/* ------------------------------------------------------------------ */
/* Mock data shapes                                                    */
/* ------------------------------------------------------------------ */

export type WidgetDay = {
  /** 3-letter uppercase label, first column is always "DZIŚ" */
  label: string;
  kind: WeatherKind;
  day: number;
  night: number;
  pop: number;
};

export type WidgetSnapshot = {
  city: string;
  now: number;
  feels: number;
  condition: string;
  kind: WeatherKind;
  syncedAt: string;
  days: WidgetDay[];
  comment: string;
};

export const MOCK_SNAPSHOT: WidgetSnapshot = {
  city: "Warszawa",
  now: 24,
  feels: 25,
  condition: "clear sky",
  kind: "sun",
  syncedAt: "22:04",
  days: [
    { label: "DZIŚ", kind: "sun", day: 24, night: 12, pop: 10 },
    { label: "ŚR", kind: "partly", day: 21, night: 11, pop: 0 },
    { label: "CZW", kind: "rain", day: 18, night: 9, pop: 70 },
    { label: "PT", kind: "cloud", day: 16, night: 8, pop: 45 },
  ],
  comment: "kod się sam nie napisze, ale i tak wyjdź na dwór",
};
