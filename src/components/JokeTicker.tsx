const TICKER = [
  "// TODO: fix the weather",
  "// FIXME: sun leaks memory",
  "/* it works on my machine */",
  "$ sudo make it sunny",
  "throw new WeatherException('too hot')",
  "git commit -m 'weather patch v1.0.1'",
  "npm ERR! ENOENT: sunshine not found",
  "> mood.status = 'caffeinated'",
];

export function JokeTicker() {
  return (
    <div className="overflow-hidden border-t border-[color:var(--phosphor-dim)] py-2 text-xs text-[color:var(--phosphor-dim)]">
      <div
        className="flex gap-12 whitespace-nowrap"
        style={{
          animation: "ticker 40s linear infinite",
        }}
      >
        {[...TICKER, ...TICKER].map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
      <style>{`@keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }`}</style>
    </div>
  );
}
