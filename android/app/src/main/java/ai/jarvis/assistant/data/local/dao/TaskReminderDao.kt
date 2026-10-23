package ai.jarvis.assistant.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import ai.jarvis.assistant.data.local.entities.TaskReminderEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TaskReminderDao {
    @Query("SELECT * FROM tasks_reminders ORDER BY created DESC")
    fun getAllTasksFlow(): Flow<List<TaskReminderEntity>>

    @Query("SELECT * FROM tasks_reminders WHERE isCompleted = 0 ORDER BY created DESC")
    suspend fun getPendingTasks(): List<TaskReminderEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskReminderEntity)

    @Query("UPDATE tasks_reminders SET isCompleted = :completed WHERE id = :id")
    suspend fun updateTaskStatus(id: String, completed: Boolean)

    @Query("DELETE FROM tasks_reminders WHERE id = :id")
    suspend fun deleteTask(id: String)
}
