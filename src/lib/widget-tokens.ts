// Design tokens for the "Terminal 2.0" 4×2 home-screen widget mockup.
//
// Everything tagged "native" mirrors android/app/src/main/res/values/widget_colors.xml
// (and the layout in weather_widget.xml) 1:1 — keep hex values in sync with those
// files (see docs/widget-spec.md for the full element → @+id mapping).
// Tokens tagged "mockup-only" are HUD/neon accents that only exist in the web
// preview; docs/widget-spec.md maps each to the nearest widget_colors.xml entry or
// to a new drawable/color to add on the native side.

export type WidgetState = "ok" | "refreshing" | "stale" | "offline" | "no-location";

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
export const WIDGET_COLORS = {
  // native (widget_colors.xml)
  bg: "#0a0f0a",
  green: "#33ff66",
  greenDim: "#4a6a4a",
  amber: "#ffb000",
  amberDim: "#806000",
  cyan: "#55ffff",
  cyanDim: "#2a6666",
  crimson: "#ff5555",
  crimsonDim: "#703030",
  online: "#33ff66",
  offline: "#ff5555",
  aqiGood: "#33ff66",
  aqiModerate: "#ffb000",
  aqiSensitive: "#ff7a1a",
  aqiUnhealthy: "#ff3b3b",
  aqiVeryUnhealthy: "#a64dff",
  aqiHazardous: "#7f0000",

  // mockup-only HUD accents (defined as CSS vars in src/styles.css too)
  hudCyan: "#55ffff",
  hudCyanDim: "#2a6666",
  hudGrid: "rgba(85, 255, 255, 0.10)",
  hudGlow: "rgba(85, 255, 255, 0.45)",
  hudLine: "rgba(85, 255, 255, 0.35)",
  hudScan: "rgba(85, 255, 255, 0.06)",
  hudMagenta: "#ff4fd8",
};

/** Returns a hex color as rgba() with the given alpha (0..1). */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Metrics — native 4×2 footprint is 250×110dp; preview renders it at 2.4×.
// Every size in this file is authored in dp/sp first and converted to preview
// px with dp(), so the web mockup can never claim more room than RemoteViews has.
// ---------------------------------------------------------------------------
export const METRICS = {
  cells: [4, 2] as const,
  dp: { width: 250, height: 110 },
  scale: 2.4,
  padDp: 5,
  radiusDp: 5,
  cornerDp: 4,
  gridCellDp: 7,
};

/** dp/sp → preview px */
export const dp = (v: number): number => Math.round(v * METRICS.scale * 100) / 100;

export const PREVIEW = {
  width: dp(METRICS.dp.width),
  height: dp(METRICS.dp.height),
};

// ---------------------------------------------------------------------------
// Typography — authored in sp (native truth), exposed in px for the mockup.
// 8sp is the hard floor: anything smaller is unreadable on a home screen.
// ---------------------------------------------------------------------------
export const SP_SCALE = {
  header: 9,
  hero: 22,
  heroUnit: 9,
  condition: 8,
  dayLabel: 9,
  temp: 11,
  pop: 8,
  meta: 8,
  footer: 9,
} as const;

export type TypeToken = keyof typeof SP_SCALE;

export const TYPE_SCALE = Object.fromEntries(
  Object.entries(SP_SCALE).map(([k, sp]) => [k, dp(sp)]),
) as Record<TypeToken, number>;

// ---------------------------------------------------------------------------
// Vertical budget — the whole point: 110dp minus padding must contain every row.
// Values are dp and are consumed verbatim by the mockup and by weather_widget.xml.
// ---------------------------------------------------------------------------
export const ROWS = {
  header: 12,
  gapA: 2,
  hero: 28,
  rule: 1,
  gapB: 2,
  grid: 40,
  gapC: 2,
  footer: 11,
} as const;

/** Inner rows of one forecast column — must sum to ROWS.grid. */
export const GRID_ROWS = {
  label: 9,
  icon: 13,
  temp: 10,
  pop: 8,
} as const;

export const LAYOUT = {
  heroIconDp: 22,
  gridIconDp: 13,
  sparkBarDp: 3,
  sparkGapDp: 2,
  sparkHeightDp: 18,
  refreshHitDp: 12,
  dotDp: 4,
  columnGapDp: 3,
} as const;

export type FitReport = {
  contentHeightDp: number;
  usedDp: number;
  slackDp: number;
  fits: boolean;
  gridUsedDp: number;
  gridFits: boolean;
  rows: { name: string; dp: number }[];
};

/** Static assertion helper — surfaced in /mockups so a regression is visible. */
export function fitReport(): FitReport {
  const contentHeightDp = METRICS.dp.height - METRICS.padDp * 2;
  const rows = Object.entries(ROWS).map(([name, v]) => ({ name, dp: v }));
  const usedDp = rows.reduce((a, r) => a + r.dp, 0);
  const gridUsedDp = Object.values(GRID_ROWS).reduce((a, v) => a + v, 0);
  return {
    contentHeightDp,
    usedDp,
    slackDp: contentHeightDp - usedDp,
    fits: usedDp <= contentHeightDp,
    gridUsedDp,
    gridFits: gridUsedDp <= ROWS.grid,
    rows,
  };
}


