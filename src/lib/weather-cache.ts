import type { WeatherResponse } from "./weather-api";

const PREFIX = "brew-wx:cache:";

export type CachedWeather = {
  data: WeatherResponse;
  updatedAt: number;
  location: string;
  lat: number;
  lon: number;
};

function key(lat: number, lon: number) {
  return `${PREFIX}${lat.toFixed(3)},${lon.toFixed(3)}`;
}

export function saveWeatherCache(entry: CachedWeather) {
  try {
    localStorage.setItem(key(entry.lat, entry.lon), JSON.stringify(entry));
    localStorage.setItem(`${PREFIX}last`, key(entry.lat, entry.lon));
  } catch {}
}

export function loadWeatherCache(
  lat: number,
  lon: number,
): CachedWeather | null {
  try {
    const raw = localStorage.getItem(key(lat, lon));
    if (!raw) return null;
    return JSON.parse(raw) as CachedWeather;
  } catch {
    return null;
  }
}

export function loadLastWeatherCache(): CachedWeather | null {
  try {
    const k = localStorage.getItem(`${PREFIX}last`);
    if (!k) return null;
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    return JSON.parse(raw) as CachedWeather;
  } catch {
    return null;
  }
}
