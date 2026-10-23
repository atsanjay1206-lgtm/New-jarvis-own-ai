package ai.jarvis.assistant.ui.screens

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import ai.jarvis.assistant.domain.model.JarvisMode
import ai.jarvis.assistant.domain.model.JarvisState
import ai.jarvis.assistant.ui.components.ArcReactorView
import ai.jarvis.assistant.ui.components.ChatFeedView
import ai.jarvis.assistant.ui.components.HeaderHUDView
import ai.jarvis.assistant.ui.components.QuickControlsDock
import ai.jarvis.assistant.ui.components.WaveformView
import ai.jarvis.assistant.ui.theme.StarkBlack
import ai.jarvis.assistant.ui.theme.StarkCyan
import ai.jarvis.assistant.ui.theme.StarkCyanDim
import ai.jarvis.assistant.viewmodel.JarvisViewModel

@Composable
fun MainHudScreen(
    viewModel: JarvisViewModel,
    onOpenDiagnostics: () -> Unit,
    onOpenMemory: () -> Unit,
    onOpenProtocols: () -> Unit,
    onOpenSettings: () -> Unit
) {
    val context = LocalContext.current
    val jarvisState by viewModel.jarvisState.collectAsState()
    val mode by viewModel.mode.collectAsState()
    val telemetry by viewModel.telemetry.collectAsState()
    val messages by viewModel.messages.collectAsState()
    val partialTranscript by viewModel.partialTranscript.collectAsState()
    val isProcessing by viewModel.isProcessing.collectAsState()

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            viewModel.startListening()
        }
        viewModel.refreshTelemetry()
    }

    val activeProvider = when (mode) {
        JarvisMode.OFFLINE -> "Local Tactical Core (On-Device)"
        JarvisMode.ONLINE -> "Gemini 3.8 Flash (Cloud)"
        JarvisMode.AUTO -> if (telemetry.isOnline) "Auto (Gemini 3.8 Flash)" else "Auto (Local Core Fallback)"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(StarkBlack)
    ) {
        // 1. Futuristic Header HUD
        HeaderHUDView(
            mode = mode,
            onModeChange = { viewModel.setMode(it) },
            telemetry = telemetry,
            activeProviderName = activeProvider,
            onOpenDiagnostics = onOpenDiagnostics,
            onOpenMemory = onOpenMemory,
            onOpenProtocols = onOpenProtocols,
            onOpenSettings = onOpenSettings
        )

        // 2. Arc Reactor Centerpiece & Audio Waveform
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalAlignment = Alignment.CenterVertically
        ) {
            ArcReactorView(
                state = jarvisState,
                size = 180.dp,
                onTap = {
                    if (jarvisState == JarvisState.SPEAKING) {
                        viewModel.stopSpeaking()
                    } else if (jarvisState == JarvisState.LISTENING) {
                        viewModel.stopListening()
                    } else {
                        val hasMic = ContextCompat.checkSelfPermission(
                            context,
                            Manifest.permission.RECORD_AUDIO
                        ) == PackageManager.PERMISSION_GRANTED
                        if (hasMic) {
                            viewModel.startListening()
                        } else {
                            permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                        }
                    }
                }
            )

            WaveformView(
                isActive = jarvisState != JarvisState.IDLE,
                isSpeaking = jarvisState == JarvisState.SPEAKING,
                modifier = Modifier.padding(horizontal = 24.dp, vertical = 2.dp),
                height = 20.dp
            )

            Text(
                text = "STATUS: ${jarvisState.name}",
                color = StarkCyan,
                fontFamily = FontFamily.Monospace,
                fontSize = 10.sp,
                letterSpacing = 1.sp
            )
        }

        // 3. Communications Feed
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) {
            ChatFeedView(
                messages = messages,
                isProcessing = isProcessing,
                onReplaySpeech = { viewModel.speakText(it) },
                onExecuteAction = { viewModel.executeAction(it) }
            )
        }

        // 4. Push-to-Talk Dock & Controls
        QuickControlsDock(
            isListening = jarvisState == JarvisState.LISTENING,
            isSpeaking = jarvisState == JarvisState.SPEAKING,
            partialTranscript = partialTranscript,
            onStartListening = {
                val hasMic = ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.RECORD_AUDIO
                ) == PackageManager.PERMISSION_GRANTED
                if (hasMic) {
                    viewModel.startListening()
                } else {
                    permissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                }
            },
            onStopListening = { viewModel.stopListening() },
            onStopSpeaking = { viewModel.stopSpeaking() },
            onSendMessage = { viewModel.submitMessage(it) },
            onQuickAction = { viewModel.submitMessage(it) }
        )
    }
}