// Per-widget-instance background fill transparency (mirrors WidgetTransparency.kt).
export const TRANSPARENCY_LEVELS = [
  { id: "opaque", label: "100%", alpha: 1 },
  { id: "high", label: "85%", alpha: 0.85 },
  { id: "medium", label: "60%", alpha: 0.6 },
  { id: "low", label: "35%", alpha: 0.35 },
] as const;

// ---------------------------------------------------------------------------
// State variants
// ---------------------------------------------------------------------------
export type StateVariant = {
  label: string;
  code: string;
  dot: string;
  header: string;
  banner: string | null;
  bannerColor: string;
  dimData: boolean;
  blink: boolean;
  sweepFast: boolean;
};

export const STATE_VARIANTS: Record<WidgetState, StateVariant> = {
  ok: {
    label: "ok",
    code: "200 OK",
    dot: WIDGET_COLORS.online,
    header: WIDGET_COLORS.green,
    banner: null,
    bannerColor: WIDGET_COLORS.green,
    dimData: false,
    blink: true,
    sweepFast: false,
  },
  refreshing: {
    label: "refreshing",
    code: "GET /forecast",
    dot: WIDGET_COLORS.online,
    header: WIDGET_COLORS.cyan,
    banner: "⟳ refreshing…",
    bannerColor: WIDGET_COLORS.cyan,
    dimData: false,
    blink: true,
    sweepFast: true,
  },
  stale: {
    label: "stale",
    code: "304 retrying",
    dot: WIDGET_COLORS.amber,
    header: WIDGET_COLORS.amber,
    banner: "⚠ stale · retrying",
    bannerColor: WIDGET_COLORS.amber,
    dimData: true,
    blink: true,
    sweepFast: false,
  },
  offline: {
    label: "offline",
    code: "0 net · cache",
    dot: WIDGET_COLORS.offline,
    header: WIDGET_COLORS.crimson,
    banner: "offline · serving cached snapshot",
    bannerColor: WIDGET_COLORS.offline,
    dimData: true,
    blink: false,
    sweepFast: false,
  },
  "no-location": {
    label: "no-location",
    code: "404 city",
    dot: WIDGET_COLORS.crimson,
    header: WIDGET_COLORS.crimson,
    banner: null,
    bannerColor: WIDGET_COLORS.crimson,
    dimData: true,
    blink: true,
    sweepFast: false,
  },
};

// ---------------------------------------------------------------------------
// POP → sparkline mapping
// ---------------------------------------------------------------------------
export type Sparkline = {
  bars: number[]; // normalized 0..1, one entry per day
  max: number; // max daily PoP across the window
  hasRain: boolean; // any day >= 50%
};

export function popToSparkline(pop: number[]): Sparkline {
  const max = Math.max(1, ...pop);
  return {
    bars: pop.map((p) => p / max),
    max,
    hasRain: pop.some((p) => p >= 50),
  };
}

// ---------------------------------------------------------------------------
// AQI helpers (mirrors WeatherWidgetProvider.aqiLabelAndColor)
// ---------------------------------------------------------------------------
export function aqiLabel(aqi: number): string {
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very unhealthy";
  return "hazardous";
}

export function aqiColor(aqi: number): string {
  if (aqi <= 50) return WIDGET_COLORS.aqiGood;
  if (aqi <= 100) return WIDGET_COLORS.aqiModerate;
  if (aqi <= 150) return WIDGET_COLORS.aqiSensitive;
  if (aqi <= 200) return WIDGET_COLORS.aqiUnhealthy;
  if (aqi <= 300) return WIDGET_COLORS.aqiVeryUnhealthy;
  return WIDGET_COLORS.aqiHazardous;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
export const PL_DOW = ["nd", "pn", "wt", "śr", "cz", "pt", "sb"];

export function dayLabel(isoDate: string, index: number): string {
  if (index === 0) return "dziś";
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "?";
  return PL_DOW[d.getUTCDay()];
}

function isoDaysFromNow(offset: number): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export type MockDay = {
  date: string;
  code: number; // Open-Meteo WMO weather code
  tempDay: number;
  tempNight: number;
  pop: number; // daily precipitation probability, %
};

export const MOCK_DAYS: MockDay[] = [
  { date: isoDaysFromNow(0), code: 2, tempDay: 24, tempNight: 14, pop: 20 },
  { date: isoDaysFromNow(1), code: 61, tempDay: 19, tempNight: 12, pop: 85 },
  { date: isoDaysFromNow(2), code: 3, tempDay: 17, tempNight: 11, pop: 35 },
  { date: isoDaysFromNow(3), code: 0, tempDay: 22, tempNight: 13, pop: 5 },
];

export const MOCK_WIDGET = {
  location: "Warszawa",
  isLive: false,
  now: { temp: 21, code: 2, isDay: true },
  nowPop: 20,
  aqi: 42,
  sigma: "grindset weather. wychodzisz albo zostajesz nikim",
  days: MOCK_DAYS,
};
