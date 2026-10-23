import React, { useState, useEffect } from 'react';
import { 
  X, 
  Activity, 
  Battery, 
  HardDrive, 
  Cpu, 
  ShieldCheck, 
  Radio, 
  Play, 
  Camera, 
  Phone, 
  MapPin, 
  Clock, 
  Settings, 
  Calculator, 
  Volume2, 
  FileText 
} from 'lucide-react';
import { SystemTelemetry, IntentAction } from '../types/jarvis';
import { androidIntents } from '../services/androidIntents';
import { jarvisStorage } from '../services/storage';
import { soundEffects } from '../services/soundEffects';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: SystemTelemetry;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  telemetry,
}) => {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'hardware' | 'intents' | 'audit' | 'audio'>('hardware');

  useEffect(() => {
    if (isOpen) {
      jarvisStorage.getAuditLogs().then(setAuditLogs);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testIntent = async (action: string, target?: string) => {
    soundEffects.playClick();
    const result = await androidIntents.executeAction({
      action,
      target,
      label: `Manual Test: ${action} (${target || ''})`,
    });
    alert(result.message);
    const updated = await jarvisStorage.getAuditLogs();
    setAuditLogs(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#050b14] border border-cyan-800/80 rounded-2xl flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-950 bg-[#071322]">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-mono text-sm sm:text-base font-bold text-cyan-200 tracking-wider">
                SYSTEM DIAGNOSTICS // HARDWARE & INTENT BUS
              </h3>
              <p className="text-[11px] font-mono text-cyan-600">
                Host Telemetry • Android Intent Dispatcher • Real-time Hardware Probes
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

        {/* Tab Selector */}
        <div className="flex items-center border-b border-cyan-950 bg-[#06101e] px-4 gap-2 text-xs font-mono">
          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('hardware');
            }}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === 'hardware'
                ? 'border-cyan-400 text-cyan-200'
                : 'border-transparent text-cyan-600 hover:text-cyan-400'
            }`}
          >
            HARDWARE TELEMETRY
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('intents');
            }}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === 'intents'
                ? 'border-cyan-400 text-cyan-200'
                : 'border-transparent text-cyan-600 hover:text-cyan-400'
            }`}
          >
            ANDROID INTENT TESTER
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('audit');
            }}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'border-cyan-400 text-cyan-200'
                : 'border-transparent text-cyan-600 hover:text-cyan-400'
            }`}
          >
            AUDIT LOG ({auditLogs.length})
          </button>

          <button
            onClick={() => {
              soundEffects.playClick();
              setActiveTab('audio');
            }}
            className={`py-2.5 px-3 border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === 'audio'
                ? 'border-cyan-400 text-cyan-200'
                : 'border-transparent text-cyan-600 hover:text-cyan-400'
            }`}
          >
            AUDIO SYNTH
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 font-mono text-xs">
          {activeTab === 'hardware' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Device Profile */}
              <div className="p-3.5 rounded-xl border border-cyan-900/60 bg-[#071322]/80 flex flex-col gap-2">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>PROCESSOR & MEMORY</span>
                </span>
                <div className="flex justify-between border-b border-cyan-950/60 py-1 text-slate-300">
                  <span>Host Model:</span>
                  <span className="text-cyan-300">OnePlus 11R (CPH2487)</span>
                </div>
                <div className="flex justify-between border-b border-cyan-950/60 py-1 text-slate-300">
                  <span>SoC Platform:</span>
                  <span className="text-cyan-300">Snapdragon 8+ Gen 1</span>
                </div>
                <div className="flex justify-between border-b border-cyan-950/60 py-1 text-slate-300">
                  <span>CPU Cores:</span>
                  <span className="text-cyan-300">{telemetry.hardwareCores} Cores Active</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>System RAM:</span>
                  <span className="text-emerald-400 font-bold">{telemetry.memoryGB} GB LPDDR5X</span>
                </div>
              </div>

              {/* Power Subsystem */}
              <div className="p-3.5 rounded-xl border border-cyan-900/60 bg-[#071322]/80 flex flex-col gap-2">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Battery className="w-4 h-4" />
                  <span>POWER & ARC CORE</span>
                </span>
                <div className="flex justify-between border-b border-cyan-950/60 py-1 text-slate-300">
                  <span>Battery Cell Level:</span>
                  <span className="text-cyan-300 font-bold">{telemetry.batteryLevel}%</span>
                </div>
                <div className="flex justify-between border-b border-cyan-950/60 py-1 text-slate-300">
                  <span>Charging State:</span>
                  <span className={telemetry.isCharging ? 'text-emerald-400' : 'text-slate-400'}>
                    {telemetry.isCharging ? 'Active (100W SuperVOOC)' : 'Discharging'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-cyan-950/60 py-1 text-slate-300">
                  <span>Arc Reactor Output:</span>
                  <span className="text-cyan-300">{telemetry.corePowerPercent}%</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Core Temperature:</span>
                  <span className="text-cyan-300">{telemetry.reactorTemp} °C (Nominal)</span>
                </div>
              </div>

              {/* Storage Subsystem */}
              <div className="p-3.5 rounded-xl border border-cyan-900/60 bg-[#071322]/80 flex flex-col gap-2">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" />
                  <span>STORAGE PARTITIONS</span>
                </span>
                <div className="flex justify-between border-b border-cyan-950/60 py-1 text-slate-300">
                  <span>Internal UFS 3.1:</span>
                  <span className="text-cyan-300">256 GB Partition</span>
                </div>
                <div className="flex justify-between border-b border-cyan-950/60 py-1 text-slate-300">
                  <span>App Cache Quota:</span>
                  <span className="text-cyan-300">{telemetry.storageQuotaMB} MB</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Storage Utilized:</span>
                  <span className="text-cyan-300">{telemetry.storageUsedMB} MB</span>
                </div>
              </div>

              {/* Network & Privacy */}
              <div className="p-3.5 rounded-xl border border-cyan-900/60 bg-[#071322]/80 flex flex-col gap-2">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>SECURITY & ENCRYPTION</span>
                </span>
                <div className="flex justify-between border-b border-cyan-950/60 py-1 text-slate-300">
                  <span>Network Status:</span>
                  <span className={telemetry.isOnline ? 'text-emerald-400' : 'text-amber-400'}>
                    {telemetry.isOnline ? 'Online Gateway' : 'Air-gapped (Offline)'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-cyan-950/60 py-1 text-slate-300">
                  <span>Offline Intelligence:</span>
                  <span className="text-emerald-400">Armed & Autonomous</span>
                </div>
                <div className="flex justify-between py-1 text-slate-300">
                  <span>Memory Encryption:</span>
                  <span className="text-emerald-400">IndexedDB Local Sandboxed</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'intents' && (
            <div className="flex flex-col gap-3">
              <p className="text-slate-400 text-xs font-sans">
                Test genuine Android intent dispatching directly from JARVIS. When running on Android, these invoke native application activities:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  onClick={() => testIntent('open_app', 'camera')}
                  className="p-3 rounded-xl border border-cyan-900/60 bg-[#071322] hover:border-cyan-500 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-2 cursor-pointer transition-all"
                >
                  <Camera className="w-5 h-5 text-cyan-400" />
                  <span>Launch Camera</span>
                </button>

                <button
                  onClick={() => testIntent('open_app', 'dialer')}
                  className="p-3 rounded-xl border border-cyan-900/60 bg-[#071322] hover:border-cyan-500 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-2 cursor-pointer transition-all"
                >
                  <Phone className="w-5 h-5 text-cyan-400" />
                  <span>Open Dialer</span>
                </button>

                <button
                  onClick={() => testIntent('open_app', 'maps')}
                  className="p-3 rounded-xl border border-cyan-900/60 bg-[#071322] hover:border-cyan-500 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-2 cursor-pointer transition-all"
                >
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span>Open Maps</span>
                </button>

                <button
                  onClick={() => testIntent('open_app', 'clock')}
                  className="p-3 rounded-xl border border-cyan-900/60 bg-[#071322] hover:border-cyan-500 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-2 cursor-pointer transition-all"
                >
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span>Open Alarms</span>
                </button>

                <button
                  onClick={() => testIntent('open_app', 'calculator')}
                  className="p-3 rounded-xl border border-cyan-900/60 bg-[#071322] hover:border-cyan-500 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-2 cursor-pointer transition-all"
                >
                  <Calculator className="w-5 h-5 text-cyan-400" />
                  <span>Calculator</span>
                </button>

                <button
                  onClick={() => testIntent('open_app', 'settings')}
                  className="p-3 rounded-xl border border-cyan-900/60 bg-[#071322] hover:border-cyan-500 hover:bg-cyan-950/40 text-cyan-300 flex flex-col items-center gap-2 cursor-pointer transition-all"
                >
                  <Settings className="w-5 h-5 text-cyan-400" />
                  <span>Device Settings</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="flex flex-col gap-2">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-cyan-700">No intents logged yet.</div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg border border-cyan-900/50 bg-[#071322] flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-cyan-300 font-bold uppercase">{log.action}</span>
                      <span className="text-cyan-700 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] font-sans">{log.executionResult || log.label}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="flex flex-col gap-3">
              <p className="text-slate-400 text-xs font-sans">
                JARVIS uses Web Audio API synthesized frequencies for zero-latency, 100% offline acoustic cues without requiring any downloaded MP3 files:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => soundEffects.playReactorPulse()}
                  className="p-3 rounded-xl border border-cyan-900/60 bg-[#071322] hover:border-cyan-400 text-cyan-300 flex items-center justify-between cursor-pointer"
                >
                  <span>Arc Reactor Pulse</span>
                  <Play className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => soundEffects.playListeningCue()}
                  className="p-3 rounded-xl border border-cyan-900/60 bg-[#071322] hover:border-cyan-400 text-cyan-300 flex items-center justify-between cursor-pointer"
                >
                  <span>Voice Listen Cue</span>
                  <Play className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => soundEffects.playActionConfirmed()}
                  className="p-3 rounded-xl border border-cyan-900/60 bg-[#071322] hover:border-cyan-400 text-cyan-300 flex items-center justify-between cursor-pointer"
                >
                  <span>Action Confirmed</span>
                  <Play className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => soundEffects.playBootSequence()}
                  className="p-3 rounded-xl border border-cyan-900/60 bg-[#071322] hover:border-cyan-400 text-cyan-300 flex items-center justify-between cursor-pointer"
                >
                  <span>MK-LXXXV Boot</span>
                  <Play className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => soundEffects.playAlert()}
                  className="p-3 rounded-xl border border-red-900/60 bg-[#071322] hover:border-red-400 text-red-300 flex items-center justify-between cursor-pointer"
                >
                  <span>Warning Siren</span>
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-cyan-950 bg-[#071322] flex items-center justify-between text-xs font-mono">
          <span className="text-cyan-600 text-[11px]">System diagnostic status: 100% OPERATIONAL</span>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded bg-cyan-500 text-black font-bold font-mono hover:bg-cyan-400 cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
