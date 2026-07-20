import { useMemo } from "react";
import { PixelIcon } from "./PixelIcon";
import type { WeatherResponse } from "@/lib/weather-api";
import { wmoToKind, wmoLabel } from "@/lib/wmo";
import { pickJoke } from "@/lib/dev-jokes";

export function WeatherWidget({
  data,
  location,
}: {
  data: WeatherResponse;
  location: string;
}) {
  const c = data.current;
  const kind = wmoToKind(c.weather_code);
  const isNight = c.is_day === 0;
  const joke = useMemo(
    () => pickJoke(kind, isNight),
    [kind, isNight, c.time],
  );

  return (
    <div className="terminal-box relative p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-widest text-[color:var(--phosphor-dim)]">
        <span>┌─ widget/home ─┐</span>
        <span className="blink">●</span>
      </div>

      <div className="flex items-start gap-5">
        <PixelIcon kind={isNight && kind === "sun" ? "moon" : kind} size={128} />
        <div className="flex-1">
          <div className="font-display text-[80px] leading-none crt-glow">
            {Math.round(c.temperature_2m)}°
          </div>
          <div className="mt-1 text-sm text-[color:var(--phosphor-dim)]">
            feels_like = {Math.round(c.apparent_temperature)}°
          </div>
          <div className="mt-2 text-base uppercase tracking-wider">
            {wmoLabel(c.weather_code)}
          </div>
          <div className="mt-1 text-sm text-[color:var(--phosphor-dim)]">
            @ {location}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-[color:var(--phosphor-dim)] pt-3">
        <div className="text-xs text-[color:var(--phosphor-dim)]">
          {"// "}dev.joke()
        </div>
        <div className="mt-1 text-sm text-[color:var(--amber)]">{joke}</div>
      </div>
    </div>
  );
}
