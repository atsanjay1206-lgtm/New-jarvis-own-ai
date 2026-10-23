package ai.jarvis.assistant.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import ai.jarvis.assistant.JarvisApp
import ai.jarvis.assistant.data.local.entities.ChatMessageEntity
import ai.jarvis.assistant.data.local.entities.MemoryEntity
import ai.jarvis.assistant.domain.ai.HybridAIService
import ai.jarvis.assistant.domain.ai.OfflineCommandEngine
import ai.jarvis.assistant.domain.ai.OnlineGeminiProvider
import ai.jarvis.assistant.domain.diagnostics.CapabilityStatus
import ai.jarvis.assistant.domain.model.ChatMessage
import ai.jarvis.assistant.domain.model.HardwareTelemetry
import ai.jarvis.assistant.domain.model.IntentAction
import ai.jarvis.assistant.domain.model.JarvisMode
import ai.jarvis.assistant.domain.model.JarvisState
import ai.jarvis.assistant.domain.model.MemoryItem
import ai.jarvis.assistant.domain.model.MessageSender
import ai.jarvis.assistant.domain.model.MessageStatus
import ai.jarvis.assistant.domain.speech.SpeechRecognitionManager
import ai.jarvis.assistant.domain.speech.TextToSpeechManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID

class JarvisViewModel(application: Application) : AndroidViewModel(application) {

    private val app = application as JarvisApp
    private val db = app.database
    private val prefs = app.preferences
    private val capabilityManager = app.capabilityManager
    private val actionRegistry = app.actionRegistry

    // Engines
    private val offlineEngine = OfflineCommandEngine()
    private val onlineProvider = OnlineGeminiProvider("")
    private val hybridAIService = HybridAIService(capabilityManager, offlineEngine, onlineProvider)

    // State
    private val _jarvisState = MutableStateFlow(JarvisState.IDLE)
    val jarvisState: StateFlow<JarvisState> = _jarvisState.asStateFlow()

    private val _mode = MutableStateFlow(JarvisMode.AUTO)
    val mode: StateFlow<JarvisMode> = _mode.asStateFlow()

    private val _telemetry = MutableStateFlow(capabilityManager.getTelemetry())
    val telemetry: StateFlow<HardwareTelemetry> = _telemetry.asStateFlow()

    private val _partialTranscript = MutableStateFlow("")
    val partialTranscript: StateFlow<String> = _partialTranscript.asStateFlow()

    private val _isProcessing = MutableStateFlow(false)
    val isProcessing: StateFlow<Boolean> = _isProcessing.asStateFlow()

    private val _capabilities = MutableStateFlow(capabilityManager.getAllCapabilities())
    val capabilities: StateFlow<List<CapabilityStatus>> = _capabilities.asStateFlow()

