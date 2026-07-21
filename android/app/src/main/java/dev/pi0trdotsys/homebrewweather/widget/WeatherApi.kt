package dev.pi0trdotsys.homebrewweather.widget

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/**
 * Minimal Kotlin port of src/lib/weather-api.ts using plain HttpURLConnection
 * + org.json (both built into Android) — no Retrofit/OkHttp/Gson needed for
 * this widget's small surface area. All functions here are blocking; callers
 * must invoke them off the main thread (background thread / coroutine).
 */
object WeatherApi {

    data class GeoResult(
        val name: String,
        val country: String,
        val admin1: String?,
        val latitude: Double,
        val longitude: Double,
    )

    data class DailyEntry(
        val date: String,
        val weatherCode: Int,
        val tempMax: Double,
        val tempMin: Double,
        val precipitationProbabilityMax: Int,
    )

    data class WeatherData(
        val isDay: Boolean,
        val currentWeatherCode: Int,
        val currentTemperature: Double,
        val daily: List<DailyEntry>,
    )

    private fun httpGetJson(urlStr: String): JSONObject {
        val conn = URL(urlStr).openConnection() as HttpURLConnection
        try {
            conn.requestMethod = "GET"
            conn.connectTimeout = 15_000
            conn.readTimeout = 15_000
            val code = conn.responseCode
            val stream = if (code in 200..299) conn.inputStream else conn.errorStream
            val body = stream?.bufferedReader()?.use { it.readText() } ?: ""
            if (code !in 200..299) {
                throw RuntimeException("HTTP $code for $urlStr: $body")
            }
            return JSONObject(body)
        } finally {
            conn.disconnect()
        }
    }

    private fun parseGeoResult(o: JSONObject): GeoResult = GeoResult(
        name = o.optString("name", "unknown"),
        country = o.optString("country", ""),
        admin1 = if (o.has("admin1")) o.optString("admin1", "").ifBlank { null } else null,
        latitude = o.optDouble("latitude"),
        longitude = o.optDouble("longitude"),
    )

    fun geocode(query: String): List<GeoResult> {
        if (query.isBlank()) return emptyList()
        val q = URLEncoder.encode(query, "UTF-8")
        val url = "https://geocoding-api.open-meteo.com/v1/search?name=$q&count=6&language=en&format=json"
        val json = httpGetJson(url)
        val results = json.optJSONArray("results") ?: return emptyList()
        return (0 until results.length()).map { parseGeoResult(results.getJSONObject(it)) }
    }

    fun reverseGeocode(lat: Double, lon: Double): GeoResult? {
        val url = "https://geocoding-api.open-meteo.com/v1/reverse?latitude=$lat&longitude=$lon&language=en&format=json"
        return try {
            val json = httpGetJson(url)
            val results = json.optJSONArray("results") ?: return null
            if (results.length() == 0) null else parseGeoResult(results.getJSONObject(0))
        } catch (e: Exception) {
            null
        }
    }

    fun fetchWeather(lat: Double, lon: Double): WeatherData {
        val url = "https://api.open-meteo.com/v1/forecast" +
            "?latitude=$lat&longitude=$lon" +
            "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day,surface_pressure" +
            "&hourly=temperature_2m,weather_code,precipitation_probability" +
            "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset" +
            "&timezone=auto&forecast_days=7"
        val json = httpGetJson(url)

        val current = json.getJSONObject("current")
        val isDay = current.optInt("is_day", 1) == 1
        val currentCode = current.optInt("weather_code", 0)
        val currentTemp = current.optDouble("temperature_2m", Double.NaN)

        val daily = json.getJSONObject("daily")
        val times = daily.getJSONArray("time")
        val codes = daily.getJSONArray("weather_code")
        val maxes = daily.getJSONArray("temperature_2m_max")
        val mins = daily.getJSONArray("temperature_2m_min")
        val pops = daily.optJSONArray("precipitation_probability_max")

        val count = minOf(4, times.length())
        val entries = (0 until count).map { i ->
            DailyEntry(
                date = times.getString(i),
                weatherCode = codes.getInt(i),
                tempMax = maxes.getDouble(i),
                tempMin = mins.getDouble(i),
                precipitationProbabilityMax = pops?.optInt(i, 0) ?: 0,
            )
        }
        return WeatherData(isDay = isDay, currentWeatherCode = currentCode, currentTemperature = currentTemp, daily = entries)
    }
}
