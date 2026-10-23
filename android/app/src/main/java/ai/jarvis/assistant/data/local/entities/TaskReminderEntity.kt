package ai.jarvis.assistant.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks_reminders")
data class TaskReminderEntity(
    @PrimaryKey val id: String,
    val title: String,
    val priority: String,
    val dueTime: String?,
    val isCompleted: Boolean,
    val created: Long
)
