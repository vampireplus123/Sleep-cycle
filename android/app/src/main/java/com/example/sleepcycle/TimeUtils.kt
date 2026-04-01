package com.example.sleepcycle

import java.text.SimpleDateFormat
import java.util.*

object TimeUtils {
    fun formatTime(timeInMillis: Long): String {
        val sdf = SimpleDateFormat("HH:mm", Locale.getDefault())
        return sdf.format(Date(timeInMillis))
    }
}