    val activeProtocols: StateFlow<Set<String>> = prefs.activeProtocolsFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, setOf("SENTRY"))

    val isMuted: StateFlow<Boolean> = prefs.isMutedFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, false)

    val userMoniker: StateFlow<String> = prefs.userMonikerFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, "Sir")

    val speechRate: StateFlow<Float> = prefs.speechRateFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, 1.05f)

    val speechPitch: StateFlow<Float> = prefs.speechPitchFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, 0.95f)

    val backendUrl: StateFlow<String> = prefs.backendUrlFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, "")

    // Chat messages stream from Room
    val messages: StateFlow<List<ChatMessage>> = db.chatDao().getAllMessages()
        .map { list ->
            list.map { entity ->
                ChatMessage(
                    id = entity.id,
                    sender = try { MessageSender.valueOf(entity.sender) } catch (e: Exception) { MessageSender.SYSTEM },
                    text = entity.text,
                    timestamp = entity.timestamp,
                    provider = entity.provider,
                    isOffline = entity.isOffline,
                    action = null,
                    status = try { MessageStatus.valueOf(entity.status) } catch (e: Exception) { MessageStatus.SUCCESS }
                )
            }
        }
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    // Memories stream from Room
    val memories: StateFlow<List<MemoryItem>> = db.memoryDao().getAllMemoriesFlow()
        .map { list ->
            list.map { e ->
                MemoryItem(
                    id = e.id,
                    key = e.key,
                    value = e.value,
                    category = e.category,
                    created = e.created,
                    updated = e.updated,
                    confidence = e.confidence
                )
            }
        }
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    // Speech Managers
    private val ttsManager = TextToSpeechManager(app) { speaking ->
        if (speaking) {
            _jarvisState.value = JarvisState.SPEAKING
        } else if (!_isProcessing.value && !speechRecognitionManager.isListening.value) {
            _jarvisState.value = JarvisState.IDLE
        }
    }

    private val speechRecognitionManager = SpeechRecognitionManager(
        context = app,
        onFinalTranscript = { finalTranscript ->
            _partialTranscript.value = ""
            // Check for immediate voice interrupt command
            if (finalTranscript.equals("JARVIS stop", ignoreCase = true) ||
                finalTranscript.equals("stop", ignoreCase = true) ||
                finalTranscript.equals("stop speaking", ignoreCase = true)) {
                stopSpeaking()
            } else {
                submitMessage(finalTranscript)
            }
        },
        onPartialTranscript = { partial ->
            _partialTranscript.value = partial
        },
        onError = { errorMsg ->
            _partialTranscript.value = ""
            _jarvisState.value = JarvisState.IDLE
            appendSystemMessage("Speech recognition error: $errorMsg")
        },
        onListeningStateChanged = { listening ->
            if (listening) {
                ttsManager.stopSpeaking()
                _jarvisState.value = JarvisState.LISTENING
            } else if (!_isProcessing.value && !ttsManager.isSpeaking.value) {
                _jarvisState.value = JarvisState.IDLE
            }
        }
    )

    init {
        // Collect mode preference
        viewModelScope.launch {
            prefs.modeFlow.collect { m -> _mode.value = m }
        }
        viewModelScope.launch {
            prefs.backendUrlFlow.collect { url -> hybridAIService.updateBackendUrl(url) }
        }
        viewModelScope.launch {
            prefs.speechRateFlow.collect { r -> ttsManager.speechRate = r }
        }
        viewModelScope.launch {
            prefs.speechPitchFlow.collect { p -> ttsManager.speechPitch = p }
        }
        refreshTelemetry()
    }

    fun refreshTelemetry() {
        _telemetry.value = capabilityManager.getTelemetry()
        _capabilities.value = capabilityManager.getAllCapabilities()
    }

    fun setMode(newMode: JarvisMode) {
        viewModelScope.launch {
            prefs.setMode(newMode)
            _mode.value = newMode
        }
    }

    fun startListening() {
        ttsManager.stopSpeaking()
        speechRecognitionManager.startListening()
    }

    fun stopListening() {
        speechRecognitionManager.stopListening()
    }

    fun stopSpeaking() {
        ttsManager.stopSpeaking()
        if (_jarvisState.value == JarvisState.SPEAKING) {
            _jarvisState.value = JarvisState.IDLE
        }
    }

    fun speakText(text: String) {
        if (!isMuted.value) {
            ttsManager.speak(text)
        }
    }

    fun submitMessage(rawText: String) {
        val text = rawText.trim()
        if (text.isEmpty()) return

        val userEntity = ChatMessageEntity(
            id = "msg_${System.currentTimeMillis()}",
            sender = MessageSender.USER.name,
            text = text,
            timestamp = System.currentTimeMillis(),
            provider = null,
            isOffline = false,
            actionJson = null,
            status = MessageStatus.SUCCESS.name
        )

        viewModelScope.launch {
            db.chatDao().insertMessage(userEntity)
            _isProcessing.value = true
            _jarvisState.value = JarvisState.ANALYZING

            try {
                val currentHistory = messages.value
                val currentMemories = memories.value
                val aiResponse = hybridAIService.processQuery(text, _mode.value, currentHistory, currentMemories)

                var actionResMessage: String? = null
                if (aiResponse.action != null) {
                    val res = actionRegistry.executeAction(aiResponse.action)
                    actionResMessage = res.message
                }

                val replyText = if (actionResMessage != null) {
                    "${aiResponse.reply}\n\n[Action Executed: $actionResMessage]"
                } else {
                    aiResponse.reply
                }

                val jarvisEntity = ChatMessageEntity(
                    id = "msg_${System.currentTimeMillis()}",
                    sender = MessageSender.JARVIS.name,
                    text = replyText,
                    timestamp = System.currentTimeMillis(),
                    provider = aiResponse.provider,
                    isOffline = aiResponse.isOffline,
                    actionJson = null,
                    status = MessageStatus.SUCCESS.name
                )
                db.chatDao().insertMessage(jarvisEntity)

                // Vocalize response
                if (!isMuted.value) {
                    ttsManager.speak(aiResponse.reply)
                }
            } catch (e: Exception) {
                val errorEntity = ChatMessageEntity(
                    id = "msg_err_${System.currentTimeMillis()}",
                    sender = MessageSender.JARVIS.name,
                    text = "Tactical core error: ${e.message ?: "Subroutine faulted."} Auxiliary systems nominal.",
                    timestamp = System.currentTimeMillis(),
                    provider = "Local Tactical Core",
                    isOffline = true,
                    actionJson = null,
                    status = MessageStatus.ERROR.name
                )
                db.chatDao().insertMessage(errorEntity)
            } finally {
                _isProcessing.value = false
                if (!ttsManager.isSpeaking.value) {
                    _jarvisState.value = JarvisState.IDLE
                }
            }
        }
    }

    fun executeAction(action: IntentAction) {
        viewModelScope.launch {
            val res = actionRegistry.executeAction(action)
            appendSystemMessage("Action Executed: ${res.message}")
        }
    }

    fun executeProtocol(protocolCode: String) {
        viewModelScope.launch {
            when (protocolCode) {
                "CLEAN_SLATE" -> {
                    db.chatDao().clearAllMessages()
                    appendJarvisMessage("Clean Slate Protocol completed. Volatile conversation feed purged. Core parameters reset.")
                }
                "HOUSE_PARTY" -> {
                    prefs.toggleProtocol("HOUSE_PARTY", true)
                    appendJarvisMessage("House Party Protocol engaged. All auxiliary offline modules staged into memory.")
                }
                "STEALTH" -> {
                    val newMuted = !isMuted.value
                    prefs.setMuted(newMuted)
                    prefs.toggleProtocol("STEALTH", newMuted)
                    if (newMuted) stopSpeaking()
                    appendJarvisMessage(if (newMuted) "Stealth mode active. Acoustic dampeners engaged." else "Stealth mode disengaged. Audio telemetry restored.")
                }
                "SENTRY" -> {
                    prefs.toggleProtocol("SENTRY", true)
                    appendJarvisMessage("Sentry defense perimeter verified. Standing by for directives.")
                }
                "OVERDRIVE" -> {
                    prefs.toggleProtocol("OVERDRIVE", true)
                    appendJarvisMessage("Qualcomm Snapdragon 8+ Gen 1 stepped to maximum performance clock.")
                }
            }
        }
    }

    fun addMemory(key: String, value: String, category: String) {
        viewModelScope.launch {
            db.memoryDao().insertMemory(
                MemoryEntity(
                    id = "mem_${UUID.randomUUID()}",
                    key = key,
                    value = value,
                    category = category,
                    created = System.currentTimeMillis(),
                    updated = System.currentTimeMillis(),
                    confidence = 1.0f
                )
            )
        }
    }

    fun deleteMemory(id: String) {
        viewModelScope.launch {
            db.memoryDao().deleteMemoryById(id)
        }
    }

    fun clearAllConversations() {
        viewModelScope.launch {
            db.chatDao().clearAllMessages()
        }
    }

    fun updateSettings(moniker: String, rate: Float, pitch: Float, muted: Boolean, backendUrl: String) {
        viewModelScope.launch {
            prefs.setUserMoniker(moniker)
            prefs.setSpeechSettings(rate, pitch)
            prefs.setMuted(muted)
            prefs.setBackendUrl(backendUrl)
        }
    }

    private fun appendJarvisMessage(text: String) {
        viewModelScope.launch {
            db.chatDao().insertMessage(
                ChatMessageEntity(
                    id = "proto_${System.currentTimeMillis()}",
                    sender = MessageSender.JARVIS.name,
                    text = text,
                    timestamp = System.currentTimeMillis(),
                    provider = "Local Tactical Core",
                    isOffline = true,
                    actionJson = null,
                    status = MessageStatus.SUCCESS.name
                )
            )
            if (!isMuted.value) {
                ttsManager.speak(text)
            }
        }
    }

    private fun appendSystemMessage(text: String) {
        viewModelScope.launch {
            db.chatDao().insertMessage(
                ChatMessageEntity(
                    id = "sys_${System.currentTimeMillis()}",
                    sender = MessageSender.SYSTEM.name,
                    text = text,
                    timestamp = System.currentTimeMillis(),
                    provider = null,
                    isOffline = true,
                    actionJson = null,
                    status = MessageStatus.SUCCESS.name
                )
            )
        }
    }

    override fun onCleared() {
        super.onCleared()
        speechRecognitionManager.destroy()
        ttsManager.shutdown()
    }
}
