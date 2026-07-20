import type { WeatherResponse } from "@/lib/weather-api";
import { wmoToKind } from "@/lib/wmo";
import { PixelIcon } from "./PixelIcon";

export function HourlyStrip({ data }: { data: WeatherResponse }) {
  const now = new Date(data.current.time);
  const startIdx = data.hourly.time.findIndex(
    (t) => new Date(t).getTime() >= now.getTime() - 30 * 60 * 1000,
  );
  const slice = Array.from({ length: 24 }, (_, i) => startIdx + i).filter(
    (i) => i >= 0 && i < data.hourly.time.length,
  );
  return (
    <div className="terminal-box p-4">
      <div className="mb-3 text-xs uppercase tracking-widest text-[color:var(--phosphor-dim)]">
        $ weather --hourly 24
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {slice.map((i) => {
          const t = new Date(data.hourly.time[i]);
          const kind = wmoToKind(data.hourly.weather_code[i]);
          const pop = data.hourly.precipitation_probability[i] ?? 0;
          return (
            <div
              key={i}
              className="flex min-w-16 flex-col items-center gap-1 border border-[color:var(--phosphor-dim)]/40 p-2"
            >
              <div className="text-xs text-[color:var(--phosphor-dim)]">
                {t.getHours().toString().padStart(2, "0")}h
              </div>
              <PixelIcon kind={kind} size={32} />
              <div className="text-sm font-display leading-none">
                {Math.round(data.hourly.temperature_2m[i])}°
              </div>
              <div className="text-[10px] text-[color:var(--cyan)]">
                {pop}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
