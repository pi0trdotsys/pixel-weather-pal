import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { WeatherWidget, type RefreshInterval } from "@/components/WeatherWidget";
import { NowPanel } from "@/components/NowPanel";
import { HourlyStrip } from "@/components/HourlyStrip";
import { DailyForecast } from "@/components/DailyForecast";
import { TerminalOutput } from "@/components/TerminalOutput";
import { LocationBar } from "@/components/LocationBar";
import { JokeTicker } from "@/components/JokeTicker";
import { fetchWeather, reverseGeocode, type GeoResult } from "@/lib/weather-api";
import {
  loadWeatherCache,
  loadLastWeatherCache,
  saveWeatherCache,
} from "@/lib/weather-cache";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";


type Coords = { lat: number; lon: number; name: string } | null;
const INTERVAL_KEY = "brew-wx:interval";

const STORAGE_KEY = "brew-wx:coords";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        property: "og:image",
        content:
          "https://id-preview--6313c827-2a95-4616-9590-077cbd7ceb49.lovable.app/og-cover.jpg",
      },
      {
        name: "twitter:image",
        content:
          "https://id-preview--6313c827-2a95-4616-9590-077cbd7ceb49.lovable.app/og-cover.jpg",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [coords, setCoords] = useState<Coords>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCoords(JSON.parse(raw));
    } catch {}
    setBooted(true);
  }, []);

  useEffect(() => {
    if (coords) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
      } catch {}
    }
  }, [coords]);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setGeoError("navigator.geolocation === undefined");
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const name = await reverseGeocode(lat, lon);
        setCoords({ lat, lon, name });
        setLocating(false);
      },
      (err) => {
        setGeoError(err.message);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  const pickCity = useCallback((r: GeoResult) => {
    setCoords({
      lat: r.latitude,
      lon: r.longitude,
      name: `${r.name}, ${r.country}`,
    });
  }, []);

  // Auto-locate on first visit if nothing saved
  useEffect(() => {
    if (booted && !coords) locate();
  }, [booted, coords, locate]);

  const [interval, setInterval] = useState<RefreshInterval>(30);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(INTERVAL_KEY);
      if (raw) setInterval(Number(raw) as RefreshInterval);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(INTERVAL_KEY, String(interval));
    } catch {}
  }, [interval]);

  const online = useOnlineStatus();

  const { data, isLoading, isFetching, error, refetch, dataUpdatedAt } =
    useQuery({
      enabled: !!coords,
      queryKey: ["weather", coords?.lat, coords?.lon],
      queryFn: async () => {
        if (!navigator.onLine) {
          const cached = loadWeatherCache(coords!.lat, coords!.lon);
          if (cached) return cached.data;
          throw new Error("offline & no cached snapshot available");
        }
        try {
          const fresh = await fetchWeather(coords!.lat, coords!.lon);
          saveWeatherCache({
            data: fresh,
            updatedAt: Date.now(),
            location: coords!.name,
            lat: coords!.lat,
            lon: coords!.lon,
          });
          return fresh;
        } catch (e) {
          const cached = loadWeatherCache(coords!.lat, coords!.lon);
          if (cached) return cached.data;
          throw e;
        }
      },
      initialData: () => {
        if (!coords) return undefined;
        return (
          loadWeatherCache(coords.lat, coords.lon)?.data ??
          loadLastWeatherCache()?.data
        );
      },
      initialDataUpdatedAt: () => {
        if (!coords) return undefined;
        return (
          loadWeatherCache(coords.lat, coords.lon)?.updatedAt ??
          loadLastWeatherCache()?.updatedAt
        );
      },
      staleTime: interval * 60 * 1000,
      refetchInterval: online ? interval * 60 * 1000 : false,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: online,
      refetchOnReconnect: true,
      retry: online ? 2 : 0,
    });

  useEffect(() => {
    if (online && coords) refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  const isStale =
    !!dataUpdatedAt && Date.now() - dataUpdatedAt > interval * 60 * 1000;
  const fromCache = !online && !!data;

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 px-4 pb-4 pt-6 sm:px-6">
      {/* Title bar */}
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl crt-glow sm:text-4xl">
          $ homebrew-weather
          <span className="blink">_</span>
        </h1>
        <nav className="flex items-center gap-4 text-xs uppercase tracking-widest text-[color:var(--phosphor-dim)]">
          <span>v1.0.0</span>
          <Link
            to="/about"
            className="hover:text-[color:var(--phosphor)]"
          >
            ./about
          </Link>
        </nav>
      </header>

      <LocationBar
        location={coords?.name ?? ""}
        onLocate={locate}
        onPick={pickCity}
        locating={locating}
      />

      {geoError && (
        <div className="terminal-box p-3 text-sm text-[color:var(--crimson)]">
          <span className="text-[color:var(--phosphor-dim)]">stderr:</span>{" "}
          {geoError}. Try [locate()] again or grep a city above.
        </div>
      )}

      {!coords && !geoError && !locating && (
        <div className="terminal-box p-4 text-sm">
          <p>{"// no coords in memory"}</p>
          <p className="text-[color:var(--phosphor-dim)]">
            {"> allow location or type a city_"}
          </p>
        </div>
      )}

      {locating && (
        <div className="terminal-box p-4 text-sm">
          <span className="blink">▓</span> polling GPS…
        </div>
      )}

      {isLoading && coords && (
        <div className="terminal-box p-4 text-sm">
          <span className="blink">▓</span> GET api.open-meteo.com …
        </div>
      )}

      {error && (
        <div className="terminal-box p-4 text-sm text-[color:var(--crimson)]">
          fetch failed: {(error as Error).message}
        </div>
      )}

      {data && coords && (
        <>
          <WeatherWidget
            data={data}
            location={coords.name}
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            updatedAt={dataUpdatedAt}
            interval={interval}
            onIntervalChange={setInterval}
            online={online}
            isStale={isStale}
            fromCache={fromCache}
          />
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <NowPanel data={data} />
            <div className="terminal-box p-4 text-xs text-[color:var(--phosphor-dim)]">
              <div className="mb-2 uppercase tracking-widest">$ cron -l</div>
              <p>
                * net:{" "}
                <span
                  className={
                    online
                      ? "text-[color:var(--phosphor)]"
                      : "text-[color:var(--crimson)]"
                  }
                >
                  {online ? "ONLINE" : "OFFLINE"}
                </span>
                {fromCache && " · serving cache"}
                {isStale && online && " · stale, refreshing"}
              </p>
              <p>* auto-refresh co {interval} min (also in background)</p>
              <p>* last sync: {new Date(dataUpdatedAt).toLocaleTimeString()}</p>
              <p>* provider: open-meteo · lokacja: {coords.name}</p>
            </div>
          </div>
          <HourlyStrip data={data} />
          <div className="grid gap-4 lg:grid-cols-2">
            <DailyForecast data={data} />
            <TerminalOutput data={data} location={coords.name} />
          </div>
        </>
      )}

      <div className="mt-auto">
        <JokeTicker />
        <p className="mt-2 text-center text-[10px] uppercase tracking-widest text-[color:var(--phosphor-dim)]">
          weather via open-meteo · no cookies · no tracking · brewed with ♥ in
          the terminal
        </p>
      </div>
    </div>
  );
}
