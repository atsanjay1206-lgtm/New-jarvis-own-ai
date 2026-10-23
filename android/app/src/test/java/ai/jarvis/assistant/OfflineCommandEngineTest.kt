package ai.jarvis.assistant

import ai.jarvis.assistant.domain.ai.OfflineCommandEngine
import ai.jarvis.assistant.domain.model.MemoryItem
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class OfflineCommandEngineTest {

    private lateinit var engine: OfflineCommandEngine

    @Before
    fun setup() {
        engine = OfflineCommandEngine()
    }

    @Test
    fun testTorchCommand() = runBlocking {
        val resultOn = engine.processQuery("Turn on torch")
        assertNotNull(resultOn.action)
        assertEquals("toggle_torch", resultOn.action?.action)
        assertEquals("on", resultOn.action?.params?.get("state"))
        assertTrue(resultOn.isOffline)

        val resultOff = engine.processQuery("Turn off the flashlight")
        assertNotNull(resultOff.action)
        assertEquals("toggle_torch", resultOff.action?.action)
        assertEquals("off", resultOff.action?.params?.get("state"))
    }

    @Test
    fun testOpenAppCamera() = runBlocking {
        val res = engine.processQuery("Open camera")
        assertNotNull(res.action)
        assertEquals("open_camera", res.action?.action)
    }

    @Test
    fun testOpenAppDialer() = runBlocking {
        val res = engine.processQuery("Launch phone")
        assertNotNull(res.action)
        assertEquals("open_app", res.action?.action)
        assertEquals("dialer", res.action?.target)
    }

    @Test
    fun testSetTimer() = runBlocking {
        val res = engine.processQuery("Set a timer for 15 minutes labeled tea")
        assertNotNull(res.action)
        assertEquals("set_timer", res.action?.action)
        assertEquals("900", res.action?.params?.get("seconds"))
        assertEquals("tea", res.action?.params?.get("label"))
    }

    @Test
    fun testSetAlarm() = runBlocking {
        val res = engine.processQuery("Set an alarm for 6:30 AM")
        assertNotNull(res.action)
        assertEquals("set_alarm", res.action?.action)
        assertEquals("6", res.action?.params?.get("hour"))
        assertEquals("30", res.action?.params?.get("minute"))
    }

    @Test
    fun testAddTask() = runBlocking {
        val res = engine.processQuery("Remind me to call Tony Stark")
        assertNotNull(res.action)
        assertEquals("add_task", res.action?.action)
        assertTrue(res.action?.params?.get("title")?.contains("Tony Stark") == true)
    }

    @Test
    fun testScreenSummarizeIntent() = runBlocking {
        val res = engine.processQuery("Summarize this screen")
        assertNotNull(res.action)
        assertEquals("read_screen_content", res.action?.action)
    }

    @Test
    fun testMemoryStorageAndRecall() = runBlocking {
        val storeRes = engine.processQuery("Remember that Mark 85 armor requires vibranium alloy")
        assertNotNull(storeRes.action)
        assertEquals("remember", storeRes.action?.action)

        val memoryList = listOf(
            MemoryItem(
                id = "1",
                key = "Armor Directive",
                value = "Mark 85 armor requires vibranium alloy"
            )
        )
        val recallRes = engine.processQuery("What do you remember?", memories = memoryList)
        assertTrue(recallRes.reply.contains("vibranium alloy"))
    }
}
