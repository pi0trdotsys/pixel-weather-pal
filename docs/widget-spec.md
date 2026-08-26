# Widget „Terminal 2.0" — spec dla Claude (implementacja natywna Android)

Spec przenosi webową makietę `src/components/mockups/WidgetMock4x2.tsx` na natywny
widget Android (AppWidgetProvider + RemoteViews). Nie przepisuj logiki od zera —
rozszerz istniejący widget, zachowując jego kontrakt (odświeżanie w tle, cache,
offline, motywy, AQI, sigma-joke).

## Pliki referencyjne

- Makieta web: `src/components/mockups/WidgetMock4x2.tsx`, `WidgetStates.tsx`
- Tokeny web: `src/lib/widget-tokens.ts` (1:1 z kolorami native — trzymaj w syncu)
- Trasa podglądu: `src/routes/mockups.tsx` (`/mockups`)
- Natywny provider: `android/app/src/main/java/dev/pi0trdotsys/homebrewweather/widget/WeatherWidgetProvider.kt`
- Natywny layout: `android/app/src/main/res/layout/weather_widget.xml`
- Kolory: `android/app/src/main/res/values/widget_colors.xml`
- Info widgetu: `android/app/src/main/res/xml/weather_widget_info.xml`
- Ikony: `widget/PixelIcons.kt`, żarty: `widget/SigmaJokes.kt`

## 1. Elementy makupy → @+id (RemoteViews)

| Region w makiecie | Rola | `@+id` | Z czego jest budowane |
|---|---|---|---|
| `┌─ Warszawa ─┐` | lokalizacja (dim, theme) | `widget_header_label` | `setTextViewText`, prefix `"◎ "` gdy isLive |
| `_` (migający kursor) | blink | `widget_cursor` | `BlinkAlarm` przełącza `VISIBLE/GONE` |
| status online/offline | dot | `widget_online_dot` | `widget_dot_online` / `widget_dot_offline` |
| przycisk miasta | konfiguracja | `widget_city_btn` | `PendingIntent.getActivity` |
| przycisk odświeżania | refresh | `widget_refresh_btn` | `PendingIntent.getBroadcast` (`ACTION_REFRESH`) |
| **hero temp `21°C`** (duży VT323) | aktualna temp | **NOWY `widget_hero_temp`** | duży `TextView`, kolor `widget_cyan`, glow = cień |
| `now · partly cloudy · rain 20%` | warunki | `widget_now_line` | istniejące |
| ikona warunków | hero | `widget_now_icon` | `PixelIcons.render(kind, px, frame)` |
| **sparkline POP (4 słupki)** | trend opadów | **NOWY `widget_sparkline`** | `TextView` z blokami `▁▂▃▅▇` (patrz §4) |
| `AQI 42 · good` | meta | `widget_aqi_line` | istniejące |
| etykieta dnia `dziś/śr/cz/pt` | grid | `widget_day{0..3}_label` | theme primary, `dowAbbrev()` |
| ikona dnia | grid | `widget_icon{0..3}` | `PixelIcons.render(...)`, frame animacji |
| temp dzień/noc `24° / 14°` | grid | `widget_temp{0..3}` | `tempSpannable()` (amber/dim) |
| `▽ 20%` | PoP | `widget_pop{0..3}` | `"▽ ${pop}%"` cyan |
| meta (feels/hum/wind) | opcjonalne | `widget_meta_line` | kompakt → `GONE` |
| `// sigma.forecast()` | stopka | `widget_footer_comment` | dim |
| `> sigma komentarz` | stopka | `widget_footer_joke` | amber, `SigmaJokes.pick(...)` |
| **narożne nawiasy HUD** | dekoracja | **NOWE 4×`ImageView`** lub warstwa tła | patrz §4 |
| **siatka HUD** | tło | `widget_root` background | patrz §4 |
| banner stanu (stale/offline/refreshing) | status | **NOWY `widget_status_banner`** | opcjonalny pasek |

> Nie zmieniaj identyfikatorów, które już istnieją — natywny worker, provider i
> testy debugowe się do nich odwołują. Nowe widoki tylko dodawaj.

## 2. Tokeny → widget_colors.xml

Makieta używa `WIDGET_COLORS` z `src/lib/widget-tokens.ts`. Mapowanie na natywne
kolory (istniejące zostają; dopisz tylko brakujące):

