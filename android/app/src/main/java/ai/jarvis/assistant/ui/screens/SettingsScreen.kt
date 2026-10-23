package ai.jarvis.assistant.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.jarvis.assistant.ui.theme.StarkAlert
import ai.jarvis.assistant.ui.theme.StarkBlack
import ai.jarvis.assistant.ui.theme.StarkBorder
import ai.jarvis.assistant.ui.theme.StarkCard
import ai.jarvis.assistant.ui.theme.StarkCyan
import ai.jarvis.assistant.ui.theme.StarkCyanDim
import ai.jarvis.assistant.ui.theme.TextMuted
import ai.jarvis.assistant.ui.theme.TextPrimary
import ai.jarvis.assistant.ui.theme.TextSecondary

@Composable
fun SettingsScreen(
    currentMoniker: String,
    currentRate: Float,
    currentPitch: Float,
    isMuted: Boolean,
    currentBackendUrl: String,
    onSaveSettings: (String, Float, Float, Boolean, String) -> Unit,
    onClearAllHistory: () -> Unit,
    onBack: () -> Unit
) {
    var moniker by remember { mutableStateOf(currentMoniker) }
    var rate by remember { mutableFloatStateOf(currentRate) }
    var pitch by remember { mutableFloatStateOf(currentPitch) }
    var muted by remember { mutableStateOf(isMuted) }
    var backendUrl by remember { mutableStateOf(currentBackendUrl) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(StarkBlack)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(
                    imageVector = Icons.Default.ArrowBack,
                    contentDescription = "Back",
                    tint = StarkCyan
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Column {
                Text(
                    text = "ASSISTANT CONFIGURATION",
                    color = StarkCyan,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "TACTICAL PERSONA & CLOUD PARAMETERS",
                    color = StarkCyanDim,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Section 1: User Profile & Moniker
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(StarkCard)
                .border(1.dp, StarkBorder, RoundedCornerShape(8.dp))
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "COMMANDER IDENTITY",
                    color = StarkCyan,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                )
                OutlinedTextField(
                    value = moniker,
                    onValueChange = { moniker = it },
                    label = { Text("Honorific / Moniker (e.g. Sir, Commander)", fontSize = 11.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Section 2: Speech Synthesis Parameters
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(StarkCard)
                .border(1.dp, StarkBorder, RoundedCornerShape(8.dp))
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "ACOUSTIC SYNTHESIZER (TEXT-TO-SPEECH)",
                    color = StarkCyan,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(text = "Mute Voice Feedback", color = TextPrimary, fontSize = 13.sp)
                    Switch(
                        checked = muted,
                        onCheckedChange = { muted = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = StarkBlack,
                            checkedTrackColor = StarkAlert
                        )
                    )
                }

                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "Speech Rate (Cadence)", color = TextSecondary, fontSize = 12.sp)
                        Text(text = "%.2fx".format(rate), color = StarkCyan, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                    }
                    Slider(
                        value = rate,
                        onValueChange = { rate = it },
                        valueRange = 0.7f..1.5f,
                        colors = SliderDefaults.colors(thumbColor = StarkCyan, activeTrackColor = StarkCyan)
                    )
                }

                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(text = "Speech Pitch (Timbre)", color = TextSecondary, fontSize = 12.sp)
                        Text(text = "%.2fx".format(pitch), color = StarkCyan, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                    }
                    Slider(
                        value = pitch,
                        onValueChange = { pitch = it },
                        valueRange = 0.7f..1.3f,
                        colors = SliderDefaults.colors(thumbColor = StarkCyan, activeTrackColor = StarkCyan)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Section 3: Online AI Endpoint
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(StarkCard)
                .border(1.dp, StarkBorder, RoundedCornerShape(8.dp))
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "ONLINE REASONING PROXY ENDPOINT",
                    color = StarkCyan,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                )
                Text(
                    text = "Configure custom backend proxy or leave blank for local emulator defaults (10.0.2.2:3000).",
                    color = TextMuted,
                    fontSize = 11.sp
                )
                OutlinedTextField(
                    value = backendUrl,
                    onValueChange = { backendUrl = it },
                    label = { Text("Backend URL (e.g. https://your-server.app)", fontSize = 11.sp) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Save Button
        Button(
            onClick = {
                onSaveSettings(moniker, rate, pitch, muted, backendUrl)
                onBack()
            },
            colors = ButtonDefaults.buttonColors(containerColor = StarkCyan, contentColor = StarkBlack),
            shape = RoundedCornerShape(6.dp),
            modifier = Modifier.fillMaxWidth().height(44.dp)
        ) {
            Text(
                text = "Apply Configuration Changes",
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Clear History
        OutlinedButton(
            onClick = onClearAllHistory,
            colors = ButtonDefaults.outlinedButtonColors(contentColor = StarkAlert),
            border = androidx.compose.foundation.BorderStroke(1.dp, StarkAlert),
            shape = RoundedCornerShape(6.dp),
            modifier = Modifier.fillMaxWidth().height(42.dp)
        ) {
            Text(
                text = "Purge Conversation Database",
                fontFamily = FontFamily.Monospace,
                fontSize = 11.sp
            )
        }
    }
}
