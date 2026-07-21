package dev.pi0trdotsys.homebrewweather.widget

import kotlin.math.abs

/**
 * Direct Kotlin port of src/lib/sigma-jokes.ts — same joke pools, same
 * pick-by-seed logic (pool is night + kind when isNight, else just kind;
 * pick index = |seed| % pool.size).
 */
object SigmaJokes {

    private val SIGMA: Map<String, List<String>> = mapOf(
        "sun" to listOf(
            "słońce grzeje, beta narzeka na UV",
            "+25°C, w sam raz na treningu klatki, nie na płacz",
            "grindset weather. wychodzisz albo zostajesz nikim",
            "ładna pogoda, a ty siedzisz w chacie jak jakiś cuck",
            "słońce świeci mocniej niż twoja kariera",
            "słońce jak twój ambicja — świeci raz w miesiącu",
            "UV index wyższy niż twoja pewność siebie",
            "słonecznie. idealna pogoda żeby w końcu zrobić coś ze swoim gównianym CV",
            "sigma się opala i planuje imperium, ty planujesz drzemkę",
            "zajebista pogoda, szkoda że masz zajebiście mało w niej do roboty",
            "+30°C na dworze, +2 w twoim koncie bankowym",
            "słońce nie bierze L9, a ty bierzesz kolejny sick day",
            "piękny dzień żeby wyjść z domu i przestać być swoim własnym hejterem",
        ),
        "partly" to listOf(
            "chmury się nie mogą zdecydować, jak twoja ex",
            "50/50, jak twoje szanse u tamtej z insta",
            "pół-jasno, pół-gówno, klasyk",
            "pogoda mid, jak twoje bench press",
            "częściowe zachmurzenie, jak twoja motywacja po 10 rano",
            "niebo waha się jak ty przed każdym 'dzień dobry'",
            "50% szans na deszcz, 100% szans że dalej nic nie zrobisz",
            "pogoda w sam raz na 'jeszcze pięć minut i wstaję'",
            "chmury przelotne, twoje plany życiowe jeszcze bardziej",
            "połowicznie słonecznie, połowicznie jak twój set na siłce",
        ),
        "cloud" to listOf(
            "szaro-buro, idealnie pod depresję i redbulla",
            "niebo zachmurzone jak twoje myśli o poniedziałku",
            "pochmurno. beta zostaje w domu. sigma i tak wychodzi",
            "chmury gęste jak wymówki twojego kumpla",
            "szaro jak twoje boxy z bielizną nieprane od tygodnia",
            "zachmurzenie całkowite, jak twój brak planu na przyszłość",
            "dzień szary jak twój Discord status 'offline' od trzech dni",
            "pochmurnie, ale i tak jaśniej niż perspektywy bez porannej rutyny",
            "niebo w kolorze twojego nastroju o 6 rano",
            "chmury nisko, standardy jeszcze niżej, ale to się zaraz zmieni",
        ),
        "fog" to listOf(
            "mgła gęstsza niż twój wywód po piątym piwie",
            "visibility 10m, jak twoje plany życiowe",
            "mgła. idealna na zniknięcie bez tłumaczenia",
            "nic nie widać, jak twoja przyszłość bez planu B",
            "mgła gęsta jak tłumaczenie czemu znowu nie poszedłeś na trening",
            "widoczność zero, motywacja też, ale nogi jeszcze działają",
            "mgła jak twój umysł przed pierwszą kawą — i po niej",
            "nic nie widać, więc nikt nie widzi że dziś też olałeś plan dnia",
            "gęsto jak atmosfera po tym jak znowu obiecałeś 'od jutra zaczynam'",
        ),
        "rain" to listOf(
            "leje jak w mordę. bierz kurtkę albo bądź twardy",
            "deszcz. sigma i tak biega, beta pisze do mamy",
            "mokro jak w komentach pod twoim postem",
            "leje. dobra pogoda żeby przestać się mazać i zrobić coś ze sobą",
            "kropi. weź parasol albo weź się w garść",
            "pada. świat płacze zamiast ciebie, więc chociaż to masz z głowy",
            "deszcz zmywa błoto, szkoda że nie zmywa twoich wymówek",
            "leje jak z cebra, a ty dalej myślisz że 'dziś se odpuszczę'",
            "mokro na zewnątrz, sucho w portfelu, klasyczny miesiąc",
            "burza się zbliża, ty się nie zbliżasz nawet do siłki",
            "deszcz nie pyta o zgodę, twój szef też nie będzie",
            "pada jak diably, wstawaj i rusz dupsko zanim się rozmyślisz",
        ),
        "snow" to listOf(
            "śnieg. zimno jak serce twojej ex",
            "biało. jak konto po weekendzie",
            "śnieg, mróz, twoje wymówki się nie liczą",
            "sypie. beta odwołuje plany, sigma odpala pompki",
            "minus na termometrze, minus też na twoim koncie, spójność ceniona",
            "śnieg pada, standardy nie — te zostają wysoko",
            "zimno jak twoje relacje z rodziną od świąt",
            "biało wszędzie, jak twój brak pomysłu na to życie",
            "śnieg sypie, ty dalej śpisz, klasyczny beta scenariusz",
            "mróz szczypie mocniej niż twój ostatni wyciąg z konta",
        ),
        "thunder" to listOf(
            "burza. bogowie się jarają, ty się nie chowaj",
            "grzmi mocniej niż twoje ego po jednej serii",
            "piorun pierdolnie i tak w tego nieogara co stoi pod drzewem",
            "burza. wyłącz kompa albo module się na 5g",
            "grzmot głośniejszy niż twoje wymówki na grupowym czacie",
            "błyskawica szybsza niż twoja decyzja żeby wreszcie coś zmienić",
            "piorun bije, adrenalina bije, w końcu coś w tobie bije",
            "burza na niebie, chaos w twoim planie dnia, standard",
            "grzmi jak twój żołądek po tym jak znowu zjadłeś fast food zamiast obiadu",
        ),
        "night" to listOf(
            "noc. sigma trenuje, beta scrolluje reelsy",
            "3 w nocy i dalej nie śpisz? peak male behavior",
            "księżyc świeci, a ty dalej sam. działaj albo śpij",
            "ciemno. dobra pora na refleksję czemu ci nie wychodzi",
            "północ, a ty dalej w telefonie zamiast w łóżku, klasyk",
            "ciemno na zewnątrz, ciemno w głowie po scrollowaniu do 4 rano",
            "gwiazdy świecą, ty gaśniesz, odwróć to jutro",
            "noc sowy, ale sowa przynajmniej ma plan na jutro",
            "śpij. jutro znowu trzeba udawać że masz to ogarnięte",
        ),
    )

    /** kind is one of the WeatherKind strings from [Wmo.wmoToKind] (not "night"). */
    fun pick(kind: String, isNight: Boolean = false, seed: Int = 0): String {
        val kindPool = SIGMA[kind] ?: SIGMA.getValue("cloud")
        val pool = if (isNight) (SIGMA.getValue("night") + kindPool) else kindPool
        val idx = abs(seed) % pool.size
        return pool[idx]
    }
}
