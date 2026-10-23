package ai.jarvis.assistant.ui.screens

import android.content.Intent
import android.net.Uri
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.jarvis.assistant.domain.diagnostics.CapabilityStatus
import ai.jarvis.assistant.domain.model.HardwareTelemetry
import ai.jarvis.assistant.ui.theme.StarkAlert
import ai.jarvis.assistant.ui.theme.StarkBlack
import ai.jarvis.assistant.ui.theme.StarkBorder
import ai.jarvis.assistant.ui.theme.StarkCard
import ai.jarvis.assistant.ui.theme.StarkCyan
import ai.jarvis.assistant.ui.theme.StarkCyanDim
import ai.jarvis.assistant.ui.theme.StarkSuccess
import ai.jarvis.assistant.ui.theme.TextMuted
import ai.jarvis.assistant.ui.theme.TextPrimary
import ai.jarvis.assistant.ui.theme.TextSecondary

@Composable
fun DiagnosticsScreen(
    capabilities: List<CapabilityStatus>,
    telemetry: HardwareTelemetry,
    onBack: () -> Unit
) {
    val context = LocalContext.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(StarkBlack)
            .padding(16.dp)
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
                    text = "SYSTEM DIAGNOSTICS & TELEMETRY",
                    color = StarkCyan,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "HARDWARE BUS AUDIT: ${telemetry.hardwareModel.uppercase()}",
                    color = StarkCyanDim,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Hardware Resource Summary Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(8.dp))
                .background(StarkCard)
                .border(1.dp, StarkCyan.copy(alpha = 0.3f), RoundedCornerShape(8.dp))
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = "ONEPLUS 11R SUBSYSTEM TELEMETRY",
                    color = StarkCyan,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp
                )
                Text(
                    text = "• Qualcomm Snapdragon 8+ Gen 1 (8 Cores active)",
                    color = TextPrimary,
                    fontSize = 12.sp
                )
                Text(
                    text = "• RAM Overhead: %.1f GB free of %.1f GB LPDDR5X".format(telemetry.freeRamGb, telemetry.totalRamGb),
                    color = TextPrimary,
                    fontSize = 12.sp
                )
                Text(
                    text = "• Power Reserves: ${telemetry.batteryLevel}% (${if (telemetry.isCharging) "Charging via SuperVOOC" else "Discharging"})",
                    color = TextPrimary,
                    fontSize = 12.sp
                )
                Text(
                    text = "• Network Status: ${if (telemetry.isOnline) "Connected (${telemetry.networkType})" else "Offline (Autonomous)"}",
                    color = if (telemetry.isOnline) StarkSuccess else StarkAlert,
                    fontSize = 12.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "ANDROID CAPABILITIES & PERMISSION MATRIX",
            color = StarkCyanDim,
            fontFamily = FontFamily.Monospace,
            fontSize = 11.sp,
            letterSpacing = 0.8.sp
        )

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn(
            modifier = Modifier.fillMaxWidth().weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(capabilities, key = { it.id }) { cap ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(6.dp))
                        .background(StarkCard)
                        .border(1.dp, StarkBorder, RoundedCornerShape(6.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = if (cap.isGrantedOrAvailable) Icons.Default.CheckCircle else Icons.Default.Warning,
                                    contentDescription = null,
                                    tint = if (cap.isGrantedOrAvailable) StarkSuccess else StarkAlert,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = cap.title,
                                    color = TextPrimary,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 13.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = cap.description,
                                color = TextSecondary,
                                fontSize = 11.sp
                            )
                        }

                        if (!cap.isGrantedOrAvailable && cap.intentActionToFix != null) {
                            OutlinedButton(
                                onClick = {
                                    val intent = Intent(cap.intentActionToFix).apply {
                                        if (cap.intentActionToFix == android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS) {
                                            data = Uri.fromParts("package", context.packageName, null)
                                        }
                                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                                    }
                                    context.startActivity(intent)
                                },
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = StarkCyan),
                                border = androidx.compose.foundation.BorderStroke(1.dp, StarkCyan),
                                shape = RoundedCornerShape(4.dp),
                                modifier = Modifier.height(32.dp)
                            ) {
                                Text(
                                    text = "Configure",
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(
                                    imageVector = Icons.Default.OpenInNew,
                                    contentDescription = null,
                                    modifier = Modifier.size(12.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
