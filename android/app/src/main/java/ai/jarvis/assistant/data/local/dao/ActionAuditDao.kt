package ai.jarvis.assistant.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import ai.jarvis.assistant.data.local.entities.ActionAuditEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ActionAuditDao {
    @Query("SELECT * FROM action_audit_logs ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentAuditLogs(limit: Int = 100): Flow<List<ActionAuditEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: ActionAuditEntity)

    @Query("DELETE FROM action_audit_logs")
    suspend fun clearLogs()
}
