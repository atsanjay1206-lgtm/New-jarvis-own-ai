package ai.jarvis.assistant.domain.speech

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.util.Locale

class TextToSpeechManager(
    private val context: Context,
    private val onSpeakingStateChanged: (Boolean) -> Unit
) {
    private var tts: TextToSpeech? = null
    private var isInitialized = false

    private val _isSpeaking = MutableStateFlow(false)
    val isSpeaking: StateFlow<Boolean> = _isSpeaking

    var speechRate: Float = 1.05f
        set(value) {
            field = value
            tts?.setSpeechRate(value)
        }

    var speechPitch: Float = 0.95f
        set(value) {
            field = value
            tts?.setPitch(value)
        }

    init {
        tts = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                isInitialized = true
                val result = tts?.setLanguage(Locale.UK)
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts?.setLanguage(Locale.US)
                }
                tts?.setPitch(speechPitch)
                tts?.setSpeechRate(speechRate)

                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        _isSpeaking.value = true
                        onSpeakingStateChanged(true)
                    }

                    override fun onDone(utteranceId: String?) {
                        _isSpeaking.value = false
                        onSpeakingStateChanged(false)
                    }

                    @Deprecated("Deprecated in Java")
                    override fun onError(utteranceId: String?) {
                        _isSpeaking.value = false
                        onSpeakingStateChanged(false)
                    }
                })
            }
        }
    }

    fun speak(text: String) {
        if (!isInitialized || tts == null) return

        stopSpeaking()

        // Strip action tags, markdown, and URLs
        val cleanText = text
            .replace(Regex("\\[\\[ACTION:.*?\\]\\]", RegexOption.DOT_MATCHES_ALL), "")
            .replace(Regex("```[\\s\\S]*?```"), "Code block omitted.")
            .replace(Regex("`([^`]+)`"), "$1")
            .replace(Regex("[*_~#]"), "")
            .replace(Regex("https?://\\S+"), "link")
            .trim()

        if (cleanText.isEmpty()) return

        val utteranceId = "jarvis_tts_${System.currentTimeMillis()}"
        tts?.speak(cleanText, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
    }

    fun stopSpeaking() {
        if (tts != null) {
            tts?.stop()
        }
        _isSpeaking.value = false
        onSpeakingStateChanged(false)
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        _isSpeaking.value = false
    }
}
