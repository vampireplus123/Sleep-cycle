package com.example.sleepcycle

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import android.os.VibrationEffect
import android.os.Vibrator
import android.widget.Toast

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val soundUriString = intent.getStringExtra("ALARM_SOUND_URI")
        val soundUri = if (soundUriString != null) {
            Uri.parse(soundUriString)
        } else {
            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        }

        // Play sound using SoundManager
        val soundManager = SoundManager(context)
        soundManager.playSound(soundUri, loop = true)

        // Vibrate if enabled
        val sharedPreferences = context.getSharedPreferences("sleep_prefs", Context.MODE_PRIVATE)
        val isVibrationEnabled = sharedPreferences.getBoolean("vibration_enabled", true)

        if (isVibrationEnabled) {
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createOneShot(5000, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                vibrator.vibrate(5000)
            }
        }

        Toast.makeText(context, "Wake up! Sleep cycle complete.", Toast.LENGTH_LONG).show()
    }
}
