package ai.jarvis.assistant.data.preferences

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.floatPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import ai.jarvis.assistant.domain.model.JarvisMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "jarvis_preferences")

class JarvisPreferences(private val context: Context) {

    companion object {
        val KEY_MODE = stringPreferencesKey("jarvis_mode")
        val KEY_SPEECH_RATE = floatPreferencesKey("speech_rate")
        val KEY_SPEECH_PITCH = floatPreferencesKey("speech_pitch")
        val KEY_IS_MUTED = booleanPreferencesKey("is_muted")
        val KEY_USER_MONIKER = stringPreferencesKey("user_moniker")
        val KEY_ACTIVE_PROTOCOLS = stringSetPreferencesKey("active_protocols")
        val KEY_ONLINE_BACKEND_URL = stringPreferencesKey("online_backend_url")
    }

    val modeFlow: Flow<JarvisMode> = context.dataStore.data.map { prefs ->
        val modeStr = prefs[KEY_MODE] ?: JarvisMode.AUTO.name
        try {
            JarvisMode.valueOf(modeStr)
        } catch (e: Exception) {
            JarvisMode.AUTO
        }
    }

    val speechRateFlow: Flow<Float> = context.dataStore.data.map { prefs ->
        prefs[KEY_SPEECH_RATE] ?: 1.05f
    }

    val speechPitchFlow: Flow<Float> = context.dataStore.data.map { prefs ->
        prefs[KEY_SPEECH_PITCH] ?: 0.95f
    }

    val isMutedFlow: Flow<Boolean> = context.dataStore.data.map { prefs ->
        prefs[KEY_IS_MUTED] ?: false
    }

    val userMonikerFlow: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_USER_MONIKER] ?: "Sir"
    }

    val activeProtocolsFlow: Flow<Set<String>> = context.dataStore.data.map { prefs ->
        prefs[KEY_ACTIVE_PROTOCOLS] ?: setOf("SENTRY")
    }

    val backendUrlFlow: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[KEY_ONLINE_BACKEND_URL] ?: ""
    }

    suspend fun setMode(mode: JarvisMode) {
        context.dataStore.edit { prefs ->
            prefs[KEY_MODE] = mode.name
        }
    }

    suspend fun setSpeechSettings(rate: Float, pitch: Float) {
        context.dataStore.edit { prefs ->
            prefs[KEY_SPEECH_RATE] = rate.coerceIn(0.5f, 2.0f)
            prefs[KEY_SPEECH_PITCH] = pitch.coerceIn(0.5f, 2.0f)
        }
    }

    suspend fun setMuted(muted: Boolean) {
        context.dataStore.edit { prefs ->
            prefs[KEY_IS_MUTED] = muted
        }
    }

    suspend fun setUserMoniker(moniker: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_USER_MONIKER] = moniker.trim()
        }
    }

    suspend fun toggleProtocol(protocolCode: String, active: Boolean) {
        context.dataStore.edit { prefs ->
            val current = prefs[KEY_ACTIVE_PROTOCOLS]?.toMutableSet() ?: mutableSetOf("SENTRY")
            if (active) {
                current.add(protocolCode)
            } else {
                current.remove(protocolCode)
            }
            prefs[KEY_ACTIVE_PROTOCOLS] = current
        }
    }

    suspend fun setBackendUrl(url: String) {
        context.dataStore.edit { prefs ->
            prefs[KEY_ONLINE_BACKEND_URL] = url.trim()
        }
    }
}
