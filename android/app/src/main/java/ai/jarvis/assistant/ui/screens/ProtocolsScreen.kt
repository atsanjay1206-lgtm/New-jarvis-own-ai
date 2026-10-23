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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.jarvis.assistant.domain.model.ProtocolItem
import ai.jarvis.assistant.ui.theme.StarkAlert
import ai.jarvis.assistant.ui.theme.StarkBlack
import ai.jarvis.assistant.ui.theme.StarkBorder
import ai.jarvis.assistant.ui.theme.StarkCard
import ai.jarvis.assistant.ui.theme.StarkCyan
import ai.jarvis.assistant.ui.theme.StarkCyanDim
import ai.jarvis.assistant.ui.theme.StarkSuccess
import ai.jarvis.assistant.ui.theme.TextPrimary
import ai.jarvis.assistant.ui.theme.TextSecondary

@Composable
fun ProtocolsScreen(
    activeProtocols: Set<String>,
    onExecuteProtocol: (String) -> Unit,
    onBack: () -> Unit
) {
    val protocols = listOf(
        ProtocolItem(
            id = "clean_slate",
            code = "CLEAN_SLATE",
            name = "Clean Slate Protocol",
            description = "Purges active conversation cache and volatile memory while preserving durable Room records."
        ),
        ProtocolItem(
            id = "house_party",
            code = "HOUSE_PARTY",
            name = "House Party Protocol",
            description = "Stages all auxiliary offline cognitive engines and intent listeners into device RAM."
        ),
        ProtocolItem(
            id = "stealth",
            code = "STEALTH",
            name = "Stealth Mode Directive",
            description = "Engages acoustic dampeners (mutes Text-to-Speech) and dims holographic luminescence."
        ),
        ProtocolItem(
            id = "sentry",
            code = "SENTRY",
            name = "Sentry Defense Protocol",
            description = "Maintains elevated background readiness and monitors device integrity continuously."
        ),
        ProtocolItem(
            id = "overdrive",
            code = "OVERDRIVE",
            name = "Snapdragon Overdrive",
            description = "Optimizes core thread allocation for maximum local reasoning throughput."
        )
    )

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
                    text = "STARK TACTICAL PROTOCOLS",
                    color = StarkCyan,
                    fontFamily = FontFamily.Monospace,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    letterSpacing = 1.sp
                )
                Text(
                    text = "DEFENSIVE & SYSTEM OVERRIDES",
                    color = StarkCyanDim,
                    fontFamily = FontFamily.Monospace,
                    fontSize = 10.sp
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            modifier = Modifier.fillMaxWidth().weight(1f),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(protocols, key = { it.code }) { proto ->
                val isActive = activeProtocols.contains(proto.code)
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(StarkCard)
                        .border(
                            1.dp,
                            if (isActive) StarkCyan else StarkBorder,
                            RoundedCornerShape(8.dp)
                        )
                        .padding(14.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    imageVector = Icons.Default.Shield,
                                    contentDescription = null,
                                    tint = if (isActive) StarkSuccess else StarkCyanDim,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = proto.name,
                                    color = if (isActive) StarkCyan else TextPrimary,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }

                            OutlinedButton(
                                onClick = { onExecuteProtocol(proto.code) },
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = if (proto.code == "CLEAN_SLATE") StarkAlert else StarkCyan
                                ),
                                border = androidx.compose.foundation.BorderStroke(
                                    1.dp,
                                    if (proto.code == "CLEAN_SLATE") StarkAlert else StarkCyan
                                ),
                                shape = RoundedCornerShape(4.dp),
                                modifier = Modifier.height(30.dp)
                            ) {
                                Text(
                                    text = if (isActive) "Active" else "Engage",
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Text(
                            text = proto.description,
                            color = TextSecondary,
                            fontSize = 11.sp,
                            lineHeight = 16.sp
                        )
                    }
                }
            }
        }
    }
}
