package ai.jarvis.assistant.domain.ai

import ai.jarvis.assistant.domain.model.ChatMessage
import ai.jarvis.assistant.domain.model.IntentAction
import ai.jarvis.assistant.domain.model.MemoryItem
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class OfflineCommandEngine : AIProvider {

    override suspend fun processQuery(
        prompt: String,
        history: List<ChatMessage>,
        memories: List<MemoryItem>
    ): AIResponse {
        val text = prompt.trim()
        val lower = text.lowercase(Locale.ROOT)

        // 1. Torch / Flashlight
        if (lower.contains("torch") || lower.contains("flashlight")) {
            val isOff = lower.contains("off") || lower.contains("disable") || lower.contains("extinguish")
            val state = if (isOff) "off" else "on"
            return AIResponse(
                reply = if (isOff) "Extinguishing tactical flashlight, Sir." else "Illuminating tactical flashlight via camera hardware, Sir.",
                action = IntentAction(
                    action = "toggle_torch",
                    params = mapOf("state" to state),
                    label = if (isOff) "Turn Torch Off" else "Turn Torch On"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 2. Camera
        if (lower == "open camera" || lower == "take photo" || lower.contains("open the camera")) {
            return AIResponse(
                reply = "Engaging primary optical sensors. Camera viewfinder active.",
                action = IntentAction(
                    action = "open_camera",
                    label = "Launch Camera"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 3. Screen Summarization & Reading via Accessibility
        if (lower.contains("read this screen") || lower.contains("summarize this screen") || lower.contains("what is on my screen")) {
            return AIResponse(
                reply = "Querying device accessibility layer for visible window buffers, Sir.",
                action = IntentAction(
                    action = "read_screen_content",
                    label = "Extract Screen Buffer"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 4. App Launching Intents
        val appRegex = Regex("(?:open|launch|start|run|pull up)\\s+(?:the\\s+)?(camera|dialer|phone|maps|navigation|gps|settings|calculator|clock|alarm|spotify|music|youtube|whatsapp)", RegexOption.IGNORE_CASE)
        val appMatch = appRegex.find(lower)
        if (appMatch != null) {
            val app = appMatch.groupValues[1].lowercase(Locale.ROOT)
            val target = when (app) {
                "phone" -> "dialer"
                "gps", "navigation" -> "maps"
                "music" -> "spotify"
                else -> app
            }
            return AIResponse(
                reply = "Accessing local Android subroutines, Sir. Launching $app interface immediately.",
                action = IntentAction(
                    action = "open_app",
                    target = target,
                    label = "Open ${app.replaceFirstChar { it.uppercase() }}"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 5. Battery & Power Diagnostics
        if (lower.contains("battery") || lower.contains("power level") || lower.contains("cell status") || lower.contains("power reserve")) {
            return AIResponse(
                reply = "Scanning OnePlus 11R power bus. Retrieving capacity and charging status.",
                action = IntentAction(
                    action = "get_battery",
                    label = "Scan Battery"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 6. Chronometer Timers
        val timerRegex = Regex("(?:set|start|create)(?:\\s+a)?\\s+timer\\s+(?:for\\s+)?(\\d+)\\s*(minute|min|second|sec|hour|hr)s?(?:\\s+(?:for|called|labeled)\\s+(.+))?", RegexOption.IGNORE_CASE)
        val timerMatch = timerRegex.find(lower)
        if (timerMatch != null) {
            val amount = timerMatch.groupValues[1].toIntOrNull() ?: 5
            val unit = timerMatch.groupValues[2].lowercase(Locale.ROOT)
            val label = timerMatch.groupValues.getOrNull(3)?.trim()?.ifEmpty { null } ?: "Tactical Timer"
            val seconds = when {
                unit.startsWith("min") -> amount * 60
                unit.startsWith("hour") || unit.startsWith("hr") -> amount * 3600
                else -> amount
            }
            return AIResponse(
                reply = "Chronometer primed for $amount $unit${if (amount > 1) "s" else ""}. Standing by, Sir.",
                action = IntentAction(
                    action = "set_timer",
                    params = mapOf("seconds" to seconds.toString(), "label" to label),
                    label = "Set $amount $unit Timer"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 7. Alarms
        val alarmRegex = Regex("(?:set|create)(?:\\s+an)?\\s+alarm\\s+(?:for\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?(?:\\s+(?:for|called|labeled)\\s+(.+))?", RegexOption.IGNORE_CASE)
        val alarmMatch = alarmRegex.find(lower)
        if (alarmMatch != null) {
            var hour = alarmMatch.groupValues[1].toIntOrNull() ?: 8
            val minute = alarmMatch.groupValues[2].toIntOrNull() ?: 0
            val meridiem = alarmMatch.groupValues.getOrNull(3)?.lowercase(Locale.ROOT)
            val label = alarmMatch.groupValues.getOrNull(4)?.trim()?.ifEmpty { null } ?: "JARVIS Wake Directive"

            if (meridiem == "pm" && hour < 12) hour += 12
            if (meridiem == "am" && hour == 12) hour = 0

            return AIResponse(
                reply = String.format(Locale.ROOT, "Alarm registered in Android chronometer for %02d:%02d.", hour, minute),
                action = IntentAction(
                    action = "set_alarm",
                    params = mapOf("hour" to hour.toString(), "minute" to minute.toString(), "label" to label),
                    label = String.format(Locale.ROOT, "Set Alarm %02d:%02d", hour, minute)
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 8. Reminders & Tasks
        val taskRegex = Regex("(?:remind me to|add task|create task|new task|note down|add to checklist)\\s+(.+)", RegexOption.IGNORE_CASE)
        val taskMatch = taskRegex.find(lower)
        if (taskMatch != null) {
            val taskTitle = taskMatch.groupValues[1].trim()
            return AIResponse(
                reply = "Directive logged to persistent Room storage: \"$taskTitle\". Securely saved on-device.",
                action = IntentAction(
                    action = "add_task",
                    params = mapOf("title" to taskTitle, "priority" to "medium"),
                    label = "Add Task: ${taskTitle.take(20)}"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 9. Memory Storage ("remember that...", "store memory...")
        val rememberRegex = Regex("(?:remember that|store memory|take note that|keep in mind)\\s+(.+)", RegexOption.IGNORE_CASE)
        val rememberMatch = rememberRegex.find(lower)
        if (rememberMatch != null) {
            val value = rememberMatch.groupValues[1].trim()
            return AIResponse(
                reply = "Committed to encrypted Room memory, Sir. This will persist across device reboots.",
                action = IntentAction(
                    action = "remember",
                    params = mapOf("key" to "User Directive", "value" to value, "category" to "Directive"),
                    label = "Store Long-Term Memory"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 10. Memory Recall
        if (lower.contains("what do you remember") || lower.contains("show memories") || lower.contains("recall")) {
            val count = memories.size
            val summary = memories.take(3).joinToString("; ") { "\"${it.key}: ${it.value}\"" }
            return AIResponse(
                reply = "I currently maintain $count durable records in local storage, Sir. Key entries include: ${summary.ifEmpty { "Default Stark protocols active." }}",
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 11. Phone Dialing
        val dialRegex = Regex("(?:call|dial)\\s+([+0-9\\s\\-]{5,})", RegexOption.IGNORE_CASE)
        val dialMatch = dialRegex.find(lower)
        if (dialMatch != null) {
            val number = dialMatch.groupValues[1].trim()
            return AIResponse(
                reply = "Preparing phone dialer for $number, Sir.",
                action = IntentAction(
                    action = "dial_number",
                    target = number,
                    label = "Dial $number"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 12. Navigation
        val navRegex = Regex("(?:navigate to|directions to|take me to|route to)\\s+(.+)", RegexOption.IGNORE_CASE)
        val navMatch = navRegex.find(lower)
        if (navMatch != null) {
            val dest = navMatch.groupValues[1].trim()
            return AIResponse(
                reply = "Calculating tactical vector to \"$dest\". Launching Android Maps.",
                action = IntentAction(
                    action = "open_navigation",
                    target = dest,
                    label = "Navigate to $dest"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 13. Tactical Protocols
        if (lower.contains("clean slate")) {
            return AIResponse(
                reply = "Clean Slate Protocol engaged, Sir. Purging communication feed and resetting buffers.",
                action = IntentAction(
                    action = "trigger_protocol",
                    target = "CLEAN_SLATE",
                    label = "Clean Slate Protocol"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        if (lower.contains("house party")) {
            return AIResponse(
                reply = "House Party Protocol acknowledged. All auxiliary modules deployed and awaiting commands.",
                action = IntentAction(
                    action = "trigger_protocol",
                    target = "HOUSE_PARTY",
                    label = "House Party Protocol"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        if (lower.contains("stealth")) {
            return AIResponse(
                reply = "Stealth mode toggled. Acoustic dampeners engaged and visual HUD dimmed.",
                action = IntentAction(
                    action = "trigger_protocol",
                    target = "STEALTH",
                    label = "Stealth Protocol"
                ),
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 14. Time and Date
        if (lower.contains("what time") || lower.contains("current time") || lower == "time") {
            val sdf = SimpleDateFormat("hh:mm:ss a", Locale.getDefault())
            return AIResponse(
                reply = "The current time is ${sdf.format(Date())}, Sir.",
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        if (lower.contains("what day") || lower.contains("today's date") || lower.contains("what date")) {
            val sdf = SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.getDefault())
            return AIResponse(
                reply = "Today is ${sdf.format(Date())}, Sir.",
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // 15. OnePlus 11R Host Lore
        if (lower.contains("oneplus") || lower.contains("specs") || lower.contains("hardware")) {
            return AIResponse(
                reply = "Host platform: OnePlus 11R. Qualcomm Snapdragon 8+ Gen 1, 16GB LPDDR5X RAM, 100W SuperVOOC power system. Operating at optimal efficiency.",
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        if (lower.contains("who are you") || lower.contains("what are you") || lower.contains("your name")) {
            return AIResponse(
                reply = "I am J.A.R.V.I.S. — Just A Rather Very Intelligent System. Your autonomous personal assistant, configured for local phone operations, memory retention, and tactical coordination.",
                provider = "Local Tactical Core (On-Device)",
                isOffline = true
            )
        }

        // Default offline response
        return AIResponse(
            reply = "I have processed your directive through my on-device offline reasoning core, Sir. Local device controls, alarms, timers, notes, and memories are fully operational. For unrestricted conversational synthesis, switch to Online Mode.",
            provider = "Local Cognitive Engine (On-Device)",
            isOffline = true
        )
    }
}
