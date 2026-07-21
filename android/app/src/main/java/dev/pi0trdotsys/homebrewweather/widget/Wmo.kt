package dev.pi0trdotsys.homebrewweather.widget

/**
 * Direct Kotlin port of src/lib/wmo.ts — maps Open-Meteo WMO weather codes to
 * the same icon "kind" strings used by [PixelIcons].
 */
object Wmo {
    fun wmoToKind(code: Int): String {
        if (code == 0) return "sun"
        if (code == 1 || code == 2) return "partly"
        if (code == 3) return "cloud"
        if (code == 45 || code == 48) return "fog"
        if (code in 51..67) return "rain"
        if (code in 80..82) return "rain"
        if (code in 71..77) return "snow"
        if (code == 85 || code == 86) return "snow"
        if (code >= 95) return "thunder"
        return "cloud"
    }
}
