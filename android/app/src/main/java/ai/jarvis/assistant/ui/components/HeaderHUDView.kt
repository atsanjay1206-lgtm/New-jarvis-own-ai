package ai.jarvis.assistant.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.BatteryChargingFull
import androidx.compose.material.icons.filled.BatteryFull
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.jarvis.assistant.domain.model.HardwareTelemetry
import ai.jarvis.assistant.domain.model.JarvisMode
import ai.jarvis.assistant.ui.theme.StarkAlert
import ai.jarvis.assistant.ui.theme.StarkBlack
import ai.jarvis.assistant.ui.theme.StarkBorder
import ai.jarvis.assistant.ui.theme.StarkCyan
import ai.jarvis.assistant.ui.theme.StarkCyanDim
import ai.jarvis.assistant.ui.theme.StarkNavy
import ai.jarvis.assistant.ui.theme.StarkSuccess
import ai.jarvis.assistant.ui.theme.TextMuted
import ai.jarvis.assistant.ui.theme.TextPrimary

@Composable
fun HeaderHUDView(
    mode: JarvisMode,
    onModeChange: (JarvisMode) -> Unit,
    telemetry: HardwareTelemetry,
    activeProviderName: String,
    onOpenDiagnostics: () -> Unit,
    onOpenMemory: () -> Unit,
    onOpenProtocols: () -> Unit,
    onOpenSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(StarkNavy.copy(alpha = 0.95f))
            .border(1.dp, StarkBorder)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        // Row 1: Brand & Top Utilities
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(if (telemetry.isOnline) StarkCyan else StarkAlert)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "J.A.R.V.I.S.",
                    color = StarkCyan,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "MK-LXXXV",
                    color = StarkCyanDim,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 11.sp
                )
            }

            // Quick navigation icons
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onOpenDiagnostics, modifier = Modifier.size(32.dp)) {
                    Icon(
                        imageVector = Icons.Default.Tune,
                        contentDescription = "Diagnostics",
                        tint = StarkCyan,
                        modifier = Modifier.size(18.dp)
                    )
                }
                IconButton(onClick = onOpenMemory, modifier = Modifier.size(32.dp)) {
                    Icon(
                        imageVector = Icons.Default.Memory,
                        contentDescription = "Memory Bank",
                        tint = StarkCyan,
                        modifier = Modifier.size(18.dp)
                    )
                }
                IconButton(onClick = onOpenProtocols, modifier = Modifier.size(32.dp)) {
                    Icon(
                        imageVector = Icons.Default.Security,
                        contentDescription = "Protocols",
                        tint = StarkCyan,
                        modifier = Modifier.size(18.dp)
                    )
                }
                IconButton(onClick = onOpenSettings, modifier = Modifier.size(32.dp)) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Settings",
                        tint = StarkCyan,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        // Row 2: Mode Toggle & Hardware Telemetry
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Mode Selectors
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(StarkBlack)
                    .border(1.dp, StarkBorder, RoundedCornerShape(4.dp))
                    .padding(2.dp)
            ) {
                JarvisMode.entries.forEach { m ->
                    val isSelected = m == mode
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(2.dp))
                            .background(if (isSelected) StarkCyan.copy(alpha = 0.25f) else Color.Transparent)
                            .clickable { onModeChange(m) }
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = m.name,
                            color = if (isSelected) StarkCyan else TextMuted,
                            fontFamily = FontFamily.Monospace,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            fontSize = 10.sp
                        )
                    }
                }
            }

            // Real Hardware Telemetry Badge
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Battery
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (telemetry.isCharging) Icons.Default.BatteryChargingFull else Icons.Default.BatteryFull,
                        contentDescription = "Battery",
                        tint = if (telemetry.batteryLevel > 20) StarkSuccess else StarkAlert,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(2.dp))
                    Text(
                        text = "${telemetry.batteryLevel}%",
                        color = TextPrimary,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp
                    )
                }

                // Network
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = if (telemetry.isOnline) Icons.Default.Wifi else Icons.Default.WifiOff,
                        contentDescription = "Network",
                        tint = if (telemetry.isOnline) StarkCyan else StarkAlert,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(2.dp))
                    Text(
                        text = if (telemetry.isOnline) "ONLINE" else "OFFLINE",
                        color = if (telemetry.isOnline) StarkCyan else StarkAlert,
                        fontFamily = FontFamily.Monospace,
                        fontSize = 10.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(2.dp))

        // Row 3: Active Provider Line
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "ENGINE: $activeProviderName",
                color = StarkCyanDim,
                fontFamily = FontFamily.Monospace,
                fontSize = 9.sp
            )
            Text(
                text = "SNAPDRAGON 8+ GEN 1 (16GB)",
                color = TextMuted,
                fontFamily = FontFamily.Monospace,
                fontSize = 9.sp
            )
        }
    }
}
