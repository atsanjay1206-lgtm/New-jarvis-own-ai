package ai.jarvis.assistant.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = StarkCyan,
    onPrimary = StarkBlack,
    primaryContainer = StarkNavy,
    onPrimaryContainer = StarkCyan,
    secondary = StarkBlue,
    onSecondary = TextPrimary,
    background = StarkBlack,
    onBackground = TextPrimary,
    surface = StarkNavy,
    onSurface = TextPrimary,
    surfaceVariant = StarkCard,
    onSurfaceVariant = TextSecondary,
    outline = StarkBorder,
    error = StarkAlert
)

@Composable
fun JarvisTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
