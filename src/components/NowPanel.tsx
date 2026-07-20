import type { WeatherResponse } from "@/lib/weather-api";

export function NowPanel({ data }: { data: WeatherResponse }) {
  const c = data.current;
  const rows: Array<[string, string]> = [
    ["temp", `${c.temperature_2m.toFixed(1)}°C`],
    ["apparent", `${c.apparent_temperature.toFixed(1)}°C`],
    ["humidity", `${c.relative_humidity_2m}%`],
    ["wind", `${c.wind_speed_10m.toFixed(1)} km/h`],
    ["pressure", `${Math.round(c.surface_pressure)} hPa`],
    ["daylight", c.is_day ? "true" : "false"],
    ["tz", data.timezone],
  ];
  return (
    <div className="terminal-box p-4">
      <div className="mb-2 text-xs uppercase tracking-widest text-[color:var(--phosphor-dim)]">
        $ cat /proc/weather
      </div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-[color:var(--phosphor-dim)]/30 last:border-0">
              <td className="py-1 text-[color:var(--phosphor-dim)]">{k}</td>
              <td className="py-1 text-right font-mono">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
