package ai.jarvis.assistant.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import ai.jarvis.assistant.data.local.dao.ActionAuditDao
import ai.jarvis.assistant.data.local.dao.ChatDao
import ai.jarvis.assistant.data.local.dao.MemoryDao
import ai.jarvis.assistant.data.local.dao.TaskReminderDao
import ai.jarvis.assistant.data.local.entities.ActionAuditEntity
import ai.jarvis.assistant.data.local.entities.ChatMessageEntity
import ai.jarvis.assistant.data.local.entities.MemoryEntity
import ai.jarvis.assistant.data.local.entities.TaskReminderEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        ChatMessageEntity::class,
        MemoryEntity::class,
        TaskReminderEntity::class,
        ActionAuditEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class JarvisDatabase : RoomDatabase() {
    abstract fun chatDao(): ChatDao
    abstract fun memoryDao(): MemoryDao
    abstract fun taskReminderDao(): TaskReminderDao
    abstract fun actionAuditDao(): ActionAuditDao

    companion object {
        @Volatile
        private var INSTANCE: JarvisDatabase? = null

        fun getInstance(context: Context): JarvisDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    JarvisDatabase::class.java,
                    "jarvis_core.db"
                )
                .addCallback(object : Callback() {
                    override fun onCreate(db: SupportSQLiteDatabase) {
                        super.onCreate(db)
                        CoroutineScope(Dispatchers.IO).launch {
                            seedDefaultMemories(getInstance(context).memoryDao())
                        }
                    }
                })
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }

        private suspend fun seedDefaultMemories(memoryDao: MemoryDao) {
            val now = System.currentTimeMillis()
            val defaults = listOf(
                MemoryEntity(
                    id = "mem_identity",
                    key = "Host Identity",
                    value = "Addressed respectfully as Sir / Commander. Operating under Stark Industries protocol Mk LXXXV.",
                    category = "User Profile",
                    created = now,
                    updated = now,
                    confidence = 1.0f
                ),
                MemoryEntity(
                    id = "mem_hardware",
                    key = "Primary Hardware",
                    value = "OnePlus 11R running Snapdragon 8+ Gen 1, 16GB LPDDR5X RAM, 100W SuperVOOC power bus.",
                    category = "Device Specs",
                    created = now,
                    updated = now,
                    confidence = 1.0f
                ),
                MemoryEntity(
                    id = "mem_directive",
                    key = "Operational Directive",
                    value = "Prioritize on-device offline autonomy, execute phone controls with safety validation, maintain low power consumption.",
                    category = "Directive",
                    created = now,
                    updated = now,
                    confidence = 0.95f
                ),
                MemoryEntity(
                    id = "mem_cadence",
                    key = "Speech Persona",
                    value = "British English cadence, refined, subtle wit, concise, action-oriented, and unfailingly loyal.",
                    category = "Preference",
                    created = now,
                    updated = now,
                    confidence = 0.9f
                )
            )
            defaults.forEach { memoryDao.insertMemory(it) }
        }
    }
}
