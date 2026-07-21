package dev.pi0trdotsys.homebrewweather.widget

import android.content.Context
import org.json.JSONObject

/** A saved city for one particular widget instance. */
data class WidgetCity(val lat: Double, val lon: Double, val name: String) {
    fun toJson(): String = JSONObject().apply {
        put("lat", lat)
        put("lon", lon)
        put("name", name)
    }.toString()

    companion object {
        fun fromJson(raw: String?): WidgetCity? {
            if (raw.isNullOrBlank()) return null
            return try {
                val o = JSONObject(raw)
                WidgetCity(
                    lat = o.getDouble("lat"),
                    lon = o.getDouble("lon"),
                    name = o.optString("name", "?"),
                )
            } catch (e: Exception) {
                null
            }
        }
    }
}

/**
 * Dedicated SharedPreferences file for per-widget-instance city selection,
 * keyed by "city_" + appWidgetId — separate from the main app's storage so
 * the widget keeps working independent of the WebView/app ever being opened.
 */
object WidgetPrefs {
    private const val PREFS_NAME = "widget_city_prefs"
    private fun cityKey(appWidgetId: Int) = "city_$appWidgetId"
    private fun weatherCacheKey(appWidgetId: Int) = "weather_cache_$appWidgetId"

    fun getCity(context: Context, appWidgetId: Int): WidgetCity? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return WidgetCity.fromJson(prefs.getString(cityKey(appWidgetId), null))
    }

    fun setCity(context: Context, appWidgetId: Int, city: WidgetCity) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(cityKey(appWidgetId), city.toJson()).apply()
    }

    fun removeCity(context: Context, appWidgetId: Int) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .remove(cityKey(appWidgetId))
            .remove(weatherCacheKey(appWidgetId))
            .apply()
    }

    /** Last-known-good weather, used as an offline fallback when a refresh fails. */
    fun getCachedWeather(context: Context, appWidgetId: Int): WeatherApi.WeatherData? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val raw = prefs.getString(weatherCacheKey(appWidgetId), null) ?: return null
        return try {
            val o = JSONObject(raw)
            val dailyArr = o.getJSONArray("daily")
            val daily = (0 until dailyArr.length()).map { i ->
                val d = dailyArr.getJSONObject(i)
                WeatherApi.DailyEntry(
                    date = d.getString("date"),
                    weatherCode = d.getInt("weatherCode"),
                    tempMax = d.getDouble("tempMax"),
                    tempMin = d.getDouble("tempMin"),
                    precipitationProbabilityMax = d.getInt("pop"),
                )
            }
            WeatherApi.WeatherData(
                isDay = o.optBoolean("isDay", true),
                currentWeatherCode = o.optInt("currentWeatherCode", 0),
                // optDouble default NaN: older cached entries (written before this field
                // existed) won't have it — NaN is treated as "unknown" by callers that
                // care (see WeatherNotifier), never as a real reading of 0°C.
                currentTemperature = o.optDouble("currentTemp", Double.NaN),
                // Same "unknown" convention for the newer feels-like/humidity/wind
                // fields — older cached blobs simply won't have these keys.
                apparentTemperature = o.optDouble("apparentTemp", Double.NaN),
                humidityPercent = o.optInt("humidity", -1),
                windSpeedKmh = o.optDouble("windSpeed", Double.NaN),
                daily = daily,
            )
        } catch (e: Exception) {
            null
        }
    }

    fun setCachedWeather(context: Context, appWidgetId: Int, weather: WeatherApi.WeatherData) {
        val dailyArr = org.json.JSONArray()
        weather.daily.forEach { entry ->
            dailyArr.put(JSONObject().apply {
                put("date", entry.date)
                put("weatherCode", entry.weatherCode)
                put("tempMax", entry.tempMax)
                put("tempMin", entry.tempMin)
                put("pop", entry.precipitationProbabilityMax)
            })
        }
        val o = JSONObject().apply {
            put("isDay", weather.isDay)
            put("currentWeatherCode", weather.currentWeatherCode)
            // org.json's put(String, Double) throws for NaN/Infinite, so only write
            // it when it's an actual reading — optDouble() on read already defaults
            // a missing key back to NaN ("unknown").
            if (!weather.currentTemperature.isNaN()) put("currentTemp", weather.currentTemperature)
            if (!weather.apparentTemperature.isNaN()) put("apparentTemp", weather.apparentTemperature)
            if (weather.humidityPercent >= 0) put("humidity", weather.humidityPercent)
            if (!weather.windSpeedKmh.isNaN()) put("windSpeed", weather.windSpeedKmh)
            put("daily", dailyArr)
        }
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(weatherCacheKey(appWidgetId), o.toString()).apply()
    }
}