| Token mockupu | Hex | Zasób native | Status |
|---|---|---|---|
| `bg` | `#0a0f0a` | `widget_bg` | istnieje |
| `green` | `#33ff66` | `widget_green` | istnieje |
| `greenDim` | `#4a6a4a` | `widget_green_dim` | istnieje |
| `amber` | `#ffb000` | `widget_amber` | istnieje |
| `amberDim` | `#806000` | `widget_amber_dim` | istnieje |
| `cyan` | `#55ffff` | `widget_cyan` | istnieje |
| `cyanDim` | `#2a6666` | `widget_cyan_dim` | istnieje |
| `crimson` | `#ff5555` | `widget_crimson` | istnieje |
| `crimsonDim` | `#703030` | `widget_crimson_dim` | istnieje |
| `online` / `offline` | `#33ff66` / `#ff5555` | `widget_online` / `widget_offline` | istnieje |
| `aqi*` (6 kolorów) | — | `widget_aqi_*` | istnieje |
| `hudCyan` | `#55ffff` | `widget_cyan` | alias (nie dodawaj duplikatu) |
| `hudCyanDim` | `#2a6666` | `widget_cyan_dim` | alias |
| `hudGrid` | `rgba(85,255,255,0.10)` | **NOWY `widget_hud_grid`** | dodaj |
| `hudGlow` | `rgba(85,255,255,0.45)` | **NOWY `widget_hud_glow`** | dodaj (glow/boxShadow → shadowColor/shadowRadius na TextView lub `drawable`) |
| `hudLine` | `rgba(85,255,255,0.35)` | **NOWY `widget_hud_line`** | dodaj |
| `hudScan` | `rgba(85,255,255,0.06)` | **NOWY `widget_hud_scan`** | dodaj |
| `hudMagenta` | `#ff4fd8` | **NOWY `widget_hud_magenta`** | dodaj |

> `withAlpha()` w webie to po prostu `#AARRGGBB` w XML (np. 10% → `0x1A`,
> 45% → `0x73`). Nie używaj `setViewAlpha` na całym widżecie — dotyczy to tylko
> tła (`widget_root` → `widget_background_*`).

## 3. Nowe drawable / kolory do dodania

1. **`widget_hud_grid.xml`** (drawable) — siatka blueprint 16dp: `layer-list` z
   dwoma `BitmapDrawable`/`shape` paskami (pion + poziom) w `widget_hud_grid`,
   opcjonalnie z `radial-gradient` maską (XML ma ograniczone `radial-gradient`;
   jak nie da się zamaskować — po prostu cała siatka, będzie subtelna i tak OK).
2. **`widget_background_hud.xml`** (drawable) — zaokrąglony fill `widget_bg` +
   `stroke` 1dp `widget_hud_line` + wewnętrzny `shape` siatki. Użyj jako bazowego
   tła `widget_root` (zamiast/obok `widget_background_*` — te trzymaj dalej, bo
   odpowiadają za przezroczystość).
