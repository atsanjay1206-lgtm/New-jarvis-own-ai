package ai.jarvis.assistant

import android.app.Application
import ai.jarvis.assistant.data.local.JarvisDatabase
import ai.jarvis.assistant.data.preferences.JarvisPreferences
import ai.jarvis.assistant.domain.actions.ActionRegistry
import ai.jarvis.assistant.domain.diagnostics.DeviceCapabilityManager

class JarvisApp : Application() {

    lateinit var database: JarvisDatabase
        private set

    lateinit var preferences: JarvisPreferences
        private set

    lateinit var actionRegistry: ActionRegistry
        private set

    lateinit var capabilityManager: DeviceCapabilityManager
        private set

    override fun onCreate() {
        super.onCreate()
        instance = this
        database = JarvisDatabase.getInstance(this)
        preferences = JarvisPreferences(this)
        capabilityManager = DeviceCapabilityManager(this)
        actionRegistry = ActionRegistry(this, database, capabilityManager)
    }

    companion object {
        lateinit var instance: JarvisApp
            private set
    }
}
