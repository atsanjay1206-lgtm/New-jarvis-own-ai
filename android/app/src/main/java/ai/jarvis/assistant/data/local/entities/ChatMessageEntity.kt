package ai.jarvis.assistant.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "chat_messages")
data class ChatMessageEntity(
    @PrimaryKey val id: String,
    val sender: String, // "USER", "JARVIS", "SYSTEM"
    val text: String,
    val timestamp: Long,
    val provider: String?,
    val isOffline: Boolean,
    val actionJson: String?,
    val status: String
)
