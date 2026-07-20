import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "about — Homebrew Weather" },
      {
        name: "description",
        content:
          "About Homebrew Weather: a pixel-art, terminal-themed weather app for developers.",
      },
      { property: "og:title", content: "about — Homebrew Weather" },
      {
        property: "og:description",
        content: "Pixel-art weather for devs. Powered by Open-Meteo.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="text-xs uppercase tracking-widest text-[color:var(--phosphor-dim)] hover:text-[color:var(--phosphor)]"
      >
        ← cd ~/
      </Link>
      <h1 className="mt-4 font-display text-4xl crt-glow">
        $ man homebrew-weather
      </h1>
      <div className="terminal-box mt-6 space-y-4 p-5 text-sm leading-relaxed">
        <p>
          <span className="text-[color:var(--phosphor-dim)]">NAME</span>
          <br />
          homebrew-weather — pixel-art weather forecast for developers
        </p>
        <p>
          <span className="text-[color:var(--phosphor-dim)]">SYNOPSIS</span>
          <br />
          A tiny weather PWA styled like a 1980s phosphor CRT terminal.
          16×16 hand-drawn pixel icons, dev jokes for every condition,
          ASCII forecast, and a widget-shaped home tile. Install it on your
          phone (Add to Home Screen) and it launches full-screen with its
          own app icon.
        </p>
        <p>
          <span className="text-[color:var(--phosphor-dim)]">DATA</span>
          <br />
          Weather + geocoding: {" "}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-[color:var(--amber)]"
          >
            open-meteo.com
          </a>{" "}
          — free, no key, no tracking. Location comes from your browser's
          Geolocation API; nothing leaves your device except the coords sent
          to Open-Meteo.
        </p>
        <p>
          <span className="text-[color:var(--phosphor-dim)]">BUGS</span>
          <br />
          {"// TODO: teach it to make coffee"}
        </p>
        <p className="text-[color:var(--phosphor-dim)]">
          {"# EOF"}
          <span className="blink">_</span>
        </p>
      </div>
    </div>
  );
}
