package ai.jarvis.assistant.domain.ai

import ai.jarvis.assistant.domain.diagnostics.DeviceCapabilityManager
import ai.jarvis.assistant.domain.model.ChatMessage
import ai.jarvis.assistant.domain.model.JarvisMode
import ai.jarvis.assistant.domain.model.MemoryItem

class HybridAIService(
    private val capabilityManager: DeviceCapabilityManager,
    private val offlineEngine: OfflineCommandEngine,
    private var onlineProvider: OnlineGeminiProvider
) {

    fun updateBackendUrl(url: String) {
        onlineProvider = OnlineGeminiProvider(url)
    }

    suspend fun processQuery(
        prompt: String,
        mode: JarvisMode,
        history: List<ChatMessage>,
        memories: List<MemoryItem>
    ): AIResponse {
        val isNetworkAvailable = capabilityManager.getTelemetry().isOnline

        val shouldUseOfflineDirectly = mode == JarvisMode.OFFLINE ||
                (mode == JarvisMode.AUTO && !isNetworkAvailable)

        if (shouldUseOfflineDirectly) {
            return offlineEngine.processQuery(prompt, history, memories)
        }

        return try {
            onlineProvider.processQuery(prompt, history, memories)
        } catch (e: Exception) {
            // Automatic fallback to offline tactical core
            val offlineRes = offlineEngine.processQuery(prompt, history, memories)
            offlineRes.copy(
                reply = "[Cloud uplink bypassed] ${offlineRes.reply}",
                provider = "Local Tactical Core (Fallback)",
                isOffline = true
            )
        }
    }
}
