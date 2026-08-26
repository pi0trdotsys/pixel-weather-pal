# Redesign widgetu 4×2 — "Terminal 2.0"

Cel: nowa, bardziej czytelna i „hyper future tech" makieta widgetu Androida 4×2, dostarczona jako klikalne makiety w TypeScripcie + tokeny + spec dla Claude'a, który zaimplementuje to w RemoteViews.

## Kierunek wizualny

Zostaje fosforowa zieleń jako baza, dochodzi warstwa HUD:

- Baza: `#000` → `#060d06` pionowy gradient tła, ramka 1px `#1f8a3f` z jaśniejszym narożnikowym akcentem (corner brackets `⌐ ¬ ∟ ⌐`).
- Akcent zimny: cyan `#55ffff` dla danych „live" (temperatura teraz, pasek POP), bursztyn `#ffb000` dla ostrzeżeń/stale, czerwień `#ff5555` dla offline.
- Micro-grid: subtelna siatka kropek 4dp w tle (drawable), daje wrażenie HUD-u bez szumu.
- Typografia: monospace, wyraźna hierarchia — temp dnia 22sp bold, noc 12sp dim, etykiety dni 9sp uppercase z trackingiem.
- Czytelność: wyraźniejszy kontrast dim-textu (`#3f8f55` zamiast obecnego ciemnego zielonego), większe odstępy między kolumnami, separatory hairline zamiast pełnych ramek.

## Nowy układ 4×2

```text
┌ HBW ─ Warszawa ──────────── ● sync 22:04  [⟳] ┐
│  ▓▓ 24°  clear sky            feels 25°       │
│  ────────────────────────────────────────────  │
│  DZIŚ    ŚR      CZW     PT                    │
│  [ico]   [ico]   [ico]   [ico]                 │
│  24°/12° 21°/11° 18°/9°  16°/8°                │
│  ▁▃▅ 10% ▁▁▁ 0%  ▅▇▇ 70% ▃▅▅ 45%              │
│  "kod się sam nie napisze, ruszaj się"         │
└────────────────────────────────────────────────┘
```

Zmiany względem obecnego: pasek „hero" z aktualną temperaturą (dziś dubluje się z kolumną), POP jako mini słupek + %, sigma-komentarz w osobnej strefie z ciemniejszym tłem, ikona refresh w prawym górnym rogu z kropką stanu połączenia.

## Efekty / smaczki (wykonalne w RemoteViews)

- „Scanline sweep" — statyczny gradient drawable u góry kafla imitujący przebieg promienia.
- Corner brackets + hairline separatory zamiast pełnej ramki.
- Kropka stanu: pulsująca imitacja przez naprzemienne drawables przy każdym tick BlinkAlarm (już istnieje).
- Kursor `_` mrugający (istniejący mechanizm) przeniesiony na koniec nazwy miasta.
- Stan „refreshing": ikona ⟳ zamieniana na klatkę `◜◝◞◟` przy każdej aktualizacji (bez prawdziwej animacji — RemoteViews jej nie ma).
- Wersja glass/glow tylko na poziomie makiety web (blur, animacje) — spec jasno rozdziela „web-only" od „android-safe".

## Dostawa

1. `src/lib/widget-tokens.ts` — kolory, rozmiary tekstu, spacing, mapowanie POP→słupek, warianty stanu (ok / stale / offline / refreshing). Jedno źródło prawdy, eksportowane typy.
2. `src/components/mockups/WidgetMock4x2.tsx` — komponent renderujący makietę widgetu na fake danych, pixel-perfect proporcje 4×2 (~330×155dp).
3. `src/components/mockups/WidgetStates.tsx` — te same makiety w stanach: online, stale, offline, loading, brak lokalizacji.
4. `src/routes/mockups.tsx` — trasa `/mockups`: podgląd na tle „ekranu głównego", przełącznik stanów i przełącznik przezroczystości tła (35/60/85/100 — jak istniejące `widget_background_*`).
5. `docs/widget-spec.md` — dokumentacja dla Claude'a: mapa element → `@+id/...` w `weather_widget.xml`, tabela tokenów → `widget_colors.xml`, lista drawables do dodania, ograniczenia RemoteViews, checklista implementacji.

## Techniczne detale

- Makiety są czystym frontendem na danych statycznych — nie ruszają `weather-api.ts`, cache'u ani logiki odświeżania.
- Tokeny w TS trzymają wartości hex 1:1 z tym, co trafi do `res/values/widget_colors.xml`, żeby nie było rozjazdu.
- Trasa `/mockups` dostaje własny `head()` z tytułem/opisem, `robots: noindex`.
- Nowe kolory dodaję do `src/styles.css` jako tokeny (`--hud-cyan` itd.) — bez hardkodowanych klas kolorów w komponentach.
- Nic w `android/` nie jest zmieniane w tym kroku — to dostarcza dopiero implementacja wg spec.

## Poza zakresem

- Sama implementacja w Kotlinie/XML (to robi Claude wg spec).
- Redesign strony głównej aplikacji web — osobny krok, jeśli zechcesz.
