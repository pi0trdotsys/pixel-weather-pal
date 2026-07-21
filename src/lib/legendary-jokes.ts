// Hidden tier, unlocked by the Konami code. See useKonamiCode + EasterEgg.
export const LEGENDARY_JOKES: string[] = [
  "ACHIEVEMENT UNLOCKED: you know the code. +30 XP, -30°C ego.",
  "root access granted. please don't `rm -rf /`. we just cleaned that.",
  "legendary drop: a semicolon you forgot in 2019. it still compiles.",
  "sigma mode engaged. beta mode: uninstalled.",
  "weather.status is now permanently 'it depends' (works on my machine).",
  "you found the konami code. the konami code did not find inner peace.",
  "999999 bugs in the code, take one down, patch it around — 1000001 bugs in the code.",
  "the forecast for today: 100% chance of you reading source code for fun.",
  "achievement: 30 keystrokes to enlightenment. narrator: it was only 10.",
  "this easter egg was compiled with 0 warnings and 1 questionable life choice.",
];

export function pickLegendary(seed = 0): string {
  const idx = Math.abs(Math.floor(seed)) % LEGENDARY_JOKES.length;
  return LEGENDARY_JOKES[idx];
}
