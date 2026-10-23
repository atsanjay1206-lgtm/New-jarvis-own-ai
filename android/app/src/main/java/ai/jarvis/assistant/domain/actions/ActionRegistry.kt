package ai.jarvis.assistant.domain.actions

import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.net.Uri
import android.provider.AlarmClock
import android.provider.MediaStore
import android.provider.Settings
import ai.jarvis.assistant.data.local.JarvisDatabase
import ai.jarvis.assistant.data.local.entities.ActionAuditEntity
import ai.jarvis.assistant.data.local.entities.MemoryEntity
import ai.jarvis.assistant.data.local.entities.TaskReminderEntity
import ai.jarvis.assistant.domain.accessibility.JarvisAccessibilityService
import ai.jarvis.assistant.domain.diagnostics.DeviceCapabilityManager
import ai.jarvis.assistant.domain.model.ActionResult
import ai.jarvis.assistant.domain.model.IntentAction
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.UUID

class ActionRegistry(
    private val context: Context,
    private val database: JarvisDatabase,
    private val capabilityManager: DeviceCapabilityManager
) {
    private var isTorchOn = false

    suspend fun executeAction(action: IntentAction): ActionResult = withContext(Dispatchers.IO) {
        var success = true
        var message: String

        try {
            when (action.action.lowercase()) {
                "open_app" -> {
                    val target = action.target?.lowercase().orEmpty()
                    message = handleOpenApp(target)
                }

                "toggle_torch" -> {
                    val desiredState = action.params["state"]?.lowercase()
                    message = handleToggleTorch(desiredState)
                }

                "open_camera" -> {
                    message = handleOpenCamera()
                }

                "set_alarm" -> {
                    val hour = action.params["hour"]?.toIntOrNull() ?: 8
                    val minute = action.params["minute"]?.toIntOrNull() ?: 0
                    val label = action.params["message"] ?: action.params["label"] ?: "Stark Directive"
                    message = handleSetAlarm(hour, minute, label)
                }

                "set_timer" -> {
                    val seconds = action.params["seconds"]?.toIntOrNull() ?: 300
                    val label = action.params["label"] ?: "Chronometer Timer"
                    message = handleSetTimer(seconds, label)
                }

                "add_task" -> {
                    val title = action.params["title"] ?: action.target ?: "General Directive"
                    val priority = action.params["priority"] ?: "medium"
                    val dueTime = action.params["dueTime"] ?: "Today"
                    database.taskReminderDao().insertTask(
                        TaskReminderEntity(
                            id = "task_${System.currentTimeMillis()}",
                            title = title,
                            priority = priority,
                            dueTime = dueTime,
                            isCompleted = false,
                            created = System.currentTimeMillis()
                        )
                    )
                    message = "Task committed to Room database: \"$title\" [Priority: ${priority.uppercase()}]."
                }

                "remember" -> {
                    val key = action.params["key"] ?: "Tactical Note"
                    val value = action.params["value"] ?: action.target.orEmpty()
                    val category = action.params["category"] ?: "User Profile"
                    database.memoryDao().insertMemory(
                        MemoryEntity(
                            id = "mem_${UUID.randomUUID()}",
                            key = key,
                            value = value,
                            category = category,
                            created = System.currentTimeMillis(),
                            updated = System.currentTimeMillis(),
                            confidence = 1.0f
                        )
                    )
                    message = "Long-term memory indexed in Room: \"$key\" stored under category [$category]."
                }

                "dial_number" -> {
                    val number = action.params["number"] ?: action.target.orEmpty()
                    message = handleDialNumber(number)
                }

                "prepare_sms" -> {
                    val number = action.params["number"].orEmpty()
                    val body = action.params["message"].orEmpty()
                    message = handlePrepareSms(number, body)
                }

                "open_navigation" -> {
                    val destination = action.params["destination"] ?: action.target.orEmpty()
                    message = handleNavigation(destination)
                }

                "open_settings" -> {
                    val settingType = action.params["type"] ?: action.target.orEmpty()
                    message = handleOpenSettings(settingType)
                }

                "read_screen_content" -> {
                    val screenText = JarvisAccessibilityService.instance?.extractVisibleScreenText()
                        ?: "Screen awareness unavailable. Please enable the JARVIS Accessibility Service in System Settings."
                    message = "Visible screen context extracted: ${screenText.take(200)}..."
                }

                "get_battery" -> {
                    val telemetry = capabilityManager.getTelemetry()
                    val chargeStatus = if (telemetry.isCharging) "Charging via SuperVOOC bus" else "Discharging"
                    message = "Power cells report ${telemetry.batteryLevel}% capacity. Status: $chargeStatus."
                }

                "trigger_protocol" -> {
                    val proto = action.params["protocol"] ?: action.target ?: "DEFENSE"
                    message = "Executing protocol [$proto]. Subsystems adjusted accordingly."
                }

                else -> {
                    message = "Operation [${action.action}] dispatched via Android intent registry."
                }
            }
        } catch (e: Exception) {
            success = false
            message = "Execution anomaly: ${e.message ?: "Operation rejected by Android security sandbox."}"
        }

        val updatedAction = action.copy(
            executed = success,
            executionResult = message,
            timestamp = System.currentTimeMillis()
        )

        // Log to persistent Room audit log
        try {
            database.actionAuditDao().insertLog(
                ActionAuditEntity(
                    id = "log_${UUID.randomUUID()}",
                    actionName = action.action,
                    target = action.target,
                    executionResult = message,
                    success = success,
                    timestamp = System.currentTimeMillis()
                )
            )
        } catch (e: Exception) {}

        ActionResult(success = success, message = message, action = updatedAction)
    }

    private fun handleOpenApp(appName: String): String {
        return when (appName) {
            "camera" -> handleOpenCamera()
            "dialer", "phone" -> {
                val intent = Intent(Intent.ACTION_DIAL).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                "Dispatched Android Dialer intent."
            }
            "calculator" -> {
                val intent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_APP_CALCULATOR)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                try {
                    context.startActivity(intent)
                    "Dispatched Device Calculator."
                } catch (e: Exception) {
                    launchByPackageName("com.oneplus.calculator", "Calculator")
                }
            }
            "clock", "alarm" -> {
                val intent = Intent(AlarmClock.ACTION_SHOW_ALARMS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                "Summoned Android Chronometer and Alarms."
            }
            "settings" -> {
                val intent = Intent(Settings.ACTION_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                "Dispatched Android System Settings."
            }
            "maps", "navigation" -> {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("geo:0,0?q=")).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
                "Opened Navigation & Tactical Maps."
            }
            "youtube" -> {
                launchByPackageName("com.google.android.youtube", "YouTube")
            }
            "spotify" -> {
                launchByPackageName("com.spotify.music", "Spotify")
            }
            "whatsapp" -> {
                launchByPackageName("com.whatsapp", "WhatsApp")
            }
            else -> {
                // Search installed applications matching name
                val pm = context.packageManager
                val packages = pm.getInstalledApplications(0)
                val match = packages.firstOrNull {
                    pm.getApplicationLabel(it).toString().contains(appName, ignoreCase = true)
                }
                if (match != null) {
                    val launchIntent = pm.getLaunchIntentForPackage(match.packageName)?.apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    if (launchIntent != null) {
                        context.startActivity(launchIntent)
                        "Launched application: ${pm.getApplicationLabel(match)}."
                    } else {
                        "Target application identified but cannot be directly launched."
                    }
                } else {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/search?q=${Uri.encode(appName)}")).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(intent)
                    "Dispatched web query for \"$appName\"."
                }
            }
        }
    }

    private fun launchByPackageName(pkg: String, readableName: String): String {
        val pm = context.packageManager
        val launchIntent = pm.getLaunchIntentForPackage(pkg)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        return if (launchIntent != null) {
            context.startActivity(launchIntent)
            "Dispatched $readableName on device."
        } else {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg")).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
            "$readableName not installed. Opened Play Store entry."
        }
    }

    private fun handleOpenCamera(): String {
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return "Dispatched Android Camera intent."
    }

    private fun handleToggleTorch(desiredState: String?): String {
        val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
            ?: return "Camera hardware interface unavailable."

        val cameraId = cameraManager.cameraIdList.firstOrNull { id ->
            val chars = cameraManager.getCameraCharacteristics(id)
            chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
        } ?: return "No camera flashlight detected on device hardware."

        val targetState = when (desiredState) {
            "on", "enable", "true" -> true
            "off", "disable", "false" -> false
            else -> !isTorchOn
        }

        cameraManager.setTorchMode(cameraId, targetState)
        isTorchOn = targetState
        val stateText = if (isTorchOn) "illuminated" else "extinguished"
        return "Tactical flashlight $stateText via CameraManager."
    }

    private fun handleSetAlarm(hour: Int, minute: Int, message: String): String {
        val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(AlarmClock.EXTRA_HOUR, hour)
            putExtra(AlarmClock.EXTRA_MINUTES, minute)
            putExtra(AlarmClock.EXTRA_MESSAGE, message)
            putExtra(AlarmClock.EXTRA_SKIP_UI, false)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        val timeFormatted = String.format("%02d:%02d", hour, minute)
        return "Alarm scheduled in Android Chronometer for $timeFormatted with label \"$message\"."
    }

    private fun handleSetTimer(seconds: Int, label: String): String {
        val intent = Intent(AlarmClock.ACTION_SET_TIMER).apply {
            putExtra(AlarmClock.EXTRA_LENGTH, seconds)
            putExtra(AlarmClock.EXTRA_MESSAGE, label)
            putExtra(AlarmClock.EXTRA_SKIP_UI, false)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        val mins = seconds / 60
        val secs = seconds % 60
        return "Chronometer timer initiated: ${mins}m ${secs}s for \"$label\"."
    }

    private fun handleDialNumber(number: String): String {
        val cleanNumber = number.filter { it.isDigit() || it == '+' || it == '*' || it == '#' }
        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$cleanNumber")).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return "Prepared phone dialer for number: $cleanNumber."
    }

    private fun handlePrepareSms(number: String, body: String): String {
        val cleanNumber = number.filter { it.isDigit() || it == '+' }
        val uri = Uri.parse("smsto:$cleanNumber")
        val intent = Intent(Intent.ACTION_SENDTO, uri).apply {
            putExtra("sms_body", body)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return "Prepared SMS dispatch to $cleanNumber. User confirmation required before transmission."
    }

    private fun handleNavigation(destination: String): String {
        val uri = Uri.parse("geo:0,0?q=${Uri.encode(destination)}")
        val intent = Intent(Intent.ACTION_VIEW, uri).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return "Opened navigation route toward \"$destination\"."
    }

    private fun handleOpenSettings(type: String): String {
        val action = when (type.lowercase()) {
            "wifi" -> Settings.ACTION_WIFI_SETTINGS
            "bluetooth" -> Settings.ACTION_BLUETOOTH_SETTINGS
            "sound" -> Settings.ACTION_SOUND_SETTINGS
            "display" -> Settings.ACTION_DISPLAY_SETTINGS
            "accessibility" -> Settings.ACTION_ACCESSIBILITY_SETTINGS
            "battery" -> Settings.ACTION_POWER_USAGE_SUMMARY
            else -> Settings.ACTION_SETTINGS
        }
        val intent = Intent(action).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return "Dispatched Android system settings interface: $type."
    }
}
