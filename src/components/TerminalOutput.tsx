import { useEffect, useState } from "react";
import type { WeatherResponse } from "@/lib/weather-api";
import { wmoLabel, wmoToKind } from "@/lib/wmo";
import { pickJoke } from "@/lib/dev-jokes";

const ASCII: Record<string, string[]> = {
  sun: [
    "     \\   |   /     ",
    "      .-\"\"\"-.      ",
    "   -- (  o  o ) -- ",
    "      \\  ---  /    ",
    "      /`-...-`\\    ",
    "     /   |   \\     ",
  ],
  partly: [
    "    \\  |  /   .--.  ",
    "    .-\"\"-.  .-(    ). ",
    "   ( o  o )(___.__)__)",
    "    `----'           ",
  ],
  cloud: [
    "        .--.        ",
    "     .-(    ).      ",
    "    (___.__)__)     ",
    "                    ",
  ],
  fog: [
    "  _ - _ - _ - _ - _ ",
    " _ - _ - _ - _ - _ -",
    "  _ - _ - _ - _ - _ ",
    " _ - _ - _ - _ - _ -",
  ],
  rain: [
    "        .--.        ",
    "     .-(    ).      ",
    "    (___.__)__)     ",
    "     ' ' ' ' '      ",
    "    ' ' ' ' '       ",
  ],
  snow: [
    "        .--.        ",
    "     .-(    ).      ",
    "    (___.__)__)     ",
    "     *  *  *  *     ",
    "    *  *  *  *      ",
  ],
  thunder: [
    "        .--.        ",
    "     .-(    ).      ",
    "    (___.__)__)     ",
    "       /_ZZZ        ",
    "        /           ",
  ],
};

export function TerminalOutput({
  data,
  location,
}: {
  data: WeatherResponse;
  location: string;
}) {
  const kind = wmoToKind(data.current.weather_code);
  const art = ASCII[kind] ?? ASCII.cloud;
  const joke = pickJoke(kind, data.current.is_day === 0);

  const lines: string[] = [
    `user@homebrew-weather:~$ weather --today`,
    ``,
    ...art,
    ``,
    `location   : ${location}`,
    `condition  : ${wmoLabel(data.current.weather_code)}`,
    `temp       : ${data.current.temperature_2m.toFixed(1)}°C  (feels ${data.current.apparent_temperature.toFixed(1)}°C)`,
    `wind       : ${data.current.wind_speed_10m.toFixed(1)} km/h`,
    `humidity   : ${data.current.relative_humidity_2m}%`,
    `sunrise    : ${new Date(data.daily.sunrise[0]).toTimeString().slice(0, 5)}`,
    `sunset     : ${new Date(data.daily.sunset[0]).toTimeString().slice(0, 5)}`,
    ``,
    `# ${joke}`,
    `user@homebrew-weather:~$ `,
  ];

  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const id = setInterval(() => {
      setShown((s) => {
        if (s >= lines.length) {
          clearInterval(id);
          return s;
        }
        return s + 1;
      });
    }, 55);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.current.time, location]);

  return (
    <div className="terminal-box p-4 font-mono text-[13px] leading-tight">
      <div className="mb-2 flex items-center gap-2 text-xs text-[color:var(--phosphor-dim)]">
        <span className="inline-block h-3 w-3 rounded-full bg-[color:var(--crimson)]" />
        <span className="inline-block h-3 w-3 rounded-full bg-[color:var(--amber)]" />
        <span className="inline-block h-3 w-3 rounded-full bg-[color:var(--phosphor)]" />
        <span className="ml-2">— bash — 80×24</span>
      </div>
      <pre className="whitespace-pre-wrap break-words text-[color:var(--phosphor)]">
        {lines.slice(0, shown).join("\n")}
        {shown >= lines.length && <span className="blink">_</span>}
      </pre>
    </div>
  );
}
