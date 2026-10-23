package ai.jarvis.assistant.domain.ai

import ai.jarvis.assistant.domain.model.ChatMessage
import ai.jarvis.assistant.domain.model.IntentAction
import ai.jarvis.assistant.domain.model.MemoryItem

data class AIResponse(
    val reply: String,
    val action: IntentAction? = null,
    val provider: String,
    val isOffline: Boolean
)

interface AIProvider {
    suspend fun processQuery(
        prompt: String,
        history: List<ChatMessage> = emptyList(),
        memories: List<MemoryItem> = emptyList()
    ): AIResponse
}
