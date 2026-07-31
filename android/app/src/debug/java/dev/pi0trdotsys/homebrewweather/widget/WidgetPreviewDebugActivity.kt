package dev.pi0trdotsys.homebrewweather.widget

import android.app.Activity
import android.os.Bundle
import android.widget.FrameLayout
import dev.pi0trdotsys.homebrewweather.R

/**
 * DEV-ONLY verification harness. Lives entirely under src/debug/ (this file,
 * its manifest registration, and its layout), so it is only ever compiled
 * into debug builds — absent from release, and never reachable from the
 * launcher (no LAUNCHER intent-filter is declared for it anywhere).
 *
 * Exists because dragging a widget onto a home screen to eyeball a layout
 * change is fragile/impractical to automate. Instead this seeds fake
 * (deliberately worst-case) weather data into [WidgetPrefs]' cache for a
 * throwaway appWidgetId, flips [WeatherWidgetProvider.debugForceOfflineCache]
 * so [WeatherWidgetProvider.buildRemoteViews] skips the live network fetch
 * and reads that cache instead, then inflates the *actual* returned
 * RemoteViews tree (via [android.widget.RemoteViews.apply]) into two
 * containers sized to exactly match the widget's guaranteed-minimum
 * (250x180dp) and minimum-resize (180x140dp) footprints declared in
 * res/xml/weather_widget_info.xml — the same real code path production
 * uses, not a hand-copied approximation.
 *
 * Launch with:
 *   adb shell am start -n dev.pi0trdotsys.homebrewweather/.widget.WidgetPreviewDebugActivity
 * then inspect with:
 *   adb exec-out screencap -p > preview.png
 */
class WidgetPreviewDebugActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_widget_preview_debug)

        seedFakeData(FAKE_WIDGET_ID)

        WeatherWidgetProvider.debugForceOfflineCache = true
        try {
            // Simulate the host reporting the widget's *default* footprint via
            // onAppWidgetOptionsChanged (see WidgetPrefs.setLastKnownMin{Width,Height}Dp)
            // before building — same persisted values buildRemoteViews() always
            // reads, just written directly here instead of via a real AppWidgetManager
            // resize callback (which a throwaway, never-actually-placed fake widget id
            // can't receive).
            WidgetPrefs.setLastKnownMinWidthDp(this, FAKE_WIDGET_ID, WidgetPrefs.DEFAULT_MIN_WIDTH_DP)
            WidgetPrefs.setLastKnownMinHeightDp(this, FAKE_WIDGET_ID, WidgetPrefs.DEFAULT_MIN_HEIGHT_DP)
            val rvDefault = WeatherWidgetProvider.buildRemoteViews(applicationContext, FAKE_WIDGET_ID)
            val defaultContainer = findViewById<FrameLayout>(R.id.preview_default_container)
            defaultContainer.addView(rvDefault.apply(applicationContext, defaultContainer))

            // Now simulate the host reporting a resize down to minResizeWidth/Height.
            WidgetPrefs.setLastKnownMinWidthDp(this, FAKE_WIDGET_ID, 180)
            WidgetPrefs.setLastKnownMinHeightDp(this, FAKE_WIDGET_ID, 140)
            val rvMinResize = WeatherWidgetProvider.buildRemoteViews(applicationContext, FAKE_WIDGET_ID)
            val minResizeContainer = findViewById<FrameLayout>(R.id.preview_minresize_container)
            minResizeContainer.addView(rvMinResize.apply(applicationContext, minResizeContainer))
        } finally {
            // Don't leave the process-wide debug seam flipped on beyond this screen.
            WeatherWidgetProvider.debugForceOfflineCache = false
        }
    }

    /**
     * Deliberately worst-case-ish sample data (long-ish city name, a mix of
     * icon kinds across the 4 days including a below-zero day, a max-length
     * "unhealthy (sensitive)" AQI label, 100% PoP) so the layout gets
     * stress-tested against real content widths, not best-case short strings.
     */
    private fun seedFakeData(fakeWidgetId: Int) {
        WidgetPrefs.setCity(
            this,
            fakeWidgetId,
            WidgetCity(lat = 52.2297, lon = 21.0122, name = "Warszawa-Śródmieście", isLive = false),
        )
        val fakeWeather = WeatherApi.WeatherData(
            isDay = true,
            currentWeatherCode = 61, // rain
            currentTemperature = 18.0,
            apparentTemperature = 16.0,
            humidityPercent = 82,
            windSpeedKmh = 23.0,
            currentPrecipitationProbability = 74,
            usAqi = 142, // -> "unhealthy (sensitive)", the longest AQI category label
            daily = listOf(
                WeatherApi.DailyEntry(date = "2026-07-31", weatherCode = 0, tempMax = 29.0, tempMin = 14.0, precipitationProbabilityMax = 12),
                WeatherApi.DailyEntry(date = "2026-08-01", weatherCode = 61, tempMax = 22.0, tempMin = 11.0, precipitationProbabilityMax = 88),
                WeatherApi.DailyEntry(date = "2026-08-02", weatherCode = 95, tempMax = 19.0, tempMin = 9.0, precipitationProbabilityMax = 100),
                WeatherApi.DailyEntry(date = "2026-08-03", weatherCode = 71, tempMax = -2.0, tempMin = -8.0, precipitationProbabilityMax = 45),
            ),
        )
        WidgetPrefs.setCachedWeather(this, fakeWidgetId, fakeWeather)
    }

    companion object {
        private const val FAKE_WIDGET_ID = -777
    }
}
