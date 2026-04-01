# Sleep Cycle Manager

This project contains a high-fidelity **Web Application** (React + TypeScript + Tailwind) for live preview and a complete **Android Project Structure** (Kotlin + Jetpack Compose) as requested.

## Project Structure

- `/src`: Contains the React/TypeScript source code for the web-based Sleep Cycle Manager.
- `/android`: Contains the full Android project structure:
  - `AndroidManifest.xml`: Permissions and component declarations.
  - `MainActivity.kt`: UI built with Jetpack Compose.
  - `SleepViewModel.kt`: MVVM architecture for state management.
  - `AlarmReceiver.kt`: BroadcastReceiver for handling alarms.
  - `TimeUtils.kt`: Utility functions for time formatting.

## Features

- **Auto-detect current time**: Automatically calculates wake-up times from "now".
- **Cycle Selector**: Choose between 1 to 8 sleep cycles (90 minutes each).
- **Wake-up Time Calculation**: Displays the optimal time to wake up.
- **Alarm Feature**: 
  - Web: Simulated alarm with modal and visual feedback.
  - Android: Real `AlarmManager` integration with `BroadcastReceiver`.
- **Suggestions**: Shows multiple options (4, 5, 6 cycles) for quick selection.
- **Backwards Mode**: "I want to wake up at..." feature to calculate when to fall asleep.
- **Dark Mode**: Modern, clean, and dark-mode friendly UI.

## How to use the Android code
The files in the `/android` directory can be copied into a standard Android Studio project. Ensure you have the necessary dependencies for Jetpack Compose and Material 3.
