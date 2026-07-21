import type { WeatherKind } from "./wmo";

export const JOKES: Record<WeatherKind | "night", string[]> = {
  sun: [
    "It compiles. The sun is out. Ship it.",
    "Warning: high UV. `sudo apply --sunscreen`.",
    "Perfect weather for `git push --force` (no it's not).",
    "Stack Overflow is up. So is the sun.",
    "`while(sunny) { code(); hydrate(); }`",
    "Zero clouds, zero excuses. Go touch grass(1).",
    "CPU throttling from heat. So is your brain.",
    "Bright enough to finally see the whiteboard bugs.",
    "`export SUNSHINE=true` — no restart required.",
  ],
  partly: [
    "50% clouds, 50% clarity. Just like your requirements.",
    "Partly cloudy — much like this legacy codebase.",
    "TODO: figure out if it's sunny or not.",
    "Schrödinger's forecast: both sunny and not, until observed.",
    "Flaky test detected: weather.status is nondeterministic.",
    "A/B testing the sky today.",
  ],
  cloud: [
    "Overcast. Perfect lighting for a dark theme.",
    "The cloud is down. Wait, no — it's above you.",
    "`kubectl get weather` → still cloudy.",
    "Gray sky, gray Slack, gray coffee. Balanced.",
    "100% cloud coverage, 0% cloud compute.",
    "Overcast — nature's `prefers-color-scheme: dark`.",
  ],
  fog: [
    "Visibility low. Just like your test coverage.",
    "Fog: nature's `console.log('here')`.",
    "Can't see the deploy for the fog.",
    "`grep -r 'sun' /sky/` → no matches.",
    "Stack trace: obscured by weather.fog(dense=true).",
    "404: horizon not found.",
  ],
  rain: [
    "It's raining. Perfect time to `git blame`.",
    "Rain detected. Rebooting the umbrella.",
    "`npm install rain-jacket --save`.",
    "Water is falling. So is your uptime probably.",
    "It's raining bugs. And water.",
    "Precipitation: 100%. Motivation: 404.",
    "`try { walk() } catch (Rain e) { stayIndoors() }`",
    "The cloud finally pushed its changes.",
  ],
  snow: [
    "Snow day. Merge conflicts still exist.",
    "❄ = new File(); cold.deploy();",
    "The build is frozen. Literally.",
    "Snowflake type detected. Everywhere.",
    "White screen of death, but outside.",
    "Cache invalidated by frost.",
  ],
  thunder: [
    "Thunder detected. Unplug the servers.",
    "`throw new Storm();`",
    "Lightning strike: instant `git reset --hard`.",
    "Prod is down. Also the power.",
    "Uncaught exception: SkyException at line 0.",
    "Latency spike caused by literal lightning.",
  ],
  night: [
    "It's late. `commit -m 'wip'` and sleep.",
    "The sun has 404'd. Try again in 8 hours.",
    "Dark mode: engaged by nature.",
    "Night shift. The rubber duck is listening.",
    "`cron.schedule('0 3 * * *', panic)`",
    "Still awake debugging life choices.",
  ],
};

export function pickJoke(kind: WeatherKind, isNight = false): string {
  const pool = isNight ? [...JOKES.night, ...JOKES[kind]] : JOKES[kind];
  return pool[Math.floor(Math.random() * pool.length)];
}
