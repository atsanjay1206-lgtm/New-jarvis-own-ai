package ai.jarvis.assistant.domain.accessibility

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

class JarvisAccessibilityService : AccessibilityService() {

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // We only inspect screen content when explicitly queried by user directive.
    }

    override fun onInterrupt() {
        // Clean release of resources
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) {
            instance = null
        }
    }

    fun extractVisibleScreenText(): String {
        val rootNode = rootInActiveWindow ?: return "Unable to access visible screen buffer. Target application window may be secure or inaccessible."
        val builder = StringBuilder()
        traverseNodes(rootNode, builder, 0)
        val result = builder.toString().trim()
        return if (result.isNotEmpty()) result else "No readable text content detected on current display."
    }

    private fun traverseNodes(node: AccessibilityNodeInfo?, out: StringBuilder, depth: Int) {
        if (node == null || depth > 12) return

        val text = node.text
        val contentDesc = node.contentDescription

        if (!text.isNullOrBlank()) {
            out.append(text.toString().trim()).append("\n")
        } else if (!contentDesc.isNullOrBlank()) {
            out.append(contentDesc.toString().trim()).append("\n")
        }

        for (i in 0 until node.childCount) {
            val child = node.getChild(i)
            traverseNodes(child, out, depth + 1)
        }
    }

    companion object {
        var instance: JarvisAccessibilityService? = null
            private set

        fun isServiceRunning(): Boolean = instance != null
    }
}
