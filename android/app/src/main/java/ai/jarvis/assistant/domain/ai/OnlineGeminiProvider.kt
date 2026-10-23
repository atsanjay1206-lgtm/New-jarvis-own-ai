package ai.jarvis.assistant.domain.ai

import ai.jarvis.assistant.domain.model.ChatMessage
import ai.jarvis.assistant.domain.model.IntentAction
import ai.jarvis.assistant.domain.model.MemoryItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class OnlineGeminiProvider(private val baseUrl: String) : AIProvider {

    private val client = OkHttpClient.Builder()
        .connectTimeout(5, TimeUnit.SECONDS)
        .readTimeout(8, TimeUnit.SECONDS)
        .build()

    override suspend fun processQuery(
        prompt: String,
        history: List<ChatMessage>,
        memories: List<MemoryItem>
    ): AIResponse = withContext(Dispatchers.IO) {
        val url = if (baseUrl.isNotBlank()) {
            if (baseUrl.endsWith("/")) "${baseUrl}api/chat" else "$baseUrl/api/chat"
        } else {
            "http://10.0.2.2:3000/api/chat" // Default Android emulator host loopback
        }

        val historyJson = JSONArray().apply {
            history.takeLast(8).forEach { msg ->
                put(JSONObject().apply {
                    put("sender", if (msg.sender == ai.jarvis.assistant.domain.model.MessageSender.USER) "user" else "jarvis")
                    put("text", msg.text)
                })
            }
        }

        val memoriesJson = JSONArray().apply {
            memories.forEach { mem ->
                put(JSONObject().apply {
                    put("key", mem.key)
                    put("value", mem.value)
                    put("category", mem.category)
                })
            }
        }

        val bodyJson = JSONObject().apply {
            put("message", prompt)
            put("conversationHistory", historyJson)
            put("memories", memoriesJson)
            put("mode", "online")
        }

        val requestBody = bodyJson.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
        val request = Request.Builder()
            .url(url)
            .post(requestBody)
            .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) {
            throw IllegalStateException("Server returned HTTP ${response.code}")
        }

        val responseString = response.body?.string().orEmpty()
        val resJson = JSONObject(responseString)

        val replyText = resJson.optString("reply", "Systems nominal, Sir.")
        var action: IntentAction? = null
        if (resJson.has("action") && !resJson.isNull("action")) {
            val actObj = resJson.getJSONObject("action")
            val paramsMap = mutableMapOf<String, String>()
            if (actObj.has("params") && !actObj.isNull("params")) {
                val p = actObj.getJSONObject("params")
                p.keys().forEach { k -> paramsMap[k] = p.getString(k) }
            }
            action = IntentAction(
                action = actObj.optString("action", "open_app"),
                target = actObj.optString("target", null),
                params = paramsMap,
                label = actObj.optString("label", null)
            )
        }

        AIResponse(
            reply = replyText,
            action = action,
            provider = resJson.optString("provider", "Gemini 3.8 Flash (Online)"),
            isOffline = false
        )
    }
}
