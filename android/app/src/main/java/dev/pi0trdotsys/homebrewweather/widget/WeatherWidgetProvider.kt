package dev.pi0trdotsys.homebrewweather.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.text.Spannable
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import android.view.View
import android.widget.RemoteViews
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

        /** Handles a ~60s BlinkAlarm tick: flips the shared cursor state and pushes a cheap
         * partial update (no re-fetch) to every currently-placed widget instance. */
        private fun handleBlinkTick(context: Context) {
            val cursorOn = BlinkPrefs.toggle(context)
            val appWidgetManager = AppWidgetManager.getInstance(context)
            allWidgetIds(context).forEach { id ->
                val rv = RemoteViews(context.packageName, R.layout.weather_widget)
                rv.setViewVisibility(R.id.widget_cursor, if (cursorOn) View.VISIBLE else View.GONE)
                try {
                    appWidgetManager.partiallyUpdateAppWidget(id, rv)
                } catch (e: Exception) {
                    // best-effort, continue with the next widget
                }
            }
        }

        private fun dpToPx(context: Context, dp: Int): Int =
            Math.round(dp * context.resources.displayMetrics.density)

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

            val online = isOnline(context)
            rv.setImageViewResource(
                R.id.widget_online_dot,
                if (online) R.drawable.widget_dot_online else R.drawable.widget_dot_offline,
            )

            // Blinking cursor: reflect the currently-persisted on/off tick state
            // (BlinkAlarm flips it roughly once a minute — see handleBlinkTick /
            // BlinkAlarm.kt for why it's a discrete toggle, not a smooth blink).
            rv.setViewVisibility(R.id.widget_cursor, if (BlinkPrefs.isOn(context)) View.VISIBLE else View.GONE)

            val city = WidgetPrefs.getCity(context, appWidgetId)
            if (city == null) {
                rv.setTextViewText(R.id.widget_header_label, "┌─ widget 4×2 · set city ─┐")
                rv.setTextViewText(R.id.widget_footer_comment, "// sigma.forecast()")
                rv.setTextViewText(R.id.widget_footer_joke, "> tap [city] to configure")
                return rv
            }

            rv.setTextViewText(R.id.widget_header_label, "┌─ widget 4×2 · ${city.name} ─┐")

            var isFresh = false
            val weather = try {
                val fresh = WeatherApi.fetchWeather(city.lat, city.lon)
                WidgetPrefs.setCachedWeather(context, appWidgetId, fresh)
                isFresh = true
                fresh
            } catch (e: Exception) {
                WidgetPrefs.getCachedWeather(context, appWidgetId)
            }

            if (weather == null) {
                rv.setTextViewText(R.id.widget_footer_joke, "> offline — no cached data yet")
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
            }

            val iconPx = dpToPx(context, 28)
            for (i in 0 until 4) {
                val entry = weather.daily.getOrNull(i) ?: continue
                val dayLabel = if (i == 0) "dziś" else dowAbbrev(entry.date)
                val kind = Wmo.wmoToKind(entry.weatherCode)
                rv.setTextViewText(DAY_LABEL_IDS[i], dayLabel)
                rv.setImageViewBitmap(ICON_IDS[i], PixelIcons.render(kind, iconPx))
                rv.setTextViewText(TEMP_IDS[i], tempSpannable(context, entry.tempMax, entry.tempMin))
                rv.setTextViewText(POP_IDS[i], "▽ ${entry.precipitationProbabilityMax}%")
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