3. **Narożne nawiasy** — 4× `ImageView` (po jednym na róg) z drawable `widget_corner_tl/tr/bl/br`
   (kształt „L" 2dp grubości, `widget_hud_line`), albo pojedynczy `layer-list`
   w `widget_background_hud`. Prościej: layer-list w tle (mniej widoków, mniejszy
   koszt RemoteViews).
4. **`widget_status_banner`** (TextView, `visibility=gone` domyślnie) — pasek
   `stale · retrying` / `offline · serving cached snapshot` / `refreshing…`,
   kolor wg stanu (amber/crimson/cyan).
5. **`widget_hero_temp`** (TextView) — duży `textSize` (np. 24sp), `fontFamily`
   „monospace", `textColor=widget_cyan`, `shadowColor=widget_hud_glow`,
   `shadowRadius=6`, `shadowDx/Dy=0`.
6. **`widget_sparkline`** (TextView) — trend POP 4 dni. RemoteViews nie rysuje
   wykresów, więc zamień `popToSparkline()` na Unicode: posortuj wartości,
   przypisz znaki `▁▂▃▄▅▆▇█` proporcjonalnie do `pop / maxPop`, wypisz 4 znaki
   w `widget_sparkline`. Kolor: `widget_amber` gdy któryś dzień ≥ 50%, inaczej
   `widget_cyan`.

## 4. Ograniczenia RemoteViews (minimum, którego nie wolno złamać)

- Tylko widoki z allow-listy (`FrameLayout`, `LinearLayout`, `TextView`,
  `ImageView`, `ImageButton`, `ProgressBar`, `Chronometer`, `AnalogClock`…). **Nie
  ma** zwykłego `View` ani custom view — stąd separator 1dp w layoutcie to `TextView`.
- **Brak CSS/`animate-spin`/`mix-blend-mode`/`mask-image`** — wszystko z webowej
  makety trzeba odwzorować statycznie lub dyskretnie (patrz §5).
- `RemoteViews.setTextColor(id, Int)` — bezpieczne od minSdk 24. `ColorStateList`
  (API 31+) i `setInt(id, "setBackgroundColor", …)` używaj ostrożnie/nie używaj.
- Kolor tła fill: `rv.setInt(widget_root, "setBackgroundResource", drawableRes)` —
  dokładnie tak robi obecny `WidgetTransparency`. Nie dodawaj nowej osi przezroczystości.
- Wszystko w `buildRemoteViews()` to czysty, deterministyczny stan — **żadnych
  ciągłych animacji**. Ticker ~60 s to `BlinkAlarm`/`handleBlinkTick` (już istnieje).
- `setImageViewBitmap` co refresh jest OK, ale pamiętaj o limicie rozmiaru
  RemoteViews (≈ rozsądne, małe bitmapy 16×16 skalowane nearest-neighbor).

## 5. Jak odtworzyć efekty webowe w natywie

| Efekt web | Natywny odpowiednik |
|---|---|
| `.widget-sweep` (przesuwający się błysk) | Nie da się płynnie. Opcje: (a) statyczny diagonalny `gradient` w tle, (b) `widget_sweep` ImageView z `level-list` przełączanym co tick ~60s (imitacja skanu). Wybierz (a) jako bazę, (b) jako smaczek. |
| `animate-spin` na ikonie refresh | `ProgressBar` (indeterminate, mały, cyan) pokazywany tylko w stanie `refreshing`; albo `level-list` na `ImageView`. `ProgressBar` jest prostszy i w allow-liście. |
| `pixel-materialize` / klatki ikon | `PixelIcons.transformGrid(frame)` + `BlinkPrefs.frame()` — już działa. |
| migający kursor | `widget_cursor` + `BlinkAlarm` — już działa. |
| glow tekstu (hero temp) | `shadowColor/shadowRadius` na TextView (android:shadowColor itd.). |
| siatka HUD | `widget_hud_grid.xml` w tle. |

## 6. Checklista implementacyjna

- [ ] Dodać nowe kolory do `widget_colors.xml` (hud_grid/glow/line/scan/magenta).
- [ ] Dodać drawable: `widget_background_hud`, `widget_hud_grid` (+ ew. 4 narożniki).
- [ ] Layout: dodać `widget_hero_temp`, `widget_sparkline`, `widget_status_banner`;
      przeorganizować sekcję „right now" w hero (duża temp + sparkline), zachowując
      istniejące `@+id` i kompaktowe progi (compactHeight/compactWidth).
- [ ] `buildRemoteViews()`: zasilić hero temp, sparkline (mapowanie POP→znaki),
      status banner (stale/offline/refreshing), glow hero.
- [ ] Stan `refreshing`: pokazać `ProgressBar`/`level-list` na ikonie refresh.
- [ ] Stan `offline`: banner „offline · serving cached snapshot" + dim danych
      (obniż kontrast/alfa tekstów gridu — NIE `setViewAlpha` na root).
- [ ] Stan `stale`: banner „stale · retrying" (amber).
- [ ] Stan `no-location`: header `set city`, hero → „tap [city] to configure".
- [ ] 4×2: `weather_widget_info.xml` → `targetCellHeight="2"`, `minHeight="110dp"`
      (teraz jest `3`/`180dp`). Zweryfikuj, czy hero + grid + sigma mieszczą się;
      jeśli nie — utrzymaj 4×3 i traktuj makietę jako gęstszy wariant.
- [ ] Zsynchronizować `widget_colors.xml` z `src/lib/widget-tokens.ts` (hex 1:1).
- [ ] `gradlew assembleDebug` + `lint` przechodzi; widget renderuje się w
      `WidgetPreviewDebugActivity` bez przycinania.

## 7. Wymiary

- 4×2 = **250×110dp** (cell 70dp, padding -30dp). Makieta webowa = 2.4× (600×264px),
  więc wszystkie `TYPE_SCALE` px dzielisz przez 2.4 → sp (np. hero 44px ≈ 18sp).
- Obecny widget deklaruje 4×3 (`targetCellHeight=3`, `minHeight=180dp`). Decyzja:
  albo celuj w prawdziwe 4×2 (ryzyko ściśnięcia hero+grid+sigma), albo zostań przy
  4×3 i użyj makiet tylko jako wzorca wizualnego.


