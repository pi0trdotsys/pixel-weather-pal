import { PixelIcon } from "@/components/PixelIcon";
import {
  MOCK_SNAPSHOT,
  WIDGET_METRICS,
  WIDGET_STATE_STYLES,
  color,
  popToBar,
  type WidgetOpacity,
  type WidgetSnapshot,
  type WidgetState,
} from "@/lib/widget-tokens";

/**
 * Pixel-accurate mockup of the Android 4x2 "Terminal 2.0" widget.
 * 1 CSS px === 1 dp. Effects marked WEB-ONLY in docs/widget-spec.md are
 * approximations of what the RemoteViews build ships as static drawables.
 */
export function WidgetMock4x2({
  snapshot = MOCK_SNAPSHOT,
  state = "ok",
  opacity = 85,
  scale = 1,
}: {
  snapshot?: WidgetSnapshot;
  state?: WidgetState;
  opacity?: WidgetOpacity;
  scale?: number;
}) {
  const s = WIDGET_STATE_STYLES[state];
  const m = WIDGET_METRICS;
  const alpha = opacity / 100;

  return (
    <div
      style={{
        width: m.widthDp,
        height: m.heightDp,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        position: "relative",
        borderRadius: m.cornerRadiusDp,
        overflow: "hidden",
        fontFamily: "var(--font-mono)",
        color: color("phosphor"),
        background: `linear-gradient(180deg, ${hexA(color("bg"), alpha)} 0%, ${hexA(
          color("bgDeep"),
          alpha,
        )} 100%)`,
        boxShadow: `inset 0 0 0 1px ${hexA(color("rule"), 0.55)}, 0 0 24px ${hexA(
          color("phosphor"),
          0.1,
        )}`,
      }}
      role="img"
      aria-label={`Makieta widgetu 4x2, stan ${state}`}
    >
      {/* HUD micro-grid (android: static dotted drawable) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${hexA(color("phosphor"), 0.1)} 1px, transparent 1px)`,
          backgroundSize: "8px 8px",
        }}
      />
      {/* Scanline sweep (WEB-ONLY animation; android: static gradient strip) */}
      <div className="widget-sweep pointer-events-none absolute inset-x-0 top-0 h-full" />

      <CornerBrackets />

      <div
        className="relative flex h-full flex-col"
        style={{ padding: m.padDp, gap: m.gapDp - 2 }}
      >
        {/* ── header ───────────────────────────────────────────── */}
        <div className="flex items-center" style={{ gap: 6 }}>
          <span style={chrome({ color: color("rule") })}>HBW</span>
          <span
            className="truncate"
            style={chrome({ color: color("phosphorDim"), letterSpacing: 1.2 })}
          >
            {snapshot.city}
            <span className="blink">_</span>
          </span>
          <div className="h-px flex-1" style={{ background: hexA(color("rule"), 0.5) }} />
          <span
            style={{
              width: m.dotDp,
              height: m.dotDp,
              borderRadius: 999,
              background: color(s.accent),
              boxShadow: `0 0 6px ${color(s.accent)}`,
            }}
          />
          <span style={chrome({ color: color(s.accent) })}>
            {s.label} {state === "no-location" ? "--:--" : snapshot.syncedAt}
          </span>
          <span
            style={{
              ...chrome({ color: color("phosphor") }),
              width: m.refreshHitDp - 8,
              height: m.refreshHitDp - 8,
              display: "grid",
              placeItems: "center",
              border: `1px solid ${hexA(color("rule"), 0.8)}`,
              fontSize: 11,
            }}
          >
            {s.refreshGlyph}
          </span>
        </div>

        {s.showsData ? (
          <>
            {/* ── hero row ───────────────────────────────────────── */}
            <div className="flex items-center" style={{ gap: 8 }}>
              <PixelIcon kind={snapshot.kind} size={32} />
              <span
                className="glow-breathe"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 34,
                  lineHeight: "30px",
                  color: color("cyan"),
                }}
              >
                {snapshot.now}°
              </span>
              <div className="flex flex-col" style={{ gap: 1 }}>
                <span style={{ fontSize: 10, color: color("phosphor") }}>
                  {snapshot.condition}
                </span>
                <span style={{ fontSize: 10, color: color("phosphorDim") }}>
                  feels {snapshot.feels}°
                </span>
              </div>
            </div>

            <div className="h-px" style={{ background: hexA(color("rule"), 0.45) }} />

            {/* ── 4-day grid ─────────────────────────────────────── */}
            <div
              className="grid flex-1"
              style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: m.columnGapDp }}
            >
              {snapshot.days.map((d, i) => {
                const bar = popToBar(d.pop);
                return (
                  <div
                    key={d.label}
                    className="flex flex-col items-center justify-center"
                    style={{
                      gap: 1,
                      borderLeft:
                        i === 0 ? "none" : `1px solid ${hexA(color("rule"), 0.28)}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        letterSpacing: 1.6,
                        color: i === 0 ? color("phosphor") : color("phosphorDim"),
                      }}
                    >
                      {d.label}
                    </span>
                    <PixelIcon kind={d.kind} size={32} />
                    <span style={{ fontSize: 15, fontWeight: 700, lineHeight: "16px" }}>
                      {d.day}°
                      <span style={{ fontSize: 10, fontWeight: 400, color: color("phosphorDim") }}>
                        /{d.night}°
                      </span>
                    </span>
                    <span style={{ fontSize: 9, color: color(bar.accent) }}>
                      {bar.glyphs} {d.pop}%
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-center">
            <span style={{ fontSize: 11, color: color("phosphorDim") }}>
              {"> brak fixa GPS — dotknij [⌖] i wskaż miasto_"}
            </span>
          </div>
        )}

        {/* ── sigma comment zone ───────────────────────────────── */}
        <div
          className="truncate"
          style={{
            background: hexA(color("zone"), 0.85),
            borderTop: `1px solid ${hexA(color("rule"), 0.5)}`,
            margin: -m.padDp,
            marginTop: 2,
            padding: `4px ${m.padDp}px`,
            fontSize: 10,
            color: color("phosphorDim"),
          }}
        >
          <span style={{ color: color("rule") }}>{"// "}</span>
          {snapshot.comment}
        </div>
      </div>
    </div>
  );
}

function CornerBrackets() {
  const b = WIDGET_METRICS.bracketDp;
  const line = `1px solid ${color("phosphor")}`;
  const corners = [
    { top: 3, left: 3, borderTop: line, borderLeft: line },
    { top: 3, right: 3, borderTop: line, borderRight: line },
    { bottom: 3, left: 3, borderBottom: line, borderLeft: line },
    { bottom: 3, right: 3, borderBottom: line, borderRight: line },
  ];
  return (
    <>
      {corners.map((c, i) => (
        <span
          key={i}
          className="pointer-events-none absolute"
          style={{ width: b, height: b, opacity: 0.75, ...c }}
        />
      ))}
    </>
  );
}

function chrome(extra: Record<string, string | number> = {}) {
  return {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
    ...extra,
  };
}

/** #rrggbb + alpha -> rgba() string */
function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
