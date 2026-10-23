package ai.jarvis.assistant.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PointMode
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import ai.jarvis.assistant.domain.model.JarvisState
import ai.jarvis.assistant.ui.theme.StarkAlert
import ai.jarvis.assistant.ui.theme.StarkCyan
import ai.jarvis.assistant.ui.theme.StarkCyanDim
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun ArcReactorView(
    state: JarvisState,
    size: Dp = 220.dp,
    onTap: () -> Unit = {}
) {
    val infiniteTransition = rememberInfiniteTransition(label = "ArcReactorMotion")

    val outerRotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = if (state == JarvisState.LISTENING) 4000 else 14000,
                easing = LinearEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "outerRotation"
    )

    val innerRotation by infiniteTransition.animateFloat(
        initialValue = 360f,
        targetValue = 0f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = if (state == JarvisState.ANALYZING) 3000 else 10000,
                easing = LinearEasing
            ),
            repeatMode = RepeatMode.Restart
        ),
        label = "innerRotation"
    )

    val corePulse by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = when (state) {
                    JarvisState.SPEAKING -> 500
                    JarvisState.LISTENING -> 800
                    JarvisState.ANALYZING -> 400
                    else -> 1800
                },
                easing = FastOutSlowInEasing
            ),
            repeatMode = RepeatMode.Reverse
        ),
        label = "corePulse"
    )

    val primaryColor = when (state) {
        JarvisState.ALERT -> StarkAlert
        JarvisState.MUTED -> Color(0xFF64748B)
        else -> StarkCyan
    }

    Box(
        modifier = Modifier
            .size(size)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onTap
            ),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val center = Offset(size.toPx() / 2f, size.toPx() / 2f)
            val maxRadius = (size.toPx() / 2f) * 0.9f

            // 1. Outer containment ring
            drawCircle(
                color = primaryColor.copy(alpha = 0.2f),
                radius = maxRadius,
                center = center,
                style = Stroke(width = 2.dp.toPx())
            )

            // 2. Rotating segmented outer brackets
            rotate(outerRotation, pivot = center) {
                val bracketCount = 8
                val sweep = 20f
                for (i in 0 until bracketCount) {
                    val startAngle = i * (360f / bracketCount)
                    drawArc(
                        color = primaryColor.copy(alpha = 0.7f),
                        startAngle = startAngle,
                        sweepAngle = sweep,
                        useCenter = false,
                        topLeft = Offset(center.x - maxRadius * 0.88f, center.y - maxRadius * 0.88f),
                        size = androidx.compose.ui.geometry.Size(maxRadius * 1.76f, maxRadius * 1.76f),
                        style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
                    )
                }
            }

            // 3. Middle ring with radial ticks
            val middleRadius = maxRadius * 0.72f
            drawCircle(
                color = primaryColor.copy(alpha = 0.35f),
                radius = middleRadius,
                center = center,
                style = Stroke(width = 1.5.dp.toPx())
            )

            rotate(innerRotation, pivot = center) {
                val tickCount = 24
                for (i in 0 until tickCount) {
                    val angle = Math.toRadians((i * (360.0 / tickCount)))
                    val startX = center.x + (middleRadius * 0.88f) * cos(angle).toFloat()
                    val startY = center.y + (middleRadius * 0.88f) * sin(angle).toFloat()
                    val endX = center.x + middleRadius * cos(angle).toFloat()
                    val endY = center.y + middleRadius * sin(angle).toFloat()

                    drawLine(
                        color = primaryColor.copy(alpha = 0.6f),
                        start = Offset(startX, startY),
                        end = Offset(endX, endY),
                        strokeWidth = 2.dp.toPx(),
                        cap = StrokeCap.Round
                    )
                }
            }

            // 4. Central palladium power core
            val coreRadius = (maxRadius * 0.38f) * corePulse
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(
                        Color.White,
                        primaryColor,
                        primaryColor.copy(alpha = 0.15f),
                        Color.Transparent
                    ),
                    center = center,
                    radius = coreRadius * 1.4f
                ),
                radius = coreRadius * 1.2f,
                center = center
            )

            // Core center circle
            drawCircle(
                color = Color.White.copy(alpha = 0.9f),
                radius = coreRadius * 0.5f,
                center = center
            )
        }
    }
}
