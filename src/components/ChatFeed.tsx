import React, { useRef, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Volume2, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  Sparkles,
  Zap
} from 'lucide-react';
import { ChatMessage, IntentAction } from '../types/jarvis';
import { soundEffects } from '../services/soundEffects';

interface ChatFeedProps {
  messages: ChatMessage[];
  onReplaySpeech: (text: string) => void;
  onExecuteAction: (action: IntentAction) => void;
  onQuickPrompt: (prompt: string) => void;
  isProcessing: boolean;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  messages,
  onReplaySpeech,
  onExecuteAction,
  onQuickPrompt,
  isProcessing,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  const handleCopy = (id: string, text: string) => {
    soundEffects.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    'Run diagnostic scan',
    'Open camera',
    'Battery power level',
    'Execute Stealth Protocol',
    'Set 5 minute timer',
    'What are your primary specs?',
  ];

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col gap-4 select-text">
      {/* Welcome / Initial banner if empty */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center my-auto py-8 px-4 max-w-lg mx-auto border border-cyan-900/40 bg-[#050b14]/70 rounded-xl backdrop-blur">
          <div className="w-12 h-12 rounded-full border border-cyan-500/50 flex items-center justify-center bg-cyan-950/40 text-cyan-400 mb-3 shadow-[0_0_15px_rgba(34,211,238,0.3)]">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="font-mono text-base font-bold text-cyan-300 tracking-wider mb-1">
            J.A.R.V.I.S. ONLINE // ALL SYSTEMS NOMINAL
          </h2>
          <p className="text-xs text-cyan-500/80 mb-6 leading-relaxed">
            Stark Industries Mark LXXXV Core ready. Equipped with real offline on-device cognitive reasoning, Android intent dispatch, persistent memory, and Gemini cloud intelligence.
          </p>

          <div className="w-full text-left">
            <span className="text-[11px] font-mono uppercase text-cyan-400 tracking-wider block mb-2 font-semibold">
              Suggested Directives:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => onQuickPrompt(p)}
                  className="text-left text-xs font-mono px-3 py-2 rounded border border-cyan-900/60 bg-cyan-950/30 text-cyan-300 hover:border-cyan-500/80 hover:bg-cyan-900/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-cyan-500">›</span>
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Message Stream */}
      {messages.map((msg) => {
        const isJarvis = msg.sender === 'jarvis';
        const isSystem = msg.sender === 'system';

        if (isSystem) {
          return (
            <div
              key={msg.id}
              className="mx-auto my-1 px-4 py-1.5 rounded border border-amber-900/60 bg-amber-950/30 text-amber-300 font-mono text-xs flex items-center gap-2 max-w-md text-center"
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{msg.text}</span>
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            className={`flex flex-col gap-1.5 max-w-[90%] sm:max-w-[78%] ${
              isJarvis ? 'self-start' : 'self-end'
            }`}
          >
            {/* Sender Metadata Bar */}
            <div
              className={`flex items-center gap-2 text-[10px] font-mono ${
                isJarvis ? 'text-cyan-500' : 'text-slate-400 justify-end'
              }`}
            >
              <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
                {isJarvis ? <Bot className="w-3 h-3 text-cyan-400" /> : <User className="w-3 h-3 text-slate-300" />}
                {isJarvis ? 'J.A.R.V.I.S.' : 'SIR'}
              </span>

              <span>•</span>
              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

              {isJarvis && msg.provider && (
                <>
                  <span>•</span>
                  <span
                    className={`px-1.5 py-0.2 rounded border text-[9px] uppercase font-bold tracking-tight ${
                      msg.isOffline
                        ? 'border-amber-600/70 bg-amber-950/40 text-amber-300'
                        : 'border-cyan-600/70 bg-cyan-950/40 text-cyan-300'
                    }`}
                  >
                    {msg.provider}
                  </span>
                </>
              )}
            </div>

            {/* Bubble Container */}
            <div
              className={`p-3.5 rounded-xl border relative shadow-lg ${
                isJarvis
                  ? 'border-cyan-800/70 bg-[#061220]/80 text-cyan-100 rounded-tl-sm'
                  : 'border-sky-700/60 bg-sky-950/50 text-white rounded-tr-sm'
              }`}
            >
              <div className="text-sm font-sans leading-relaxed whitespace-pre-wrap selection:bg-cyan-500/30">
                {msg.text}
              </div>

              {/* Action Execution Card */}
              {msg.action && (
                <div className="mt-3 pt-2.5 border-t border-cyan-900/60 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>DIRECTIVE EXECUTED: {msg.action.action.toUpperCase()}</span>
                    </span>
                    <button
                      onClick={() => onExecuteAction(msg.action!)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-200 underline cursor-pointer flex items-center gap-1"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      <span>Re-dispatch</span>
                    </button>
                  </div>
                  {msg.action.executionResult && (
                    <div className="text-[11px] font-mono bg-cyan-950/50 border border-cyan-900/50 rounded p-1.5 text-cyan-200">
                      {msg.action.executionResult}
                    </div>
                  )}
                </div>
              )}

              {/* Footer Controls for Jarvis Messages */}
              {isJarvis && (
                <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[11px] font-mono text-cyan-600 border-t border-cyan-950/50">
                  <span className="text-[9px] uppercase tracking-wider text-cyan-700">
                    {msg.isOffline ? 'OFFLINE SECURED' : 'ONLINE LINKED'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="hover:text-cyan-300 transition-colors cursor-pointer p-0.5"
                      title="Copy Response"
                    >
                      {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => onReplaySpeech(msg.text)}
                      className="hover:text-cyan-300 transition-colors cursor-pointer p-0.5"
                      title="Replay Voice Synthesis"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Thinking / Analyzing Indicator */}
      {isProcessing && (
        <div className="self-start flex flex-col gap-1 max-w-[70%]">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-500">
            <Bot className="w-3 h-3 text-cyan-400" />
            <span>J.A.R.V.I.S. ANALYZING...</span>
          </div>
          <div className="p-3 rounded-xl rounded-tl-sm border border-cyan-900/60 bg-[#061220]/60 text-cyan-300 flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Consulting neural pathways and cognitive indices...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
