import type { WeatherKind } from "@/lib/wmo";

// 16x16 pixel icons. Chars: . transparent, Y yellow, W white, G gray,
// D dark-gray, B blue, C cyan, K black outline, L lightning, S snow
const ICONS: Record<WeatherKind | "moon", string[]> = {
  sun: [
    "................",
    "......YYYY......",
    "..Y...YYYY...Y..",
    ".YY..YYYYYY..YY.",
    "..Y.YYYYYYYY.Y..",
    "....YYYYYYYY....",
    "..YYYYYYYYYYYY..",
    "YYYYYYYYYYYYYYYY",
    "YYYYYYYYYYYYYYYY",
    "..YYYYYYYYYYYY..",
    "....YYYYYYYY....",
    "..Y.YYYYYYYY.Y..",
    ".YY..YYYYYY..YY.",
    "..Y...YYYY...Y..",
    "......YYYY......",
    "................",
  ],
  moon: [
    "................",
    "......WWWW......",
    "....WWWWWWWW....",
    "...WWWWWDDDDW...",
    "..WWWWWDD..DDW..",
    "..WWWWWD....DW..",
    ".WWWWWWD....DW..",
    ".WWWWWWWDDDDW...",
    ".WWWWWWWWWWW....",
    ".WWWWWWWWWW.....",
    "..WWWWWWWW......",
    "..WWWWWWWW......",
    "...WWWWWW.......",
    "....WWWW........",
    "................",
    "................",
  ],
  partly: [
    "................",
    ".....YYYY.......",
    "..Y..YYYY..Y....",
    "...YYYYYYY......",
    "..YYYYYYYYYY....",
    "..YYYY.WWWWWW...",
    "....Y.WWWWWWWW..",
    "....WWWWWWWWWWW.",
    "..WWWWWWWWWWWWWW",
    ".WWWWWWWWWWWWWWW",
    ".WWWWWWWWWWWWWW.",
    "..WWWWWWWWWWWW..",
    "................",
    "................",
    "................",
    "................",
  ],
  cloud: [
    "................",
    "................",
    ".....WWWWW......",
    "...WWWWWWWWW....",
    "..WWWWWWWWWWW...",
    ".WWWWWWWWWWWWW..",
    "WWWWWWWWWWWWWWW.",
    "WWWWWWWWWWWWWWWW",
    "WWWWWWWWWWWWWWWW",
    ".WWWWWWWWWWWWWW.",
    "..WWWWWWWWWWWW..",
    "....WWWWWWWW....",
    "................",
    "................",
    "................",
    "................",
  ],
  fog: [
    "................",
    "................",
    "..GGGGGGGGGGGG..",
    "...GGGGGGGGGG...",
    "................",
    ".GGGGGGGGGGGGGG.",
    "..GGGGGGGGGGGG..",
    "................",
    "GGGGGGGGGGGGGGGG",
    "..GGGGGGGGGGGG..",
    "................",
    ".GGGGGGGGGGGGGG.",
    "...GGGGGGGGGG...",
    "................",
    "..GGGGGGGGGGGG..",
    "................",
  ],
  rain: [
    "................",
    "....WWWWWW......",
    "..WWWWWWWWWW....",
    ".WWWWWWWWWWWWW..",
    "WWWWWWWWWWWWWWW.",
    "WWWWWWWWWWWWWWWW",
    ".WWWWWWWWWWWWWW.",
    "..WWWWWWWWWWWW..",
    "................",
    "..B..B..B..B..B.",
    ".B..B..B..B..B..",
    "..B..B..B..B..B.",
    ".B..B..B..B..B..",
    "..B..B..B..B..B.",
    "................",
    "................",
  ],
  snow: [
    "................",
    "....WWWWWW......",
    "..WWWWWWWWWW....",
    ".WWWWWWWWWWWWW..",
    "WWWWWWWWWWWWWWW.",
    "WWWWWWWWWWWWWWWW",
    ".WWWWWWWWWWWWWW.",
    "..WWWWWWWWWWWW..",
    "................",
    "..S....S....S...",
    ".SSS..SSS..SSS..",
    "..S....S....S...",
    "....S....S....S.",
    "...SSS..SSS..SSS",
    "....S....S....S.",
    "................",
  ],
  thunder: [
    "................",
    "....DDDDDD......",
    "..DDDDDDDDDD....",
    ".DDDDDDDDDDDDD..",
    "DDDDDDDDDDDDDDD.",
    "DDDDDDDDDDDDDDDD",
    ".DDDDDDDDDDDDDD.",
    "..DDDDDDDDDDDD..",
    "................",
    ".....LLLL.......",
    "....LLLL........",
    "...LLLLLLLL.....",
    ".....LLLL.......",
    "....LLL.........",
    "...LL...........",
    "................",
  ],
};

const COLORS: Record<string, string> = {
  Y: "#ffd23f",
  W: "#e0e6e0",
  G: "#4a6a4a",
  D: "#2a3a2a",
  B: "#55aaff",
  C: "#55ffff",
  K: "#000000",
  L: "#ffb000",
  S: "#e0f0ff",
};

export function PixelIcon({
  kind,
  size = 128,
  className = "",
}: {
  kind: WeatherKind | "moon";
  size?: number;
  className?: string;
}) {
  const grid = ICONS[kind] ?? ICONS.cloud;
  const px = Math.floor(size / 16);
  return (
    <div
      key={kind}
      className={`pixel-materialize ${className}`}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(16, ${px}px)`,
        gridTemplateRows: `repeat(16, ${px}px)`,
        width: px * 16,
        height: px * 16,
        imageRendering: "pixelated",
        filter: "drop-shadow(0 0 6px rgba(51,255,102,0.15))",
      }}
      aria-hidden
    >
      {grid.flatMap((row, y) =>
        row.split("").map((ch, x) => (
          <div
            key={`${x}-${y}`}
            style={{
              width: px,
              height: px,
              background: ch === "." ? "transparent" : (COLORS[ch] ?? "#33ff66"),
            }}
          />
        )),
      )}
    </div>
  );
}
