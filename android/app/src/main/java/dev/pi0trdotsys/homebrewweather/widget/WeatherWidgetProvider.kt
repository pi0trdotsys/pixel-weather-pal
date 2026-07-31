package dev.pi0trdotsys.homebrewweather.widget

import android.Manifest
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationManager
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.text.Spannable
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import android.view.View
import android.widget.RemoteViews
import androidx.core.content.ContextCompat
import dev.pi0trdotsys.homebrewweather.MainActivity
import dev.pi0trdotsys.homebrewweather.R
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.concurrent.Executors

/**
 * Native home-screen widget (AppWidgetProvider + RemoteViews) that mirrors
 * the (now-removed) src/components/WeatherWidget.tsx web tile, but runs
 * entirely independent of the WebView — its own network calls, its own
 * per-instance city, its own refresh loop.
 */
class WeatherWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.forEach { refreshWidget(context, appWidgetManager, it) }
        WeatherWorker.enqueuePeriodic(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        when (intent.action) {
            ACTION_REFRESH -> {
                val id = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID)
                if (id != AppWidgetManager.INVALID_APPWIDGET_ID) {
                    refreshWidget(context, AppWidgetManager.getInstance(context), id)
                }
            }
            ACTION_BLINK_TICK -> handleBlinkTick(context)
        }
    }

    override fun onEnabled(context: Context) {
        WeatherWorker.enqueuePeriodic(context)
        BlinkAlarm.start(context)
    }

    override fun onDisabled(context: Context) {
        WeatherWorker.cancelPeriodic(context)
        BlinkAlarm.stop(context)
    }

    override fun onDeleted(context: Context, appWidgetIds: IntArray) {
        appWidgetIds.forEach { WidgetPrefs.removeCity(context, it) }
    }

    companion object {
        const val ACTION_REFRESH = "dev.pi0trdotsys.homebrewweather.ACTION_REFRESH"
        const val ACTION_BLINK_TICK = "dev.pi0trdotsys.homebrewweather.ACTION_BLINK_TICK"

        private val bgExecutor = Executors.newCachedThreadPool()
        private val DOW = arrayOf("nd", "pn", "wt", "śr", "cz", "pt", "sb")

        // Bumped from 28dp now that the taller (targetCellHeight=3) layout has
        // room to breathe — shared by the full fetch path and the cheap
        // blink-tick partial update so both draw icons at the same size.
        private const val ICON_DP = 42

        fun componentName(context: Context) = ComponentName(context, WeatherWidgetProvider::class.java)

        /** All currently-placed widget ids, e.g. for the periodic worker. */
        fun allWidgetIds(context: Context): IntArray =
            AppWidgetManager.getInstance(context).getAppWidgetIds(componentName(context))

        /** Kicks off a background fetch + RemoteViews push for a single widget instance. */
        fun refreshWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            bgExecutor.execute {
                try {
                    val rv = buildRemoteViews(context, appWidgetId)
                    appWidgetManager.updateAppWidget(appWidgetId, rv)
                } catch (e: Exception) {
                    // Best-effort widget; swallow so a single bad refresh never crashes the host process.
                }
            }
        }

        /** Handles a ~60s BlinkAlarm tick: flips the shared cursor state, advances the
         * shared icon-animation frame counter, and pushes a cheap partial update (no
         * network re-fetch — icon bitmaps are just re-rendered from each widget's
         * already-cached weather codes) to every currently-placed widget instance. */
        private fun handleBlinkTick(context: Context) {
            val cursorOn = BlinkPrefs.toggle(context)
            val frame = BlinkPrefs.advanceFrame(context)
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val iconPx = dpToPx(context, ICON_DP)
            allWidgetIds(context).forEach { id ->
                val rv = RemoteViews(context.packageName, R.layout.weather_widget)
                rv.setViewVisibility(R.id.widget_cursor, if (cursorOn) View.VISIBLE else View.GONE)
                // Re-render each day's icon at the new frame from cached weather codes
                // only — no network call, matching the "no new battery cost" tradeoff.
                val weather = WidgetPrefs.getCachedWeather(context, id)
                if (weather != null) {
                    for (i in 0 until 4) {
                        val entry = weather.daily.getOrNull(i) ?: continue
                        val kind = Wmo.wmoToKind(entry.weatherCode)
                        rv.setImageViewBitmap(ICON_IDS[i], PixelIcons.render(kind, iconPx, frame))
                    }
                }
                try {
                    appWidgetManager.partiallyUpdateAppWidget(id, rv)
                } catch (e: Exception) {
                    // best-effort, continue with the next widget
                }
            }
        }

        private fun dpToPx(context: Context, dp: Int): Int =
            Math.round(dp * context.resources.displayMetrics.density)

        /**
         * "Follow my location" (WidgetCity.isLive) resolution for a background
         * refresh. A background context can't easily run a full
         * requestLocationUpdates()-with-timeout loop the way the foreground
         * WidgetConfigureActivity does (see requestLocationFix()/safeLastKnown()
         * there) — so, same pragmatic beta-appropriate tradeoff as BlinkAlarm's
         * doc comment elsewhere in this file: a best-effort
         * getLastKnownLocation() across providers is the right, simpler choice
         * here, not a fresh GPS fix.
         *
         * Returns [storedCity] unchanged when it isn't in live mode. When it is
         * live but no last-known fix is available from any provider (e.g. right
         * after boot, before any provider has a fix), also gracefully returns
         * [storedCity] as-is rather than crashing or blanking the widget.
         * Otherwise re-resolves lat/lon (+ a best-effort reverse-geocoded name)
         * and persists the refreshed WidgetCity so the offline-fallback cache
         * and header label stay current too.
         */
        private fun resolveEffectiveCity(context: Context, appWidgetId: Int, storedCity: WidgetCity): WidgetCity {
            if (!storedCity.isLive) return storedCity
            val location = bestEffortLastKnownLocation(context) ?: return storedCity

            val geo = try {
                WeatherApi.reverseGeocode(location.latitude, location.longitude)
            } catch (e: Exception) {
                null
            }
            val updated = WidgetCity(
                lat = location.latitude,
                lon = location.longitude,
                name = geo?.name ?: storedCity.name,
                isLive = true,
            )
            WidgetPrefs.setCity(context, appWidgetId, updated)
            return updated
        }

        /** Best-effort getLastKnownLocation() across GPS/network/passive providers —
         * never requests a fresh fix, never throws (permission or provider errors are
         * swallowed), just returns the first non-null cached fix or null. */
        private fun bestEffortLastKnownLocation(context: Context): Location? {
            val fineGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED
            val coarseGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) ==
                PackageManager.PERMISSION_GRANTED
            if (!fineGranted && !coarseGranted) return null

            val lm = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager ?: return null
            val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER, LocationManager.PASSIVE_PROVIDER)
            for (provider in providers) {
                try {
                    val loc = lm.getLastKnownLocation(provider)
                    if (loc != null) return loc
                } catch (e: SecurityException) {
                    // no permission for this provider — try the next one
                } catch (e: IllegalArgumentException) {
                    // provider not present on this device — try the next one
                }
            }
            return null
        }

        /** Maps a US AQI (0..500+) reading to a short compact label + color resource,
         * per the standard US EPA AQI category breakpoints. */
        private fun aqiLabelAndColor(aqi: Int): Pair<String, Int> = when {
            aqi <= 50 -> "good" to R.color.widget_aqi_good
            aqi <= 100 -> "moderate" to R.color.widget_aqi_moderate
            aqi <= 150 -> "unhealthy (sensitive)" to R.color.widget_aqi_sensitive
            aqi <= 200 -> "unhealthy" to R.color.widget_aqi_unhealthy
            aqi <= 300 -> "very unhealthy" to R.color.widget_aqi_very_unhealthy
            else -> "hazardous" to R.color.widget_aqi_hazardous
        }

        private fun isOnline(context: Context): Boolean {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return false
            val network = cm.activeNetwork ?: return false
            val caps = cm.getNetworkCapabilities(network) ?: return false
            return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        }

        private fun dowAbbrev(isoDate: String): String {
            return try {
                val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
                val date = sdf.parse(isoDate) ?: return "?"
                val cal = Calendar.getInstance()
                cal.time = date
                // Calendar.DAY_OF_WEEK: Sunday=1 .. Saturday=7, matches DOW[0..6] order (nd..sb)
                DOW[cal.get(Calendar.DAY_OF_WEEK) - 1]
            } catch (e: Exception) {
                "?"
            }
        }

        private fun tempSpannable(context: Context, dayMax: Double, nightMin: Double): SpannableString {
            val text = "${Math.round(dayMax)}° / ${Math.round(nightMin)}°"
            val span = SpannableString(text)
            val amber = context.getColor(R.color.widget_amber)
            val green = context.getColor(R.color.widget_green)
            val slashIdx = text.indexOf('/')
            span.setSpan(ForegroundColorSpan(amber), 0, slashIdx, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
            span.setSpan(ForegroundColorSpan(green), slashIdx, text.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
            return span
        }

        /** Compact "feels like / humidity / wind" line for the new data row —
         * only surfaces fields WeatherApi actually parsed; missing/unknown
         * readings (NaN / -1 sentinels, e.g. from an older offline cache) are
         * simply omitted rather than shown as garbage. */
        private fun metaLine(weather: WeatherApi.WeatherData): String {
            val parts = mutableListOf<String>()
            if (!weather.apparentTemperature.isNaN()) {
                parts += "feels ${Math.round(weather.apparentTemperature)}°"
            }
            if (weather.humidityPercent >= 0) {
                parts += "hum ${weather.humidityPercent}%"
            }
            if (!weather.windSpeedKmh.isNaN()) {
                parts += "wind ${Math.round(weather.windSpeedKmh)}km/h"
            }
            return if (parts.isEmpty()) "" else parts.joinToString("  ·  ")
        }

        private val DAY_LABEL_IDS = intArrayOf(R.id.widget_day0_label, R.id.widget_day1_label, R.id.widget_day2_label, R.id.widget_day3_label)
        private val ICON_IDS = intArrayOf(R.id.widget_icon0, R.id.widget_icon1, R.id.widget_icon2, R.id.widget_icon3)
        private val TEMP_IDS = intArrayOf(R.id.widget_temp0, R.id.widget_temp1, R.id.widget_temp2, R.id.widget_temp3)
        private val POP_IDS = intArrayOf(R.id.widget_pop0, R.id.widget_pop1, R.id.widget_pop2, R.id.widget_pop3)

        /** Builds the full RemoteViews for one widget instance. Performs a blocking network
         * call — must be invoked off the main thread (see [refreshWidget] / WeatherWorker). */
        fun buildRemoteViews(context: Context, appWidgetId: Int): RemoteViews {
            val rv = RemoteViews(context.packageName, R.layout.weather_widget)
            val pendingFlags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE

            // Tapping the body opens the app.
            val openAppIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val openAppPending = PendingIntent.getActivity(context, appWidgetId * 10 + 0, openAppIntent, pendingFlags)
            rv.setOnClickPendingIntent(R.id.widget_content, openAppPending)

            // "change city" button -> configure activity, passed the appWidgetId directly
            // (not through the host's ACTION_APPWIDGET_CONFIGURE flow, since the widget
            // already exists at this point).
            val configureIntent = Intent(context, WidgetConfigureActivity::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                data = Uri.parse("widgetconfig://widget/$appWidgetId")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            val configurePending = PendingIntent.getActivity(context, appWidgetId * 10 + 1, configureIntent, pendingFlags)
            rv.setOnClickPendingIntent(R.id.widget_city_btn, configurePending)

            // refresh button -> broadcast back to this provider
            val refreshIntent = Intent(context, WeatherWidgetProvider::class.java).apply {
                action = ACTION_REFRESH
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                data = Uri.parse("refresh://widget/$appWidgetId")
            }
            val refreshPending = PendingIntent.getBroadcast(context, appWidgetId * 10 + 2, refreshIntent, pendingFlags)
            rv.setOnClickPendingIntent(R.id.widget_refresh_btn, refreshPending)

            // Per-widget-instance personalization (theme + background transparency) —
            // see WidgetConfigureActivity's theme/transparency pickers and
            // WidgetTheme.kt's doc comments for exactly which views these touch and
            // which stay fixed regardless of theme. Applied unconditionally, before
            // any of the early-return states below, so even the "set city" /
            // "offline, no cache" placeholder states respect the chosen look.
            val theme = WidgetPrefs.getTheme(context, appWidgetId)
            val transparency = WidgetPrefs.getTransparency(context, appWidgetId)
            rv.setInt(R.id.widget_root, "setBackgroundResource", transparency.drawableRes)
            rv.setTextColor(R.id.widget_header_label, context.getColor(theme.dimColorRes))
            rv.setTextColor(R.id.widget_cursor, context.getColor(theme.primaryColorRes))
            rv.setTextColor(R.id.widget_now_line, context.getColor(theme.primaryColorRes))
            DAY_LABEL_IDS.forEach { rv.setTextColor(it, context.getColor(theme.primaryColorRes)) }

            val online = isOnline(context)
            rv.setImageViewResource(
                R.id.widget_online_dot,
                if (online) R.drawable.widget_dot_online else R.drawable.widget_dot_offline,
            )

            // Blinking cursor: reflect the currently-persisted on/off tick state
            // (BlinkAlarm flips it roughly once a minute — see handleBlinkTick /
            // BlinkAlarm.kt for why it's a discrete toggle, not a smooth blink).
            rv.setViewVisibility(R.id.widget_cursor, if (BlinkPrefs.isOn(context)) View.VISIBLE else View.GONE)

            val storedCity = WidgetPrefs.getCity(context, appWidgetId)
            if (storedCity == null) {
                rv.setTextViewText(R.id.widget_header_label, "┌─ set city ─┐")
                rv.setTextViewText(R.id.widget_footer_comment, "// sigma.forecast()")
                rv.setTextViewText(R.id.widget_footer_joke, "> tap [city] to configure")
                rv.setViewVisibility(R.id.widget_aqi_line, View.GONE)
                return rv
            }

            // "Follow my location" (isLive) widgets re-acquire the device's current
            // location on every refresh instead of trusting a frozen snapshot — see
            // resolveEffectiveCity() for the (best-effort, background-safe) approach.
            val city = resolveEffectiveCity(context, appWidgetId, storedCity)

            val liveMarker = if (city.isLive) "◎ " else ""
            rv.setTextViewText(R.id.widget_header_label, "┌─ $liveMarker${city.name} ─┐")

            var isFresh = false
            var weather = try {
                val fresh = WeatherApi.fetchWeather(city.lat, city.lon)
                isFresh = true
                fresh
            } catch (e: Exception) {
                WidgetPrefs.getCachedWeather(context, appWidgetId)
            }

            if (weather == null) {
                rv.setTextViewText(R.id.widget_footer_joke, "> offline — no cached data yet")
                rv.setViewVisibility(R.id.widget_aqi_line, View.GONE)
                return rv
            }

            // Notifications are evaluated only against a genuinely fresh fetch (never a
            // stale offline-fallback cache) and are entirely best-effort — a notification
            // failure must never break the widget's own render.
            if (isFresh) {
                try {
                    WeatherNotifier.evaluate(context, appWidgetId, city, weather)
                } catch (e: Exception) {
                    // best-effort, never break the widget refresh
                }

                // Separate Air Quality API call (different host) — fully best-effort:
                // a failure here must never blank/break the main weather render. On
                // failure, fall back to whatever AQI value was last cached rather than
                // just dropping the line.
                val aqi = try {
                    WeatherApi.fetchAirQuality(city.lat, city.lon)
                } catch (e: Exception) {
                    null
                }
                weather = if (aqi != null) {
                    weather.copy(usAqi = aqi)
                } else {
                    val cachedAqi = WidgetPrefs.getCachedWeather(context, appWidgetId)?.usAqi ?: -1
                    if (cachedAqi >= 0) weather.copy(usAqi = cachedAqi) else weather
                }

                WidgetPrefs.setCachedWeather(context, appWidgetId, weather)
            }

            val iconPx = dpToPx(context, ICON_DP)
            // Use whatever frame the blink tick last persisted so a manual
            // refresh / periodic re-fetch stays visually in sync with it
            // rather than resetting the animation.
            val frame = BlinkPrefs.frame(context)
            for (i in 0 until 4) {
                val entry = weather.daily.getOrNull(i) ?: continue
                val dayLabel = if (i == 0) "dziś" else dowAbbrev(entry.date)
                val kind = Wmo.wmoToKind(entry.weatherCode)
                rv.setTextViewText(DAY_LABEL_IDS[i], dayLabel)
                rv.setImageViewBitmap(ICON_IDS[i], PixelIcons.render(kind, iconPx, frame))
                rv.setTextViewText(TEMP_IDS[i], tempSpannable(context, entry.tempMax, entry.tempMin))
                rv.setTextViewText(POP_IDS[i], "▽ ${entry.precipitationProbabilityMax}%")
            }

            rv.setTextViewText(R.id.widget_meta_line, metaLine(weather))

            // "Right now" line: current temp + current chance of rain — distinct
            // from the 4-day grid above (today's daily max/min and daily-max PoP).
            val nowParts = mutableListOf<String>()
            if (!weather.currentTemperature.isNaN()) nowParts += "now: ${Math.round(weather.currentTemperature)}°"
            if (weather.currentPrecipitationProbability >= 0) nowParts += "rain ${weather.currentPrecipitationProbability}%"
            rv.setTextViewText(R.id.widget_now_line, nowParts.joinToString(" · "))

            if (weather.usAqi >= 0) {
                val (label, colorRes) = aqiLabelAndColor(weather.usAqi)
                val text = "AQI ${weather.usAqi} · $label"
                val span = SpannableString(text)
                span.setSpan(ForegroundColorSpan(context.getColor(colorRes)), 0, text.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
                rv.setTextViewText(R.id.widget_aqi_line, span)
                rv.setViewVisibility(R.id.widget_aqi_line, View.VISIBLE)
            } else {
                rv.setTextViewText(R.id.widget_aqi_line, "")
                rv.setViewVisibility(R.id.widget_aqi_line, View.GONE)
            }

            val kind0 = Wmo.wmoToKind(weather.currentWeatherCode)
            val isNight = !weather.isDay
            // Seed by current hour so the joke is stable within a refresh cycle but
            // varies across refreshes/hours, matching pickSigma()'s intent.
            val seed = (System.currentTimeMillis() / (60 * 60 * 1000L)).toInt()
            val joke = SigmaJokes.pick(kind0, isNight, seed)
            rv.setTextViewText(R.id.widget_footer_joke, "> $joke")

            return rv
        }
    }
}
