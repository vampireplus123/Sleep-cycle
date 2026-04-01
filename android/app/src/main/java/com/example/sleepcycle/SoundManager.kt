package com.example.sleepcycle

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.net.Uri

class SoundManager(private val context: Context) {
    private var mediaPlayer: MediaPlayer? = null

    fun playSound(uri: Uri, loop: Boolean = false) {
        stopSound()
        mediaPlayer = MediaPlayer().apply {
            setDataSource(context, uri)
            setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            isLooping = loop
            prepare()
            start()
        }
    }

    fun stopSound() {
        mediaPlayer?.stop()
        mediaPlayer?.release()
        mediaPlayer = null
    }

    fun getSystemAlarmSounds(): List<AlarmSound> {
        val manager = RingtoneManager(context)
        manager.setType(RingtoneManager.TYPE_ALARM)
        val cursor = manager.cursor
        val list = mutableListOf<AlarmSound>()
        while (cursor.moveToNext()) {
            val title = cursor.getString(RingtoneManager.TITLE_COLUMN_INDEX)
            val uri = manager.getRingtoneUri(cursor.position)
            list.add(AlarmSound(title, uri.toString(), isSystem = true))
        }
        return list
    }
}

data class AlarmSound(
    val name: String,
    val uriString: String,
    val isSystem: Boolean = true
)
