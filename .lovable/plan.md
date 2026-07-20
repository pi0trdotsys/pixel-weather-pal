## Cel

Instalowalna aplikacja pogodowa (PWA) w estetyce homebrew / zielony terminal CRT. Wszystkie ikony pogodowe jako pixel-art, żarty programistyczne w interfejsie i na "widgecie" (dużym kafelku dashboardowym).

## Stack i integracje

- TanStack Start + Tailwind v4 (istniejąca baza).
- **Open-Meteo API** (bez klucza, bez backendu, bez Lovable Cloud) — geokodowanie i pogoda przez `fetch` z klienta.
- **Geolokalizacja przeglądarki** (`navigator.geolocation`) z fallbackiem na wyszukiwarkę miasta (Open-Meteo geocoding).
- PWA: manifest + ikony, `display: standalone`, motyw kolorystyczny zielony/czarny. Bez service workera (zgodnie ze skillem PWA — użytkownik prosi tylko o "widget na ekran główny", nie o offline).

## Wygląd (design system)

- Paleta: tło `#000000` / `#0a0f0a`, tekst `#33ff66` (fosfor), akcent bursztynowy `#ffb000` na ostrzeżenia, czerwony `#ff5555` na błędy. Efekt CRT: subtelne scanline'y (CSS `repeating-linear-gradient`), lekki glow (text-shadow), migający kursor `_`.
- Typografia: monospace pixel — `VT323` do nagłówków, `JetBrains Mono` do body (ładowane przez `<link>` w `__root.tsx`, nie `@import`).
- Ikony pogodowe: **własny komponent `<PixelIcon kind="sun|cloud|rain|snow|thunder|fog|partly" />`** rysowany siatką `div`-ów (16×16, `image-rendering: pixelated`) — bez zewnętrznych assetów, koloryzowany semantycznym tokenem, ostry pixel look bez rozmycia.

## Struktura tras

```
src/routes/
  __root.tsx          — head: fonty, manifest, theme-color; CRT overlay
  index.tsx           — dashboard: WidgetPreview + Now + Today + Hourly24 + Daily7 + TerminalOutput
  about.tsx           — o aplikacji + credits Open-Meteo
```

Jedna strona wystarcza dla MVP. `index.tsx` zastępuje placeholder.

## Komponenty

- `WeatherWidget` — duży kafelek 2×2 imitujący widget iOS/Android: pixel ikona, temperatura wielkim VT323, miasto, jeden losowy żart programistyczny pasujący do pogody ("It's raining. Perfect time to `git blame`.").
- `NowPanel` — temp odczuwalna, wiatr, wilgotność, ciśnienie — jako "system stats".
- `HourlyStrip` — 24h scroll poziomy, mini-ikonki + temp.
- `DailyForecast` — 7 dni jako tabela terminalowa (`| Mon | ☀ | 22° | 14° |`).
- `TerminalOutput` — sekcja stylizowana jak `$ weather --today`: ASCII-art ikona (duża) + prognoza wypisana linia po linii z "typewriter" animacją, prompt `user@homebrew-weather:~$`.
- `LocationBar` — przycisk `[locate]` + input `> search city_`.
- `JokeTicker` — losowy żart u dołu (`// TODO: fix the weather`).

## Dane (żarty)

Lokalny plik `src/lib/dev-jokes.ts` — ~40 żartów pogrupowanych po `condition` (sunny/rain/snow/cloud/thunder/fog/night). Widget i TerminalOutput losują z puli pasującej do aktualnej pogody.

## PWA (manifest-only)

- `public/manifest.webmanifest`: `name: "Homebrew Weather"`, `short_name: "brew-wx"`, `theme_color: "#0a0f0a"`, `background_color: "#000000"`, `display: "standalone"`, ikony 192/512 (pixel-art słońce+chmura na czarnym tle, generowane przez imagegen).
- `<link rel="manifest">`, `<meta name="theme-color">`, `apple-touch-icon` w `__root.tsx` head.
- Brak service workera, brak rejestracji — zgodnie z regułami preview safety.

## SEO / head

- `__root.tsx`: title "Homebrew Weather — Pixel-art forecast for devs", opis + og:title/og:description/og:type/twitter:card. Brak og:image na root.
- `index.tsx` head: og:image = wygenerowany hero (pixel-art scena pogodowa), plus twitter:image ten sam URL.

## Techniczne detale

- Fetch pogody przez `useQuery` z `queryKey: ["weather", lat, lon]`, ensureQueryData w loaderze `index` po ustaleniu koordów (koordy pochodzą z klienta → loader tylko dla wyszukiwania miasta ze search params `?lat&lon&name`).
- Fallback gdy brak koordów: prompt `> allow location or type city_`.
- Mapowanie WMO weather codes → nasze `kind` w `src/lib/wmo.ts`.
- CRT scanlines: warstwa `fixed inset-0 pointer-events-none` z `mix-blend-mode`.

## Zakres poza MVP (świadomie pomijam)

- Prawdziwy natywny widget systemowy — Lovable buduje web; PWA + duży kafelek to najbliżej.
- Zapisane miasta, ulubione, historia — nie było wymagane.
- Ostrzeżenia pogodowe, radar, mapy — poza zakresem.
