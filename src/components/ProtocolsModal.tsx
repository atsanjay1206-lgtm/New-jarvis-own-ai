import React from 'react';
import { 
  X, 
  Shield, 
  Flame, 
  EyeOff, 
  Zap, 
  AlertOctagon, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { ProtocolDefinition } from '../types/jarvis';
import { soundEffects } from '../services/soundEffects';

interface ProtocolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteProtocol: (protocolId: string) => void;
  activeProtocols: string[];
}

export const ProtocolsModal: React.FC<ProtocolsModalProps> = ({
  isOpen,
  onClose,
  onExecuteProtocol,
  activeProtocols,
}) => {
  if (!isOpen) return null;

  const protocols: ProtocolDefinition[] = [
    {
      id: 'CLEAN_SLATE',
      code: 'PROTOCOL 88-A',
      name: 'Clean Slate Protocol',
      description: 'Purges volatile session buffers, resets UI telemetry, and re-initializes neural state while maintaining encrypted long-term memories.',
      level: 'CRITICAL',
      status: activeProtocols.includes('CLEAN_SLATE') ? 'ACTIVE' : 'STANDBY',
      actionSummary: 'Volatile Cache Reset',
    },
    {
      id: 'HOUSE_PARTY',
      code: 'PROTOCOL 42-B',
      name: 'House Party Protocol',
      description: 'Mobilizes all auxiliary subroutines, alarms, offline models, and task schedules concurrently for multi-tasking operations.',
      level: 'ELEVATED',
      status: activeProtocols.includes('HOUSE_PARTY') ? 'ACTIVE' : 'STANDBY',
      actionSummary: 'Auxiliary Subroutine Mobilization',
    },
    {
      id: 'STEALTH',
      code: 'PROTOCOL 14-S',
      name: 'Stealth Protocol',
      description: 'Dims HUD luminescence to minimal lumens, disables acoustic auditory chimes, and suppresses network beaconing.',
      level: 'NORMAL',
      status: activeProtocols.includes('STEALTH') ? 'ACTIVE' : 'STANDBY',
      actionSummary: 'Silent Run & Visual Concealment',
    },
    {
      id: 'SENTRY',
      code: 'PROTOCOL 09-G',
      name: 'Sentry Defense Mode',
      description: 'Enters automated low-power perimeter vigilance. Monitors local reminders, task queues, and battery telemetry continuously.',
      level: 'NORMAL',
      status: activeProtocols.includes('SENTRY') ? 'ACTIVE' : 'STANDBY',
      actionSummary: 'Autonomous Perimeter Watch',
    },
    {
      id: 'OVERDRIVE',
      code: 'PROTOCOL 99-X',
      name: 'Overdrive Mode',
      description: 'Allocates maximum CPU thread priority to on-device neural inference and increases Arc Reactor output to 100%.',
      level: 'ELEVATED',
      status: activeProtocols.includes('OVERDRIVE') ? 'ACTIVE' : 'STANDBY',
      actionSummary: 'Maximum Snapdragon 8+ Gen 1 Performance',
    },
    {
      id: 'DIAGNOSTIC',
      code: 'PROTOCOL 01-D',
      name: 'Full Diagnostic Sweep',
      description: 'Executes comprehensive integrity check across OnePlus 11R battery cells, UFS 3.1 storage partitions, and offline model matrices.',
      level: 'NORMAL',
      status: 'STANDBY',
      actionSummary: 'System Hardware Verification',
    },
  ];

  const handleTrigger = (p: ProtocolDefinition) => {
    soundEffects.playActionConfirmed();
    onExecuteProtocol(p.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#050b14] border border-cyan-800/80 rounded-2xl flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-950 bg-[#071322]">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-mono text-sm sm:text-base font-bold text-cyan-200 tracking-wider">
                TACTICAL PROTOCOLS // STARK DIRECTIVES
              </h3>
              <p className="text-[11px] font-mono text-cyan-600">
                Authorized override directives • Mk LXXXV Security Clearance
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-cyan-500 hover:text-cyan-200 hover:bg-cyan-950/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 font-mono">
          {protocols.map((p) => {
            const isActive = activeProtocols.includes(p.id);

            return (
              <div
                key={p.id}
                className={`p-4 rounded-xl border transition-all flex flex-col gap-2.5 ${
                  isActive
                    ? 'border-amber-500/80 bg-amber-950/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                    : 'border-cyan-900/60 bg-[#071322]/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-bold text-sm">{p.name}</span>
                      <span className="text-[10px] text-cyan-600 px-1.5 py-0.5 border border-cyan-900 rounded">
                        {p.code}
                      </span>
                      {isActive && (
                        <span className="text-[10px] text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/50">
                          ENGAGED
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-300 font-sans mt-1">{p.description}</span>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                      p.level === 'CRITICAL'
                        ? 'border-red-600/80 bg-red-950/40 text-red-300'
                        : p.level === 'ELEVATED'
                        ? 'border-amber-600/80 bg-amber-950/40 text-amber-300'
                        : 'border-cyan-800 bg-cyan-950/40 text-cyan-400'
                    }`}
                  >
                    {p.level}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-cyan-950/60 pt-2 text-xs">
                  <span className="text-[10px] text-cyan-600">{p.actionSummary}</span>
                  <button
                    onClick={() => handleTrigger(p)}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer text-xs transition-all ${
                      isActive
                        ? 'bg-amber-500 text-black hover:bg-amber-400'
                        : 'bg-cyan-500/20 border border-cyan-400/80 text-cyan-200 hover:bg-cyan-500/30'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isActive ? 'RE-ENGAGE' : 'EXECUTE PROTOCOL'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-cyan-950 bg-[#071322] flex items-center justify-between text-xs font-mono">
          <span className="text-cyan-600 text-[11px]">Directives bypass cloud servers; executed locally.</span>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-cyan-500 text-black font-bold font-mono hover:bg-cyan-400 cursor-pointer text-xs"
          >
            CLOSE CONSOLE
          </button>
        </div>
      </div>
    </div>
  );
};
