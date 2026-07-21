<div align="center">

# 🟢 homebrew-weather

**`$ weather --today`**

A pixel-art weather terminal for developers. Green phosphor, CRT scanlines, and a forecast that ships with dev jokes instead of ads.

[![beta](https://img.shields.io/badge/status-beta-33ff66?style=flat-square&labelColor=0a0f0a)](https://github.com/pi0trdotsys/pixel-weather-pal/releases)
[![stack](https://img.shields.io/badge/stack-TanStack%20Start%20%7C%20React%2019%20%7C%20Tailwind%20v4-0a0f0a?style=flat-square&labelColor=000000&color=33ff66)](#stack)
[![data](https://img.shields.io/badge/data-Open--Meteo-ffb000?style=flat-square&labelColor=0a0f0a)](https://open-meteo.com/)

</div>

---

## `man homebrew-weather`

```
NAME
    homebrew-weather — pixel-art weather forecast for developers

SYNOPSIS
    A tiny weather app styled like a 1980s phosphor CRT terminal.
    16×16 hand-drawn pixel icons, dev jokes matched to conditions,
    typewriter ASCII forecast, and a widget-shaped home tile.

DATA
    Weather + geocoding via open-meteo.com — free, no key, no tracking.
    Location comes straight from your device; nothing else leaves it.

BUGS
    // TODO: teach it to make coffee
```

## Features

- **`$ weather --today`** — a real terminal panel with typewriter-animated forecast output
- **Now / Hourly / 7-day** — feels-like, wind, humidity, pressure as "system stats"; 24h scroll strip; 7-day forecast rendered as a terminal table
- **Native Android home-screen widget** — a real 4×2 App Widget (not a WebView), rendering the same pixel icons/forecast the app does, with its own refresh button and city picker, entirely independent of the app being open
- **Weather notifications** — rain incoming, high/low temperature, and big day-to-day swings, evaluated natively in the background and configurable per-threshold
- **`./settings`** — refresh interval + all notification toggles/thresholds, shared between the app and the widget's background worker
- **Zero backend** — everything runs client-side (and, on Android, natively) against [Open-Meteo](https://open-meteo.com/); no API keys, no server, no tracking
- **Installable** — PWA manifest for "Add to Home Screen", plus a native Android beta build (see [Releases](https://github.com/pi0trdotsys/pixel-weather-pal/releases))

## Stack

| Layer      | Tech                                             |
| ---------- | ------------------------------------------------ |
| Framework  | [TanStack Start](https://tanstack.com/start) + [TanStack Router](https://tanstack.com/router) |
| UI         | React 19, Tailwind CSS v4, Radix primitives      |
| Data       | [Open-Meteo](https://open-meteo.com/) (weather + geocoding), TanStack Query |
| Mobile     | [Capacitor](https://capacitorjs.com/) + native Kotlin (AppWidgetProvider, WorkManager, notifications) |
| Settings   | [@capacitor/preferences](https://capacitorjs.com/docs/apis/preferences) — shared storage between the web app and native widget/worker |
| Tooling    | Vite, Bun, ESLint, Prettier                      |

## Getting started

```bash
bun install
bun run dev      # http://localhost:3000
```

```bash
bun run build    # production build
bun run lint     # eslint
bun run format   # prettier --write .
```

## Android (beta)

A debug-signed beta `.apk` wraps the static client build (Capacitor WebView) alongside a genuinely native home-screen widget and background worker written in Kotlin — the widget keeps working, refreshing, and notifying even if the app itself is never opened. Grab the latest build from [Releases](https://github.com/pi0trdotsys/pixel-weather-pal/releases).

```bash
bun run build:capacitor   # static web build → capacitor-www/
npx cap sync android
cd android && ./gradlew assembleDebug
```

Add the widget from your launcher's widget picker ("Homebrew Weather", 4×2) — it'll prompt you to pick a city (or use your location), then updates itself on the interval set in `./settings`.
