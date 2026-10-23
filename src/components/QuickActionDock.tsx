import React, { useState, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Send, 
  Sparkles, 
  Trash2,
  Sliders,
  CornerDownLeft
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface QuickActionDockProps {
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  transcriptInterim: string;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  isListening,
  isSpeaking,
  isProcessing,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onSendMessage,
  onClearHistory,
  transcriptInterim,
}) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSend = () => {
    if (!inputText.trim() || isProcessing) return;
    soundEffects.playClick();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMic = () => {
    if (isListening) {
      soundEffects.playClick();
      onStopListening();
    } else {
      soundEffects.playListeningCue();
      onStartListening();
    }
  };

  return (
    <div className="w-full bg-[#030712]/95 backdrop-blur-lg border-t border-cyan-950/80 px-3 sm:px-6 py-3 flex flex-col gap-2 z-30 select-none">
      {/* Real-time speech transcription display if listening */}
      {isListening && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/50 text-cyan-200 text-xs font-mono animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold text-cyan-400">AUDIO INPUT:</span>
            <span>{transcriptInterim || 'Listening for directive...'}</span>
          </div>
          <span className="text-[10px] text-cyan-500 uppercase tracking-wider">TAP MIC TO FINISH</span>
        </div>
      )}

      {/* Main input & mic controls */}
      <div className="flex items-center gap-2">
        {/* Stop speech / Cancel button if speaking */}
        {isSpeaking && (
          <button
            onClick={() => {
              soundEffects.playClick();
              onStopSpeaking();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-950/60 border border-amber-500/80 text-amber-300 font-mono text-xs hover:bg-amber-900/60 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-pulse"
            title="Interrupt speech playback"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline font-bold">INTERRUPT</span>
          </button>
        )}

        {/* Text Input */}
        <div className="flex-1 relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? "Listening to your voice..." : "Enter directive or ask J.A.R.V.I.S..."}
            disabled={isProcessing}
            className="w-full bg-[#071322] border border-cyan-900/80 rounded-xl px-4 py-2.5 text-sm text-cyan-100 placeholder-cyan-700 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 transition-all font-sans"
          />

          {inputText.trim() && (
            <button
              onClick={handleSend}
              disabled={isProcessing}
              className="absolute right-2 p-1.5 rounded-lg bg-cyan-500 text-black hover:bg-cyan-400 transition-all cursor-pointer"
              title="Dispatch Directive"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Central Push-to-Talk Mic Button */}
        <button
          onClick={toggleMic}
          className={`relative p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer select-none ${
            isListening
              ? 'bg-red-500/20 border-red-400 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
              : 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-900/40 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
          }`}
          title={isListening ? "Stop Voice Input" : "Push-to-Talk Voice Input"}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5 animate-pulse text-red-400" />
              <span className="absolute -inset-1 rounded-xl border-2 border-red-500/60 animate-ping pointer-events-none" />
            </>
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Clear Feed Button */}
        <button
          onClick={() => {
            soundEffects.playClick();
            if (window.confirm("Clear active communications stream, Sir? (Stored memories will remain intact).")) {
              onClearHistory();
            }
          }}
          className="p-3 rounded-xl border border-cyan-950 bg-cyan-950/20 text-cyan-700 hover:text-cyan-400 hover:border-cyan-800 transition-colors cursor-pointer"
          title="Clear Conversation Stream"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
