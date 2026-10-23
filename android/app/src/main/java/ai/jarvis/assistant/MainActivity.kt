package ai.jarvis.assistant

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import ai.jarvis.assistant.ui.screens.DiagnosticsScreen
import ai.jarvis.assistant.ui.screens.MainHudScreen
import ai.jarvis.assistant.ui.screens.MemoryBankScreen
import ai.jarvis.assistant.ui.screens.ProtocolsScreen
import ai.jarvis.assistant.ui.screens.SettingsScreen
import ai.jarvis.assistant.ui.theme.JarvisTheme
import ai.jarvis.assistant.ui.theme.StarkBlack
import ai.jarvis.assistant.viewmodel.JarvisViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: JarvisViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            JarvisTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = StarkBlack
                ) {
                    val navController = rememberNavController()

                    NavHost(navController = navController, startDestination = "main_hud") {
                        composable("main_hud") {
                            MainHudScreen(
                                viewModel = viewModel,
                                onOpenDiagnostics = {
                                    viewModel.refreshTelemetry()
                                    navController.navigate("diagnostics")
                                },
                                onOpenMemory = { navController.navigate("memory") },
                                onOpenProtocols = { navController.navigate("protocols") },
                                onOpenSettings = { navController.navigate("settings") }
                            )
                        }

                        composable("diagnostics") {
                            val capabilities by viewModel.capabilities.collectAsState()
                            val telemetry by viewModel.telemetry.collectAsState()
                            DiagnosticsScreen(
                                capabilities = capabilities,
                                telemetry = telemetry,
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable("memory") {
                            val memories by viewModel.memories.collectAsState()
                            MemoryBankScreen(
                                memories = memories,
                                onAddMemory = { k, v, c -> viewModel.addMemory(k, v, c) },
                                onDeleteMemory = { id -> viewModel.deleteMemory(id) },
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable("protocols") {
                            val activeProtocols by viewModel.activeProtocols.collectAsState()
                            ProtocolsScreen(
                                activeProtocols = activeProtocols,
                                onExecuteProtocol = { code -> viewModel.executeProtocol(code) },
                                onBack = { navController.popBackStack() }
                            )
                        }

                        composable("settings") {
                            val moniker by viewModel.userMoniker.collectAsState()
                            val rate by viewModel.speechRate.collectAsState()
                            val pitch by viewModel.speechPitch.collectAsState()
                            val isMuted by viewModel.isMuted.collectAsState()
                            val backendUrl by viewModel.backendUrl.collectAsState()

                            SettingsScreen(
                                currentMoniker = moniker,
                                currentRate = rate,
                                currentPitch = pitch,
                                isMuted = isMuted,
                                currentBackendUrl = backendUrl,
                                onSaveSettings = { m, r, p, muted, url ->
                                    viewModel.updateSettings(m, r, p, muted, url)
                                },
                                onClearAllHistory = {
                                    viewModel.clearAllConversations()
                                },
                                onBack = { navController.popBackStack() }
                            )
                        }
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        viewModel.refreshTelemetry()
    }
}
