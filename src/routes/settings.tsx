import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  loadRefreshInterval,
  saveRefreshInterval,
  loadNotificationSettings,
  saveNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
  type RefreshInterval,
  type NotificationSettings,
} from "@/lib/settings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "settings — Homebrew Weather" },
      {
        name: "description",
        content: "Configure refresh interval and weather notifications.",
      },
    ],
  }),
  component: Settings,
});

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 border border-[color:var(--phosphor-dim)]/40 px-3 py-2 text-left text-sm hover:border-[color:var(--phosphor)]"
    >
      <span>{label}</span>
      <span
        className={
          "border px-2 py-0.5 text-[10px] uppercase tracking-widest " +
          (checked
            ? "border-[color:var(--phosphor)] bg-[color:var(--phosphor)] text-black"
            : "border-[color:var(--phosphor-dim)] text-[color:var(--phosphor-dim)]")
        }
      >
        {checked ? "on" : "off"}
      </span>
    </button>
  );
}

function ThresholdInput({
  label,
  value,
  onChange,
  suffix = "°C",
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 border border-[color:var(--phosphor-dim)]/40 px-3 py-2 text-sm">
      <span className={disabled ? "text-[color:var(--phosphor-dim)]" : ""}>{label}</span>
      <span className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 bg-transparent text-right outline-none disabled:opacity-40"
        />
        <span className="text-[color:var(--phosphor-dim)]">{suffix}</span>
      </span>
    </label>
  );
}

function Settings() {
  const [interval, setInterval] = useState<RefreshInterval>(30);
  const [notif, setNotif] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadRefreshInterval(), loadNotificationSettings()]).then(([i, n]) => {
      setInterval(i);
      setNotif(n);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) saveRefreshInterval(interval);
  }, [interval, loaded]);

  useEffect(() => {
    if (loaded) saveNotificationSettings(notif);
  }, [notif, loaded]);

  const patch = (p: Partial<NotificationSettings>) => setNotif((prev) => ({ ...prev, ...p }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link
        to="/"
        className="text-xs uppercase tracking-widest text-[color:var(--phosphor-dim)] hover:text-[color:var(--phosphor)]"
      >
        ← cd ~/
      </Link>
      <h1 className="mt-4 font-display text-4xl crt-glow">$ vim /etc/homebrew-weather.conf</h1>

      <div className="terminal-box mt-6 space-y-4 p-5 text-sm">
        <div>
          <div className="mb-2 text-[color:var(--phosphor-dim)] uppercase tracking-widest">
            REFRESH
          </div>
          <label className="flex items-center justify-between gap-3 border border-[color:var(--phosphor-dim)]/40 px-3 py-2">
            <span>auto-refresh interval (app + home-screen widget)</span>
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value) as RefreshInterval)}
              className="bg-transparent border border-[color:var(--phosphor-dim)] px-2 py-0.5 text-[color:var(--phosphor)] focus:outline-none focus:border-[color:var(--phosphor)]"
            >
              <option value={15}>15m</option>
              <option value={30}>30m</option>
              <option value={60}>1h</option>
              <option value={180}>3h</option>
              <option value={360}>6h</option>
            </select>
          </label>
        </div>

        <div>
          <div className="mb-2 text-[color:var(--phosphor-dim)] uppercase tracking-widest">
            NOTIFICATIONS
          </div>
          <div className="space-y-2">
            <Toggle
              label="rain incoming"
              checked={notif.rainEnabled}
              onChange={(v) => patch({ rainEnabled: v })}
            />
            <Toggle
              label="high temperature"
              checked={notif.highEnabled}
              onChange={(v) => patch({ highEnabled: v })}
            />
            <ThresholdInput
              label="↳ threshold"
              value={notif.highThreshold}
              disabled={!notif.highEnabled}
              onChange={(v) => patch({ highThreshold: v })}
            />
            <Toggle
              label="low temperature"
              checked={notif.lowEnabled}
              onChange={(v) => patch({ lowEnabled: v })}
            />
            <ThresholdInput
              label="↳ threshold"
              value={notif.lowThreshold}
              disabled={!notif.lowEnabled}
              onChange={(v) => patch({ lowThreshold: v })}
            />
            <Toggle
              label="big day-to-day swing"
              checked={notif.swingEnabled}
              onChange={(v) => patch({ swingEnabled: v })}
            />
            <ThresholdInput
              label="↳ min. delta"
              value={notif.swingThreshold}
              disabled={!notif.swingEnabled}
              onChange={(v) => patch({ swingThreshold: v })}
            />
            <Toggle
              label="air quality"
              checked={notif.aqiEnabled}
              onChange={(v) => patch({ aqiEnabled: v })}
            />
            <ThresholdInput
              label="↳ AQI threshold"
              value={notif.aqiThreshold}
              disabled={!notif.aqiEnabled}
              onChange={(v) => patch({ aqiThreshold: v })}
              suffix="AQI"
            />
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-widest text-[color:var(--phosphor-dim)]">
          {"// on Android these are read directly by the home-screen widget's"}
          <br />
          {"// background worker — no need to open the app for alerts to fire."}
        </p>
      </div>
    </div>
  );
}
