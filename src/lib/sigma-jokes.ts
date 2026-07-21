// Sigma / peak male / lekko wulgarne komentarze pogodowe (PL)
import type { WeatherKind } from "./wmo";

const SIGMA: Record<WeatherKind | "night", string[]> = {
  sun: [
    "słońce grzeje, beta narzeka na UV",
    "+25°C, w sam raz na treningu klatki, nie na płacz",
    "grindset weather. wychodzisz albo zostajesz nikim",
    "ładna pogoda, a ty siedzisz w chacie jak jakiś cuck",
    "słońce świeci mocniej niż twoja kariera",
  ],
  partly: [
    "chmury się nie mogą zdecydować, jak twoja ex",
    "50/50, jak twoje szanse u tamtej z insta",
    "pół-jasno, pół-gówno, klasyk",
    "pogoda mid, jak twoje bench press",
  ],
  cloud: [
    "szaro-buro, idealnie pod depresję i redbulla",
    "niebo zachmurzone jak twoje myśli o poniedziałku",
    "pochmurno. beta zostaje w domu. sigma i tak wychodzi",
    "chmury gęste jak wymówki twojego kumpla",
  ],
  fog: [
    "mgła gęstsza niż twój wywód po piątym piwie",
    "visibility 10m, jak twoje plany życiowe",
    "mgła. idealna na zniknięcie bez tłumaczenia",
    "nic nie widać, jak twoja przyszłość bez planu B",
  ],
  rain: [
    "leje jak w mordę. bierz kurtkę albo bądź twardy",
    "deszcz. sigma i tak biega, beta pisze do mamy",
    "mokro jak w komentach pod twoim postem",
    "leje. dobra pogoda żeby przestać się mazać i zrobić coś ze sobą",
    "kropi. weź parasol albo weź się w garść",
  ],
  snow: [
    "śnieg. zimno jak serce twojej ex",
    "biało. jak konto po weekendzie",
    "śnieg, mróz, twoje wymówki się nie liczą",
    "sypie. beta odwołuje plany, sigma odpala pompki",
  ],
  thunder: [
    "burza. bogowie się jarają, ty się nie chowaj",
    "grzmi mocniej niż twoje ego po jednej serii",
    "piorun pierdolnie i tak w tego nieogara co stoi pod drzewem",
    "burza. wyłącz kompa albo module się na 5g",
  ],
  night: [
    "noc. sigma trenuje, beta scrolluje reelsy",
    "3 w nocy i dalej nie śpisz? peak male behavior",
    "księżyc świeci, a ty dalej sam. działaj albo śpij",
    "ciemno. dobra pora na refleksję czemu ci nie wychodzi",
  ],
};

export function pickSigma(kind: WeatherKind, isNight = false, seed = 0): string {
  const pool = isNight ? [...SIGMA.night, ...SIGMA[kind]] : SIGMA[kind];
  const idx = Math.abs(Math.floor(seed)) % pool.length;
  return pool[idx];
}
