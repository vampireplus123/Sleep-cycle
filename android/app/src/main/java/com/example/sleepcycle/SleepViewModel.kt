package com.example.sleepcycle

import android.content.SharedPreferences
import android.net.Uri
import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import java.util.*

data class SleepUiState(
    val selectedCycles: Int = 5,
    val calculatedWakeUpTime: String = "",
    val wakeUpTimeMillis: Long = 0L,
    val sleepDuration: Double = 0.0,
    val suggestions: List<SleepSuggestion> = emptyList(),
    val availableSounds: List<AlarmSound> = emptyList(),
    val selectedSound: AlarmSound? = null,
    val isPreviewing: Boolean = false,
    val isAlarmSet: Boolean = false,
    val activeAlarmTime: String? = null,
    val isVibrationEnabled: Boolean = true
)

data class SleepSuggestion(
    val time: String,
    val cycles: Int,
    val duration: Double
)

class SleepViewModel(
    private val soundManager: SoundManager,
    private val alarmScheduler: AlarmScheduler,
    private val sharedPreferences: SharedPreferences
) : ViewModel() {
    private val _uiState = MutableStateFlow(SleepUiState())
    val uiState: StateFlow<SleepUiState> = _uiState.asStateFlow()

    init {
        val sounds = soundManager.getSystemAlarmSounds()
        
        // Restore state
        val savedCycles = sharedPreferences.getInt("cycles", 5)
        val savedSoundUri = sharedPreferences.getString("sound_uri", null)
        val savedAlarmSet = sharedPreferences.getBoolean("alarm_set", false)
        val savedAlarmTime = sharedPreferences.getString("alarm_time", null)
        val savedVibration = sharedPreferences.getBoolean("vibration_enabled", true)

        val initialSound = sounds.find { it.uriString == savedSoundUri } ?: sounds.firstOrNull()

        _uiState.update { 
            it.copy(
                availableSounds = sounds, 
                selectedSound = initialSound,
                selectedCycles = savedCycles,
                isAlarmSet = savedAlarmSet,
                activeAlarmTime = savedAlarmTime,
                isVibrationEnabled = savedVibration
            ) 
        }
        calculateTimes()
    }

    fun updateCycles(cycles: Int) {
        _uiState.update { it.copy(selectedCycles = cycles) }
        sharedPreferences.edit().putInt("cycles", cycles).apply()
        calculateTimes()
    }

    fun toggleVibration(enabled: Boolean) {
        _uiState.update { it.copy(isVibrationEnabled = enabled) }
        sharedPreferences.edit().putBoolean("vibration_enabled", enabled).apply()
    }

    fun selectSound(sound: AlarmSound) {
        stopPreview()
        _uiState.update { it.copy(selectedSound = sound) }
        sharedPreferences.edit().putString("sound_uri", sound.uriString).apply()
    }

    fun toggleAlarm() {
        if (_uiState.value.isAlarmSet) {
            cancelAlarm()
        } else {
            setAlarm()
        }
    }

    private fun setAlarm() {
        val timeMillis = _uiState.value.wakeUpTimeMillis
        val timeStr = _uiState.value.calculatedWakeUpTime
        val soundUri = _uiState.value.selectedSound?.uriString

        alarmScheduler.schedule(timeMillis, soundUri)
        
        _uiState.update { it.copy(isAlarmSet = true, activeAlarmTime = timeStr) }
        
        sharedPreferences.edit()
            .putBoolean("alarm_set", true)
            .putString("alarm_time", timeStr)
            .apply()
    }

    private fun cancelAlarm() {
        alarmScheduler.cancel()
        _uiState.update { it.copy(isAlarmSet = false, activeAlarmTime = null) }
        
        sharedPreferences.edit()
            .putBoolean("alarm_set", false)
            .remove("alarm_time")
            .apply()
    }

    fun addCustomSound(name: String, uri: Uri) {
        val newSound = AlarmSound(name, uri.toString(), isSystem = false)
        _uiState.update { 
            it.copy(
                availableSounds = it.availableSounds + newSound,
                selectedSound = newSound
            )
        }
    }

    fun togglePreview() {
        if (_uiState.value.isPreviewing) {
            stopPreview()
        } else {
            startPreview()
        }
    }

    private fun startPreview() {
        val sound = _uiState.value.selectedSound ?: return
        soundManager.playSound(Uri.parse(sound.uriString))
        _uiState.update { it.copy(isPreviewing = true) }
    }

    fun stopPreview() {
        soundManager.stopSound()
        _uiState.update { it.copy(isPreviewing = false) }
    }

    override fun onCleared() {
        super.onCleared()
        soundManager.stopSound()
    }

    private fun calculateTimes() {
        val now = Calendar.getInstance()
        val cycles = _uiState.value.selectedCycles
        
        val wakeUpTime = now.clone() as Calendar
        wakeUpTime.add(Calendar.MINUTE, cycles * 90)
        
        val duration = (cycles * 90) / 60.0
        
        val suggestions = listOf(4, 5, 6).map { c ->
            val suggestionTime = now.clone() as Calendar
            suggestionTime.add(Calendar.MINUTE, c * 90)
            SleepSuggestion(
                time = TimeUtils.formatTime(suggestionTime.timeInMillis),
                cycles = c,
                duration = (c * 90) / 60.0
            )
        }

        _uiState.update {
            it.copy(
                calculatedWakeUpTime = TimeUtils.formatTime(wakeUpTime.timeInMillis),
                wakeUpTimeMillis = wakeUpTime.timeInMillis,
                sleepDuration = duration,
                suggestions = suggestions
            )
        }
    }
}
