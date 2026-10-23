package ai.jarvis.assistant.domain.model

enum class JarvisMode {
    AUTO,
    ONLINE,
    OFFLINE
}

enum class JarvisState {
    IDLE,
    LISTENING,
    ANALYZING,
    SPEAKING,
    ALERT,
    MUTED
}

data class ChatMessage(
    val id: String = System.currentTimeMillis().toString(),
    val sender: MessageSender,
    val text: String,
    val timestamp: Long = System.currentTimeMillis(),
    val provider: String? = null,
    val isOffline: Boolean = false,
    val action: IntentAction? = null,
    val status: MessageStatus = MessageStatus.SUCCESS
)

enum class MessageSender {
    USER,
    JARVIS,
    SYSTEM
}

enum class MessageStatus {
    SUCCESS,
    WARNING,
    ERROR
}

data class IntentAction(
    val action: String,
    val target: String? = null,
    val params: Map<String, String> = emptyMap(),
    val label: String? = null,
    val requiresConfirmation: Boolean = false,
    val executed: Boolean = false,
    val executionResult: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)

data class ActionResult(
    val success: Boolean,
    val message: String,
    val action: IntentAction
)

data class MemoryItem(
    val id: String,
    val key: String,
    val value: String,
    val category: String = "User Profile",
    val created: Long = System.currentTimeMillis(),
    val updated: Long = System.currentTimeMillis(),
    val confidence: Float = 1.0f
)

data class TaskReminderItem(
    val id: String,
    val title: String,
    val priority: String = "medium",
    val dueTime: String? = null,
    val isCompleted: Boolean = false,
    val created: Long = System.currentTimeMillis()
)

data class ProtocolItem(
    val id: String,
    val code: String,
    val name: String,
    val description: String,
    val isActive: Boolean = false
)

data class HardwareTelemetry(
    val batteryLevel: Int = 100,
    val isCharging: Boolean = false,
    val isOnline: Boolean = true,
    val networkType: String = "Wi-Fi",
    val totalRamGb: Float = 16.0f,
    val freeRamGb: Float = 11.2f,
    val hardwareModel: String = "OnePlus 11R (Snapdragon 8+ Gen 1)",
    val cpuTempCelsius: Float = 36.5f,
    val corePowerPercent: Int = 94
)
