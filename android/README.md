# J.A.R.V.I.S. — Native Android Autonomous Assistant

An installable, native Android personal assistant inspired by the cinematic experience of Iron Man, built with **Kotlin**, **Jetpack Compose**, **Room Database**, **DataStore Preferences**, **Android SpeechRecognizer**, **TextToSpeech**, **CameraManager**, and **Android Intent Automation**.

Specifically optimized for high-performance Android devices such as the **OnePlus 11R (Snapdragon 8+ Gen 1, 16GB LPDDR5X RAM)**.

---

## 1. Native Architecture Overview

- **Language & UI**: 100% Kotlin with modern Jetpack Compose & Material 3. Single-Activity Architecture (`MainActivity`).
- **Database & Persistence**: Android Room (`JarvisDatabase`) with 4 entities:
  - `ChatMessageEntity`: Full conversation stream with timestamps, status, and action executions.
  - `MemoryEntity`: Long-term durable encrypted memories (Host specs, directives, preferences).
  - `TaskReminderEntity`: Tasks and alarms schedule.
  - `ActionAuditEntity`: Full audit trail of dispatched phone operations.
- **Preferences**: Jetpack DataStore (`JarvisPreferences`) for mode selection, speech rate/pitch, protocols, and moniker.
- **Voice-First Push-to-Talk**:
  - `SpeechRecognitionManager`: Android `SpeechRecognizer` with `RecognitionListener`, interim transcripts, and "JARVIS stop" interrupt detection.
  - `TextToSpeechManager`: Android `TextToSpeech` with British accent tuning, custom pitch/rate, and instant cancellation.
- **Phone Automation (`ActionRegistry`)**:
  - Flashlight / Torch: Direct hardware toggle via `CameraManager.setTorchMode()`.
  - Camera: Native `MediaStore.ACTION_IMAGE_CAPTURE`.
  - App Launching: Dynamic query & launch via `PackageManager` + standard intents for Camera, Phone/Dialer, Maps, Calculator, Clock/Alarms, YouTube, Spotify, WhatsApp, Settings.
  - Alarms & Timers: `AlarmClock.ACTION_SET_ALARM` and `ACTION_SET_TIMER`.
  - Dialer: `Intent.ACTION_DIAL`.
  - SMS: `Intent.ACTION_SENDTO` (with explicit confirmation).
  - Navigation: `Intent.ACTION_VIEW` with `geo:0,0?q=...`.
  - Battery & Hardware Telemetry: `BatteryManager` and `ActivityManager.MemoryInfo`.
- **Accessibility Service (`JarvisAccessibilityService`)**:
  - Transparent, user-controlled screen awareness.
  - Reads active window buffers for "Read this screen" and "Summarize this screen" directives upon explicit user request.
- **AI Reasoning**:
  - `OfflineCommandEngine`: Real on-device deterministic NLU with regex and semantic extraction for all phone controls.
  - `OnlineGeminiProvider`: Connects to Gemini cloud reasoning for open-ended queries.
  - `HybridAIService`: Automatically routes between on-device offline tactical core and cloud reasoning, with instant fallback when disconnected.

---

## 2. OnePlus 11R Installation & Build Guide

### Prerequisites
- Android Studio Ladybug / Meerkat (or newer)
- Android SDK 35 (compileSdk 35, minSdk 26)
- JDK 17 or JDK 21

### Building the APK
From the `android/` directory:
```bash
# Clean and assemble debug APK
./gradlew assembleDebug

# Output APK location:
# app/build/outputs/apk/debug/app-debug.apk
```

### Installing on OnePlus 11R
1. Enable **Developer Options** on your OnePlus 11R:
   - Go to `Settings -> About device -> Version -> Tap Build number 7 times`.
2. Enable **USB Debugging** in `Settings -> Additional settings -> Developer options`.
3. Connect your OnePlus 11R via USB-C.
4. Run:
```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

---

## 3. Granting Permissions on OnePlus 11R

1. **Microphone (Mandatory for Voice)**:
   - Tap the central Arc Reactor or bottom Push-to-Talk button.
   - When the system dialog appears, select **"While using the app"**.
2. **Flashlight & Camera**:
   - Camera permission is requested when launching the camera or flashlight toggle.
3. **Accessibility Service (Optional for Screen Summarization)**:
   - Go to `Settings -> Additional settings -> Accessibility -> Downloaded apps -> JARVIS Screen Awareness & Assist`.
   - Toggle to **Enable**.

---

## 4. Voice Commands Reference

| Directive | Action Dispatched |
|---|---|
| *"Turn on the torch"* | Direct hardware toggle via `CameraManager` |
| *"Extinguish flashlight"* | Turns off torch |
| *"Open camera"* | Launches Android Camera viewfinder |
| *"Launch YouTube"* | Opens YouTube via `PackageManager` |
| *"Set an alarm for 6:30 AM"* | Dispatches `AlarmClock.ACTION_SET_ALARM` |
| *"Start a 10 minute timer"* | Dispatches `AlarmClock.ACTION_SET_TIMER` |
| *"Remind me to call Tony at 4 PM"* | Saves directive in Room database |
| *"Remember that the access code is 4096"* | Stores durable record in `memories` table |
| *"What do you remember?"* | Queries and summarizes stored memories |
| *"What time is it?"* | Speaks current localized time |
| *"Battery status"* | Reports capacity & SuperVOOC charging status |
| *"Summarize this screen"* | Extracts visible text via Accessibility Service |
| *"JARVIS stop"* | Immediately terminates speech and active tasks |
| *"Engage Clean Slate Protocol"* | Purges conversation cache |
| *"Engage Stealth Protocol"* | Mutes Text-To-Speech audio |
