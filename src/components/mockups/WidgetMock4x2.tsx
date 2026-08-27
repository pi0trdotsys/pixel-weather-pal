import type { CSSProperties } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { PixelIcon } from "@/components/PixelIcon";
import { wmoLabel, wmoToKind } from "@/lib/wmo";
import {
  GRID_ROWS,
  LAYOUT,
  METRICS,
  MOCK_DAYS,
  PREVIEW,
  ROWS,
  STATE_VARIANTS,
  TYPE_SCALE,
  WIDGET_COLORS,
  aqiColor,
  aqiLabel,
  dayLabel,
  dp,
  popToSparkline,
  withAlpha,
  type MockDay,
  type WidgetState,
} from "@/lib/widget-tokens";

type WidgetMock4x2Props = {
  state?: WidgetState;
  location?: string;
  isLive?: boolean;
  nowTemp?: number;
  nowCode?: number;
  isDay?: boolean;
  nowPop?: number;
  aqi?: number | null;
  days?: MockDay[];
  sigma?: string;
  updatedAt?: string;
  bgAlpha?: number;
  zoom?: number;
  /** draws the dp row budget on top of the widget */
  showGuides?: boolean;
};

function Brackets({ color }: { color: string }) {
  const s = dp(METRICS.cornerDp);
  const b = `1.5px solid ${color}`;
  const base: CSSProperties = { position: "absolute", width: s, height: s };
  return (
    <>
      <span style={{ ...base, top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <span style={{ ...base, top: 0, right: 0, borderTop: b, borderRight: b }} />
      <span style={{ ...base, bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <span style={{ ...base, bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
    </>
  );
}

const ELLIPSIS: CSSProperties = {
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export function WidgetMock4x2({
  state = "ok",
  location = "Warszawa",
  isLive = false,
  nowTemp = 21,
  nowCode = 2,
  isDay = true,
  nowPop = 20,
  aqi = 42,
  days = MOCK_DAYS,
  sigma = "grindset weather. wychodzisz albo zostajesz nikim",
  updatedAt = "14:32",
  bgAlpha = 1,
  zoom = 1,
  showGuides = false,
}: WidgetMock4x2Props) {
  const v = STATE_VARIANTS[state];
  const { width, height } = PREVIEW;
  const noLoc = state === "no-location";

  const baseKind = wmoToKind(nowCode);
  const nowKind = !isDay && (baseKind === "sun" || baseKind === "partly") ? "moon" : baseKind;
  // native renders at most 4 columns — hard-clamp so overflow can't happen
  const cols = days.slice(0, 4);
  const spark = popToSparkline(cols.map((d) => d.pop));
  const maxPop = Math.max(0, ...cols.map((d) => d.pop));

  return (
    <div style={{ width: width * zoom, height: height * zoom }}>
      <div
        className={`widget-sweep font-mono ${v.sweepFast ? "widget-sweep--fast" : ""}`}
        style={{
          width,
          height,
          transform: `scale(${zoom})`,
          transformOrigin: "top left",
          position: "relative",
          overflow: "hidden",
          borderRadius: dp(METRICS.radiusDp),
          padding: dp(METRICS.padDp),
          background: withAlpha(WIDGET_COLORS.bg, bgAlpha),
          color: "var(--hud-cyan)",
          boxShadow: `0 0 0 1px ${WIDGET_COLORS.hudLine}, 0 0 26px ${WIDGET_COLORS.hudGlow}, inset 0 0 46px rgba(85,255,255,0.06)`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="hud-grid pointer-events-none absolute inset-0" />
        <Brackets color={v.header} />

        {/* row: header — ROWS.header dp */}
        <header
          className="relative z-10 flex shrink-0 items-center justify-between"
          style={{ height: dp(ROWS.header), gap: dp(LAYOUT.columnGapDp) }}
        >
          <div
            className="min-w-0 uppercase tracking-widest"
            style={{ ...ELLIPSIS, color: v.header, fontSize: TYPE_SCALE.header }}
          >
            {noLoc ? "┌─ set city ─┐" : `┌─ ${isLive ? "◎ " : ""}${location} ─┐`}
          </div>
          <div className="flex shrink-0 items-center" style={{ gap: dp(LAYOUT.columnGapDp) }}>
            {v.blink && (
              <span className="blink" style={{ color: v.header, fontSize: TYPE_SCALE.header }}>
                _
              </span>
            )}
            {state === "offline" ? (
              <WifiOff size={dp(LAYOUT.dotDp * 2)} style={{ color: WIDGET_COLORS.offline }} />
            ) : (
              <Wifi size={dp(LAYOUT.dotDp * 2)} style={{ color: WIDGET_COLORS.online }} />
            )}
            <span
              className="grid place-items-center"
              style={{
                width: dp(LAYOUT.refreshHitDp),
                height: dp(LAYOUT.refreshHitDp),
                border: `1px solid ${WIDGET_COLORS.hudLine}`,
                borderRadius: 3,
              }}
              title="refresh"
            >
              <RefreshCw
                size={dp(LAYOUT.refreshHitDp - 4)}
                className={state === "refreshing" ? "animate-spin" : ""}
                style={{ color: v.header }}
              />
            </span>
          </div>
        </header>

        {noLoc ? (
          <div
            className="relative z-10 flex flex-1 flex-col items-center justify-center"
            style={{ gap: dp(2) }}
          >
            <div
              className="uppercase tracking-widest"
              style={{ color: WIDGET_COLORS.crimson, fontSize: TYPE_SCALE.header }}
            >
              &gt; tap [city] to configure
            </div>
            <div style={{ color: WIDGET_COLORS.crimsonDim, fontSize: TYPE_SCALE.meta }}>
              no coords · forecast unavailable
            </div>
          </div>
        ) : (
          <>
            <div style={{ height: dp(ROWS.gapA) }} />

            {/* row: hero — ROWS.hero dp */}
            <section
              className="relative z-10 flex shrink-0 items-center justify-between"
              style={{ height: dp(ROWS.hero), gap: dp(LAYOUT.columnGapDp) }}
            >
              <div
                className="flex min-w-0 items-center"
                style={{ gap: dp(LAYOUT.columnGapDp) }}
              >
                <PixelIcon kind={nowKind} size={dp(LAYOUT.heroIconDp)} />
                <div className="leading-none">
                  <span
                    className="font-display"
                    style={{
                      fontSize: TYPE_SCALE.hero,
                      lineHeight: 1,
                      textShadow: `0 0 10px ${WIDGET_COLORS.hudGlow}`,
                    }}
                  >
                    {Math.round(nowTemp)}°
                  </span>
                  <span
                    style={{ fontSize: TYPE_SCALE.heroUnit, color: WIDGET_COLORS.hudCyanDim }}
                  >
                    C
                  </span>
                  <div
                    className="uppercase tracking-widest"
                    style={{
                      ...ELLIPSIS,
                      fontSize: TYPE_SCALE.condition,
                      color: WIDGET_COLORS.hudCyanDim,
                      maxWidth: dp(96),
                    }}
                  >
                    {wmoLabel(nowCode)} · rain {nowPop}%
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center" style={{ gap: dp(LAYOUT.columnGapDp) }}>
                <div
                  className="flex items-end"
                  style={{ height: dp(LAYOUT.sparkHeightDp), gap: dp(LAYOUT.sparkGapDp) }}
                  aria-hidden
                >
                  {spark.bars.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        width: dp(LAYOUT.sparkBarDp),
                        height: Math.max(2, b * dp(LAYOUT.sparkHeightDp)),
                        background: spark.hasRain ? WIDGET_COLORS.amber : "var(--hud-cyan)",
                        boxShadow: `0 0 5px ${WIDGET_COLORS.hudGlow}`,
                      }}
                    />
                  ))}
                </div>
                <div className="text-right leading-tight">
                  <div
                    style={{
                      fontSize: TYPE_SCALE.pop,
                      color: spark.hasRain ? WIDGET_COLORS.amber : "var(--hud-cyan)",
                    }}
                  >
                    ▽ {maxPop}%
                  </div>
                  {aqi != null && (
                    <div style={{ fontSize: TYPE_SCALE.meta, color: aqiColor(aqi) }}>
                      aqi {aqi} · {aqiLabel(aqi)}
                    </div>
                  )}
                  <div style={{ fontSize: TYPE_SCALE.meta, color: WIDGET_COLORS.hudCyanDim }}>
                    sync {updatedAt}
                  </div>
                </div>
              </div>
            </section>

            <div style={{ height: dp(ROWS.gapB) }}>
              <div
                style={{
                  height: dp(ROWS.rule),
                  background: WIDGET_COLORS.hudLine,
                  opacity: 0.6,
                }}
              />
            </div>

            {/* row: 4-day grid — ROWS.grid dp */}
            <section
              className="relative z-10 flex shrink-0"
              style={{
                height: dp(ROWS.grid),
                gap: dp(LAYOUT.columnGapDp),
                opacity: v.dimData ? 0.55 : 1,
                transition: "opacity .3s",
              }}
            >
              {cols.map((d, i) => {
                const kind = wmoToKind(d.code);
                return (
                  <div
                    key={d.date}
                    className="flex min-w-0 flex-1 flex-col items-center"
                    style={{
                      borderLeft: i > 0 ? `1px dashed ${WIDGET_COLORS.hudGrid}` : undefined,
                    }}
                  >
                    <div
                      className="uppercase tracking-widest leading-none"
                      style={{
                        ...ELLIPSIS,
                        height: dp(GRID_ROWS.label),
                        fontSize: TYPE_SCALE.dayLabel,
                        color: v.header,
                      }}
                    >
                      {dayLabel(d.date, i)}
                    </div>
                    <div
                      className="grid place-items-center"
                      style={{ height: dp(GRID_ROWS.icon) }}
                    >
                      <PixelIcon kind={kind} size={dp(LAYOUT.gridIconDp)} />
                    </div>
                    <div
                      className="tabular-nums leading-none"
                      style={{
                        ...ELLIPSIS,
                        height: dp(GRID_ROWS.temp),
                        fontSize: TYPE_SCALE.temp,
                      }}
                    >
                      <span style={{ color: WIDGET_COLORS.amber }}>{d.tempDay}°</span>
                      <span style={{ color: WIDGET_COLORS.hudCyanDim }}>/</span>
                      <span style={{ color: "var(--hud-cyan)" }}>{d.tempNight}°</span>
                    </div>
                    <div
                      className="leading-none"
                      style={{
                        height: dp(GRID_ROWS.pop),
                        fontSize: TYPE_SCALE.pop,
                        color: "var(--hud-cyan)",
                      }}
                    >
                      ▽{d.pop}%
                    </div>
                  </div>
                );
              })}
            </section>

            <div style={{ height: dp(ROWS.gapC) }} />
          </>
        )}

        {/* row: footer — ROWS.footer dp, single line, always ellipsized */}
        <footer
          className="relative z-10 mt-auto flex shrink-0 items-center"
          style={{ height: dp(ROWS.footer) }}
        >
          <div
            style={{ ...ELLIPSIS, fontSize: TYPE_SCALE.footer, color: WIDGET_COLORS.amber }}
          >
            {noLoc ? "> tap [city] to configure" : `> ${sigma}`}
          </div>
        </footer>

        {v.banner && (
          <div
            className="absolute left-1/2 z-20 -translate-x-1/2 border uppercase tracking-widest"
            style={{
              top: dp(ROWS.header + 2),
              borderColor: v.bannerColor,
              color: v.bannerColor,
              background: "rgba(4, 7, 10, 0.92)",
              fontSize: TYPE_SCALE.meta,
              padding: `0 ${dp(2)}px`,
              boxShadow: `0 0 10px ${WIDGET_COLORS.hudGlow}`,
            }}
          >
            {v.banner}
          </div>
        )}

        {showGuides && (
          <div className="pointer-events-none absolute inset-0 z-30">
            {(() => {
              let y = dp(METRICS.padDp);
              return Object.entries(ROWS).map(([name, h]) => {
                const top = y;
                y += dp(h);
                return (
                  <div
                    key={name}
                    style={{
                      position: "absolute",
                      left: dp(METRICS.padDp),
                      right: dp(METRICS.padDp),
                      top,
                      height: dp(h),
                      outline: `1px dashed ${WIDGET_COLORS.hudMagenta}`,
                      color: WIDGET_COLORS.hudMagenta,
                      fontSize: 8,
                    }}
                  >
                    <span style={{ position: "absolute", right: 2, top: 0 }}>
                      {name} {h}dp
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
