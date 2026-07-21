package dev.pi0trdotsys.homebrewweather.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.SystemClock

/**
 * Drives the widget's "blinking cursor" via a repeating [AlarmManager] alarm
 * instead of WorkManager: WorkManager's real minimum periodic interval is 15
 * minutes (far too slow for anything resembling a blink), and a true
 * sub-second CSS-style blink is not achievable for a home-screen widget at
 * all — RemoteViews are inflated once by the launcher's process and there is
 * no continuously-running code inside them to animate; doing that for real
 * would require a foreground service, which is overkill (extra permission,
 * battery cost, user-visible persistent notification) for a beta feature.
 *
 * Instead we toggle the cursor's visibility on a coarse ~60s tick — a
 * deliberate, documented platform-constraint compromise, not an oversight.
 * `setInexactRepeating` (not `setExact*`) is used deliberately: the tick has
 * no correctness requirement, so letting the OS batch/align it with other
 * apps' alarms is strictly better for battery.
 */
object BlinkAlarm {
    private const val REQUEST_CODE = 9001
    private const val TICK_INTERVAL_MS = 60_000L

    private fun pendingIntent(context: Context): PendingIntent {
        val intent = Intent(context, WeatherWidgetProvider::class.java).apply {
            action = WeatherWidgetProvider.ACTION_BLINK_TICK
        }
        return PendingIntent.getBroadcast(
            context,
            REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    }

    fun start(context: Context) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        am.setInexactRepeating(
            AlarmManager.ELAPSED_REALTIME,
            SystemClock.elapsedRealtime(),
            TICK_INTERVAL_MS,
            pendingIntent(context),
        )
    }

    fun stop(context: Context) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        am.cancel(pendingIntent(context))
    }
}
