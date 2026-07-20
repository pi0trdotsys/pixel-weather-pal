import { useState } from "react";
import { geocode, type GeoResult } from "@/lib/weather-api";

export function LocationBar({
  location,
  onLocate,
  onPick,
  locating,
}: {
  location: string;
  onLocate: () => void;
  onPick: (r: GeoResult) => void;
  locating: boolean;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (!q.trim()) return;
    setBusy(true);
    try {
      setResults(await geocode(q));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="terminal-box p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[color:var(--phosphor-dim)]">location =</span>
        <span className="crt-glow">{location || "null"}</span>
        <button
          onClick={onLocate}
          disabled={locating}
          className="ml-auto border border-[color:var(--phosphor)] px-2 py-1 text-xs uppercase tracking-widest hover:bg-[color:var(--phosphor)] hover:text-black disabled:opacity-50"
        >
          {locating ? "locating…" : "[ locate() ]"}
        </button>
      </div>
      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <span className="text-[color:var(--phosphor-dim)]">{">"}</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search city_"
          className="flex-1 bg-transparent outline-none placeholder:text-[color:var(--phosphor-dim)]"
        />
        <button
          type="submit"
          className="border border-[color:var(--phosphor-dim)] px-2 py-0.5 text-xs uppercase hover:border-[color:var(--phosphor)]"
        >
          {busy ? "…" : "grep"}
        </button>
      </form>
      {results.length > 0 && (
        <ul className="mt-2 max-h-40 overflow-y-auto border border-[color:var(--phosphor-dim)]/40 text-sm">
          {results.map((r, i) => (
            <li key={`${r.latitude}-${r.longitude}-${i}`}>
              <button
                onClick={() => {
                  onPick(r);
                  setResults([]);
                  setQ("");
                }}
                className="block w-full px-2 py-1 text-left hover:bg-[color:var(--phosphor)] hover:text-black"
              >
                → {r.name}
                {r.admin1 ? `, ${r.admin1}` : ""}, {r.country}
                <span className="ml-2 text-xs text-[color:var(--phosphor-dim)]">
                  {r.latitude.toFixed(2)}, {r.longitude.toFixed(2)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
