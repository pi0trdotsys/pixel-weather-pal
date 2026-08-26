import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { WidgetMock4x2 } from "@/components/mockups/WidgetMock4x2";
import {
  STATE_NOTES,
  STATE_ORDER,
  STATE_SNAPSHOTS,
  WidgetStateGallery,
} from "@/components/mockups/WidgetStates";
import {
  WIDGET_COLORS,
  WIDGET_METRICS,
  WIDGET_OPACITIES,
  type WidgetOpacity,
  type WidgetState,
} from "@/lib/widget-tokens";

export const Route = createFileRoute("/mockups")({
  head: () => ({
    meta: [
      { title: "Makiety widgetu 4×2 — Homebrew Weather" },
      {
        name: "description",
        content:
          "Interaktywne makiety widgetu 4×2 w stylu Terminal 2.0: stany, przezroczystość tła i tokeny designu.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Makiety widgetu 4×2 — Homebrew Weather" },
      {
        property: "og:description",
        content: "Podgląd widgetu Terminal 2.0 na ekranie głównym, we wszystkich stanach.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Mockups,
});

function Mockups() {
  const [state, setState] = useState<WidgetState>("ok");
  const [opacity, setOpacity] = useState<WidgetOpacity>(85);
  const [zoom, setZoom] = useState(1.4);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl crt-glow sm:text-4xl">
          $ widget --mock 4x2
          <span className="blink">_</span>
        </h1>
        <nav className="flex gap-4 text-xs uppercase tracking-widest text-[color:var(--phosphor-dim)]">
          <Link to="/" className="hover:text-[color:var(--phosphor)]">
            cd ~/
          </Link>
          <Link to="/settings" className="hover:text-[color:var(--phosphor)]">
            ./settings
          </Link>
        </nav>
      </header>

      {/* controls */}
      <div className="terminal-box flex flex-wrap items-center gap-x-6 gap-y-3 p-3 text-xs">
        <Group label="state">
          {STATE_ORDER.map((s) => (
            <Chip key={s} active={s === state} onClick={() => setState(s)}>
              {s}
            </Chip>
          ))}
        </Group>
        <Group label="bg alpha">
          {WIDGET_OPACITIES.map((o) => (
            <Chip key={o} active={o === opacity} onClick={() => setOpacity(o)}>
              {o}%
            </Chip>
          ))}
        </Group>
        <Group label="zoom">
          {[1, 1.4, 2].map((z) => (
            <Chip key={z} active={z === zoom} onClick={() => setZoom(z)}>
              {z}×
            </Chip>
          ))}
        </Group>
      </div>

      {/* home-screen stage */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-widest text-[color:var(--phosphor-dim)]">
          $ preview --homescreen
        </h2>
        <div
          className="relative overflow-hidden border border-[color:var(--phosphor-dim)]/50 p-6"
          style={{
            background:
              "radial-gradient(120% 90% at 20% 0%, #10231a 0%, #060d06 45%, #000 100%)",
          }}
        >
          <div className="mb-4 grid grid-cols-4 gap-4 opacity-40">
            {["mail", "term", "git", "spotify"].map((a) => (
              <div key={a} className="flex flex-col items-center gap-1">
                <div className="h-9 w-9 border border-[color:var(--phosphor-dim)]/60" />
                <span className="text-[9px] uppercase tracking-widest">{a}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              width: WIDGET_METRICS.widthDp * zoom,
              height: WIDGET_METRICS.heightDp * zoom,
              maxWidth: "100%",
            }}
          >
            <WidgetMock4x2
              state={state}
              snapshot={STATE_SNAPSHOTS[state]}
              opacity={opacity}
              scale={zoom}
            />
          </div>
          <p className="mt-4 text-[11px] text-[color:var(--phosphor-dim)]">
            {STATE_NOTES[state]} · {WIDGET_METRICS.widthDp}×{WIDGET_METRICS.heightDp} dp
          </p>
        </div>
      </section>

      {/* all states */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-widest text-[color:var(--phosphor-dim)]">
          $ preview --all-states
        </h2>
        <WidgetStateGallery opacity={opacity} />
      </section>

      {/* tokens */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-widest text-[color:var(--phosphor-dim)]">
          $ cat widget-tokens.ts
        </h2>
        <div className="terminal-box overflow-x-auto p-3">
          <table className="w-full text-left text-xs">
            <thead className="text-[color:var(--phosphor-dim)]">
              <tr>
                <th className="py-1 pr-4 font-normal">token</th>
                <th className="py-1 pr-4 font-normal">hex</th>
                <th className="py-1 pr-4 font-normal">widget_colors.xml</th>
                <th className="py-1 font-normal">rola</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(WIDGET_COLORS).map(([key, t]) => (
                <tr key={key} className="border-t border-[color:var(--phosphor-dim)]/25">
                  <td className="py-1 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 border border-[color:var(--phosphor-dim)]/60"
                        style={{ background: t.hex }}
                      />
                      {key}
                    </span>
                  </td>
                  <td className="py-1 pr-4">{t.hex}</td>
                  <td className="py-1 pr-4 text-[color:var(--phosphor-dim)]">{t.androidName}</td>
                  <td className="py-1 text-[color:var(--phosphor-dim)]">{t.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[color:var(--phosphor-dim)]">
          {"// spec implementacyjny: docs/widget-spec.md"}
        </p>
      </section>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="uppercase tracking-widest text-[color:var(--phosphor-dim)]">{label}</span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`border px-2 py-0.5 uppercase tracking-widest transition-colors ${
        active
          ? "border-[color:var(--phosphor)] bg-[color:var(--phosphor)] text-black"
          : "border-[color:var(--phosphor-dim)]/60 hover:border-[color:var(--phosphor)]"
      }`}
    >
      {children}
    </button>
  );
}
