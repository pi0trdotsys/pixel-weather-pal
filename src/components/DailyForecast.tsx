import type { WeatherResponse } from "@/lib/weather-api";
import { wmoToKind, wmoLabel } from "@/lib/wmo";
import { PixelIcon } from "./PixelIcon";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function DailyForecast({ data }: { data: WeatherResponse }) {
  return (
    <div className="terminal-box p-4">
      <div className="mb-3 text-xs uppercase tracking-widest text-[color:var(--phosphor-dim)]">
        $ weather --forecast 7
      </div>
      <div className="space-y-1">
        {data.daily.time.map((iso, i) => {
          const d = new Date(iso);
          const kind = wmoToKind(data.daily.weather_code[i]);
          const max = Math.round(data.daily.temperature_2m_max[i]);
          const min = Math.round(data.daily.temperature_2m_min[i]);
          const pop = data.daily.precipitation_probability_max[i] ?? 0;
          return (
            <div
              key={iso}
              className="grid grid-cols-[3rem_2.5rem_1fr_auto_auto] items-center gap-3 border-b border-[color:var(--phosphor-dim)]/30 py-1 text-sm last:border-0"
            >
              <span className="text-[color:var(--phosphor-dim)]">
                {i === 0 ? "today" : DOW[d.getDay()]}
              </span>
              <PixelIcon kind={kind} size={24} />
              <span className="truncate text-xs text-[color:var(--phosphor-dim)]">
                {wmoLabel(data.daily.weather_code[i])}
              </span>
              <span className="text-xs text-[color:var(--cyan)]">{pop}%</span>
              <span className="font-mono tabular-nums">
                <span className="text-[color:var(--amber)]">{max}°</span>
                <span className="text-[color:var(--phosphor-dim)]"> / </span>
                <span>{min}°</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
