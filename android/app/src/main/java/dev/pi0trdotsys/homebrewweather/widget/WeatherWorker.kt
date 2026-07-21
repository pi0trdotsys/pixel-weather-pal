package dev.pi0trdotsys.homebrewweather.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequest
import androidx.work.Worker
import androidx.work.WorkManager
import androidx.work.WorkRequest
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/**
 * Periodic background refresh for every placed widget instance. Reads the
 * refresh interval from the shared "CapacitorStorage" prefs (key
 * "brew-wx:interval", set by the main web app's settings screen), clamped
 * to WorkManager's real minimum of 15 minutes.
 */
class WeatherWorker(context: Context, params: WorkerParameters) : Worker(context, params) {

    override fun doWork(): Result {
        val context = applicationContext
        val appWidgetManager = AppWidgetManager.getInstance(context)
        val ids = WeatherWidgetProvider.allWidgetIds(context)
        // Run synchronously here (Worker already runs off the main thread);
        // each widget's own fetch failure is caught internally so one bad
        // city never fails the whole batch.
        ids.forEach { id ->
            try {
                val rv = WeatherWidgetProvider.buildRemoteViews(context, id)
                appWidgetManager.updateAppWidget(id, rv)
            } catch (e: Exception) {
                // best-effort, continue with the next widget
            }
        }
        return Result.success()
    }

    companion object {
        private const val WORK_NAME = "weather_widget_periodic_refresh"

        fun enqueuePeriodic(context: Context) {
            val minutes = CapacitorStorage.refreshIntervalMinutes(context)
            val request = PeriodicWorkRequest.Builder(WeatherWorker::class.java, minutes, TimeUnit.MINUTES)
                .setConstraints(
                    Constraints.Builder()
                        .setRequiredNetworkType(NetworkType.CONNECTED)
                        .build(),
                )
                .setBackoffCriteria(BackoffPolicy.LINEAR, WorkRequest.MIN_BACKOFF_MILLIS, TimeUnit.MILLISECONDS)
                .build()
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, request)
        }

        fun cancelPeriodic(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }
}
