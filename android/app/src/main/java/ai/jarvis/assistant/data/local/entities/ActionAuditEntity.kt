package ai.jarvis.assistant.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "action_audit_logs")
data class ActionAuditEntity(
    @PrimaryKey val id: String,
    val actionName: String,
    val target: String?,
    val executionResult: String?,
    val success: Boolean,
    val timestamp: Long
)
