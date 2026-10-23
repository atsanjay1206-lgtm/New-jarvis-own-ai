package ai.jarvis.assistant.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import ai.jarvis.assistant.ui.theme.StarkCyan
import ai.jarvis.assistant.ui.theme.StarkCyanDim
import kotlin.math.sin

@Composable
fun WaveformView(
    isActive: Boolean,
    isSpeaking: Boolean,
    modifier: Modifier = Modifier,
    height: Dp = 32.dp,
    barCount: Int = 24
) {
    val infiniteTransition = rememberInfiniteTransition(label = "WaveformMotion")

    val phase by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 6.2831f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = if (isSpeaking) 800 else 1600,
                easing = androidx.compose.animation.core.LinearEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "phase"
    )

    Canvas(modifier = modifier.fillMaxWidth().height(height)) {
        val totalWidth = size.width
        val canvasHeight = size.height
        val barWidth = (totalWidth / (barCount * 1.6f)).coerceIn(2.dp.toPx(), 6.dp.toPx())
        val spacing = (totalWidth - (barCount * barWidth)) / (barCount - 1)

        for (i in 0 until barCount) {
            val normalizedX = i.toFloat() / barCount
            val wave = if (isActive) {
                val s1 = sin(phase + i * 0.45f)
                val s2 = sin(phase * 1.5f + i * 0.2f)
                ((s1 + s2) / 2f + 1f) / 2f
            } else {
                0.15f
            }

            val barH = (canvasHeight * wave).coerceIn(4.dp.toPx(), canvasHeight)
            val x = i * (barWidth + spacing)
            val y = (canvasHeight - barH) / 2f

            drawRoundRect(
                color = if (isActive) StarkCyan.copy(alpha = 0.5f + (wave * 0.5f)) else StarkCyanDim.copy(alpha = 0.25f),
                topLeft = Offset(x, y),
                size = Size(barWidth, barH),
                cornerRadius = CornerRadius(2.dp.toPx(), 2.dp.toPx())
            )
        }
    }
}
