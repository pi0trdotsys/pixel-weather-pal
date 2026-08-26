import type { CSSProperties } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { PixelIcon } from "@/components/PixelIcon";
import { wmoLabel, wmoToKind } from "@/lib/wmo";
import {
  METRICS,
  MOCK_DAYS,
  STATE_VARIANTS,
  TYPE_SCALE,
  WIDGET_COLORS,
  aqiColor,
  aqiLabel,
  dayLabel,
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
};

function Brackets({ color }: { color: string }) {
  const s = METRICS.corner;
  const b = `2px solid ${color}`;
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
  updatedAt = "14:32:07",
  bgAlpha = 1,
  zoom = 1,
}: WidgetMock4x2Props) {
  const v = STATE_VARIANTS[state];
  const { width, height } = METRICS.preview;
  const noLoc = state === "no-location";

  const baseKind = wmoToKind(nowCode);
  const nowKind = !isDay && (baseKind === "sun" || baseKind === "partly") ? "moon" : baseKind;
  const spark = popToSparkline(days.map((d) => d.pop));
  const maxPop = Math.max(...days.map((d) => d.pop));

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
          borderRadius: METRICS.radius,
          padding: METRICS.padding,
          background: withAlpha(WIDGET_COLORS.bg, bgAlpha),
          color: "var(--hud-cyan)",
          boxShadow: `0 0 0 1px ${WIDGET_COLORS.hudLine}, 0 0 26px ${WIDGET_COLORS.hudGlow}, inset 0 0 46px rgba(85,255,255,0.06)`,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="hud-grid pointer-events-none absolute inset-0" />
        <Brackets color={v.header} />

        {/* header */}
        <header
          className="relative z-10 flex items-center justify-between gap-2"
          style={{ height: 20 }}
        >
          <div
            className="min-w-0 truncate uppercase tracking-widest"
            style={{ color: v.header, fontSize: TYPE_SCALE.header }}
          >
            {noLoc ? "┌─ set city ─┐" : `┌─ ${isLive ? "◎ " : ""}${location} ─┐`}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {v.blink && (
              <span className="blink" style={{ color: v.header, fontSize: TYPE_SCALE.header }}>
                _
              </span>
            )}
            {state === "offline" ? (
              <WifiOff size={13} style={{ color: WIDGET_COLORS.offline }} />
            ) : (
              <Wifi size={13} style={{ color: WIDGET_COLORS.online }} />
            )}
            <span
              className="grid place-items-center"
              style={{
                width: 19,
                height: 19,
                border: `1px solid ${WIDGET_COLORS.hudLine}`,
                borderRadius: 4,
              }}
              title="refresh"
            >
              <RefreshCw
                size={12}
                className={state === "refreshing" ? "animate-spin" : ""}
                style={{ color: v.header }}
              />
            </span>
          </div>
        </header>

        {noLoc ? (
          /* no-location body */
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-1">
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
            {/* hero */}
            <section
              className="relative z-10 flex items-center justify-between gap-3"
              style={{ height: 66, borderBottom: `1px dashed ${WIDGET_COLORS.hudLine}` }}
            >
              <div className="flex items-center gap-3">
                <PixelIcon kind={nowKind} size={32} />
                <div className="leading-none">
                  <div
                    className="font-display"
                    style={{
                      fontSize: TYPE_SCALE.hero,
                      lineHeight: 1,
                      textShadow: `0 0 14px ${WIDGET_COLORS.hudGlow}`,
                    }}
                  >
                    {Math.round(nowTemp)}°
                    <span
                      style={{ fontSize: TYPE_SCALE.heroUnit, color: WIDGET_COLORS.hudCyanDim }}
                    >
                      C
                    </span>
                  </div>
                  <div
                    className="mt-1 uppercase tracking-widest"
                    style={{ fontSize: TYPE_SCALE.condition, color: WIDGET_COLORS.hudCyanDim }}
                  >
                    now · {wmoLabel(nowCode)} · rain {nowPop}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-end gap-1" style={{ height: 32 }} aria-hidden>
                  {spark.bars.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        width: 6,
                        height: Math.max(3, Math.round(b * 32)),
                        background: spark.hasRain ? WIDGET_COLORS.amber : "var(--hud-cyan)",
                        boxShadow: `0 0 6px ${WIDGET_COLORS.hudGlow}`,
                      }}
                    />
                  ))}
                </div>
                <div className="text-right leading-tight">
                  <div style={{ fontSize: TYPE_SCALE.meta, color: WIDGET_COLORS.hudCyanDim }}>
                    POP 24h
                  </div>
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
                      AQI {aqi} · {aqiLabel(aqi)}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* 4-day grid */}
            <section
              className="relative z-10 flex flex-1 gap-2"
              style={{ opacity: v.dimData ? 0.55 : 1, transition: "opacity .3s" }}
            >
              {days.map((d, i) => {
                const kind = wmoToKind(d.code);
                return (
                  <div
                    key={d.date}
                    className="flex flex-1 flex-col items-center justify-center gap-1"
                    style={{
                      borderLeft: i > 0 ? `1px dashed ${WIDGET_COLORS.hudGrid}` : undefined,
                    }}
                  >
                    <div
                      className="uppercase tracking-widest"
                      style={{ fontSize: TYPE_SCALE.dayLabel, color: v.header }}
                    >
                      {dayLabel(d.date, i)}
                    </div>
                    <PixelIcon kind={kind} size={32} />
                    <div
                      className="tabular-nums leading-none"
                      style={{ fontSize: TYPE_SCALE.temp }}
                    >
                      <span style={{ color: WIDGET_COLORS.amber }}>{d.tempDay}°</span>
                      <span style={{ color: WIDGET_COLORS.hudCyanDim }}> / </span>
                      <span style={{ color: "var(--hud-cyan)" }}>{d.tempNight}°</span>
                    </div>
                    <div style={{ fontSize: TYPE_SCALE.pop, color: "var(--hud-cyan)" }}>
                      ▽ {d.pop}%
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {/* footer */}
        <footer className="relative z-10">
          <div
            className="flex items-center justify-between"
            style={{ fontSize: TYPE_SCALE.meta, color: WIDGET_COLORS.hudCyanDim }}
          >
            <span>// sigma.forecast()</span>
            <span>sync {updatedAt}</span>
          </div>
          <div
            className="truncate"
            style={{ fontSize: TYPE_SCALE.footer, color: WIDGET_COLORS.amber }}
          >
            {noLoc ? "> tap [city] to configure" : `> ${sigma}`}
          </div>
        </footer>

        {/* status banner overlay */}
        {v.banner && (
          <div
            className="absolute left-1/2 top-9 z-20 -translate-x-1/2 border px-2 py-0.5 uppercase tracking-widest"
            style={{
              borderColor: v.bannerColor,
              color: v.bannerColor,
              background: "rgba(4, 7, 10, 0.92)",
              fontSize: 10,
              boxShadow: `0 0 10px ${WIDGET_COLORS.hudGlow}`,
            }}
          >
            {v.banner}
          </div>
        )}
      </div>
    </div>
  );
}