/**
 * Read-only access to the existing Capacitor Preferences SharedPreferences
 * file (group "CapacitorStorage", the @capacitor/preferences default),
 * shared with the main web app. Keys are stored as raw strings, no prefix.
 * Used only as a convenience default / for the refresh interval — the
 * widget's own city storage lives in [WidgetPrefs].
 */
object CapacitorStorage {
    private const val PREFS_NAME = "CapacitorStorage"
    private const val COORDS_KEY = "brew-wx:coords"
    private const val INTERVAL_KEY = "brew-wx:interval"

    // Notification settings — written by the web app's Settings page
    // (src/lib/settings.ts / src/routes/settings.tsx). Key names + string
    // encodings ("true"/"false", plain number strings) are a contract with
    // that file; don't rename here without updating it too.
    private const val NOTIF_RAIN_ENABLED_KEY = "settings:notif-rain-enabled"
    private const val NOTIF_HIGH_ENABLED_KEY = "settings:notif-high-enabled"
    private const val NOTIF_HIGH_THRESHOLD_KEY = "settings:notif-high-threshold"
    private const val NOTIF_LOW_ENABLED_KEY = "settings:notif-low-enabled"
    private const val NOTIF_LOW_THRESHOLD_KEY = "settings:notif-low-threshold"
    private const val NOTIF_SWING_ENABLED_KEY = "settings:notif-swing-enabled"
    private const val NOTIF_SWING_THRESHOLD_KEY = "settings:notif-swing-threshold"

    fun lastAppCity(context: Context): WidgetCity? {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return WidgetCity.fromJson(prefs.getString(COORDS_KEY, null))
    }

    /** Minutes, clamped to WorkManager's real minimum (15), default 30. */
    fun refreshIntervalMinutes(context: Context): Long {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val raw = prefs.getString(INTERVAL_KEY, null)
        val allowed = setOf(15L, 30L, 60L, 180L, 360L)
        val parsed = raw?.toLongOrNull()
        val minutes = if (parsed != null && parsed in allowed) parsed else 30L
        return maxOf(minutes, 15L)
    }

    private fun getBool(context: Context, key: String, default: Boolean): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val raw = prefs.getString(key, null) ?: return default
        return raw == "true"
    }

    private fun getDouble(context: Context, key: String, default: Double): Double {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val raw = prefs.getString(key, null) ?: return default
        return raw.toDoubleOrNull() ?: default
    }

    fun rainEnabled(context: Context): Boolean = getBool(context, NOTIF_RAIN_ENABLED_KEY, true)
    fun highEnabled(context: Context): Boolean = getBool(context, NOTIF_HIGH_ENABLED_KEY, true)
    fun highThreshold(context: Context): Double = getDouble(context, NOTIF_HIGH_THRESHOLD_KEY, 30.0)
    fun lowEnabled(context: Context): Boolean = getBool(context, NOTIF_LOW_ENABLED_KEY, true)
    fun lowThreshold(context: Context): Double = getDouble(context, NOTIF_LOW_THRESHOLD_KEY, 0.0)
    fun swingEnabled(context: Context): Boolean = getBool(context, NOTIF_SWING_ENABLED_KEY, true)
    fun swingThreshold(context: Context): Double = getDouble(context, NOTIF_SWING_THRESHOLD_KEY, 8.0)
}

/**
 * Tiny dedicated SharedPreferences file holding just the widget cursor's
 * current on/off blink state, so every widget instance toggles in lock-step
 * on each AlarmManager tick (see [BlinkAlarm] / WeatherWidgetProvider). Also
 * holds the shared icon-animation frame counter (0..3), advanced on the same
 * ~60s tick — piggybacking on the existing alarm rather than adding a new one
 * (see PixelIcons.transformGrid for what each frame looks like per icon kind).
 */
object BlinkPrefs {
    private const val PREFS_NAME = "widget_blink_prefs"
    private const val KEY_CURSOR_ON = "cursor_on"
    private const val KEY_FRAME = "frame"
    private const val FRAME_COUNT = 4

    fun isOn(context: Context): Boolean =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getBoolean(KEY_CURSOR_ON, true)

    /** Flips the stored state and returns the new value. */
    fun toggle(context: Context): Boolean {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val next = !prefs.getBoolean(KEY_CURSOR_ON, true)
        prefs.edit().putBoolean(KEY_CURSOR_ON, next).apply()
        return next
    }

    /** Currently-persisted animation frame (0..3), read by a normal
     * buildRemoteViews() fetch so it stays in sync with whatever the last
     * blink tick set — no separate frame clock. */
    fun frame(context: Context): Int =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getInt(KEY_FRAME, 0)

    /** Advances the stored frame counter (wrapping 0..3) and returns the new value. */
    fun advanceFrame(context: Context): Int {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val next = (prefs.getInt(KEY_FRAME, 0) + 1) % FRAME_COUNT
        prefs.edit().putInt(KEY_FRAME, next).apply()
        return next
    }
}
