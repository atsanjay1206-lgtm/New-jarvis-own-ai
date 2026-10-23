/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  JarvisMode, 
  JarvisState, 
  ChatMessage, 
  MemoryItem, 
  IntentAction, 
  SystemTelemetry, 
  OfflineModelSpec 
} from './types/jarvis';
import { jarvisStorage } from './services/storage';
import { jarvisSpeech } from './services/speech';
import { soundEffects } from './services/soundEffects';
import { telemetryService } from './services/telemetry';
import { offlineCognitive } from './services/offlineNLU';
import { androidIntents } from './services/androidIntents';

import { HeaderHUD } from './components/HeaderHUD';
import { ArcReactor } from './components/ArcReactor';
import { AudioWaveform } from './components/AudioWaveform';
import { ChatFeed } from './components/ChatFeed';
import { QuickActionDock } from './components/QuickActionDock';
import { MemoryBankModal } from './components/MemoryBankModal';
import { ModelManagerModal } from './components/ModelManagerModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { ProtocolsModal } from './components/ProtocolsModal';

export default function App() {
  // Core Subsystem States
  const [mode, setMode] = useState<JarvisMode>('auto');
  const [jarvisState, setJarvisState] = useState<JarvisState>('idle');
  const [telemetry, setTelemetry] = useState<SystemTelemetry>(telemetryService.getTelemetry());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [activeProtocols, setActiveProtocols] = useState<string[]>(['SENTRY']);
  const [activeModel, setActiveModel] = useState<string>('SmolLM-135M Quantum Core');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcriptInterim, setTranscriptInterim] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Modals
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isModelsOpen, setIsModelsOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isProtocolsOpen, setIsProtocolsOpen] = useState(false);

  // Active Provider text indicator
  const activeProvider = mode === 'offline' 
    ? 'Local Tactical Core (On-Device)'
    : mode === 'online'
    ? 'Gemini 3.8 Flash (Cloud)'
    : telemetry.isOnline
    ? 'Auto (Gemini 3.8 Flash)'
    : 'Auto (On-Device Offline Fallback)';

  // Initialization
  useEffect(() => {
    // 1. Subscribe to telemetry
    const unsubTelemetry = telemetryService.subscribe((t) => setTelemetry(t));

    // 2. Load stored conversation history & memories
    const loadSavedData = async () => {
      const savedMessages = await jarvisStorage.getConversations();
      setMessages(savedMessages);

      const savedMemories = await jarvisStorage.getMemories();
      setMemories(savedMemories);
    };
    loadSavedData();

    // 3. Register speech synthesis state listener
    jarvisSpeech.registerSpeakingListener((speaking) => {
      setIsSpeaking(speaking);
      if (speaking) {
        setJarvisState('speaking');
      } else if (!isListening && !isProcessing) {
        setJarvisState('idle');
      }
    });

    // 4. Play boot sequence on initial mount
    soundEffects.playBootSequence();

    return () => {
      unsubTelemetry();
      jarvisSpeech.stopSpeaking();
      jarvisSpeech.stopListening();
    };
  }, []);

  // Sync Jarvis visual state
  useEffect(() => {
    if (isListening) {
      setJarvisState('listening');
    } else if (isProcessing) {
      setJarvisState('analyzing');
    } else if (isSpeaking) {
      setJarvisState('speaking');
    } else if (!telemetry.isOnline && mode === 'online') {
      setJarvisState('alert');
    } else {
      setJarvisState('idle');
    }
  }, [isListening, isProcessing, isSpeaking, telemetry.isOnline, mode]);

  // Handle User Input Submission
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    await jarvisStorage.saveMessage(userMsg);

    setIsProcessing(true);
    setTranscriptInterim('');

    // Determine engine execution path
    const shouldUseLocal = 
      mode === 'offline' || 
      (mode === 'auto' && !telemetry.isOnline);

    if (shouldUseLocal) {
      // --- Genuine Local On-Device Execution ---
      try {
        const localResult = await offlineCognitive.processQuery(text, memories);
        
        let executedAction: IntentAction | null = null;
        if (localResult.action) {
          const actionRes = await androidIntents.executeAction(localResult.action);
          executedAction = actionRes.action;
        }

        const jarvisMsg: ChatMessage = {
          id: 'msg_jarvis_' + Date.now(),
          sender: 'jarvis',
          text: localResult.reply,
          timestamp: Date.now(),
          provider: localResult.provider,
          isOffline: true,
          action: executedAction,
          status: 'success',
        };

        setMessages((prev) => [...prev, jarvisMsg]);
        await jarvisStorage.saveMessage(jarvisMsg);

        // Vocalize response
        jarvisSpeech.speak(localResult.reply);
      } catch (err: any) {
        console.error('Local engine error:', err);
        const errorMsg: ChatMessage = {
          id: 'msg_err_' + Date.now(),
          sender: 'jarvis',
          text: `Local processing anomaly detected: ${err.message || 'Subroutine halted'}. Auxiliary systems remain online.`,
          timestamp: Date.now(),
          provider: 'Local Tactical Core',
          isOffline: true,
          status: 'error',
        };
        setMessages((prev) => [...prev, errorMsg]);
        await jarvisStorage.saveMessage(errorMsg);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // --- Online Gemini 3.8 Flash Execution with Intelligent Fallback ---
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            conversationHistory: messages.slice(-8),
            memories: memories,
            mode: mode,
          }),
        });

        if (!response.ok) {
          // If server error or API key missing, trigger graceful offline fallback
          console.warn('Server chat returned non-200, falling back to local cognitive core');
          const localResult = await offlineCognitive.processQuery(text, memories);
          
          let executedAction: IntentAction | null = null;
          if (localResult.action) {
            const actionRes = await androidIntents.executeAction(localResult.action);
            executedAction = actionRes.action;
          }

          const fallbackMsg: ChatMessage = {
            id: 'msg_jarvis_' + Date.now(),
            sender: 'jarvis',
            text: `[Cloud connection bypassed] ${localResult.reply}`,
            timestamp: Date.now(),
            provider: 'Local Tactical Core (Fallback)',
            isOffline: true,
            action: executedAction,
            status: 'warning',
          };

          setMessages((prev) => [...prev, fallbackMsg]);
          await jarvisStorage.saveMessage(fallbackMsg);
          jarvisSpeech.speak(fallbackMsg.text);
          return;
        }

        const data = await response.json();
        let executedAction: IntentAction | null = null;

        if (data.action) {
          const actionRes = await androidIntents.executeAction(data.action);
          executedAction = actionRes.action;
        }

        const jarvisMsg: ChatMessage = {
          id: 'msg_jarvis_' + Date.now(),
          sender: 'jarvis',
          text: data.reply,
          timestamp: Date.now(),
          provider: data.provider || 'Gemini 3.8 Flash',
          isOffline: false,
          action: executedAction,
          status: 'success',
        };

        setMessages((prev) => [...prev, jarvisMsg]);
        await jarvisStorage.saveMessage(jarvisMsg);

        // Vocalize response
        jarvisSpeech.speak(data.reply);
      } catch (networkErr: any) {
        console.warn('Network error in chat, falling back to on-device engine:', networkErr);
        const localResult = await offlineCognitive.processQuery(text, memories);

        let executedAction: IntentAction | null = null;
        if (localResult.action) {
          const actionRes = await androidIntents.executeAction(localResult.action);
          executedAction = actionRes.action;
        }

        const fallbackMsg: ChatMessage = {
          id: 'msg_jarvis_' + Date.now(),
          sender: 'jarvis',
          text: `Network link unavailable. Engaging local reasoning core: ${localResult.reply}`,
          timestamp: Date.now(),
          provider: 'Local Cognitive Engine (Offline)',
          isOffline: true,
          action: executedAction,
          status: 'warning',
        };

        setMessages((prev) => [...prev, fallbackMsg]);
        await jarvisStorage.saveMessage(fallbackMsg);
        jarvisSpeech.speak(localResult.reply);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [mode, telemetry.isOnline, messages, memories]);

  // Speech Recognition Controls
  const handleStartListening = () => {
    setIsListening(true);
    jarvisSpeech.startListening(
      (transcript, isFinal) => {
        if (isFinal) {
          setTranscriptInterim('');
          setIsListening(false);
          handleSendMessage(transcript);
        } else {
          setTranscriptInterim(transcript);
        }
      },
      (listening) => {
        setIsListening(listening);
      },
      (error) => {
        setIsListening(false);
        soundEffects.playAlert();
        setMessages((prev) => [
          ...prev,
          {
            id: 'err_' + Date.now(),
            sender: 'system',
            text: error,
            timestamp: Date.now(),
          },
        ]);
      }
    );
  };

  const handleStopListening = () => {
    jarvisSpeech.stopListening();
    setIsListening(false);
  };

  const handleStopSpeaking = () => {
    jarvisSpeech.stopSpeaking();
    setIsSpeaking(false);
  };

  const handleReplaySpeech = (text: string) => {
    soundEffects.playClick();
    jarvisSpeech.speak(text);
  };

  const handleExecuteAction = async (action: IntentAction) => {
    const result = await androidIntents.executeAction(action);
    setMessages((prev) => [
      ...prev,
      {
        id: 'action_res_' + Date.now(),
        sender: 'system',
        text: `Manual Action Dispatch: ${result.message}`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    soundEffects.setMuted(newMuted);
    if (newMuted) {
      jarvisSpeech.stopSpeaking();
    }
  };

  const handleClearHistory = async () => {
    await jarvisStorage.clearConversations();
    setMessages([]);
    soundEffects.playActionConfirmed();
  };

  // Protocols execution dispatcher
  const handleExecuteProtocol = async (protocolId: string) => {
    soundEffects.playActionConfirmed();
    let textReply = '';

    switch (protocolId) {
      case 'CLEAN_SLATE':
        await jarvisStorage.clearConversations();
        setMessages([]);
        setActiveProtocols((prev) => [...prev.filter((p) => p !== 'CLEAN_SLATE'), 'CLEAN_SLATE']);
        textReply = 'Clean Slate Protocol completed. Volatile communication feed purged. Core parameters reset.';
        break;

      case 'HOUSE_PARTY':
        setActiveProtocols((prev) => [...prev.filter((p) => p !== 'HOUSE_PARTY'), 'HOUSE_PARTY']);
        textReply = 'House Party Protocol activated. All auxiliary offline models and intent listeners staged in memory.';
        break;

      case 'STEALTH':
        const isStealth = activeProtocols.includes('STEALTH');
        if (isStealth) {
          setActiveProtocols((prev) => prev.filter((p) => p !== 'STEALTH'));
          setIsMuted(false);
          soundEffects.setMuted(false);
          textReply = 'Stealth protocol disengaged. Visual and acoustic telemetry restored.';
        } else {
          setActiveProtocols((prev) => [...prev, 'STEALTH']);
          setIsMuted(true);
          soundEffects.setMuted(true);
          textReply = 'Stealth protocol engaged. Acoustic dampeners active. Visual luminescence reduced.';
        }
        break;

      case 'SENTRY':
        setActiveProtocols((prev) => [...prev.filter((p) => p !== 'SENTRY'), 'SENTRY']);
        textReply = 'Sentry perimeter defense confirmed. Standing by for directives.';
        break;

      case 'OVERDRIVE':
        setActiveProtocols((prev) => [...prev.filter((p) => p !== 'OVERDRIVE'), 'OVERDRIVE']);
        textReply = 'Snapdragon 8+ Gen 1 frequency stepped to maximum clock. Overdrive active.';
        break;

      case 'DIAGNOSTIC':
        setIsDiagnosticsOpen(true);
        textReply = 'Displaying comprehensive hardware and telemetry diagnostics console.';
        break;

      default:
        textReply = `Protocol [${protocolId}] registered.`;
        break;
    }

    const sysMsg: ChatMessage = {
      id: 'proto_' + Date.now(),
      sender: 'jarvis',
      text: textReply,
      timestamp: Date.now(),
      provider: 'Local Tactical Core',
      isOffline: true,
      status: 'success',
    };

    setMessages((prev) => [...prev, sysMsg]);
    await jarvisStorage.saveMessage(sysMsg);
    jarvisSpeech.speak(textReply);
    setIsProtocolsOpen(false);
  };

  const isStealthActive = activeProtocols.includes('STEALTH');

  return (
    <div className={`flex flex-col h-screen w-screen bg-[#02040a] text-slate-100 overflow-hidden hud-grid-pattern relative ${
      isStealthActive ? 'brightness-75' : ''
    }`}>
      {/* Subtle Holographic Scanline Effect */}
      <div className="scanline-effect" />

      {/* 1. Futuristic Header HUD */}
      <HeaderHUD
        mode={mode}
        onModeChange={(m) => {
          setMode(m);
          soundEffects.playActionConfirmed();
        }}
        telemetry={telemetry}
        activeProvider={activeProvider}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenMemory={() => setIsMemoryOpen(true)}
        onOpenModels={() => setIsModelsOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenProtocols={() => setIsProtocolsOpen(true)}
      />

      {/* 2. Main Center Body: Arc Reactor Core & Chat Stream */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left / Top Section: Holographic Arc Reactor Display */}
        <section className="flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-cyan-950/60 bg-[#030814]/40 backdrop-blur-sm select-none md:w-[340px] lg:w-[400px] flex-shrink-0">
          <div className="relative flex flex-col items-center">
            {/* Holographic Arc Reactor Centerpiece */}
            <ArcReactor
              state={jarvisState}
              isListening={isListening}
              isSpeaking={isSpeaking}
              size={240}
              onCoreTap={() => {
                if (isSpeaking) {
                  handleStopSpeaking();
                } else if (isListening) {
                  handleStopListening();
                } else {
                  handleStartListening();
                }
              }}
            />

            {/* Audio Waveform Equalizer */}
            <div className="w-full mt-2">
              <AudioWaveform
                isActive={jarvisState !== 'idle'}
                isSpeaking={isSpeaking}
                isListening={isListening}
                barCount={28}
              />
            </div>

            {/* Active Directive & Model Tag */}
            <div className="mt-2 text-center flex flex-col items-center gap-1">
              <span className="font-mono text-xs font-semibold text-cyan-400 tracking-wider">
                CORE STATUS: {jarvisState.toUpperCase()}
              </span>
              <span className="font-mono text-[10px] text-cyan-600/90 tracking-tight">
                ACTIVE MODEL: {activeModel}
              </span>
            </div>
          </div>
        </section>

        {/* Right / Bottom Section: Communications HUD Stream */}
        <section className="flex-1 flex flex-col overflow-hidden bg-[#02050e]/60">
          <ChatFeed
            messages={messages}
            onReplaySpeech={handleReplaySpeech}
            onExecuteAction={handleExecuteAction}
            onQuickPrompt={handleSendMessage}
            isProcessing={isProcessing}
          />
        </section>
      </main>

      {/* 3. Bottom Control Dock: Push-to-Talk & Command Input */}
      <QuickActionDock
        isListening={isListening}
        isSpeaking={isSpeaking}
        isProcessing={isProcessing}
        onStartListening={handleStartListening}
        onStopListening={handleStopListening}
        onStopSpeaking={handleStopSpeaking}
        onSendMessage={handleSendMessage}
        onClearHistory={handleClearHistory}
        transcriptInterim={transcriptInterim}
      />

      {/* Modals */}
      <MemoryBankModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        onMemoriesUpdated={async () => {
          const updated = await jarvisStorage.getMemories();
          setMemories(updated);
        }}
      />

      <ModelManagerModal
        isOpen={isModelsOpen}
        onClose={() => setIsModelsOpen(false)}
        onActiveModelChanged={(model: OfflineModelSpec) => {
          setActiveModel(model.name);
          soundEffects.playActionConfirmed();
        }}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        telemetry={telemetry}
      />

      <ProtocolsModal
        isOpen={isProtocolsOpen}
        onClose={() => setIsProtocolsOpen(false)}
        onExecuteProtocol={handleExecuteProtocol}
        activeProtocols={activeProtocols}
      />
    </div>
  );
}
