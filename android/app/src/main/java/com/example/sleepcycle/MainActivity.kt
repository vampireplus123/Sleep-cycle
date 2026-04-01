package com.example.sleepcycle

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.OpenableColumns
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.example.sleepcycle.ui.theme.SleepCycleTheme
import java.util.*

class MainActivity : ComponentActivity() {
    private val viewModel: SleepViewModel by viewModels {
        object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                val soundManager = SoundManager(applicationContext)
                val alarmScheduler = AlarmScheduler(applicationContext)
                val sharedPreferences = getSharedPreferences("sleep_prefs", Context.MODE_PRIVATE)
                return SleepViewModel(soundManager, alarmScheduler, sharedPreferences) as T
            }
        }
    }

    private val pickAudioLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let {
            contentResolver.takePersistableUriPermission(it, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            val name = getFileName(it) ?: "Custom Sound"
            viewModel.addCustomSound(name, it)
        }
    }

    private fun getFileName(uri: Uri): String? {
        var result: String? = null
        if (uri.scheme == "content") {
            val cursor = contentResolver.query(uri, null, null, null, null)
            try {
                if (cursor != null && cursor.moveToFirst()) {
                    val index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                    if (index != -1) {
                        result = cursor.getString(index)
                    }
                }
            } finally {
                cursor?.close()
            }
        }
        if (result == null) {
            result = uri.path
            val cut = result?.lastIndexOf('/')
            if (cut != -1) {
                result = result?.substring(cut!! + 1)
            }
        }
        return result
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SleepCycleTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    SleepCycleScreen(
                        viewModel = viewModel,
                        onAddCustomSound = {
                            pickAudioLauncher.launch("audio/*")
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun SleepCycleScreen(
    viewModel: SleepViewModel,
    onAddCustomSound: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showSoundMenu by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Text(
            text = "Sleep Cycle Manager",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(text = "Optimal Wake-up Time", style = MaterialTheme.typography.labelLarge)
                Text(
                    text = uiState.calculatedWakeUpTime,
                    style = MaterialTheme.typography.displayLarge,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(text = "Sleep Cycles: ${uiState.selectedCycles}")
            Slider(
                value = uiState.selectedCycles.toFloat(),
                onValueChange = { viewModel.updateCycles(it.toInt()) },
                valueRange = 1f..8f,
                steps = 6,
                modifier = Modifier.weight(1f).padding(horizontal = 16.dp)
            )
        }

        // Sound Selection Section
        Column(modifier = Modifier.fillMaxWidth()) {
            Text(text = "Alarm Sound", style = MaterialTheme.typography.titleSmall)
            Spacer(modifier = Modifier.height(8.dp))
            Box(modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(
                    onClick = { showSoundMenu = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(uiState.selectedSound?.name ?: "Select Sound")
                }
                DropdownMenu(
                    expanded = showSoundMenu,
                    onDismissRequest = { showSoundMenu = false },
                    modifier = Modifier.fillMaxWidth(0.8f)
                ) {
                    uiState.availableSounds.forEach { sound ->
                        DropdownMenuItem(
                            text = { Text(sound.name) },
                            onClick = {
                                viewModel.selectSound(sound)
                                showSoundMenu = false
                            }
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedButton(
                    onClick = { viewModel.togglePreview() },
                    modifier = Modifier.weight(1f),
                    colors = if (uiState.isPreviewing) ButtonDefaults.outlinedButtonColors(contentColor = Color.Red) else ButtonDefaults.outlinedButtonColors()
                ) {
                    Icon(
                        imageVector = if (uiState.isPreviewing) Icons.Default.Stop else Icons.Default.PlayArrow,
                        contentDescription = null
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (uiState.isPreviewing) "STOP" else "PREVIEW")
                }
                OutlinedButton(
                    onClick = onAddCustomSound,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(imageVector = Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("ADD CUSTOM")
                }
            }
        }

        Text(
            text = "Duration: ${uiState.sleepDuration} hours",
            style = MaterialTheme.typography.bodyLarge,
            color = Color.Gray
        )

        // Vibration Toggle
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = if (uiState.isVibrationEnabled) Icons.Default.Vibration else Icons.Default.DoNotDisturbOn,
                    contentDescription = null,
                    tint = if (uiState.isVibrationEnabled) MaterialTheme.colorScheme.primary else Color.Gray
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(text = "Vibration", style = MaterialTheme.typography.titleMedium)
                    Text(
                        text = if (uiState.isVibrationEnabled) "Enabled" else "Disabled",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.Gray
                    )
                }
            }
            Switch(
                checked = uiState.isVibrationEnabled,
                onCheckedChange = { viewModel.toggleVibration(it) }
            )
        }

        // Action Button Section
        Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (uiState.isAlarmSet) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5E9))
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(imageVector = Icons.Default.NotificationsActive, contentDescription = null, tint = Color(0xFF2E7D32))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Alarm is set for ${uiState.activeAlarmTime}",
                            color = Color(0xFF2E7D32),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            Button(
                onClick = { viewModel.toggleAlarm() },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                shape = MaterialTheme.shapes.medium,
                colors = if (uiState.isAlarmSet) ButtonDefaults.buttonColors(containerColor = Color.Red) else ButtonDefaults.buttonColors()
            ) {
                Icon(
                    imageVector = if (uiState.isAlarmSet) Icons.Default.AlarmOff else Icons.Default.Alarm,
                    contentDescription = null
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (uiState.isAlarmSet) "CANCEL ALARM" else "SET ALARM",
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Other Suggestions",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.align(Alignment.Start)
        )

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            uiState.suggestions.forEach { suggestion ->
                SuggestionItem(suggestion) {
                    viewModel.updateCycles(suggestion.cycles)
                }
            }
        }
    }
}

@Composable
fun SuggestionItem(suggestion: SleepSuggestion, onClick: () -> Unit) {
    OutlinedCard(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = suggestion.time, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text(text = "${suggestion.cycles} Cycles", style = MaterialTheme.typography.bodySmall)
            }
            Text(text = "${suggestion.duration}h", color = MaterialTheme.colorScheme.primary)
        }
    }
}
