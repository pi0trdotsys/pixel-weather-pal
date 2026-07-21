import { useMemo } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { PixelIcon } from "./PixelIcon";
import type { WeatherResponse } from "@/lib/weather-api";
import { wmoToKind, wmoLabel } from "@/lib/wmo";
import { pickSigma } from "@/lib/sigma-jokes";

const DOW = ["nd", "pn", "wt", "śr", "cz", "pt", "sb"];

export type RefreshInterval = 15 | 30 | 60 | 180 | 360;

export function WeatherWidget({
  data,
  location,
  onRefresh,
  isRefreshing = false,
  updatedAt,
  interval,
  onIntervalChange,
  online = true,
  isStale = false,
  fromCache = false,
}: {
  data: WeatherResponse;
  location: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  updatedAt?: number;
  interval: RefreshInterval;
  onIntervalChange: (v: RefreshInterval) => void;
  online?: boolean;
  isStale?: boolean;
  fromCache?: boolean;
}) {

  const c = data.current;
  const kind = wmoToKind(c.weather_code);
  const isNight = c.is_day === 0;

  // 4 nearest days starting from today
  const days = useMemo(
    () =>
      data.daily.time.slice(0, 4).map((iso, i) => {
        const d = new Date(iso);
        return {
          iso,
          label: i === 0 ? "dziś" : DOW[d.getDay()],
          kind: wmoToKind(data.daily.weather_code[i]),
          codeLabel: wmoLabel(data.daily.weather_code[i]),
          day: Math.round(data.daily.temperature_2m_max[i]),
          night: Math.round(data.daily.temperature_2m_min[i]),
          pop: data.daily.precipitation_probability_max[i] ?? 0,
        };
      }),
    [data],
  );

  const sigma = useMemo(
    () => pickSigma(kind, isNight, updatedAt ?? Date.now()),
    [kind, isNight, updatedAt],
  );

  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  return (
    <div className="terminal-box relative p-4 sm:p-5">
      {/* header */}
      <div className="mb-3 flex items-center justify-between gap-2 text-[11px] uppercase tracking-widest text-[color:var(--phosphor-dim)]">
        <span className="truncate">┌─ widget 4×2 · {location || "unknown"} ─┐</span>
        <div className="flex items-center gap-2">
          <span
            title={online ? "network: online" : "network: offline — cache mode"}
            className={
              "inline-flex items-center gap-1 border px-1 py-0.5 text-[10px] " +
              (online
                ? "border-[color:var(--phosphor-dim)] text-[color:var(--phosphor)]"
                : "border-[color:var(--crimson)] text-[color:var(--crimson)] animate-pulse")
            }
          >
            {online ? <Wifi size={10} /> : <WifiOff size={10} />}
            <span className="hidden sm:inline">
              {online ? "online" : "offline"}
            </span>
          </span>
          <label className="hidden sm:inline">refresh:</label>
          <select
            value={interval}
            onChange={(e) =>
              onIntervalChange(Number(e.target.value) as RefreshInterval)
            }
            className="bg-transparent border border-[color:var(--phosphor-dim)] px-1 py-0.5 text-[10px] text-[color:var(--phosphor)] focus:outline-none focus:border-[color:var(--phosphor)]"
            aria-label="refresh interval"
          >
            <option value={15}>15m</option>
            <option value={30}>30m</option>
            <option value={60}>1h</option>
            <option value={180}>3h</option>
            <option value={360}>6h</option>
          </select>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing || !online}
            title={online ? "refresh now" : "offline — cannot refresh"}
            aria-label="refresh now"
            className="grid h-6 w-6 place-items-center border border-[color:var(--phosphor-dim)] text-[color:var(--phosphor)] transition hover:border-[color:var(--phosphor)] hover:bg-[color:var(--phosphor)]/10 disabled:opacity-50"
          >

            <RefreshCw
              size={12}
              className={isRefreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {/* 4-day grid — the "4x2 tile" */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {days.map((d) => (
          <div
            key={d.iso}
            className="flex flex-col items-center gap-1 border border-[color:var(--phosphor-dim)]/40 bg-black/30 p-2 text-center"
          >
            <div className="text-[11px] uppercase tracking-widest text-[color:var(--phosphor-dim)]">
              {d.label}
            </div>
            <PixelIcon kind={d.kind} size={48} />
            <div className="font-mono text-sm tabular-nums leading-tight">
              <span className="text-[color:var(--amber)]">{d.day}°</span>
              <span className="text-[color:var(--phosphor-dim)]"> / </span>
              <span className="text-[color:var(--phosphor)]">{d.night}°</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[color:var(--cyan)]">
              <span>▽</span>
              <span className="tabular-nums">{d.pop}%</span>
            </div>
            <div className="hidden text-[9px] uppercase tracking-wider text-[color:var(--phosphor-dim)] sm:block truncate max-w-full">
              {d.codeLabel}
            </div>
          </div>
        ))}
      </div>

      {/* offline / stale banner */}
      {(!online || isStale || fromCache) && (
        <div
          className={
            "mt-3 border px-2 py-1 text-[10px] uppercase tracking-widest " +
            (!online
              ? "border-[color:var(--crimson)] text-[color:var(--crimson)]"
              : "border-[color:var(--amber)] text-[color:var(--amber)]")
          }
        >
          {!online
            ? `⚠ offline · serving cached snapshot from ${updatedLabel}`
            : fromCache
              ? `∎ cache hit · last successful fetch ${updatedLabel}`
              : `∎ stale data · retrying…`}
        </div>
      )}

      {/* sigma comment */}
      <div className="mt-3 border-t border-[color:var(--phosphor-dim)] pt-2">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--phosphor-dim)]">
            {"// sigma.forecast()"}
          </div>
          <div className="text-[10px] tabular-nums text-[color:var(--phosphor-dim)]">
            {online ? "net:ok" : "net:down"} · last sync {updatedLabel} · auto/
            {interval}m
          </div>
        </div>

        <div className="mt-1 text-sm text-[color:var(--amber)]">
          &gt; {sigma}
        </div>
      </div>
    </div>
  );
}
