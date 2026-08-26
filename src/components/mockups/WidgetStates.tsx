import { WidgetMock4x2 } from "@/components/mockups/WidgetMock4x2";
import {
  MOCK_SNAPSHOT,
  WIDGET_METRICS,
  type WidgetOpacity,
  type WidgetSnapshot,
  type WidgetState,
} from "@/lib/widget-tokens";

/** Per-state snapshot overrides used by the mockup gallery. */
export const STATE_SNAPSHOTS: Record<WidgetState, WidgetSnapshot> = {
  ok: MOCK_SNAPSHOT,
  stale: {
    ...MOCK_SNAPSHOT,
    syncedAt: "19:41",
    comment: "dane sprzed godziny, jak twój ostatni commit",
  },
  offline: {
    ...MOCK_SNAPSHOT,
    syncedAt: "18:02",
    comment: "brak sieci — lecimy z cache, ogarnij router",
  },
  refreshing: {
    ...MOCK_SNAPSHOT,
    syncedAt: "22:06",
    comment: "GET api.open-meteo.com ... czekaj sekundę",
  },
  "no-location": {
    ...MOCK_SNAPSHOT,
    city: "unknown",
    comment: "nie wiem gdzie jesteś i szczerze, ty chyba też nie",
  },
};

export const STATE_ORDER: WidgetState[] = [
  "ok",
  "refreshing",
  "stale",
  "offline",
  "no-location",
];

export const STATE_NOTES: Record<WidgetState, string> = {
  ok: "Świeże dane, kropka fosforowa, timestamp ostatniej synchronizacji.",
  refreshing: "Ikona ⟳ podmieniona na klatkę spinnera, akcent cyan.",
  stale: "Dane starsze niż interwał — akcent bursztynowy, dane nadal widoczne.",
  offline: "Brak sieci, snapshot z cache, akcent czerwony i glif ostrzeżenia.",
  "no-location": "Brak koordynatów — siatka dni ukryta, prompt o wskazanie miasta.",
};

export function WidgetStateGallery({
  opacity = 85,
  scale = 1,
}: {
  opacity?: WidgetOpacity;
  scale?: number;
}) {
  return (
    <div className="flex flex-wrap gap-6">
      {STATE_ORDER.map((state) => (
        <figure key={state} className="flex flex-col gap-2">
          <figcaption className="text-xs uppercase tracking-widest text-[color:var(--phosphor-dim)]">
            {state}
          </figcaption>
          <div
            style={{
              width: WIDGET_METRICS.widthDp * scale,
              height: WIDGET_METRICS.heightDp * scale,
            }}
          >
            <WidgetMock4x2
              state={state}
              snapshot={STATE_SNAPSHOTS[state]}
              opacity={opacity}
              scale={scale}
            />
          </div>
          <p className="max-w-[330px] text-[11px] leading-snug text-[color:var(--phosphor-dim)]">
            {STATE_NOTES[state]}
          </p>
        </figure>
      ))}
    </div>
  );
}
