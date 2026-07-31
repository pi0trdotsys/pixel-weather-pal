package dev.pi0trdotsys.homebrewweather.widget

import kotlin.math.abs

/**
 * Direct Kotlin port of src/lib/sigma-jokes.ts — same joke pools, same
 * pick-by-seed logic (pool is night + kind when isNight, else just kind;
 * pick index = |seed| % pool.size). Lines are kept under ~50 chars in the
 * source file so the widget's single-line footer joke doesn't truncate
 * mid-sentence — keep this file byte-for-byte in sync with the .ts source.
 */
object SigmaJokes {

    private val SIGMA: Map<String, List<String>> = mapOf(
        "sun" to listOf(
            "słońce grzeje, beta narzeka na UV",
            "+25°C, w sam raz na trening klatki, nie na płacz",
            "grindset weather. wychodzisz albo zostajesz nikim",
            "ładna pogoda, a ty siedzisz w chacie jak cuck",
            "słońce świeci mocniej niż twoja kariera",
            "słońce jak twoja ambicja — raz w miesiącu",
            "UV index wyższy niż twoja pewność siebie",
            "słonecznie. w końcu ogarnij to CV",
            "sigma się opala i planuje imperium, ty drzemkę",
            "zajebista pogoda, szkoda że nic w niej nie robisz",
            "+30°C na dworze, +2 na koncie, based",
            "słońce nie bierze L9, a ty bierzesz sick day",
            "piękny dzień żeby przestać być swoim hejterem",
            "słońce non-stop, ty w łóżku, kto tu kogo grzeje",
            "witamina D za darmo, silnej woli nie rozdają",
            "idealna pogoda na cardio, wybierasz kanapę",
            "sigma łapie kontrakty, beta tylko powiadomienia",
            "słońce w zenicie, ambicje w fazie planowania",
            "giga słonecznie, zero wymówek, ogarnij się",
        ),
        "partly" to listOf(
            "chmury się nie mogą zdecydować, jak twoja ex",
            "50/50, jak twoje szanse u tamtej z insta",
            "pół-jasno, pół-gówno, klasyk",
            "pogoda mid, jak twój bench press",
            "częściowe zachmurzenie, jak motywacja po 10",
            "niebo waha się jak ty przed 'dzień dobry'",
            "50% szans na deszcz, 100% że nic nie zrobisz",
            "pogoda w sam raz na 'jeszcze pięć minut'",
            "chmury przelotne, plany życiowe jeszcze bardziej",
            "połowicznie słonecznie, połowicznie jak twój set",
            "niebo w trybie demo, pełna wersja płatna",
            "częściowo zachmurzone, w pełni no cap nieokreślone",
            "pogoda 'może', jak twoje 'jutro na siłkę'",
        ),
        "cloud" to listOf(
            "szaro-buro, idealnie pod depresję i redbulla",
            "niebo zachmurzone jak myśli o poniedziałku",
            "pochmurno. beta w domu, sigma i tak wychodzi",
            "chmury gęste jak wymówki kumpla",
            "szaro jak boxy nieprane od tygodnia",
            "zachmurzenie jak brak planu na przyszłość",
            "szaro jak twój Discord status od trzech dni",
            "pochmurnie, ale jaśniej niż bez rutyny",
            "niebo w kolorze nastroju o 6 rano",
            "chmury nisko, standardy jeszcze niżej",
            "szaro jak Excel z budżetem co go nie otwierasz",
            "zachmurzenie jak motywacja — teoretycznie jest",
            "niebo bez słońca, ty bez planu, wtorek rel",
        ),
        "fog" to listOf(
            "mgła gęstsza niż twój wywód po piątym piwie",
            "visibility 10m, jak twoje plany życiowe",
            "mgła. idealna na zniknięcie bez tłumaczenia",
            "nic nie widać, jak przyszłość bez planu B",
            "mgła gęsta jak wymówka czemu olałeś trening",
            "widoczność zero, motywacja też, nogi jeszcze idą",
            "mgła jak twój umysł przed kawą — i po niej",
            "nic nie widać, więc nikt nie widzi że olałeś dzień",
            "gęsto jak po 'od jutra zaczynam' po raz setny",
            "mgła zasłania horyzont, wymówki resztę",
            "widoczność ograniczona jak tolerancja na poranki",
            "gęsta mgła, rzadkie postanowienia noworoczne",
        ),
        "rain" to listOf(
            "leje jak w mordę. bierz kurtkę albo bądź twardy",
            "deszcz. sigma i tak biega, beta pisze do mamy",
            "mokro jak w komentach pod twoim postem",
            "leje. dobra pogoda żeby ogarnąć się",
            "kropi. weź parasol albo weź się w garść",
            "pada. świat płacze zamiast ciebie",
            "deszcz zmywa błoto, szkoda że nie wymówki",
            "leje jak z cebra, a ty 'dziś se odpuszczę'",
            "mokro na zewnątrz, sucho w portfelu, klasyk",
            "burza się zbliża, ty nie zbliżasz się do siłki",
            "deszcz nie pyta o zgodę, szef też nie będzie",
            "pada jak diably, rusz dupsko zanim się rozmyślisz",
            "leje od rana, ty leżysz od rana, coincidence?",
            "krople na szybie, wymówki w głowie, no cap",
            "deszczowo, kaptur na głowę i chodu, sigma flow",
            "parasol zapomniany, charakter też",
        ),
        "snow" to listOf(
            "śnieg. zimno jak serce twojej ex",
            "biało. jak konto po weekendzie",
            "śnieg, mróz, wymówki się nie liczą",
            "sypie. beta odwołuje plany, sigma pompki",
            "minus na termometrze, minus na koncie, spójność",
            "śnieg pada, standardy nie — te wysoko",
            "zimno jak relacje z rodziną od świąt",
            "biało wszędzie jak brak pomysłu na życie",
            "śnieg sypie, ty śpisz, klasyczny beta scenariusz",
            "mróz szczypie mocniej niż ostatni wyciąg z konta",
            "biały puch, biała flaga twojego treningu",
            "zimno jak komentarze pod twoim biznesplanem",
            "śnieg pada równo, motywacja nierówno, idziemy",
        ),
        "thunder" to listOf(
            "burza. bogowie się jarają, ty się nie chowaj",
            "grzmi mocniej niż ego po jednej serii",
            "piorun i tak celuje w tego pod drzewem",
            "burza. wyłącz kompa albo giga się module",
            "grzmot głośniejszy niż wymówki na czacie",
            "błyskawica szybsza niż twoja decyzja",
            "piorun bije, adrenalina bije, coś w tobie bije",
            "burza na niebie, chaos w planie dnia, standard",
            "grzmi jak żołądek po fast foodzie zamiast obiadu",
            "błyskawica na niebie, zero w twoich decyzjach",
            "burza się zbliża, deadline też, oba ignorujesz",
            "grzmoty głośne, twoje 'zaraz zaczynam' głośniejsze",
        ),
        "night" to listOf(
            "noc. sigma trenuje, beta scrolluje reelsy",
            "3 w nocy i nie śpisz? peak male behavior",
            "księżyc świeci, a ty dalej sam. działaj albo śpij",
            "ciemno. dobra pora na refleksję czemu nie idzie",
            "północ, a ty w telefonie zamiast w łóżku, klasyk",
            "ciemno na zewnątrz, ciemno w głowie po scrollu",
            "gwiazdy świecą, ty gaśniesz, odwróć to jutro",
            "noc sowy, ale sowa ma plan na jutro",
            "śpij. jutro znowu udawaj że masz to ogarnięte",
            "ciemność na zewnątrz, jasność telefonu w oczy",
            "gwiazd nie widać w mieście, planów też nigdzie",
            "noc jak sumienie po piątym odcinku zamiast spać",
            "śpiulkolot się szykuje, jutro znów zaspane rel",
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
