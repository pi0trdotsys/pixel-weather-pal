package dev.pi0trdotsys.homebrewweather.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Re-enqueues the periodic widget refresh work after a device reboot. Also
 * re-registers the blink cursor's AlarmManager alarm — unlike WorkManager's
 * periodic work (which survives reboot on its own), AlarmManager alarms are
 * cleared by the system on every reboot and must be re-armed explicitly.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            if (WeatherWidgetProvider.allWidgetIds(context).isNotEmpty()) {
                WeatherWorker.enqueuePeriodic(context)
                BlinkAlarm.start(context)
            }
        }
    }
}
